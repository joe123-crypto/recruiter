import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

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

async function analyzeEmail(emailSubject, emailBody, jobCriteria) {
  const prompt = `
    Analyze this job application email against the following job criteria:
    Job Title: ${jobCriteria.jobTitle}
    Experience Level: ${jobCriteria.experienceLevel}
    Key Skills: ${jobCriteria.keySkills}

    Email Subject: ${emailSubject}
    Email Body: ${emailBody}

    Extract the candidate's name, email, and role.
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

// ... (existing imports)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyIndustry, jobCriteria, emailCredentials, sendSummaryEmail: shouldSendEmail, managerEmail } = req.body;

  // ... (existing credential logic)

  // Use provided credentials or fallback to env vars
  console.log('=== EMAIL SCAN REQUEST ===');
  console.log('Email Credentials:', {
    user: emailCredentials?.user ? '✓ provided' : '✗ missing',
    pass: emailCredentials?.pass ? '✓ provided (length: ' + emailCredentials?.pass?.length + ')' : '✗ missing',
    host: emailCredentials?.host || 'default (imap.gmail.com)'
  });
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
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const candidates = [];
    let scannedCount = 0;

    // Limit to 5 for demo purposes
    const messagesToProcess = messages.slice(0, 5);

    for (const message of messagesToProcess) {
      scannedCount++;
      const all = message.parts.find((part) => part.which === 'TEXT');
      const id = message.attributes.uid;
      const idHeader = "Imap-Id: " + id + "\r\n";

      const simpleMail = await simpleParser(idHeader + all.body);

      const analysis = await analyzeEmail(simpleMail.subject, simpleMail.text, jobCriteria);

      if (analysis) {
        candidates.push({
          id: id.toString(),
          ...analysis,
          originalEmailId: id.toString()
        });
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
