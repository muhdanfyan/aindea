export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  let lastError;

  // 1. Coba DeepSeek
  const dk = process.env.DEEPSEEK_API_KEY;
  if (dk) {
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${dk}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "system", content: "Kamu asisten penerjemah bahasa Wolio yang ahli." }, { role: "user", content: prompt }],
          max_tokens: 1024
        })
      });
      if (r.ok) {
        const d = await r.json();
        return res.status(200).json({ text: d.choices[0].message.content });
      }
      lastError = await r.text();
    } catch (e) { lastError = e.message; }
  }

  // 2. Fallback Gemini (kalau ada key)
  const gk = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
  if (gk) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gk}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (r.ok) {
        const d = await r.json();
        return res.status(200).json({ text: d.candidates?.[0]?.content?.parts?.[0]?.text || "" });
      }
    } catch (e) { lastError = e.message; }
  }

  return res.status(500).json({ error: lastError || "All providers failed" });
}