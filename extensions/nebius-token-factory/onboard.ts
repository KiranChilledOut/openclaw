import {
  applyAgentDefaultModelPrimary,
  applyProviderConfigWithModelCatalogPreset,
  type ModelProviderConfig,
  type OpenClawConfig,
} from "openclaw/plugin-sdk/provider-onboard";
import { normalizeLowercaseStringOrEmpty } from "openclaw/plugin-sdk/text-runtime";
import {
  buildNebiusTokenFactoryModelDefinition,
  NEBIUS_TOKEN_FACTORY_BASE_URL,
  NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
} from "./provider-catalog.js";

export const NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF = `nebius-token-factory/${NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID}`;

const PROVIDER_ID = "nebius-token-factory";
const NEBIUS_MODEL_ALIASES = [
  { modelRef: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF, alias: "Qwen 3.5" },
] as const;

function findNebiusProviderKey(
  providers: Record<string, ModelProviderConfig> | undefined,
): string | undefined {
  if (!providers || typeof providers !== "object") {
    return undefined;
  }
  return Object.keys(providers).find(
    (key) =>
      normalizeLowercaseStringOrEmpty(key) === normalizeLowercaseStringOrEmpty(PROVIDER_ID),
  );
}

function isLegacyNebiusPlaceholderModel(
  model: NonNullable<ModelProviderConfig["models"]>[number] | undefined,
): boolean {
  if (!model) {
    return false;
  }
  const defaultModel = buildNebiusTokenFactoryModelDefinition();
  return (
    normalizeLowercaseStringOrEmpty(model.id) ===
      normalizeLowercaseStringOrEmpty(defaultModel.id) &&
    (model.name === undefined ||
      normalizeLowercaseStringOrEmpty(model.name) ===
        normalizeLowercaseStringOrEmpty(defaultModel.name) ||
      normalizeLowercaseStringOrEmpty(model.name) === normalizeLowercaseStringOrEmpty(model.id)) &&
    (model.contextWindow === undefined || model.contextWindow === defaultModel.contextWindow) &&
    (model.maxTokens === undefined || model.maxTokens === defaultModel.maxTokens)
  );
}

function shouldStripLegacyNebiusPlaceholderModels(
  models: ModelProviderConfig["models"],
): boolean {
  return Array.isArray(models) && models.length === 1 && isLegacyNebiusPlaceholderModel(models[0]);
}

export function normalizeNebiusTokenFactoryProviderConfig(
  providerConfig: ModelProviderConfig,
): ModelProviderConfig | undefined {
  if (!shouldStripLegacyNebiusPlaceholderModels(providerConfig.models)) {
    return undefined;
  }
  return { ...providerConfig, models: [] };
}

function normalizeNebiusTokenFactoryConfig(cfg: OpenClawConfig): OpenClawConfig {
  const providerKey = findNebiusProviderKey(cfg.models?.providers);
  if (!providerKey) {
    return cfg;
  }
  const providerConfig = cfg.models?.providers?.[providerKey];
  if (!providerConfig) {
    return cfg;
  }
  const normalizedProvider = normalizeNebiusTokenFactoryProviderConfig(providerConfig);
  if (!normalizedProvider) {
    return cfg;
  }
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        [PROVIDER_ID]: normalizedProvider,
      },
    },
  };
}

export function applyNebiusTokenFactoryProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  return applyProviderConfigWithModelCatalogPreset(normalizeNebiusTokenFactoryConfig(cfg), {
    providerId: PROVIDER_ID,
    api: "openai-completions",
    baseUrl: NEBIUS_TOKEN_FACTORY_BASE_URL,
    // Keep discovery authoritative. We only persist provider wiring and aliases,
    // then let runtime /v1/models replace the old default-only placeholder list.
    catalogModels: [],
    aliases: NEBIUS_MODEL_ALIASES,
  });
}

export function applyNebiusTokenFactoryConfig(cfg: OpenClawConfig): OpenClawConfig {
  return applyAgentDefaultModelPrimary(
    applyNebiusTokenFactoryProviderConfig(cfg),
    NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF,
  );
}
