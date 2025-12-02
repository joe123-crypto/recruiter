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

import { sendSummaryEmail } from '../../utils/emailSender.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyIndustry, jobCriteria, emailCredentials, sendSummaryEmail: shouldSendEmail, managerEmail, emailFilters } = req.body;

  // Use provided credentials or fallback to env vars
  console.log('=== EMAIL SCAN REQUEST ===');
  console.log('Email Credentials:', {
    user: emailCredentials?.user ? '✓ provided' : '✗ missing',
    pass: emailCredentials?.pass ? '✓ provided (length: ' + emailCredentials?.pass?.length + ')' : '✗ missing',
    host: emailCredentials?.host || 'default (imap.gmail.com)'
  });
  console.log('Email Filters:', emailFilters);
  console.log('Env IMAP_PASSWORD:', process.env.IMAP_PASSWORD ? '✓ set' : '✗ not set');

  const imapConfig = {
    imap: {
      user: emailCredentials?.user || process.env.IMAP_USER,
      password: emailCredentials?.pass || process.env.IMAP_PASSWORD,
      host: emailCredentials?.host || process.env.IMAP_HOST || 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: {
        rejectUnauthorized: false
      }
    },
  };

  console.log('Final IMAP Config:', {
    user: imapConfig.imap.user,
    host: imapConfig.imap.host,
    port: imapConfig.imap.port,
    hasPassword: !!imapConfig.imap.password
  });

  if (!imapConfig.imap.user || !imapConfig.imap.password) {
    return res.status(400).json({ error: 'Missing email credentials. Please configure them in Settings.' });
  }

  try {
    const connection = await imaps.connect(imapConfig);

    // Handle connection errors to prevent crash
    connection.on('error', (err) => {
      console.error('IMAP Connection Error (Runtime):', err);
    });

    await connection.openBox('INBOX');

    // Build search criteria using header-based filters only when specified
    let searchCriteria;
    const hasSubjectFilter = emailFilters?.subject && emailFilters.subject.trim();
    const hasSenderFilter = emailFilters?.sender && emailFilters.sender.trim();

    if (hasSubjectFilter || hasSenderFilter) {
      // Use header-based filters - search in ALL messages (not just UNSEEN)
      searchCriteria = [];

      if (hasSubjectFilter) {
        searchCriteria.push(['SUBJECT', emailFilters.subject]);
      }
      if (hasSenderFilter) {
        searchCriteria.push(['FROM', emailFilters.sender]);
      }
    } else {
      // No filters specified, default to UNSEEN messages only
      searchCriteria = ['UNSEEN'];
    }

    console.log('Email Filters Received:', emailFilters);
    console.log('IMAP Search Criteria:', JSON.stringify(searchCriteria, null, 2));

    const fetchOptions = {
      bodies: [''], // Fetch full raw message to get attachments
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} messages`);
    const candidates = [];
    let scannedCount = 0;

    // Limit to 5 for demo purposes
    const messagesToProcess = messages.slice(0, 5);

    for (const message of messagesToProcess) {
      try {
        scannedCount++;
        // Get the full raw message body
        const all = message.parts.find((part) => part.which === '');
        console.log(`Message ${message.attributes.uid} parts:`, message.parts.map(p => ({ which: p.which, size: p.size })));

        if (!all) {
          console.warn(`Skipping message ${message.attributes.uid}: No body found`);
          continue;
        }
        console.log(`Fetched body size: ${all.body.length} characters`);

        const id = message.attributes.uid;
        // const idHeader = "Imap-Id: " + id + "\r\n"; // Not needed when parsing full raw message

        const simpleMail = await simpleParser(all.body);
        console.log(`Parsed mail keys: ${Object.keys(simpleMail).join(', ')}`);
        console.log(`Attachments found: ${simpleMail.attachments ? simpleMail.attachments.length : 0}`);

        // Extract PDF attachments (resumes/CVs)
        let resumeText = '';
        if (simpleMail.attachments && simpleMail.attachments.length > 0) {
          console.log(`Message ${id} has ${simpleMail.attachments.length} attachment(s)`);

          for (const attachment of simpleMail.attachments) {
            console.log(`Checking attachment: Name="${attachment.filename}", Type="${attachment.contentType}", Size=${attachment.size}`);

            // Check for PDF - be more permissive with content types
            const isPdfType = attachment.contentType === 'application/pdf';
            const isPdfExt = attachment.filename?.toLowerCase().endsWith('.pdf');

            if (isPdfType || isPdfExt) {
              console.log(`PDF detected! Extracting: ${attachment.filename}`);
              try {
                const pdfText = await extractPdfText(attachment.content);
                if (pdfText) {
                  resumeText += `\n\n=== Resume (${attachment.filename}) ===\n${pdfText}`;
                  console.log(`Successfully extracted ${pdfText.length} characters from ${attachment.filename}`);
                  console.log('--- PDF CONTENT START ---');
                  console.log(pdfText.substring(0, 500) + '... (truncated)');
                  console.log('--- PDF CONTENT END ---');
                  break; // Process first PDF only
                } else {
                  console.warn(`Extracted text was empty for ${attachment.filename}`);
                }
              } catch (e) {
                console.error(`Failed to extract PDF text from ${attachment.filename}:`, e);
              }
            } else {
              console.log(`Skipping non-PDF attachment: ${attachment.filename}`);
            }
          }
        } else {
          console.log(`Message ${id} has NO attachments`);
        }

        const analysis = await analyzeEmail(simpleMail.subject, simpleMail.text, resumeText, jobCriteria);

        if (analysis) {
          candidates.push({
            id: id.toString(),
            ...analysis,
            originalEmailId: id.toString()
          });
        }
      } catch (err) {
        console.error(`Error processing message ${message.attributes?.uid}:`, err);
        // Continue to next message instead of crashing
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

      // Use the same credentials for SMTP
      const smtpCredentials = {
        user: imapConfig.imap.user,
        pass: imapConfig.imap.password,
        host: imapConfig.imap.host === 'imap.gmail.com' ? 'smtp.gmail.com' : imapConfig.imap.host // Simple fallback
      };

      console.log(`Sending summary email to ${recipient}...`);
      await sendSummaryEmail(smtpCredentials, recipient, subject, htmlContent);
    }

    res.status(200).json({ candidates, scannedCount });
  } catch (error) {
    console.error('=== IMAP ERROR ===');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Full Error:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to fetch or process emails', details: error.message, type: error.constructor.name });
  }
}
