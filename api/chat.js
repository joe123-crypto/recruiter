import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

export default async function chatHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, candidates, jobCriteria } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
    }

    try {
        // Construct context from candidates and job criteria
        const context = `
      You are a recruitment assistant chatbot. You have just finished scanning emails for a job position.
      
      Job Details:
      - Title: ${jobCriteria?.jobTitle || 'Unknown'}
      - Experience: ${jobCriteria?.experienceLevel || 'Unknown'}
      - Skills: ${jobCriteria?.keySkills || 'Unknown'}

      Candidates Found (${candidates?.length || 0}):
      ${JSON.stringify(candidates?.map(c => ({
            name: c.name,
            role: c.role,
            score: c.score,
            summary: c.summary,
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            reason: c.recommendationReason
        })), null, 2)}

      User Question: ${messages[messages.length - 1].content}

      Answer the user's question based strictly on the candidate data provided above. 
      If the user asks about a specific candidate, look up their details in the list.
      If the user asks for a comparison, compare the candidates based on their scores and skills.
      Be helpful, professional, and concise.
    `;

        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: context
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response text from Gemini');
        }

        res.status(200).json({ role: 'assistant', content: text });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
}
