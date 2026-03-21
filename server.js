const express = require("express");
const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { systemPrompt, messages } = req.body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt || "You are a helpful Roblox developer assistant.",
      messages: messages || []
    })
  });

  const data = await response.json();

  if (data.content && data.content[0]) {
    res.json({ result: data.content[0].text });
  } else {
    res.status(500).json({ error: "No response from AI", raw: data });
  }
});

app.listen(process.env.PORT || 3000);
