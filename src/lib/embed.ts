import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const MODEL_ID = "Xenova/multilingual-e5-base";

let instance: FeatureExtractionPipeline | null = null;

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!instance) {
    instance = await pipeline("feature-extraction", MODEL_ID, {
      dtype: "q8",
      cache_dir: process.env.TRANSFORMERS_CACHE ?? "./.cache/transformers",
    }) as FeatureExtractionPipeline;
  }
  return instance;
}

export async function embedQuery(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const result = await extractor(`query: ${text}`, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(result.data as Float32Array);
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const extractor = await getPipeline();
  const prefixed = texts.map((t) => `passage: ${t}`);
  const result = await extractor(prefixed, {
    pooling: "mean",
    normalize: true,
  });

  const dim = 768;
  const flat = result.data as Float32Array;
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    embeddings.push(Array.from(flat.slice(i * dim, (i + 1) * dim)));
  }
  return embeddings;
}
