const Groq = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Build prompt ---
const buildPrompt = (extractedText) => {
  return `You are a smart travel assistant. Analyze the following travel booking documents and create a detailed day-by-day itinerary.

BOOKING DOCUMENTS:
${extractedText}

Return ONLY a valid JSON object with NO extra text, NO markdown, NO code blocks. Use exactly this structure:
{
  "title": "Trip title based on destination",
  "destination": "Main destination city/country",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "duration": 7,
  "summary": {
    "airline": "airline name or null",
    "flightNumber": "flight number or null",
    "hotel": "hotel name or null",
    "totalTravelers": 1,
    "bookingReference": "reference number or null"
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD or null",
      "title": "Short title for this day",
      "accommodation": "Hotel name or null",
      "notes": "Any tips or important info",
      "activities": [
        {
          "time": "HH:MM AM/PM or null",
          "title": "Activity title",
          "description": "Details about this activity",
          "location": "Place name",
          "type": "flight or hotel or activity or meal or transport or other"
        }
      ]
    }
  ]
}

Rules:
- Always include at least 1 day
- Make itinerary practical and detailed
- Include check-in, check-out, flights, meals and sightseeing`;
};

const allowedTypes = ['flight', 'hotel', 'activity', 'meal', 'transport', 'other'];

// --- Parse AI response safely ---
const parseAIResponse = (responseText) => {
  try {
    const cleaned = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const data = JSON.parse(cleaned);

    // Sanitize activity types to prevent Mongoose enum validation errors
    if (data.days && Array.isArray(data.days)) {
      data.days.forEach(day => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach(act => {
            if (!allowedTypes.includes(act.type)) {
              act.type = 'other';
            }
          });
        }
      });
    }

    return data;
  } catch (err) {
    throw new Error('AI returned invalid JSON. Please try again.');
  }
};

// --- Generate itinerary from text ---
const generateFromText = async (extractedText) => {
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: buildPrompt(extractedText),
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const response = completion.choices[0].message.content;
  return parseAIResponse(response);
};

// --- Generate itinerary from image ---
// Groq vision support via llama
const generateFromImage = async (base64Image, mimetype) => {
  const completion = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildPrompt('Extract all travel information from this document image and generate itinerary.'),
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimetype};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const response = completion.choices[0].message.content;
  return parseAIResponse(response);
};

// --- Main function called by controller ---
const generateItinerary = async (extractedData) => {
  if (extractedData.type === 'text') {
    return await generateFromText(extractedData.content);
  }
  if (extractedData.type === 'image') {
    return await generateFromImage(
      extractedData.content,
      extractedData.mimetype
    );
  }
  throw new Error('Unknown extraction type');
};

module.exports = { generateItinerary };