"use node";
import OpenAI from "openai";

// Define the interface for the segments log
interface Segment {
    start: number;
    end: number;
    text: string;
    speaker: string;
}

export async function generateShowNotes(segments: Segment[]) {
    const openai = new OpenAI({
        apiKey: process.env.Open_AI_API_KEY, // User defined key name
    });

    // Simplify segments for the prompt to save tokens (approximate representation)
    // Reduce logical load by just sending text if it's too long, but we need timestamps.
    const transcriptText = segments.map(s => `[${s.start.toFixed(0)}s]: ${s.text}`).join("\n");

    const prompt = `
    You are an expert Podcast Producer. Analyze the following transcript with timestamps.
    
    Transcript:
    ${transcriptText}

    Return a valid JSON object containing:

    {
      "title": "A catchy, SEO-friendly title",
      "summary": "A professional 3-sentence summary",
      "aiSynopsis": "A deeper, detailed analysis of the episode's themes and discussions (2-3 paragraphs)",
      "guestBio": "A short bio of the guest if identified, or 'Unknown Guest'",
      "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
      "seoTags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "chapters": [
         { "startTime": number, "title": "Topic Name", "description": "Short description" }
      ],
      "resources": [
         { "title": "Book/Tool/Person Mentioned", "url": "Optional inferred URL or empty string" }
      ]
    }

    Strict Rules:
    1. 'chapters' must use the 'startTime' (in seconds) from the transcript where the topic shifts.
    2. 'chapters' should be evenly distributed (aim for at least 5 chapters).
    3. 'resources' should extract books, websites, software, or famous people mentioned.
    `;

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant that outputs JSON." }, { role: "user", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error("OpenAI returned empty response");
    }

    try {
        return JSON.parse(content);
    } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        throw new Error("Failed to parse OpenAI response");
    }
}
