import { afterEach, describe, expect, it, vi } from "vitest";
import {
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
});
