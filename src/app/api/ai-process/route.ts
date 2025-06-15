export const runtime = "nodejs";
import OpenAI from "openai";

// Updated Novita AI client configuration with proper error handling
const openai = new OpenAI({
  baseURL: "https://api.novita.ai/v3/openai",
  apiKey: process.env.NOVITA_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "Content-Type": "application/json",
  },
  defaultQuery: {
    // Add any default query parameters if needed
  },
  timeout: 30000, // 30 seconds timeout
});

/**
 * Sanitizes text by removing or escaping potentially problematic characters
 * @param text - The text to sanitize
 * @returns Sanitized text safe for JSON and display
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove or replace problematic characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/[""]/g, '"') // Normalize smart quotes to regular quotes
    .replace(/['']/g, "'") // Normalize smart apostrophes
    .replace(/[–—]/g, '-') // Normalize em/en dashes to hyphens
    .replace(/…/g, '...') // Replace ellipsis character
    .replace(/[\u00A0]/g, ' ') // Replace non-breaking space with regular space
    // Escape remaining problematic characters for JSON safety
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\t/g, '\\t') // Escape tabs
    .replace(/\r/g, '\\r') // Escape carriage returns
    // Keep newlines for readability but ensure they're properly formatted
    .replace(/\n/g, '\\n')
    // Remove any remaining problematic Unicode characters
    .replace(/[\uFFFD\uFEFF]/g, '') // Remove replacement and BOM characters
    .trim();
}

/**
 * Attempts to extract JSON from potentially malformed AI response
 * @param rawResponse - The raw response from AI
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromResponse(rawResponse: string): any {
  if (!rawResponse) return null;

  // Try to parse as-is first
  try {
    return JSON.parse(rawResponse);
  } catch {
    // If direct parsing fails, try to extract JSON from the response
  }

  // Look for JSON object patterns in the response
  const jsonPatterns = [
    /\{[\s\S]*\}/,  // Match anything between first { and last }
    /```json\s*(\{[\s\S]*\})\s*```/i, // Match JSON in code blocks
    /json\s*:\s*(\{[\s\S]*\})/i, // Match "json: {...}"
  ];

  for (const pattern of jsonPatterns) {
    const match = rawResponse.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        return JSON.parse(jsonStr);
      } catch {
        continue;
      }
    }
  }

  return null;
}

/**
 * Validates and sanitizes the AI response structure
 * @param parsed - The parsed response object
 * @param readingLevel - The reading level to determine if rephrased field is needed
 * @returns Validated and sanitized response object
 */
function validateAndSanitizeResponse(parsed: any, readingLevel: string): { summary: string; rephrased: string } {
  const result = {
    summary: '',
    rephrased: ''
  };

  if (parsed && typeof parsed === 'object') {
    // Sanitize summary
    if (parsed.summary && typeof parsed.summary === 'string') {
      result.summary = sanitizeText(parsed.summary);
    }

    // Sanitize rephrased text
    if (parsed.rephrased && typeof parsed.rephrased === 'string') {
      result.rephrased = sanitizeText(parsed.rephrased);
    } else if (readingLevel === "default") {
      result.rephrased = ''; // Empty for default reading level
    }
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const { inputText, readingLevel } = await req.json();

    // Validate input
    if (!inputText || typeof inputText !== 'string') {
      return new Response(JSON.stringify({ 
        error: "Invalid input text provided" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize input text to prevent injection attacks
    const sanitizedInput = sanitizeText(inputText);

    // Prepare the base system and user prompt
    const baseSystemPrompt = `You are an assistant that helps summarize and rephrase text for people with dyslexia. Always be clear and friendly. 

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any additional text, explanations, or formatting outside the JSON object.

The JSON object must have exactly these two fields:
- "summary": A concise summary of the text
- "rephrased": The rephrased version (or empty string if not needed)

For the rephrased version, add newline characters (\\n) after the end of each sentence to improve readability.`;

    let userPrompt = `Here is some text to process:\n\n"${sanitizedInput}"\n\nReturn only a JSON object with this exact structure:
{
  "summary": "your concise summary here",
  "rephrased": "your rephrased version here"
}\n\nSummarize the text concisely.`;

    // Add rephrasing instructions only if not "default"
    if (readingLevel !== "default") {
      userPrompt += `\n\nThen, rephrase the original text using a ${readingLevel} tone/reading level, making it easier to understand.`;
    } else {
      userPrompt += `\n\nSince the reading level is "default", set the "rephrased" field to an empty string.`;
    }

    // Updated model selection with fallback options
    const modelOptions = [
      "deepseek/deepseek-r1-distill-llama-8b",  // Primary choice
      //"meta-llama/llama-3-8b-instruct",    // Fallback option 1
      //"mistralai/mistral-7b-instruct-v0.2" // Fallback option 2
    ];

    let response;
    let lastError;

    // Try each model in case of failures
    for (const model of modelOptions) {
      try {
        response = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: baseSystemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3, // Lower temperature for more consistent JSON output
          max_tokens: 1024,
          // Use JSON mode to ensure proper JSON response
          response_format: { type: "json_object" },
        });
        break; // Success, exit the loop
      } catch (error) {
        console.warn(`Model ${model} failed:`, error);
        lastError = error;
        continue; // Try next model
      }
    }

    if (!response) {
      throw lastError || new Error("All models failed to respond");
    }

    // Enhanced response parsing with multiple fallback strategies
    const rawOutput = response.choices[0]?.message?.content;
    
    if (!rawOutput) {
      throw new Error("No content received from AI model");
    }

    let parsed = extractJsonFromResponse(rawOutput);
    
    if (!parsed) {
      console.error("Failed to parse AI response as JSON:", rawOutput);
      // Create a fallback response
      parsed = {
        summary: "Unable to process the text properly. Please try again with different input.",
        rephrased: readingLevel !== "default" ? "Sorry, rephrasing failed. Please try again." : ""
      };
    }

    // Validate and sanitize the final response
    const sanitizedResponse = validateAndSanitizeResponse(parsed, readingLevel);

    // Ensure we have valid content
    if (!sanitizedResponse.summary.trim()) {
      sanitizedResponse.summary = "Summary could not be generated for the provided text.";
    }

    return new Response(JSON.stringify(sanitizedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Process Error:", error);
    
    // Return a sanitized error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const sanitizedError = sanitizeText(errorMessage);
    
    return new Response(JSON.stringify({ 
      error: "Something went wrong with the AI processing.",
      details: sanitizedError
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}