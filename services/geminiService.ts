import { GoogleGenAI, Type } from "@google/genai";
import { CandidateAnalysis, JobCriteria } from "../types";

// Helper to get AI instance - Note: In a real app, this should probably be backend-only or use a VITE_ prefixed key
const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const scanForCandidates = async (
  industry: string,
  jobCriteria: JobCriteria,
  emailCredentials?: { user: string; pass: string; host: string },
  sendSummaryEmail: boolean = false,
  emailFilters?: { subject: string; sender: string }
): Promise<{ candidates: CandidateAnalysis[], scannedCount: number }> => {
  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyIndustry: industry,
        jobCriteria,
        emailCredentials,
        sendSummaryEmail,
        emailFilters
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.details || errorData.error || response.statusText;
      throw new Error(`Scan failed: ${errorMessage}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error scanning for candidates:", error);
    throw error;
  }
};

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
      model: "gemini-2.0-flash",
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

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No text generated");
    return JSON.parse(text);
  } catch (e) {
    console.error("Error extracting job criteria:", e);
    return null;
  }
};

export const generatePresentationScript = async (candidates: CandidateAnalysis[]): Promise<any[]> => {
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
      model: "gemini-2.0-flash",
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

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error(e);
    return [{ title: "Error", content: "Could not generate presentation." }];
  }
};