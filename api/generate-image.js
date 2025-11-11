export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // --- Read prompt ---
  let body = '';
  await new Promise(r => { req.on('data', c => (body += c)); req.on('end', r); });
  let prompt = '';
  try { prompt = JSON.parse(body || '{}').prompt || ''; } catch {}
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // --- Fallback if no key ---
  const fallback = () => res.status(200).json({ url: `https://picsum.photos/seed/${Date.now()}/1024` });
  const key = process.env.STABILITY_API_KEY;
  if (!key) return fallback();

  try {
    const r = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sdxl', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: '1:1',
        output_format: 'png',
        model: 'stable-diffusion-xl-1024-v1-0'
      })
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Stability error:', err);
      return fallback();
    }

    const data = await r.json();
    const url = data.image || data?.artifacts?.[0]?.base64;
    if (!url) return fallback();

    // The API returns base64; convert to a data URL
    const finalUrl = url.startsWith('data:') ? url : `data:image/png;base64,${url}`;
    return res.status(200).json({ url: finalUrl });
  } catch (err) {
    console.error('Server error:', err);
    return fallback();
  }
}
