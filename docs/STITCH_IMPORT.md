# Stitch Import Service

This repository keeps Stitch handoff assets under `stitch/`.

## Project

- Title: Mira Health Diary
- ID: `14123755652071843167`

Screen IDs are stored in `stitch/project.json`.

For MCP setup, see `docs/STITCH_MCP_CONFIG.md`.

## How To Import Assets

### Option A: SDK Import

1. Create a Stitch API key in Stitch settings.
2. Set it in your shell or add it to local `.env.local`:

```bash
export STITCH_API_KEY="..."
```

```bash
STITCH_API_KEY=...
```

3. Run:

```bash
npm run stitch:fetch
```

The script uses `@google/stitch-sdk` to fetch image/code URLs for the configured project and screens, then downloads those URLs.

### Option B: Hosted URLs

1. Export or copy hosted image/code URLs from Stitch for each screen.
2. Copy `stitch/sources.example.json` to `stitch/sources.json`.
3. Replace the example URLs with the real Stitch hosted URLs.
4. Run:

```bash
npm run stitch:fetch:sources
```

Both modes try `curl -L` first, then fall back to Node `fetch` when `curl` is unavailable.

Downloaded files go here:

- Images: `stitch/assets/`
- Code: `stitch/code/`
- Manifest: `stitch/meta/manifest.json`

## Screens

| Screen | ID | Slug |
|---|---|---|
| Log: Track Details | `666dbcc9cd5546c49dcda9f094bced3d` | `log-track-details` |
| Onboarding: Privacy | `1fec994bf084456bab0c29b8f18c3142` | `onboarding-privacy` |
| Onboarding: Name | `217d7b755aa447158c40082b6e1ecc0a` | `onboarding-name` |
| Onboarding: Symptoms | `41b2c2a8e52d418db3e4151f8b395f61` | `onboarding-symptoms` |
| Onboarding: Period Duration | `8617925a185d45a9bd6d55abb26c47fe` | `onboarding-period-duration` |
| Log: Care Details | `9aa7f14ece1245529ab24f90bb8b8b80` | `log-care-details` |
| Onboarding: Cycle Start | `dc331803eb244cf495529f70d8ee8791` | `onboarding-cycle-start` |
| Onboarding: Cycle Length | `dfda375a42b84a3f8a1ee67dfc58208c` | `onboarding-cycle-length` |
| Onboarding: Ready | `fb5aa89db59b48e2bee504da46a97969` | `onboarding-ready` |
| Onboarding: Goals | `fc4fb1fb31bd4098a859069af3359dad` | `onboarding-goals` |

## Notes

Stitch screen IDs alone need an API key. Without `STITCH_API_KEY`, the importer expects the hosted URLs that Stitch provides for images/code exports.
