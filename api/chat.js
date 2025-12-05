import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { sendInterviewInvitation } from '../utils/interviewInvitation.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';


dotenv.config();

// Initialize Firebase
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Helper function to get user profile from Firestore
async function getUserProfile(uid) {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

// const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY);

// Define tools for the agent
const tools = [
    {
        functionDeclarations: [
            {
                name: 'sendInterviewInvitations',
                description: 'Send interview invitation emails to selected candidates. Use this when the user asks to invite candidates for interviews or send interview invitations.',
                parameters: {
                    type: 'object',
                    properties: {
                        candidateIds: {
                            type: 'array',
                            description: 'Array of candidate IDs (as strings) to send interview invitations to',
                            items: {
                                type: 'string'
                            }
                        },
                        reason: {
                            type: 'string',
                            description: 'Brief reason for selecting these candidates'
                        },
                        interviewTime: {
                            type: 'string',
                            description: 'Proposed date and time for the interview (e.g. "Tuesday, Oct 24th at 2 PM")'
                        }
                    },
                    required: ['candidateIds']
                }
            }
        ]
    }
];

/**
 * Execute a function call from the agent
 */
async function executeFunctionCall(functionCall, candidates, jobCriteria, companyProfile) {
    const { name, args } = functionCall;

    if (name === 'sendInterviewInvitations') {
        const { candidateIds, reason, interviewTime } = args;

        // Get SMTP credentials from company profile
        const smtpCredentials = {
            user: companyProfile.imapUser || companyProfile.email,
            pass: companyProfile.imapPassword?.replace(/\s/g, ''), // Remove spaces
            host: companyProfile.imapHost?.replace('imap', 'smtp') || 'smtp.gmail.com'
        };

        // Validate credentials
        if (!smtpCredentials.user || !smtpCredentials.pass) {
            return {
                success: false,
                error: 'Email credentials not configured. Please set up SMTP credentials in Settings.',
                sentCount: 0,
                candidateNames: []
            };
        }

        const results = [];
        const successfulCandidates = [];

        for (const candidateId of candidateIds) {
            const candidate = candidates.find(c => c.id === candidateId || c.originalEmailId === candidateId);

            if (!candidate) {
                results.push({ id: candidateId, success: false, error: 'Candidate not found' });
                continue;
            }

            const result = await sendInterviewInvitation(
                smtpCredentials,
                candidate,
                jobCriteria,
                companyProfile.name || 'Our Company',
                interviewTime
            );

            results.push({ id: candidateId, name: candidate.name, ...result });

            if (result.success) {
                successfulCandidates.push(candidate.name);
            }
        }

        const sentCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return {
            success: sentCount > 0,
            sentCount,
            failedCount,
            candidateNames: successfulCandidates,
            reason,
            details: results
        };
    }

    return { error: `Unknown function: ${name}` };
}

export default async function chatHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, candidates, jobCriteria, userId, companyProfile: providedProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
    }

    try {
        // Get user profile: prefer provided profile (from client state), fallback to DB
        let companyProfile = providedProfile;
        if (!companyProfile && userId) {
            companyProfile = await getUserProfile(userId);
        }

        // Construct system instruction for the agent
        const systemInstruction = `You are an intelligent recruitment assistant agent with the ability to take actions.

You have access to the following candidates from a recent email scan:
${JSON.stringify(candidates?.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            role: c.role,
            score: c.score,
            summary: c.summary,
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            status: c.status,
            reason: c.recommendationReason
        })), null, 2)}

Job Position Details:
- Title: ${jobCriteria?.jobTitle || 'Unknown'}
- Experience: ${jobCriteria?.experienceLevel || 'Unknown'}
- Skills Required: ${jobCriteria?.keySkills || 'Unknown'}

YOU CAN TAKE ACTIONS by using available tools:
- Send interview invitations to candidates

IMPORTANT GUIDELINES:
1. When asked to invite candidates, analyze the candidates and select the best ones based on scores, skills match, and requirements
2. If user specifies a number (e.g., "top 3"), select that many candidates
3. If user mentions specific criteria (e.g., "with React experience"), filter by those criteria first
4. Always provide reasoning for your candidate selection
5. Be proactive - if the request is clear, execute the action without asking for confirmation
6. After executing an action, report what you did clearly

Be helpful, intelligent, and act autonomously when appropriate.`;

        // Convert chat messages to Gemini format
        let chatHistory = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Gemini API requires chat history to establish a turn-taking pattern starting with 'user'
        // We must remove any leading 'model' messages
        while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
            chatHistory.shift();
        }

        const userMessage = messages[messages.length - 1].content;

        const apiKey = process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        // Initialize model
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction,
            tools
        });

        // Start chat with history
        const chat = model.startChat({
            history: chatHistory
        });

        // Send user message
        let result = await chat.sendMessage(userMessage);
        let response = result.response;

        // Handle function calls
        while (response.functionCalls()) {
            const functionCalls = response.functionCalls();

            // We only handle the first one for now or loop through all
            // Gemini 2.0 Flash might return multiple
            for (const call of functionCalls) {
                console.log('🤖 Agent calling function:', call.name);
                console.log('📋 Arguments:', JSON.stringify(call.args, null, 2));

                // Execute the function
                const functionResult = await executeFunctionCall(
                    call,
                    candidates,
                    jobCriteria,
                    companyProfile || {}
                );

                console.log('✅ Function result:', JSON.stringify(functionResult, null, 2));

                // Send function result back to model
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: call.name,
                        response: functionResult
                    }
                }]);

                response = result.response;
            }
        }

        // Extract final text response
        const text = response.text();

        if (!text) {
            throw new Error('No response text from Gemini');
        }

        res.status(200).json({ role: 'assistant', content: text });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to generate response', details: error.message });
    }
}
