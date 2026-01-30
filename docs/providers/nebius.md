# Nebius

Nebius offers OpenAI-compatible endpoints. OpenClaw can auto-discover available models from the Nebius `/v1/models` endpoint when you provide an API key.

## Quick start

```bash
export NEBIUS_API_KEY="sk-..."
openclaw onboard --auth-choice nebius-api-key --nebius-api-key "$NEBIUS_API_KEY"
```

This writes the key to your OpenClaw auth profiles and sets the default model to `nebius/zai-org/GLM-4.7-FP8`.

## Configuration snippet

```json5
{
  agents: {
    defaults: { model: { primary: "nebius/zai-org/GLM-4.7-FP8" } }
  },
  models: {
    mode: "merge",
    providers: {
      nebius: {
        baseUrl: "https://api.tokenfactory.nebius.com/v1",
        apiKey: "${NEBIUS_API_KEY}",
        api: "openai-completions",
        // models auto-discovered from /v1/models; optional static fallback:
        models: [{ id: "zai-org/GLM-4.7-FP8", name: "Nebius GLM 4.7" }]
      }
    }
  }
}
```

## Notes

- Endpoint: `https://api.tokenfactory.nebius.com/v1`
- Auth: `NEBIUS_API_KEY` (Bearer)
- API: OpenAI chat completions + `/v1/models` for discovery
- Vision support is inferred from the provider’s `capabilities.vision` flag on each model.
