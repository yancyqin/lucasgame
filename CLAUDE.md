# CLAUDE.md - AI Assistant Guide

**[中文版本 →](#-中文版本)**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Run

**Local dev** (required for ES modules):
```bash
cd lucasgame
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

---

## 📖 中文版本

### 运行方式

**本地开发**（需要 ES 模块）：
```bash
cd lucasgame
python3 -m http.server 8080
# 打开 http://localhost:8080
```

**生产环境**：通过 GitHub Pages 提供。`index.html` 是入口。

### 项目架构

游戏被分为 `js/` 文件夹下的 ES 模块。`index.html` 只包含 HTML + CSS，所有逻辑都在 JS 文件中。

```
js/
  constants.js    — 数据定义（TYPES、ENEMIES、PATH、MAX_MONEY、distance()）
  Map.js          — GameMap 类：地形、isOnPath()、draw()
  Tower.js        — Tower 类：射击、受伤、绘制
  Enemy.js        — Enemy 类：移动、攻击、绘制（5 种类型）
  Projectile.js   — Projectile 类：3 种射弹（自动/手动/敌人）
  WaveManager.js  — WaveManager 类：波次循环、生成队列
  Game.js         — Game 类（协调器）+ loop() 入口
```

**游戏循环**（Game.js 底部）：
```
loop() → game.update() → game.draw() → requestAnimationFrame(loop)
```

**教学时需要指出的关键 OOP 概念：**
- **封装** — `tower.isDead()` 隐藏了 `hp <= 0` 的内部逻辑；调用者不需要知道细节
- **单一职责** — 每个文件只做一件事；`Enemy.js` 处理敌人，不处理波次
- **构造器模式** — `new Tower(x, y, 'sniper')` 返回一个现成可用的对象
- **组合** — `Game` 包含 `GameMap`、`WaveManager` 和多个 `Tower`
- **私有方法** — 前缀 `_` 的方法（如 `_drawWeapon`、`_runnerShoot`）是内部细节

### 关键模式

- **添加塔类型**：在 `constants.js` 的 `TYPES` 中添加条目——按钮和行为自动生成
- **添加敌人类型**：在 `constants.js` 的 `ENEMIES` 中添加条目，在 `WaveManager._buildWave()` 中引用
- **波次难度**：调整 `WaveManager._buildWave()` 中的 `i % N === M` 条件
- **闪现消息**：调用 `game.flash("text")` ——在 2 秒内淡出
- **手动塔控制**：`Game.trySelectTower()` / `tryFireManual()` 处理玩家控制的塔

### 经济系统

`money` 的上限是 `MAX_MONEY`（500）。在击杀敌人时从 `e.reward` 增加，波次完成时增加 `20 * wave` 奖励。添加金币时始终使用 `Math.min(money + amount, MAX_MONEY)`。

### 项目背景

由一名 12 岁的小朋友在学习编程时用 AI 辅助制作。**优先考虑可读性和可教性而不是代码复杂性。**在建议修改时：
- 指出具体的文件名和行号
- 解释 *为什么*，而不仅仅是 *做什么*
- 倾向于小的、单一概念的编辑，而不是完全重写
- 使用已建立的 OOP 模式——不要引入新的抽象

