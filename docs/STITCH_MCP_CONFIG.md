# Stitch MCP Config

Mira uses Google Stitch as a design source for the project:

- Title: Mira Health Diary
- Project ID: `14123755652071843167`
- Screen list: `stitch/project.json`
- Local MCP entrypoint: `scripts/stitch-mcp-server.mjs`

## Codex MCP Server

Add this server to your local Codex MCP config, for example `~/.codex/config.toml`.

```toml
[mcp_servers.stitch]
command = "node"
args = ["/Users/iskander/Documents/Codex/2026-06-27/mira/work/mira/scripts/stitch-mcp-server.mjs"]

[mcp_servers.stitch.env]
STITCH_API_KEY = "your-local-stitch-key"
```

Do not commit the real API key. Keep it in your local config or shell environment.

## JSON MCP Clients

Use `stitch/mcp.example.json` as the JSON version of the same config:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "node",
      "args": [
        "/Users/iskander/Documents/Codex/2026-06-27/mira/work/mira/scripts/stitch-mcp-server.mjs"
      ],
      "env": {
        "STITCH_API_KEY": "your-local-stitch-key"
      }
    }
  }
}
```

## Import Current Screens

Once `STITCH_API_KEY` is available:

```bash
npm run stitch:fetch
```

The importer reads `stitch/project.json`, calls Stitch for the configured screens, downloads the hosted image/code URLs with `curl -L`, and writes:

- images to `stitch/assets/`
- code to `stitch/code/`
- manifest to `stitch/meta/manifest.json`

If you only have hosted URLs and no API key, copy `stitch/sources.example.json` to `stitch/sources.json`, fill the URLs, then run:

```bash
npm run stitch:fetch:sources
```

## Import RU MVP Screens

The Russian MVP screen set is stored separately:

- Config: `stitch/project.ru.json`
- Hosted URL template: `stitch/sources.ru.example.json`
- Output folder: `stitch/ru/`

With `STITCH_API_KEY`:

```bash
npm run stitch:fetch:ru
```

With hosted URLs:

```bash
cp stitch/sources.ru.example.json stitch/sources.ru.json
npm run stitch:fetch:ru:sources
```

`stitch/sources.ru.json` should stay local because hosted URLs may be temporary or private.

## Configured Screens

| # | Screen | ID | Slug |
|---:|---|---|---|
| 1 | Log: Track Details | `666dbcc9cd5546c49dcda9f094bced3d` | `log-track-details` |
| 2 | Onboarding: Privacy | `1fec994bf084456bab0c29b8f18c3142` | `onboarding-privacy` |
| 3 | Onboarding: Name | `217d7b755aa447158c40082b6e1ecc0a` | `onboarding-name` |
| 4 | Onboarding: Symptoms | `41b2c2a8e52d418db3e4151f8b395f61` | `onboarding-symptoms` |
| 5 | Onboarding: Period Duration | `8617925a185d45a9bd6d55abb26c47fe` | `onboarding-period-duration` |
| 6 | Log: Care Details | `9aa7f14ece1245529ab24f90bb8b8b80` | `log-care-details` |
| 7 | Onboarding: Cycle Start | `dc331803eb244cf495529f70d8ee8791` | `onboarding-cycle-start` |
| 8 | Onboarding: Cycle Length | `dfda375a42b84a3f8a1ee67dfc58208c` | `onboarding-cycle-length` |
| 9 | Onboarding: Ready | `fb5aa89db59b48e2bee504da46a97969` | `onboarding-ready` |
| 10 | Onboarding: Goals | `fc4fb1fb31bd4098a859069af3359dad` | `onboarding-goals` |

## RU MVP Screens

| # | Screen | ID | Slug |
|---:|---|---|---|
| 1 | Отчёт (RU) | `37bd6d5ebd7845efa30880beecf514a6` | `ru-report` |
| 2 | Анализ (RU) | `82983e40d28d4223b8b1b4ce904ffc69` | `ru-analysis` |
| 3 | Детали здоровья (RU) | `4de0a371cd9d4dffa70187af53e86659` | `ru-health-details` |
| 4 | Контекст (RU) | `c8ff4577d0644785a5e82fd250157d5c` | `ru-context` |
| 5 | Профиль (RU) | `af51b68dd22745abbc19a9903aea8b83` | `ru-profile` |
| 6 | Дневник (RU) | `ffdb5b5ccd2e438691c4621006523124` | `ru-diary` |
| 7 | Сегодня (RU) | `127c21dc9e744436b2caffd9ced3adca` | `ru-today` |
