export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // --- Handle preflight request ---
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Only allow POST ---
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- Read prompt ---
  let body = '';
  await new Promise(resolve => {
    req.on('data', chunk => (body += chunk));
    req.on('end', resolve);
  });

  let prompt = '';
  try {
    const parsed = JSON.parse(body || '{}');
    prompt = parsed.prompt || '';
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // --- Fallback if OpenAI unavailable ---
  const fallback = () => {
    const seed = Date.now();
    return res
      .status(200)
      .json({ url: `https://picsum.photos/seed/${seed}/1024` });
  };

  // --- Check for API key ---
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('Missing or invalid OpenAI API key');
    return fallback();
  }

  try {
    // --- Call OpenAI image API ---
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
      const msg = data?.error?.message || '';
      console.error('OpenAI error:', msg);
      // Fallback for verify/billing errors
      if (/verify organization|quota|billing|hard limit/i.test(msg)) return fallback();
      return res.status(r.status).json({ error: msg });
    }

    const url = data?.data?.[0]?.url;
    if (!url) return fallback();

    return res.status(200).json({ url });
  } catch (err) {
    console.error('Server error:', err);
    return fallback();
  }
}
