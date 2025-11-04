export default async function handler(req, res) {
  // --- CORS (incluye preflight) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- Leer body de forma segura en Vercel (a veces req.body viene vacío) ---
    let bodyText = '';
    if (typeof req.body === 'string') {
      bodyText = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
      bodyText = JSON.stringify(req.body);
    } else {
      await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => {
          bodyText = data || '';
          resolve();
        });
      });
    }

    let prompt = '';
    try {
      const parsed = bodyText ? JSON.parse(bodyText) : {};
      prompt = typeof parsed.prompt === 'string' ? parsed.prompt : '';
    } catch {
      // si no parsea, prompt queda vacío
    }

    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // --- Llamada a OpenAI Images ---
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024'
      })
    });

    const data = await r.json();
    if (!r.ok) {
      // Devuelve el mensaje real para que lo veas en la consola
      return res.status(r.status).json({ error: data.error?.message || 'OpenAI error' });
    }

    const url = data?.data?.[0]?.url;
    return res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
