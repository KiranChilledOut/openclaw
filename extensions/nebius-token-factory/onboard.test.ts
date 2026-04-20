import { describe, expect, it } from "vitest";
import { applyNebiusTokenFactoryConfig, applyNebiusTokenFactoryProviderConfig } from "./onboard.js";
import { buildNebiusTokenFactoryModelDefinition } from "./provider-catalog.js";

describe("Nebius Token Factory onboarding", () => {
  it("writes provider wiring without persisting the legacy default-only model list", () => {
    const cfg = applyNebiusTokenFactoryProviderConfig({});

    expect(cfg.models?.providers?.["nebius-token-factory"]).toMatchObject({
      baseUrl: "https://api.tokenfactory.nebius.com/v1",
      api: "openai-completions",
      models: [],
    });
  });

  it("clears the legacy placeholder model list when reapplying provider config", () => {
    const cfg = applyNebiusTokenFactoryProviderConfig({
      models: {
        providers: {
          "nebius-token-factory": {
            baseUrl: "https://api.tokenfactory.nebius.com/v1",
            api: "openai-completions",
            models: [buildNebiusTokenFactoryModelDefinition()],
          },
        },
      },
    });

    expect(cfg.models?.providers?.["nebius-token-factory"]?.models).toEqual([]);
  });

  it("still sets the Nebius default primary model", () => {
    const cfg = applyNebiusTokenFactoryConfig({});

    expect(cfg.agents?.defaults?.model).toEqual({
      primary: "nebius-token-factory/Qwen/Qwen3.5-397B-A17B",
    });
  });
});
