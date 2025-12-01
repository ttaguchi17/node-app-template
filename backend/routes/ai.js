const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/ask', async (req, res) => {
  try {
    const { tripLocation, userQuery } = req.body;

    if (!tripLocation || !userQuery) {
      return res.status(400).json({ success: false, message: "Missing location or query" });
    }

    // ✅ UPDATED: Using Gemini 2.0 Flash from your list
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash", 
        generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      You are a local travel guide expert.
      CONTEXT: The user is planning a trip to: "${tripLocation}".
      USER QUERY: "${userQuery}"
      
      INSTRUCTIONS:
      1. Provide exactly 3 recommendations.
      2. Return ONLY a JSON array.
      
      REQUIRED JSON STRUCTURE:
      [
        {
          "name": "Name",
          "description": "Short description (max 20 words)",
          "location": "Address/Area",
          "cost": "$ - $$$",
          "type": "Food" | "Activity" | "Sight"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const recommendations = JSON.parse(text);

    res.json({ success: true, recommendations });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, message: "AI service error: " + error.message });
  }
});

module.exports = router;