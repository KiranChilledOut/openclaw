import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { upsertAuthProfile } from "openclaw/plugin-sdk/provider-auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildNebiusTokenFactoryCatalogEntries,
  buildNebiusTokenFactoryModelDefinition,
  buildNebiusTokenFactoryProvider,
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

describe("Nebius Token Factory provider catalog", () => {
  it("builds the bundled Nebius defaults", async () => {
    const provider = await buildNebiusTokenFactoryProvider();
    const defaultModel = buildNebiusTokenFactoryModelDefinition();

    expect(provider.baseUrl).toBe(NEBIUS_TOKEN_FACTORY_BASE_URL);
    expect(provider.api).toBe("openai-completions");
    expect(provider.models).toEqual([defaultModel]);
    expect(provider.models?.[0]).toMatchObject({
      id: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 262144,
      maxTokens: 65536,
    });
  });

  it("discovers additional models from /models", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID },
          { id: "deepseek-ai/DeepSeek-V3.2" },
        ],
      }),
    } as Response);

    await withLiveDiscovery(fetchMock, async () => {
      const provider = await buildNebiusTokenFactoryProvider("nebius-test-key");

      expect(fetchMock).toHaveBeenCalledWith(
        `${NEBIUS_TOKEN_FACTORY_BASE_URL}/models`,
        expect.objectContaining({
          headers: { Authorization: "Bearer nebius-test-key" },
        }),
      );
      expect(provider.models?.map((model) => model.id)).toEqual([
        NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
        "deepseek-ai/DeepSeek-V3.2",
      ]);
    });
  });

  it("falls back to the default model when discovery fails", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await withLiveDiscovery(fetchMock, async () => {
      const provider = await buildNebiusTokenFactoryProvider("nebius-test-key");

      expect(provider.models?.map((model) => model.id)).toEqual([
        NEBIUS_TOKEN_FACTORY_DEFAULT_MODEL_ID,
      ]);
    });
  });

  it("builds picker catalog entries from stored Nebius auth profiles", async () => {
    const agentDir = await mkdtemp(join(tmpdir(), "nebius-token-factory-"));
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
        const entries = await buildNebiusTokenFactoryCatalogEntries({
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
        });

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
