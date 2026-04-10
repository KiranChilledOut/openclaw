import type {
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "openclaw/plugin-sdk/provider-model-shared";
import { createSubsystemLogger } from "openclaw/plugin-sdk/runtime-env";
import { normalizeLowercaseStringOrEmpty, normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";

const log = createSubsystemLogger("nebius-token-factory-models");

export const NEBIUS_TOKEN_FACTORY_BASE_URL = "https://api.tokenfactory.nebius.com/v1";
export const NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID = "Qwen/Qwen3.5-397B-A17B";
const NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_NAME = "Qwen 3.5 397B A17B";
const NEBIUS_TOKEN_FACTORY_DEFAULT_CONTEXT_WINDOW = 262144;
const NEBIUS_TOKEN_FACTORY_DEFAULT_MAX_TOKENS = 65536;
const NEBIUS_TOKEN_FACTORY_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

type OpenAiModelEntry = {
  id?: string;
};

type OpenAiModelsResponse = {
  data?: OpenAiModelEntry[];
};

function isNebiusDefaultModel(modelId: string): boolean {
  return normalizeLowercaseStringOrEmpty(modelId) ===
    normalizeLowercaseStringOrEmpty(NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID);
}

function resolveNebiusModelInput(modelId: string): Array<"text" | "image"> {
  const normalized = normalizeLowercaseStringOrEmpty(modelId);
  if (
    isNebiusDefaultModel(modelId) ||
    normalized.includes("-vl") ||
    normalized.includes("vision")
  ) {
    return ["text", "image"];
  }
  return ["text"];
}

function isNebiusReasoningModel(modelId: string): boolean {
  const normalized = normalizeLowercaseStringOrEmpty(modelId);
  return (
    isNebiusDefaultModel(modelId) ||
    normalized.includes("thinking") ||
    normalized.includes("reason") ||
    normalized.includes("r1")
  );
}

export function buildNebiusTokenFactoryModelDefinition(
  modelId: string = NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
): ModelDefinitionConfig {
  return {
    id: modelId,
    name: isNebiusDefaultModel(modelId) ? NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_NAME : modelId,
    reasoning: isNebiusReasoningModel(modelId),
    input: resolveNebiusModelInput(modelId),
    cost: NEBIUS_TOKEN_FACTORY_DEFAULT_COST,
    contextWindow: NEBIUS_TOKEN_FACTORY_DEFAULT_CONTEXT_WINDOW,
    maxTokens: NEBIUS_TOKEN_FACTORY_DEFAULT_MAX_TOKENS,
  };
}

function coerceNebiusTokenFactoryModel(entry: OpenAiModelEntry): ModelDefinitionConfig | null {
  const id = normalizeOptionalString(entry.id) ?? "";
  if (!id) {
    return null;
  }
  return buildNebiusTokenFactoryModelDefinition(id);
}

async function discoverNebiusTokenFactoryModels(apiKey?: string): Promise<ModelDefinitionConfig[]> {
  const trimmedApiKey = normalizeOptionalString(apiKey) ?? "";
  if (!trimmedApiKey || process.env.VITEST || process.env.NODE_ENV === "test") {
    return [];
  }

  try {
    const response = await fetch(`${NEBIUS_TOKEN_FACTORY_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${trimmedApiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      log.warn(`Failed to discover Nebius Token Factory models: ${response.status}`);
      return [];
    }

    const payload = (await response.json()) as OpenAiModelsResponse;
    const entries = Array.isArray(payload.data) ? payload.data : [];
    const seen = new Set<string>();
    const models: ModelDefinitionConfig[] = [];
    for (const entry of entries) {
      const model = coerceNebiusTokenFactoryModel(entry);
      if (!model || seen.has(model.id)) {
        continue;
      }
      seen.add(model.id);
      models.push(model);
    }
    return models;
  } catch (error) {
    log.warn(`Failed to discover Nebius Token Factory models: ${String(error)}`);
    return [];
  }
}

export async function buildNebiusTokenFactoryProvider(
  apiKey?: string,
): Promise<ModelProviderConfig> {
  const discoveredModels = await discoverNebiusTokenFactoryModels(apiKey);
  const defaultModel = buildNebiusTokenFactoryModelDefinition();
  const models = discoveredModels.some((model) => model.id === defaultModel.id)
    ? discoveredModels
    : [defaultModel, ...discoveredModels];

  return {
    baseUrl: NEBIUS_TOKEN_FACTORY_BASE_URL,
    api: "openai-completions",
    models,
  };
}
