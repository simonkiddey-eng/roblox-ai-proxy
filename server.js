const express = require("express");
const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages array" });
    }

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
        messages: messages
      })
    });

    const data = await response.json();

    // Log for debugging
    console.log("Anthropic status:", response.status);
    console.log("Anthropic response:", JSON.stringify(data).slice(0, 300));

    if (data.content && data.content[0]) {
      res.json({ result: data.content[0].text });
    } else if (data.error) {
      res.status(500).json({ error: data.error.message || JSON.stringify(data.error) });
    } else {
      res.status(500).json({ error: "Unexpected response: " + JSON.stringify(data).slice(0, 200) });
    }

  } catch (err) {
    console.error("Server crash:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);
