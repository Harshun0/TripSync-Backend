import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

router.post('/ai-travel', requireAuth, async (req, res) => {
  try {
    const { destination, days, budget, interests, type, people, history } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY || GROQ_API_KEY === 'your-groq-api-key') {
      return res.status(503).json({
        error: 'AI is not configured. Add a valid GROQ_API_KEY in server/.env. Get your free key at https://console.groq.com/keys',
      });
    }

    let systemPrompt = '';
    let messages = [];

    if (type === 'itinerary') {
      systemPrompt = `You are TripSync AI, an expert travel planner. Generate detailed, practical travel itineraries in JSON format.
      
Your response MUST be a valid JSON object with this exact structure:
{
  "destination": "string",
  "duration": "string",
  "totalBudget": number,
  "currency": "₹",
  "summary": "string",
  "days": [
    {
      "day": number,
      "title": "string",
      "activities": [
        {
          "time": "string",
          "activity": "string",
          "cost": number,
          "tips": "string"
        }
      ]
    }
  ],
  "tips": ["string"]
}

Make the itinerary practical, fun, and aligned with the user's budget and interests. Include estimated costs for each activity in INR (₹). 
The budget is per person. The total should match the budget constraint.
IMPORTANT: Do NOT use markdown formatting like ** or *** in any text fields. Use plain text only. Return only the JSON object, no markdown code fence.`;

      const userPrompt = `Create a ${days}-day travel itinerary for ${destination} for a single person with a budget of ₹${budget || '20000'}.
      
User interests: ${interests?.join(', ') || 'general sightseeing'}

Provide a complete day-by-day plan with specific timings, activities, estimated costs, and helpful tips. Make sure the total cost stays within the budget. Return only valid JSON.`;

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
    } else {
      systemPrompt = `You are TripSync AI, a friendly and knowledgeable travel assistant. You help users with:
- Planning trips and itineraries
- Finding travel companions
- Budget planning and expense tracking
- Safety tips and emergency information
- Local recommendations and hidden gems

IMPORTANT: You have access to the full conversation history. Use it to maintain context.
If the user previously discussed a destination, remember it and build on it.
If they asked about hotels after discussing a trip plan, recommend hotels for THAT destination.
Be conversational, helpful, and enthusiastic about travel.
Use markdown formatting for readability (bold, bullet points, headers).
Provide actionable advice with specific details.`;

      messages = [{ role: 'system', content: systemPrompt }];
      if (history && Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          const role = msg.role === 'assistant' ? 'assistant' : 'user';
          messages.push({ role, content: msg.content || '' });
        }
      }
      messages.push({ role: 'user', content: destination || 'Hello' });
    }

    const body = {
      model: GROQ_MODEL,
      messages,
      temperature: type === 'itinerary' ? 0.3 : 0.7,
      max_tokens: 4096,
    };

    const doRequest = () =>
      fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

    let response = await doRequest();
    if (response.status === 429) {
      await new Promise((r) => setTimeout(r, 3000));
      response = await doRequest();
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errMessage = errorText;
      try {
        const errJson = JSON.parse(errorText);
        errMessage = errJson.error?.message || (typeof errJson.error === 'string' ? errJson.error : null) || errorText;
      } catch (_) {}
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Wait a moment and try again.' });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(503).json({ error: errMessage || 'Invalid Groq API key. Check GROQ_API_KEY in server/.env. Get a key at https://console.groq.com/keys' });
      }
      console.error('Groq API error:', response.status, errorText);
      return res.status(response.status).json({ error: errMessage || `Groq API error: ${response.status}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({
        error: data.choices?.[0]?.finish_reason ? `AI stopped: ${data.choices[0].finish_reason}` : 'No content in AI response',
      });
    }

    if (type === 'itinerary') {
      try {
        let jsonContent = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonContent = jsonMatch[1].trim();
        const parsedItinerary = JSON.parse(jsonContent);
        return res.json({ type: 'itinerary', data: parsedItinerary });
      } catch (parseError) {
        console.error('Failed to parse itinerary JSON:', parseError);
        return res.json({ type: 'text', content });
      }
    }

    return res.json({ type: 'text', content });
  } catch (error) {
    console.error('Error in ai-travel:', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

export default router;
