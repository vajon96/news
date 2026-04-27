import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAIExtras(title: string, content: string) {
  const prompt = `
    You are an expert news editor for "Cox Bazar Times". Based on the news article title and content below, generate the following in JSON format:
    1. "excerpt": A concise, engaging summary (max 160 characters).
    2. "category": Select the most fitting category from [Local, Tourism, Development, Sports, Culture, Environment].
    3. "slug": An SEO-friendly, URL-safe slug based on the title.
    4. "altText": A descriptive alt text for a featured image of this story.
    5. "tags": An array of 3-5 relevant keywords.

    Title: ${title}
    Content: ${content.substring(0, 2000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini AI error:", error);
    throw error;
  }
}

export async function aiGenerateDraft(promptText: string) {
  const prompt = `
    You are a professional journalist for "Cox Bazar Times". Write a full news article based on the following instructions:
    "${promptText}"
    
    Structure the response as JSON:
    {
      "title": "A catchy, urgent headline",
      "content": "Full detailed article text with html tags like <p>, <h3>, <strong> for formatting",
      "excerpt": "Brief summary",
      "category": "One of [Local, Tourism, Development, Sports, Culture, Environment]"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Draft error:", error);
    throw error;
  }
}

export async function aiSearchExpansion(query: string) {
  const prompt = `
    The user is searching for news on a Cox's Bazar news portal. 
    Expand the search query "${query}" into a set of 5 related keywords or synonyms to improve coverage.
    Return as JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return [query]; // Fallback to original
  }
}

export async function translateContent(content: string, targetLang: string = 'Bengali') {
  const prompt = `
    Translate the following news content to ${targetLang}. Preserve the emotional tone and journalistic style.
    Keep any HTML tags intact.
    
    Content: ${content}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function optimizeSocialHeadlines(headline: string) {
  const prompt = `
    Generate 3 viral and engaging social media headlines for the following news title. 
    Return as a JSON array of strings.
    
    Original Headline: ${headline}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini AI error:", error);
    throw error;
  }
}
