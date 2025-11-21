import Replicate from "replicate";

export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "black-forest-labs/flux-1-schnell",
      {
        input: {
          prompt,
          aspect_ratio: "16:9"
        }
      }
    );

    res.status(200).json({ url: output[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image generation failed" });
  }
}
