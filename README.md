# DesiPlay

A lightweight, mobile-first collection of browser games designed to work offline after the first successful online visit.

## Included in this upgrade

- Responsive landing page with game search and category filters.
- Tic Tac Toe (local two-player), Snake (keyboard and touch controls), and Memory Match.
- Local best scores and preferences using browser local storage.
- PWA manifest, install prompt support, app icon and service-worker cache.
- Privacy notice describing current local-only behavior.

## Run locally

Serve the repository root over HTTP (service workers do not work from `file://`):

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## Deploy

Publish the repository root with GitHub Pages or any static HTTPS host. Ensure the site is served from the repository root and that `index.html` is the entry point. PWA installation and service workers require HTTPS (localhost is allowed for development).

## Offline behavior

The service worker pre-caches the home page, assets and three game pages. Visit once while online to install the cache. Offline availability depends on a successful first cache and browser storage policies. Clearing site data removes cached files and local scores.

## Current scope / not yet implemented

There is no account system, backend API, online multiplayer, cloud save, leaderboard server, payment or ad integration. The included games are playable offline and save progress only on the current browser/device. Do not advertise server-backed or cross-device features until they are actually built and tested.

## Next recommended milestones

1. Add a full Ludo game and more original/copyright-cleared games.
2. Add automated tests, accessibility review and performance checks.
3. Add optional accounts and cloud sync only with a documented backend and security model.
4. Add real-time multiplayer only after authoritative server validation, matchmaking, abuse controls and privacy review.
5. Integrate ads only after consent, privacy disclosures and platform-policy review.
