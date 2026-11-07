# DesiPlay

A lightweight, mobile-first collection of browser games designed to work offline after the first successful online visit.

## Games

- **Tic Tac Toe** — local two-player classic.
- **Snake** — arcade game with keyboard and touch controls.
- **Memory Match** — local card-matching puzzle.
- **Ludo** — 2–4 player pass-and-play on one shared device.

## Ludo rules and controls

The Ludo game uses a documented classic ruleset:

- Roll a six to bring a token out of the yard; a six grants another roll.
- Complete one circuit of the shared 52-square track, return to your starting square, then enter your own six-square home lane.
- An exact roll is required to reach the centre.
- Capture a single opponent token by landing on it on a non-safe square; captured tokens return to their yard and the capturer gets another roll.
- Start squares and star squares are safe.
- Two same-colour tokens on a track square form a blockade. Tokens cannot pass through or land on a blockade; moving one token breaks it.
- The third consecutive six is ignored and ends that player's turn.
- A six, a capture or bringing a token exactly home grants an extra roll.
- The first player to bring all four tokens home wins.

Choose 2, 3 or 4 players. Two-player mode uses Red and Yellow; three-player mode uses Red, Blue and Yellow. The match is automatically saved in the current browser's local storage and can be resumed on that same device. The save schema is versioned; this home-lane correction starts a fresh match instead of interpreting older saved token positions under the new rules.

This is local pass-and-play only. There is no online multiplayer, account system, backend API, cloud save, server leaderboard, payment or ad integration. Regional Ludo rule variations may differ from the rules listed above.

## Run locally

Serve the repository root over HTTP (service workers do not work from `file://`):

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## Run the automated source and rules tests

With Node.js 18 or later, run:

```bash
node --test tests/*.test.js
```

The tests cover Ludo player modes, turn rotation, yard release, six-roll behavior, captures, safe squares, blockades on the track and start square, the full lap, all six home-lane squares, exact centre entry, winning and saved-state validation. Site-integrity tests verify game routes, manifest structure and offline precache dependencies.

## Offline behavior

The service worker pre-caches the home page, privacy page, shared assets, the Ludo page and its stylesheet/rules/UI scripts, plus all other game pages. Visit once while online to install the cache. Offline availability depends on a successful first cache and browser storage policies. Clearing site data removes cached files and the locally saved match.

## Privacy and limitations

Scores, preferences and the saved Ludo match remain in the current browser on the current device. They are not sent to a server. Clearing browser/site data removes them. No online multiplayer, account login, cloud sync or server-backed leaderboard is implemented.

## QA status

- Source-reviewed the homepage routes, search/category metadata, responsive breakpoints, navigation controls, game pages, manifest and service-worker cache dependencies.
- Corrected Ludo progress to require a complete lap back to the start square, then traverse all six coloured home-lane squares before the centre; versioned the saved-match schema so older progress is not misread.
- Added regression coverage for six-roll/no-move behavior, player rotation, the full home lane and winner validation.
- Fixed a Memory Match restart timer race, made local score storage fail safely in Snake and Tic Tac Toe, and exposed mobile navigation state to assistive technology.
- Added the privacy page to the offline precache and refreshed the service-worker cache version.
- Browser gameplay, screen-reader behavior, physical-device layout, installability and real offline behavior still require runtime QA before production release.

## Suggested next milestones

1. Run the rules tests and perform full browser/device gameplay and accessibility QA.
2. Add automated browser tests and performance checks.
3. Consider optional accounts/cloud sync only with a documented backend and security model.
4. Add real-time multiplayer only after authoritative server validation, matchmaking, abuse controls and privacy review.
5. Integrate ads only after consent, privacy disclosures and platform-policy review.
