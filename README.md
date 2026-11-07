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

Choose 2, 3 or 4 players. Two-player mode uses Red and Yellow; three-player mode uses Red, Blue and Yellow. The match is automatically saved in the current browser's local storage and can be resumed on that same device. The save schema is versioned; this home-lane correction starts a fresh match rather than interpreting older token positions under the new rules.

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

The tests cover player modes, turn rotation, yard release, six-roll behavior, captures, safe squares, track and start-square blockades, the full lap, all six home-lane squares, exact centre entry, winning and saved-state validation. Site-integrity tests check game routes, search/filter wiring, responsive CSS, manifest structure and offline precache dependencies.

## Offline behavior

The service worker pre-caches the home page, privacy page, shared assets, the Ludo page and its stylesheet/rules/UI scripts, plus all other game pages. Visit once while online to install the cache. Offline availability depends on a successful first cache and browser storage policies. Clearing site data removes cached files and the locally saved match.

## Privacy and limitations

Scores, preferences and the saved Ludo match remain in the current browser on the current device. They are not sent to a server. Clearing browser/site data removes them. No online multiplayer, account login, cloud sync or server-backed leaderboard is implemented.

## QA status

- Source-reviewed the homepage, game routes, search/category filters, responsive breakpoints, navigation, manifest, service worker and all four game pages.
- Corrected Ludo progress to require a complete lap back to the start square, then traverse all six coloured home-lane squares before the centre. The saved-match schema is versioned so older progress is not misread.
- Added regression tests for 2/3/4-player setup, turn rotation, six-roll/no-move behavior, captures, safe squares, blockades, home entry, win detection and saved-state invariants.
- Fixed a Memory Match restart-timer race, made Snake and Tic Tac Toe score storage fail safely, and exposed mobile-menu state to assistive technology.
- Added the privacy page to the offline precache and bumped the shell cache to v4.
- This QA pass executed 27 test cases in an in-memory JavaScript harness and syntax-checked seven scripts. Browser gameplay, screen-reader behavior, physical-device layout, installability and real offline operation still require runtime QA; Chromium was available but external DNS access prevented loading a local checkout or the hosted site.

## Suggested next milestones

1. Run the rules tests and perform full browser/device gameplay and accessibility QA.
2. Add automated browser tests and performance checks.
3. Consider optional accounts/cloud sync only with a documented backend and security model.
4. Add real-time multiplayer only after authoritative server validation, matchmaking, abuse controls and privacy review.
5. Integrate ads only after consent, privacy disclosures and platform-policy review.
