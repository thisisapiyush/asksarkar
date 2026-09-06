import { pipeline } from "@huggingface/transformers";

async function main() {
  console.log("Warming up embedding model (downloading ONNX weights)...");
  const cacheDir = process.env.TRANSFORMERS_CACHE ?? "./.cache/transformers";
  console.log(`Cache dir: ${cacheDir}`);

  const extractor = await pipeline("feature-extraction", "Xenova/multilingual-e5-base", {
    dtype: "q8",
    cache_dir: cacheDir,
  });

  const result = await extractor("passage: warmup", {
    pooling: "mean",
    normalize: true,
  });

  console.log(`Model ready. Embedding dim: ${result.dims[result.dims.length - 1]}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Warmup failed:", e);
  process.exit(1);
});
