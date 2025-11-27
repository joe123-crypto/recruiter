import { GoogleGenAI, Type } from "@google/genai";
import { CandidateAnalysis, EmailData, JobCriteria } from "../types";

// Helper to get AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses a job description file (PDF/Image) to extract criteria automatically.
 */
export const extractJobCriteriaFromDoc = async (base64Data: string, mimeType: string): Promise<JobCriteria | null> => {
  const ai = getAI();
  
  const prompt = `Analyze this job description document. Extract the following information into a structured JSON format:
  
  1. Job Title
  2. Experience Level (Map exactly to one of these: "Entry Level (0-2 yrs)", "Mid-Level (3-5 yrs)", "Senior (5-8 yrs)", "Lead / Principal (8+ yrs)", "Executive")
  3. Key Skills (Comma separated string)
  4. Application Deadline (Format YYYY-MM-DD. If not found, use a date 30 days from today).

  Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobTitle: { type: Type.STRING },
            experienceLevel: { type: Type.STRING },
            keySkills: { type: Type.STRING },
            deadline: { type: Type.STRING }
          },
          required: ["jobTitle", "experienceLevel", "keySkills", "deadline"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as JobCriteria;
  } catch (error) {
    console.error("Failed to parse document:", error);
    return null;
  }
};

/**
 * Generates mock recruitment emails for demonstration purposes based on specific criteria.
 */
export const generateMockEmails = async (count: number = 3, industry: string, criteria: JobCriteria): Promise<EmailData[]> => {
  const ai = getAI();
  const prompt = `Generate ${count} distinct, realistic job application emails.
  
  Context:
  Target Company Industry: ${industry}
  Role Applying For: ${criteria.jobTitle}
  Required Skills: ${criteria.keySkills}
  Experience Level: ${criteria.experienceLevel}
  
  Instructions:
  - Include a mix of candidates: 
    1. A perfect match (strong skills, good experience).
    2. A decent match but missing some skills.
    3. A weak match or someone pivoting careers.
  - The emails should vary in tone (formal, casual, eager).
  - Subject lines should look realistic (e.g., "Application for [Role]", "Inquiry - [Name]").
  
  Return ONLY a JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sender: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["id", "sender", "subject", "body", "date"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as EmailData[];
  } catch (error) {
    console.error("Failed to generate mock emails:", error);
    return [];
  }
};

/**
 * Analyzes a single email to extract candidate info and evaluate them against criteria.
 */
export const analyzeCandidateEmail = async (email: EmailData, criteria: JobCriteria): Promise<CandidateAnalysis | null> => {
  const ai = getAI();
  
  const prompt = `Analyze this job application email for the position of "${criteria.jobTitle}".
  
  Criteria for evaluation:
  - Must have skills: ${criteria.keySkills}
  - Experience Level: ${criteria.experienceLevel}
  
  Email Content:
  Subject: ${email.subject}
  From: ${email.sender}
  Body: "${email.body}"

  Extract the candidate's name.
  Evaluate them on a scale of 0-100 based strictly on how well they match the criteria above.
  Provide a short summary (max 30 words).
  List 3 key strengths relevant to the role.
  List 1 potential weakness or area of concern.
  Write a "recommendationReason" explaining why they should or should not be interviewed for THIS specific role.
  
  Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationReason: { type: Type.STRING }
          },
          required: ["name", "role", "score", "summary", "strengths", "weaknesses", "recommendationReason"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const analysis = JSON.parse(text);

    return {
      ...analysis,
      id: crypto.randomUUID(),
      email: email.sender,
      status: analysis.score > 75 ? 'interview' : 'pending',
      originalEmailId: email.id
    };

  } catch (error) {
    console.error("Failed to analyze candidate:", error);
    return null;
  }
};

/**
 * Generates a presentation script/summary for the selected candidates.
 */
export const generatePresentationScript = async (candidates: CandidateAnalysis[]): Promise<{ title: string, content: string }[]> => {
    const ai = getAI();
    const candidatesJson = JSON.stringify(candidates.map(c => ({ name: c.name, role: c.role, score: c.score, reason: c.recommendationReason })));
    
    const prompt = `Create a presentation script for a hiring meeting based on these top candidates: ${candidatesJson}.
    
    Create 3 slides:
    1. Executive Summary of the talent pool.
    2. Top Picks Highlights (mention specific names).
    3. Next Steps & Recommendations.

    Return JSON array of slides.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error(e);
        return [{ title: "Error", content: "Could not generate presentation." }];
    }
}