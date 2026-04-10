import {
  createDefaultModelPresetAppliers,
  type OpenClawConfig,
} from "openclaw/plugin-sdk/provider-onboard";
import {
  buildNebiusTokenFactoryModelDefinition,
  NEBIUS_TOKEN_FACTORY_BASE_URL,
  NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
} from "./provider-catalog.js";

export const NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF = `nebius-token-factory/${NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID}`;

const nebiusTokenFactoryPresetAppliers = createDefaultModelPresetAppliers({
  primaryModelRef: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF,
  resolveParams: (_cfg: OpenClawConfig) => ({
    providerId: "nebius-token-factory",
    api: "openai-completions",
    baseUrl: NEBIUS_TOKEN_FACTORY_BASE_URL,
    defaultModel: buildNebiusTokenFactoryModelDefinition(),
    defaultModelId: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
    aliases: [{ modelRef: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF, alias: "Qwen 3.5" }],
  }),
});

export function applyNebiusTokenFactoryProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  return nebiusTokenFactoryPresetAppliers.applyProviderConfig(cfg);
}

export function applyNebiusTokenFactoryConfig(cfg: OpenClawConfig): OpenClawConfig {
  return nebiusTokenFactoryPresetAppliers.applyConfig(cfg);
}
