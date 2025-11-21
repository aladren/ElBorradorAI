import Replicate from "replicate";

export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "stability-ai/sdxl:1f8ba7070e20c3ec915c6ad12b4b228c2e4e962f864e8b6d23830e65e8b6e8bd",
      {
        input: {
          prompt,
          aspect_ratio: "16:9",
          output_format: "png"
        }
      }
    );

    // FIX: Replicate returns an array with 1 URL
    res.status(200).json({ url: output[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image generation failed" });
  }
}
