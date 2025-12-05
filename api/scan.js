import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const candidateSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    email: { type: Type.STRING },
    role: { type: Type.STRING },
    score: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    recommendationReason: { type: Type.STRING },
    status: { type: Type.STRING }
  },
  required: ["name", "email", "role", "score", "summary", "strengths", "weaknesses", "recommendationReason", "status"]
};

// Helper function to extract text from PDF buffer
async function extractPdfText(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    return null;
  }
}

async function analyzeEmail(emailSubject, emailBody, resumeText, jobCriteria) {
  const prompt = `
    Analyze this job application against the following job criteria:
    Job Title: ${jobCriteria.jobTitle}
    Experience Level: ${jobCriteria.experienceLevel}
    Key Skills: ${jobCriteria.keySkills}

    Email Subject: ${emailSubject}
    Email Body: ${emailBody}
    
    ${resumeText ? `\n=== Resume/CV Content ===\n${resumeText}\n\nPrioritize information from the resume/CV for skills, experience, and qualifications.` : 'Note: No resume/CV attached - analyze based on email content only.'}

    Extract the candidate's name, email, and role from BOTH the email and resume (if available).
    Evaluate them and provide a score (0-100), summary, strengths, weaknesses, and a recommendation status (interview, pending, rejected).

    CRITICAL SCORING RULE:
    - If the email/resume is NOT related to the job position (e.g., spam, newsletter, marketing, or a completely different job inquiry), the score MUST be 0.
    - Do not give "mock" or "partial" credit for off-topic emails.
    - If it is a valid application but poor fit, score accordingly (low but non-zero).

    Return JSON only.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: candidateSchema
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

import { sendSummaryEmail } from '../utils/emailSender.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyIndustry, jobCriteria, emailCredentials, sendSummaryEmail: shouldSendEmail, managerEmail, emailFilters, lastScannedUid } = req.body;

  // Set headers for streaming
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data) => {
    res.write(JSON.stringify(data) + '\n');
  };

  // Log incoming request details
  console.log('=== EMAIL SCAN REQUEST ===');
  console.log('📧 Received emailCredentials object:', emailCredentials ? 'YES' : 'NO');
  console.log('📧 emailCredentials:', {
    exists: !!emailCredentials,
    user: emailCredentials?.user ? `✓ provided (${emailCredentials.user})` : '✗ missing',
    pass: emailCredentials?.pass ? `✓ provided (length: ${emailCredentials.pass.length})` : '✗ missing',
    host: emailCredentials?.host || 'not specified'
  });
  console.log('Email Filters:', emailFilters);
  console.log('Last Scanned UID:', lastScannedUid);

  // IMPORTANT: Use database credentials ONLY - do NOT fall back to .env
  // The .env credentials are placeholders and should never be used
  if (!emailCredentials || !emailCredentials.user || !emailCredentials.pass) {
    console.error('❌ No valid credentials provided from database!');
    sendEvent({
      type: 'error',
      error: 'Missing email credentials. Please configure your IMAP credentials in Settings or Onboarding.',
      details: 'Database credentials (imapUser/imapPassword) must be set in your company profile.'
    });
    res.end();
    return;
  }

  const imapConfig = {
    imap: {
      user: emailCredentials.user,
      password: emailCredentials.pass?.replace(/\s/g, ''), // Remove all spaces from password
      host: emailCredentials.host || 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: {
        rejectUnauthorized: false
      }
    },
  };

  console.log('✅ Final IMAP Config:', {
    user: imapConfig.imap.user,
    host: imapConfig.imap.host,
    port: imapConfig.imap.port,
    passwordLength: imapConfig.imap.password?.length,
    hasPassword: !!imapConfig.imap.password
  });

  let connection;

  try {
    connection = await imaps.connect(imapConfig);

    // Handle connection errors to prevent crash
    connection.on('error', (err) => {
      console.error('IMAP Connection Error (Runtime):', err);
      sendEvent({ type: 'error', error: 'IMAP Connection Error: ' + err.message });
    });

    await connection.openBox('INBOX');

    // Build search criteria
    let searchCriteria = [];

    // 1. Filter by UID if resuming
    if (lastScannedUid) {
      searchCriteria.push(['UID', `${lastScannedUid + 1}:*`]);
    }

    const hasSubjectFilter = emailFilters?.subject && emailFilters.subject.trim();
    const hasSenderFilter = emailFilters?.sender && emailFilters.sender.trim();

    if (hasSubjectFilter || hasSenderFilter) {
      if (hasSubjectFilter) {
        searchCriteria.push(['SUBJECT', emailFilters.subject]);
      }
      if (hasSenderFilter) {
        searchCriteria.push(['FROM', emailFilters.sender]);
      }
    } else if (!lastScannedUid) {
      // Default to UNSEEN only if not resuming and no specific filters
      searchCriteria.push('UNSEEN');
    }

    console.log('IMAP Search Criteria:', JSON.stringify(searchCriteria, null, 2));

    const fetchOptions = {
      bodies: [''], // Fetch full raw message to get attachments
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} messages`);

    sendEvent({ type: 'status', message: `Found ${messages.length} emails to process...` });

    const candidates = [];
    let scannedCount = 0;

    // Process ALL messages found (no limit)
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      try {
        scannedCount++;
        const id = message.attributes.uid;

        sendEvent({ type: 'progress', current: i + 1, total: messages.length, message: `Scanning email ${i + 1} of ${messages.length}...` });

        // Get the full raw message body
        const all = message.parts.find((part) => part.which === '');

        if (!all) {
          console.warn(`Skipping message ${message.attributes.uid}: No body found`);
          continue;
        }

        const simpleMail = await simpleParser(all.body);

        // Extract PDF attachments (resumes/CVs)
        let resumeText = '';
        if (simpleMail.attachments && simpleMail.attachments.length > 0) {
          for (const attachment of simpleMail.attachments) {
            const isPdfType = attachment.contentType === 'application/pdf';
            const isPdfExt = attachment.filename?.toLowerCase().endsWith('.pdf');

            if (isPdfType || isPdfExt) {
              try {
                const pdfText = await extractPdfText(attachment.content);
                if (pdfText) {
                  resumeText += `\n\n=== Resume (${attachment.filename}) ===\n${pdfText}`;
                  break; // Process first PDF only
                }
              } catch (e) {
                console.error(`Failed to extract PDF text from ${attachment.filename}:`, e);
              }
            }
          }
        }

        const analysis = await analyzeEmail(simpleMail.subject, simpleMail.text, resumeText, jobCriteria);

        if (analysis) {
          const candidateData = {
            id: id.toString(),
            ...analysis,
            originalEmailId: id.toString(),
            uid: id // Explicitly send UID for resume tracking
          };

          candidates.push(candidateData);

          // Stream the candidate immediately
          sendEvent({ type: 'candidate', candidate: candidateData });
        } else {
          // Send a "processed" event even if no candidate found, to update UID tracking
          sendEvent({ type: 'processed', uid: id });
        }

      } catch (err) {
        console.error(`Error processing message ${message.attributes?.uid}:`, err);
        // Continue to next message
      }
    }

    connection.end();

    // Send Summary Email if requested
    if (shouldSendEmail && candidates.length > 0) {
      const recipient = managerEmail || imapConfig.imap.user;
      const subject = `Recruitment Scan Summary: ${jobCriteria.jobTitle}`;

      const candidateRows = candidates.map(c => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${c.name}</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.score}/100</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.status}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.summary}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <h2>Recruitment Scan Results</h2>
        <p><strong>Job Title:</strong> ${jobCriteria.jobTitle}</p>
        <p><strong>Scanned:</strong> ${scannedCount} emails</p>
        <p><strong>Candidates Found:</strong> ${candidates.length}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Name</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Score</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Summary</th>
            </tr>
          </thead>
          <tbody>
            ${candidateRows}
          </tbody>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Generated by Recruiter Agent</p>
      `;

      const smtpCredentials = {
        user: imapConfig.imap.user,
        pass: imapConfig.imap.password,
        host: imapConfig.imap.host === 'imap.gmail.com' ? 'smtp.gmail.com' : imapConfig.imap.host
      };

      try {
        await sendSummaryEmail(smtpCredentials, recipient, subject, htmlContent);
        sendEvent({ type: 'status', message: 'Summary email sent.' });
      } catch (e) {
        console.error("Failed to send summary email", e);
        sendEvent({ type: 'status', message: 'Failed to send summary email.' });
      }
    }

    sendEvent({ type: 'complete', scannedCount, candidateCount: candidates.length });
    res.end();

  } catch (error) {
    console.error('=== IMAP ERROR ===', error);
    sendEvent({ type: 'error', error: error.message });
    res.end();
  }
}
