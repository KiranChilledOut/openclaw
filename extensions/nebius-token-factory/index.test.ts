import { describe, expect, it } from "vitest";
import { resolveProviderPluginChoice } from "../../src/plugins/provider-auth-choice.runtime.js";
import { registerSingleProviderPlugin } from "../../test/helpers/plugins/plugin-registration.js";
import plugin from "./index.js";

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
});
