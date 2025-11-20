export default async function handler(req, res) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Fallback si algo falla
  const fallback = () =>
    res.status(200).json({ url: `https://picsum.photos/seed/${Date.now()}/1024` });

  const key = process.env.STABILITY_API_KEY;
  if (!key) return fallback();

  // Leer prompt del body
  let body = '';
  await new Promise(r => {
    req.on('data', c => (body += c));
    req.on('end', r);
  });

  let prompt = '';
  try {
    prompt = JSON.parse(body || '{}').prompt || '';
  } catch (_) {}
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const r = await fetch(
      'https://api.stability.ai/v2beta/stable-image/generate/sdxl',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          cfg_scale: 7.5,
          aspect_ratio: '16:9',
          output_format: 'png',
          model: 'stable-diffusion-xl-1024-v1-0'
        })
      }
    );

    if (!r.ok) {
      console.error('Stability error status:', r.status);
      console.error('Stability error body:', await r.text());
      return fallback();
    }

    const data = await r.json();
    const b64 =
      data.image ||
      data.image_base64 ||
      (data.artifacts && data.artifacts[0] && data.artifacts[0].base64);

    if (!b64) {
      console.error('No base64 image in response:', data);
      return fallback();
    }

    const finalUrl = b64.startsWith('data:')
      ? b64
      : `data:image/png;base64,${b64}`;

    return res.status(200).json({ url: finalUrl });
  } catch (err) {
    console.error('Server error:', err);
    return fallback();
  }
}
