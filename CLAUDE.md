# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Run

**Local dev** (required for ES modules):
```bash
cd tower-defense
python3 -m http.server 8080
# open http://localhost:8080
```

**Production**: served via GitHub Pages. `index.html` is the entry point.

## Architecture

The game is split into ES modules under `js/`. `index.html` is just HTML + CSS — all logic lives in the JS files.

```
js/
  constants.js    — TYPES, ENEMIES, PATH, MAX_MONEY, distance()
  Map.js          — GameMap class: terrain, isOnPath(), draw()
  Tower.js        — Tower class: shoot, takeDamage, draw
  Enemy.js        — Enemy class: move, attack, draw (all 5 types)
  Projectile.js   — Projectile class: 3 flavours (auto/manual/enemy)
  WaveManager.js  — WaveManager class: wave cycle, spawn queue
  Game.js         — Game class (orchestrator) + loop() entry point
```

**Game loop** (bottom of `Game.js`):
```
loop() → game.update() → game.draw() → requestAnimationFrame(loop)
```

**Key OOP concepts to point out when teaching:**
- **Encapsulation** — `tower.isDead()` hides `hp <= 0`; callers don't need to know the internals
- **Single Responsibility** — each file has one job; `Enemy.js` handles enemies, not waves
- **Constructor as factory** — `new Tower(x, y, 'sniper')` returns a ready-to-use object
- **Composition** — `Game` has-a `GameMap`, has-a `WaveManager`, has-many `Tower`s
- **Private helpers** — methods prefixed `_` (e.g. `_drawWeapon`, `_runnerShoot`) are internal details

## Key patterns

- **Adding a tower type**: add an entry to `TYPES` in `constants.js` — buttons and behavior are automatic
- **Adding an enemy type**: add an entry to `ENEMIES` in `constants.js`, reference it in `WaveManager._buildWave()`
- **Wave difficulty**: adjust the `i % N === M` conditions in `WaveManager._buildWave()`
- **Flash messages**: call `game.flash("text")` — fades over 2 seconds
- **Manual tower control**: `Game.trySelectTower()` / `tryFireManual()` handle the player-controlled tower

## Economy

`money` is capped at `MAX_MONEY` (500). It increases from `e.reward` on kill and `20 * wave` bonus on wave clear. Always use `Math.min(money + amount, MAX_MONEY)` when adding gold.

## This project's context

Built by a 12-year-old learning to code with AI assistance. **Prioritize readability and teachability over cleverness.** When suggesting changes:
- Point to specific file names and line numbers
- Explain the *why*, not just the *what*
- Prefer small, single-concept edits over rewrites
- Use the OOP patterns already established — don't introduce new abstractions
