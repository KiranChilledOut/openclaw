import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { upsertAuthProfile } from "openclaw/plugin-sdk/provider-auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveProviderPluginChoice } from "../../src/plugins/provider-auth-choice.runtime.js";
import { registerSingleProviderPlugin } from "../../test/helpers/plugins/plugin-registration.js";
import plugin from "./index.js";
import {
  buildNebiusTokenFactoryModelDefinition,
  NEBIUS_TOKEN_FACTORY_BASE_URL,
  NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
} from "./provider-catalog.js";

const originalFetch = globalThis.fetch;
const originalNodeEnv = process.env.NODE_ENV;
const originalVitest = process.env.VITEST;

async function withLiveDiscovery<T>(
  fetchMock: typeof fetch,
  run: () => Promise<T>,
): Promise<T> {
  delete process.env.NODE_ENV;
  delete process.env.VITEST;
  globalThis.fetch = fetchMock;
  try {
    return await run();
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.VITEST = originalVitest;
    globalThis.fetch = originalFetch;
  }
}

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.VITEST = originalVitest;
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Nebius Token Factory provider plugin", () => {
  it("registers Nebius Token Factory with API-key wizard metadata", async () => {
    const provider = await registerSingleProviderPlugin(plugin);
    const resolved = resolveProviderPluginChoice({
      providers: [provider],
      choice: "nebius-token-factory-api-key",
    });

    expect(provider.id).toBe("nebius-token-factory");
    expect(provider.label).toBe("Nebius Token Factory");
    expect(provider.envVars).toEqual(["NEBIUS_TOKEN_FACTORY", "NEBIUS_API_KEY"]);
    expect(provider.auth).toHaveLength(1);
    expect(resolved?.provider.id).toBe("nebius-token-factory");
    expect(resolved?.method.id).toBe("api-key");
  });

  it("owns replay policy for OpenAI-compatible Nebius transports", async () => {
    const provider = await registerSingleProviderPlugin(plugin);

    expect(
      provider.buildReplayPolicy?.({
        provider: "nebius-token-factory",
        modelApi: "openai-completions",
        modelId: "Qwen/Qwen3.5-397B-A17B",
      } as never),
    ).toMatchObject({
      sanitizeToolCallIds: true,
      toolCallIdMode: "strict",
      applyAssistantFirstOrderingFix: true,
      validateGeminiTurns: true,
      validateAnthropicTurns: true,
    });
  });

  it("strips the legacy default-only placeholder model list during config normalization", async () => {
    const provider = await registerSingleProviderPlugin(plugin);

    expect(
      provider.normalizeConfig?.({
        provider: "nebius-token-factory",
        providerConfig: {
          baseUrl: "https://api.tokenfactory.nebius.com/v1",
          api: "openai-completions",
          models: [buildNebiusTokenFactoryModelDefinition()],
        },
      } as never),
    ).toMatchObject({
      models: [],
    });
  });

  it("keeps explicit Nebius model lists when they contain more than the legacy placeholder", async () => {
    const provider = await registerSingleProviderPlugin(plugin);

    expect(
      provider.normalizeConfig?.({
        provider: "nebius-token-factory",
        providerConfig: {
          baseUrl: "https://api.tokenfactory.nebius.com/v1",
          api: "openai-completions",
          models: [
            buildNebiusTokenFactoryModelDefinition(),
            buildNebiusTokenFactoryModelDefinition("deepseek-ai/DeepSeek-V3.2"),
          ],
        },
      } as never),
    ).toBeUndefined();
  });

  it("augments the onboarding picker catalog from Nebius auth profiles", async () => {
    const provider = await registerSingleProviderPlugin(plugin);
    const agentDir = await mkdtemp(join(tmpdir(), "nebius-token-factory-plugin-"));
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID },
          { id: "deepseek-ai/DeepSeek-V3.2" },
        ],
      }),
    } as Response);

    try {
      upsertAuthProfile({
        agentDir,
        profileId: "nebius-token-factory:default",
        credential: {
          type: "api_key",
          provider: "nebius-token-factory",
          key: "nebius-test-key",
        },
      });

      await withLiveDiscovery(fetchMock, async () => {
        const entries =
          (await provider.augmentModelCatalog?.({
            agentDir,
            config: {
              models: {
                providers: {
                  "nebius-token-factory": {
                    baseUrl: NEBIUS_TOKEN_FACTORY_BASE_URL,
                    api: "openai-completions",
                    models: [],
                  },
                },
              },
            },
            env: {},
            entries: [],
          } as never)) ?? [];

        expect(entries.map((entry) => `${entry.provider}/${entry.id}`)).toEqual([
          "nebius-token-factory/Qwen/Qwen3.5-397B-A17B",
          "nebius-token-factory/deepseek-ai/DeepSeek-V3.2",
        ]);
      });
    } finally {
      await rm(agentDir, { force: true, recursive: true });
    }
  });
});
