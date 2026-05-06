# Copilot Instructions

Tower defense game built with vanilla JavaScript ES modules and HTML Canvas. No build step.

## Run

```bash
python3 -m http.server 8080
# open http://localhost:8080
```
ES modules require a server — opening `index.html` directly via `file://` will not work.

## File structure

```
index.html       — HTML shell + CSS only; loads js/Game.js as a module
js/
  constants.js   — TYPES, ENEMIES, PATH, MAX_MONEY, distance()
  Map.js         — GameMap class
  Tower.js       — Tower class
  Enemy.js       — Enemy class
  Projectile.js  — Projectile class
  WaveManager.js — WaveManager class
  Game.js        — Game class + loop() entry point
```

## Class responsibilities

| Class | File | Owns |
|-------|------|------|
| `GameMap` | `Map.js` | Terrain, path, `isOnPath(x,y)`, `draw(ctx)` |
| `Tower` | `Tower.js` | Auto-shoot, `takeDamage()`, `isDead()`, `draw()` |
| `Enemy` | `Enemy.js` | Movement, special attacks (runner arrows, dragon fire), `draw()` |
| `Projectile` | `Projectile.js` | 3 types: auto-tracking / manual / enemy shot |
| `WaveManager` | `WaveManager.js` | Wave cycle, spawn queue, `update(enemyCount)` returns kind string or `{waveCleared, bonus}` |
| `Game` | `Game.js` | Orchestrator — owns all arrays and state, input handling, HUD |

## Key extension patterns

**Add a tower type** — add an entry to `TYPES` in `constants.js`. Buttons and weapon drawing switch on `typeKey`, so add a branch in `Tower._drawWeapon()` too.

**Add an enemy type** — add an entry to `ENEMIES` in `constants.js`, then reference it in `WaveManager._buildWave()`. Add drawing logic in `Enemy._drawFace()` and `Enemy._drawWeapon()`.

**Change wave difficulty** — edit the `i % N === M` conditions in `WaveManager._buildWave()`.

## Conventions

- Private methods are prefixed with `_` (e.g. `_buildWave`, `_drawWeapon`)
- `distance(a, b)` from `constants.js` is the shared geometry helper — import it anywhere
- Gold is always capped: `Math.min(money + amount, MAX_MONEY)`
- Canvas is 800 × 500 px; path waypoints are defined in `PATH` in `constants.js`
