/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface ExtractedCard {
  name: string;
  designation: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  address: string;
  location: string;
  speciality: string;
  aiContext: string;
}

export interface CompanyDetails {
  whatTheyDo: string;
  products: string[];
  latestInnovations: string;
  technology: string;
}

export const aiService = {
  async extractBusinessCardInfo(frontImage: string, backImage?: string): Promise<ExtractedCard> {
    const prompt = `Extract contact information from the provided business card image(s). 
    Provide the details in a structured JSON format. 
    If a field is not found, leave it as an empty string.
    Fields to extract: 
    - name, designation, email, phone, company, website, address, location, speciality
    - "speciality" should be inferred from the card's text (e.g., Plastic Molds, Laser Cutting).
    - "location" refers to a specific area or city mentioned.
    - "aiContext" should be a brief summary of what the company does based on the card's info and your knowledge.`;

    const parts: any[] = [
      { inlineData: { mimeType: "image/jpeg", data: frontImage.split(',')[1] || frontImage } },
    ];
    if (backImage) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: backImage.split(',')[1] || backImage } });
    }
    parts.push({ text: prompt });

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            designation: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            company: { type: Type.STRING },
            website: { type: Type.STRING },
            address: { type: Type.STRING },
            location: { type: Type.STRING },
            speciality: { type: Type.STRING },
            aiContext: { type: Type.STRING },
          },
          required: ["name", "designation", "email", "phone", "company", "website", "address", "location", "speciality", "aiContext"],
        },
      },
    });

    if (!response.text) {
      throw new Error("AI returned an empty response for business card extraction.");
    }

    return JSON.parse(response.text);
  },

  async getCompanyInfo(companyName: string): Promise<CompanyDetails> {
    const prompt = `Provide detailed information about the company "${companyName}" which is an exhibitor at Tagma 2026. 
    Include what they do, their key products, latest innovations, and technology they use.
    If exact data for some fields is unavailable, provide intelligent estimates based on their industry profile.`;

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whatTheyDo: { type: Type.STRING },
            products: { type: Type.ARRAY, items: { type: Type.STRING } },
            latestInnovations: { type: Type.STRING },
            technology: { type: Type.STRING },
          },
          required: ["whatTheyDo", "products", "latestInnovations", "technology"],
        },
      },
    });

    if (!response.text) {
      throw new Error(`AI returned an empty response for company: ${companyName}`);
    }

    return JSON.parse(response.text);
  },

  async searchCategoryExhibitors(category: string, availableCompanyList: string[]): Promise<string[]> {
    const prompt = `Act as an Industry Expert for Tagma 2026 (Tooling and Die show).
    The user is searching for: "${category}".
    
    1. First, select the most relevant exhibitors from this provided list:
    ${availableCompanyList.join(', ')}
    
    2. If there are other major industry players or exhibitors likely to be at a major Tooling & Die expo like Tagma that aren't in the list above, you may include them too.
    
    Return a JSON array of company names only.`;

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    if (!response.text) {
      return [];
    }

  },
  
  async refineProjectDescription(rawInput: string): Promise<any> {
    const prompt = `Convert the following raw project goal into a structured engineering blueprint: "${rawInput}".
    Keep responses technical and concise.
    Return JSON: {title, objective, technology, innovation, existingSystem, process, requirements}`;

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            objective: { type: Type.STRING },
            technology: { type: Type.STRING },
            innovation: { type: Type.STRING },
            existingSystem: { type: Type.STRING },
            process: { type: Type.STRING },
            requirements: { type: Type.STRING }
          },
          required: ["title", "objective", "technology", "innovation", "existingSystem", "process", "requirements"]
        }
      }
    });

    if (!response.text) throw new Error("AI failed to refine description.");
    return JSON.parse(response.text);
  },

  async matchExhibitors(projectBlueprint: any, exhibitorList: { name: string, category: string }[]): Promise<any[]> {
    // Optimization: Only send name and a small category hint to reduce token load and speed up processing
    const shortenedList = exhibitorList.map(e => `${e.name}|${e.category.slice(0, 30)}`).join('\n');
    
    const prompt = `Project: ${projectBlueprint.title} - ${projectBlueprint.objective}
    Matches needed for: ${projectBlueprint.technology}.
    
    Exhibitors (Name|Category):
    ${shortenedList}

    Pick ONLY relevant exhibitors from the list. Provide {exhibitorName, detailedSummary}.
    Explain how they specifically help with the project requirements.`;

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              exhibitorName: { type: Type.STRING },
              detailedSummary: { type: Type.STRING }
            },
            required: ["exhibitorName", "detailedSummary"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  }
};
