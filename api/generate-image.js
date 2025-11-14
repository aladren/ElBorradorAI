// --- Replicate FLUX Schnell ---
const key = process.env.REPLICATE_API_TOKEN;
if (!key) return fallback();

const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
  method: "POST",
  headers: {
    "Authorization": `Token ${key}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    input: {
      prompt: prompt,
      aspect_ratio: "1:1",
      guidance: 7.5,        // same idea as cfg_scale
      num_inference_steps: 4
    }
  })
});

const data = await r.json();
if (!r.ok) { console.error("Replicate error:", data); return fallback(); }

const url = data.output?.[0];
if (!url) return fallback();
return res.status(200).json({ url });
