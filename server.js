const express = require("express");
const app = express();
app.use(express.json());

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

app.post("/generate", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    console.log("Request received, messages:", messages ? messages.length : 0);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set!" });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages" });
    }

    const geminiContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt || "You are a helpful Roblox developer assistant." }]
      },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 10000,  // raised — never cuts off mid-script
        temperature: 0.1,       // lower = more precise code
      }
    };

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    console.log("Gemini status:", response.status);

    if (response.status === 200 && data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;
      return res.json({ result: text });
    } else if (data.error) {
      return res.status(500).json({ error: "Gemini error: " + (data.error.message || JSON.stringify(data.error)) });
    } else {
      return res.status(500).json({ error: "Unexpected: " + JSON.stringify(data).slice(0, 300) });
    }

  } catch (err) {
    console.error("Crash:", err.message);
    return res.status(500).json({ error: "Server crashed: " + err.message });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "AI Builder running!", apiKeySet: !!process.env.GEMINI_API_KEY });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started, key set:", !!process.env.GEMINI_API_KEY);
});
