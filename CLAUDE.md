# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Run

Open `index.html` directly in any browser — no build step, no server needed.

## Architecture

Everything lives in a single `index.html` file. The JS is structured around a fixed game loop:

```
loop() → update() → draw() → requestAnimationFrame(loop)
```

**Data layer** (top of script, constants + `let` globals):
- `TYPES` — tower definitions (cost, range, fireRate, damage, color)
- `ENEMIES` — enemy definitions (speed, hp, size, reward)
- `path` — array of `{x, y}` waypoints enemies walk along
- `player` — single hero object with position, sword stats, slash animation state
- `towers`, `enemies`, `projectiles` — live arrays that grow/shrink each frame

**Wave system**: `inBreak` / `breakTimer` / `spawnQueue` control the wave cycle. `buildWave(n)` returns a queue of enemy type name strings. When the queue empties and `enemies` is empty, a new break begins with a bonus gold payout.

**Collision / geometry**: `distance(a, b)` is used everywhere. `onPath(x, y)` uses point-to-line-segment projection (the `t = clamp(dot/len2)` pattern) to block tower placement on the path.

**Rendering**: Canvas 2D only. Draw order matters — path → towers → player → enemies → projectiles → HUD → overlays. The slash arc uses `ctx.arc` with `player.facing` as the center angle.

**Economy**: `money` is the single resource. Towers cost on placement, enemies pay `reward` on death, waves pay `20 * wave` bonus. `updateButtons()` syncs button opacity to affordability after any money change.

## Key patterns to know

- **Adding a tower type**: add an entry to `TYPES`, button and behavior are automatic.
- **Adding an enemy type**: add an entry to `ENEMIES`, then reference it by name in `buildWave()`.
- **Flash messages**: call `flash("text")` — draws a fading centered message for 2 seconds.
- **Wave composition**: controlled entirely by `buildWave(n)` — adjust the `i % N === M` conditions to change wave difficulty curve.
- `player.cooldown` counts down every frame; attack only triggers when it reaches 0 *and* an enemy is in range. `player.slashTimer` drives the visual arc fade separately.

## This project's context

Built by a 12-year-old learning to code with AI assistance. Prioritize readability and teachability over cleverness. When suggesting changes, point to specific line numbers and explain the *why*. Prefer small, single-concept edits over rewrites.
