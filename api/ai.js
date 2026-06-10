export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  const key = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;
  const base = process.env.DEEPSEEK_API_KEY
    ? "https://api.deepseek.com/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  try {
    const r = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024
      })
    });
    if (!r.ok) throw new Error(`${r.status}`);
    const d = await r.json();
    return res.status(200).json({ text: d.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}