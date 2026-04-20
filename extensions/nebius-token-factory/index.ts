import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import {
  buildProviderReplayFamilyHooks,
  normalizeProviderId,
} from "openclaw/plugin-sdk/provider-model-shared";
import { isRecord, normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";
import {
  applyNebiusTokenFactoryConfig,
  NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF,
  normalizeNebiusTokenFactoryProviderConfig,
} from "./onboard.js";
import {
  buildNebiusTokenFactoryCatalogEntries,
  buildNebiusTokenFactoryProvider,
} from "./provider-catalog.js";

const PROVIDER_ID = "nebius-token-factory";
const OPENAI_COMPATIBLE_REPLAY_HOOKS = buildProviderReplayFamilyHooks({
  family: "openai-compatible",
});

function findExplicitProviderConfig(
  providers: Record<string, unknown> | undefined,
  providerId: string,
): Record<string, unknown> | undefined {
  if (!providers) {
    return undefined;
  }
  const normalizedProviderId = normalizeProviderId(providerId);
  const match = Object.entries(providers).find(
    ([configuredProviderId]) => normalizeProviderId(configuredProviderId) === normalizedProviderId,
  );
  return isRecord(match?.[1]) ? match[1] : undefined;
}

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "Nebius Token Factory Provider",
  description: "Bundled Nebius Token Factory provider plugin",
  provider: {
    label: "Nebius Token Factory",
    docsPath: "/providers/nebius-token-factory",
    envVars: ["NEBIUS_TOKEN_FACTORY", "NEBIUS_API_KEY"],
    auth: [
      {
        methodId: "api-key",
        label: "Nebius Token Factory API key",
        hint: "Qwen 3.5",
        optionKey: "nebiusTokenFactoryApiKey",
        flagName: "--nebius-token-factory-api-key",
        envVar: "NEBIUS_TOKEN_FACTORY",
        promptMessage: "Enter Nebius Token Factory API key",
        defaultModel: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyNebiusTokenFactoryConfig(cfg),
        wizard: {
          groupLabel: "Nebius Token Factory",
          groupHint: "Qwen 3.5",
        },
      },
    ],
    catalog: {
      order: "simple",
      run: async (ctx) => {
        const { apiKey, discoveryApiKey } = ctx.resolveProviderApiKey(PROVIDER_ID);
        if (!apiKey) {
          return null;
        }

        const explicitProvider = findExplicitProviderConfig(
          ctx.config.models?.providers as Record<string, unknown> | undefined,
          PROVIDER_ID,
        );
        const explicitBaseUrl = normalizeOptionalString(explicitProvider?.baseUrl) ?? "";

        return {
          provider: {
            ...(await buildNebiusTokenFactoryProvider(discoveryApiKey ?? apiKey)),
            ...(explicitBaseUrl ? { baseUrl: explicitBaseUrl } : {}),
            apiKey,
          },
        };
      },
    },
    augmentModelCatalog: ({ config, env, agentDir }) =>
      buildNebiusTokenFactoryCatalogEntries({
        config,
        env,
        agentDir,
      }),
    normalizeConfig: ({ providerConfig }) =>
      normalizeNebiusTokenFactoryProviderConfig(providerConfig),
    ...OPENAI_COMPATIBLE_REPLAY_HOOKS,
  },
});
