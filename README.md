# Lucas Game 🎮

**[Play the Game →](https://yancyqin.github.io/lucasgame/)**

---

## 📖 English Version

### What is This?

**Lucas Game** is a tower defense game built by a 12-year-old learning AI-assisted programming with his dad. It's not just a game—it's a **complete learning journey** in modern web development.

This project demonstrates how kids can turn their own ideas into reality using AI as a coding mentor, progressing from simple HTML/JavaScript to professional OOP architecture.

### 🎯 Learning Journey

#### **Phase 1: Foundation (Single File)**
- Start with one `index.html` containing HTML, CSS, and JavaScript
- Learn basic game loops and DOM manipulation
- Understand coordinates, movement, collision detection
- **Skills:** Variables, functions, event listeners

#### **Phase 2: Data & Balance**
- Read and analyze the existing code (constants, tower stats, enemy waves)
- Modify game data: tower prices, damage, health, enemy rewards
- Understand how data flows through the game
- **Skills:** Code reading, debugging, game balance mechanics
- **Example tasks:**
  - "Change the sniper tower cost to 200 and damage to 50"
  - "Make wave 5 spawn 10 enemies instead of 5"
  - "Increase player starting money to 600"

#### **Phase 3: Modules & OOP**
- Refactor single file → ES6 modules (one class per file)
- Learn Object-Oriented Programming:
  - **Encapsulation** — `tower.isDead()` hides internal `hp <= 0` logic
  - **Single Responsibility** — `Enemy.js` only handles enemies, not towers
  - **Constructor Pattern** — `new Tower(x, y, 'sniper')` creates a ready-to-use object
  - **Composition** — `Game` contains `GameMap`, `WaveManager`, towers, and enemies
  - **Private Methods** — prefix with `_` to indicate internal details
- **Current structure:**
  ```
  js/
    constants.js    — Game data (tower types, enemies, economy)
    Map.js          — GameMap class (terrain, path, rendering)
    Tower.js        — Tower class (shooting, damage, targeting)
    Enemy.js        — Enemy class (movement, health, 5 types)
    Projectile.js   — Projectile class (3 types: auto, manual, enemy)
    WaveManager.js  — WaveManager class (spawning, difficulty)
    Game.js         — Game class (orchestrator, main loop)
  ```

#### **Phase 4: Advanced Patterns** (Future)
- Learn programming logic through real game mechanics:
  - **Loops** — How waves spawn enemies in patterns (`for` loops in `_buildWave()`)
  - **Conditionals** — Pathfinding logic (`if` statements in `isOnPath()`)
  - **Arrays & Objects** — Storing towers, enemies, projectiles
  - **Callbacks** — Event handling and frame animations
  - **Async concepts** — Managing simultaneous game updates
- Extend the game: new tower types, enemy behaviors, visual effects

### 🏗️ Architecture Overview

```
Game Loop (requestAnimationFrame)
  ↓
game.update()
  ├─ waveManager.update()      → spawn enemies
  ├─ towers[].update()          → each tower shoots
  ├─ enemies[].update()         → each enemy moves
  ├─ projectiles[].update()     → projectiles move & hit
  └─ economy.update()           → handle money/waves
  ↓
game.draw()
  ├─ map.draw()                 → terrain
  ├─ towers[].draw()            → tower visuals
  ├─ enemies[].draw()           → enemy visuals
  └─ projectiles[].draw()       → projectile visuals
```

### 🎓 Key OOP Concepts in Code

| Concept | Example | File | Learning Goal |
|---------|---------|------|---|
| **Encapsulation** | `tower.isDead()` hides `hp <= 0` | Tower.js | Don't expose internals |
| **Constructor** | `new Tower(x, y, 'sniper')` | Tower.js | Factory pattern |
| **Methods** | `enemy.takeDamage(50)` | Enemy.js | Objects have behavior |
| **Properties** | `tower.cost`, `enemy.speed` | constants.js | Objects have state |
| **Composition** | `game.map`, `game.waveManager` | Game.js | Objects contain objects |
| **Inheritance** | Enemy types (Runner, Tank, etc.) | Enemy.js | Code reuse |
| **Private helpers** | `_drawWeapon()`, `_runnerShoot()` | Tower.js, Enemy.js | Internals vs public API |

### 💡 Learning Activities

**Activity 1: Modify & Observe**
```javascript
// In constants.js, change this:
const TYPES = {
  sniper: { cost: 150, damage: 30, range: 150, fireRate: 1500 }
  // Change cost to 200 and damage to 50, reload the game
  // Question: Does the game feel balanced?
}
```
**Goal:** Understand how data affects game feel

**Activity 2: Read & Understand**
- Open `Enemy.js` and find the `Runner` type
- Question: Why does Runner have low health but high speed?
- Question: What would happen if we swap their stats?

**Activity 3: Code Detective**
- Find where money increases when you kill an enemy (`CLAUDE.md` → Economy)
- Modify the reward formula: `e.reward * 2` to give double money
- **Why?** Learn how to trace data flow through code

**Activity 4: Add a New Tower**
1. Add entry to `TYPES` in `constants.js`
2. New tower type automatically gets a button + behavior
3. Question: What should the stats be? Why?

**Activity 5: Debug with Logs**
```javascript
// In Game.js update(), add:
console.log(`Wave: ${this.wave}, Money: ${this.money}`);
// Reload and watch the console—understand game state
```
**Goal:** Learn debugging and observability

### 🚀 Quick Start

**Play Online:**
- [Lucas Game](https://yancyqin.github.io/lucasgame/)

**Local Development:**
```bash
cd lucasgame
python3 -m http.server 8080
# Open http://localhost:8080
```

### 📚 File Guide

- **`index.html`** — Entry point (HTML structure, canvas setup)
- **`style.css`** — All visual styling
- **`js/constants.js`** — Game data (start here to learn balance)
- **`js/Game.js`** — Main orchestrator (understand game loop here)
- **`js/Enemy.js`** — Enemy types (learn inheritance patterns)
- **`js/Tower.js`** — Tower behavior (learn targeting & combat)
- **`js/WaveManager.js`** — Enemy spawning (learn loops & timing)
- **`CLAUDE.md`** — Guidance for AI assistants

### 🎓 Teaching Tips

1. **Start with data:** Modify `constants.js` before reading class code
2. **Trace the game loop:** Follow one enemy from spawn to death
3. **Ask "why":** "Why is Sniper expensive? Why does Tank have 200 HP?"
4. **Small changes:** One value per day, observe the effect
5. **Console logging:** Add `console.log()` to understand what's happening
6. **Pair programming:** Work through code together, explain as you go

### 🔮 Future Enhancements

- [ ] Add visual effects (explosions, money pop-ups)
- [ ] Implement difficulty presets (easy/normal/hard)
- [ ] Add tower upgrade system (better guns over time)
- [ ] Create multiple maps with different paths
- [ ] Add sound effects and music
- [ ] Build a "learning mode" with pause/slow-motion/hitbox debug view
- [ ] Statistics dashboard (towers built, enemies killed, money spent)
- [ ] Mobile touch controls
- [ ] Save/load game state

---

## 📖 中文版本

### 这是什么？

**Lucas Game** 是一个由 12 岁小朋友在爸爸的陪同下，利用 AI 辅助编程开发的塔防游戏。这不仅仅是一个游戏——它是一个**完整的编程学习之旅**。

这个项目展示了孩子们如何利用 AI 作为编程导师，把自己的想法变成现实，从简单的 HTML/JavaScript 逐步进阶到专业的面向对象编程架构。

### 🎯 学习路径

#### **第一阶段：基础（单文件）**
- 从一个 `index.html` 开始，包含 HTML、CSS 和 JavaScript
- 学习游戏循环和 DOM 操作
- 理解坐标、运动、碰撞检测
- **技能：** 变量、函数、事件监听

#### **第二阶段：数据与平衡**
- 阅读和分析现有代码（常数、塔的属性、敌人波次）
- 修改游戏数据：塔的价格、伤害、生命值、敌人奖励
- 理解数据如何流经整个游戏
- **技能：** 代码阅读、调试、游戏平衡设计
- **练习任务：**
  - "把狙击手塔的费用改为 200，伤害改为 50"
  - "让第 5 波生成 10 个敌人而不是 5 个"
  - "把玩家初始金钱增加到 600"

#### **第三阶段：模块化与 OOP**
- 重构：单文件 → ES6 模块（一个类一个文件）
- 学习面向对象编程：
  - **封装** — `tower.isDead()` 隐藏内部的 `hp <= 0` 逻辑
  - **单一职责** — `Enemy.js` 只负责敌人，不负责塔
  - **构造器模式** — `new Tower(x, y, 'sniper')` 创建现成可用的对象
  - **组合** — `Game` 包含 `GameMap`、`WaveManager`、塔和敌人
  - **私有方法** — 前缀 `_` 表示内部细节
- **当前结构：**
  ```
  js/
    constants.js    — 游戏数据（塔类型、敌人、经济系统）
    Map.js          — GameMap 类（地形、路径、渲染）
    Tower.js        — Tower 类（射击、伤害、瞄准）
    Enemy.js        — Enemy 类（移动、血量、5 种类型）
    Projectile.js   — Projectile 类（3 种：自动、手动、敌人）
    WaveManager.js  — WaveManager 类（生成、难度）
    Game.js         — Game 类（协调器、主循环）
  ```

#### **第四阶段：高级模式** （未来）
- 通过游戏机制学习编程逻辑：
  - **循环** — 敌人波次如何以特定模式生成（`WaveManager` 中的 `for` 循环）
  - **条件语句** — 寻路逻辑（`isOnPath()` 中的 `if` 语句）
  - **数组与对象** — 存储塔、敌人、射弹
  - **回调函数** — 事件处理和帧动画
  - **异步概念** — 管理同时进行的游戏更新
- 扩展游戏：新塔类型、敌人行为、视觉效果

### 🏗️ 架构概览

```
游戏循环 (requestAnimationFrame)
  ↓
game.update()
  ├─ waveManager.update()      → 生成敌人
  ├─ towers[].update()          → 每座塔射击
  ├─ enemies[].update()         → 每个敌人移动
  ├─ projectiles[].update()     → 射弹移动和碰撞
  └─ economy.update()           → 处理金钱和波次
  ↓
game.draw()
  ├─ map.draw()                 → 地形
  ├─ towers[].draw()            → 塔的视觉效果
  ├─ enemies[].draw()           → 敌人的视觉效果
  └─ projectiles[].draw()       → 射弹的视觉效果
```

### 🎓 代码中的关键 OOP 概念

| 概念 | 示例 | 文件 | 学习目标 |
|------|------|------|---------|
| **封装** | `tower.isDead()` 隐藏 `hp <= 0` | Tower.js | 不暴露内部细节 |
| **构造器** | `new Tower(x, y, 'sniper')` | Tower.js | 工厂模式 |
| **方法** | `enemy.takeDamage(50)` | Enemy.js | 对象有行为 |
| **属性** | `tower.cost`、`enemy.speed` | constants.js | 对象有状态 |
| **组合** | `game.map`、`game.waveManager` | Game.js | 对象包含对象 |
| **继承** | 敌人类型（Runner、Tank 等） | Enemy.js | 代码重用 |
| **私有方法** | `_drawWeapon()`、`_runnerShoot()` | Tower.js、Enemy.js | 公共 API vs 内部实现 |

### 💡 学习活动

**活动 1：修改与观察**
```javascript
// 在 constants.js 中，改变这个：
const TYPES = {
  sniper: { cost: 150, damage: 30, range: 150, fireRate: 1500 }
  // 把 cost 改为 200，damage 改为 50，重新加载游戏
  // 问题：游戏是否仍然平衡？
}
```
**目标：** 理解数据如何影响游戏感受

**活动 2：阅读与理解**
- 打开 `Enemy.js` 找到 `Runner` 类型
- 问题：为什么 Runner 血量少但速度快？
- 问题：如果我们交换它们的属性会怎样？

**活动 3：代码侦探**
- 找到杀死敌人时金钱增加的代码（参考 `CLAUDE.md` → 经济系统）
- 修改奖励公式：`e.reward * 2` 给予双倍金钱
- **为什么？** 学会如何追踪代码中的数据流

**活动 4：添加新塔**
1. 在 `constants.js` 的 `TYPES` 中添加条目
2. 新塔类型自动获得按钮和行为
3. 问题：这座塔的属性应该是什么？为什么？

**活动 5：用日志调试**
```javascript
// 在 Game.js 的 update() 中添加：
console.log(`波次: ${this.wave}, 金钱: ${this.money}`);
// 重新加载并看控制台——理解游戏状态
```
**目标：** 学习调试和可观测性

### 🚀 快速开始

**在线游玩：**
- [Lucas Game](https://yancyqin.github.io/lucasgame/)

**本地开发：**
```bash
cd lucasgame
python3 -m http.server 8080
# 打开 http://localhost:8080
```

### 📚 文件指南

- **`index.html`** — 入口点（HTML 结构、Canvas 设置）
- **`style.css`** — 所有视觉样式
- **`js/constants.js`** — 游戏数据（从这里开始学习平衡设计）
- **`js/Game.js`** — 主协调器（理解游戏循环）
- **`js/Enemy.js`** — 敌人类型（学习继承模式）
- **`js/Tower.js`** — 塔的行为（学习瞄准和战斗逻辑）
- **`js/WaveManager.js`** — 敌人生成（学习循环和计时）
- **`CLAUDE.md`** — AI 助手指南

### 🎓 教学建议

1. **从数据开始：** 在阅读类代码之前修改 `constants.js`
2. **追踪游戏循环：** 跟踪一个敌人从生成到死亡的过程
3. **问"为什么"：** "为什么狙击手很贵？为什么坦克有 200 HP？"
4. **小改变：** 每天改一个值，观察效果
5. **控制台日志：** 添加 `console.log()` 理解发生了什么
6. **结对编程：** 一起查看代码，边看边解释

### 🔮 未来增强

- [ ] 添加视觉效果（爆炸、金钱飘动）
- [ ] 实现难度预设（简单/正常/困难）
- [ ] 添加塔升级系统（随时间改进）
- [ ] 创建多个地图和不同路径
- [ ] 添加音效和音乐
- [ ] 构建"学习模式"（暂停/慢速/碰撞盒调试）
- [ ] 统计仪表盘（建造的塔、杀死的敌人、花费的金钱）
- [ ] 移动触控支持
- [ ] 保存/加载游戏状态

---

## 🌟 Why This Project?

For educators looking to teach AI-assisted programming to kids:
- **Concrete:** Kids see their code running immediately
- **Motivating:** They build a game, not abstract exercises
- **Scalable:** Start simple, grow complexity gradually
- **Inclusive:** AI assistance removes syntax frustration, focus on logic
- **Shareable:** Show friends, understand what they've built

为想教孩子 AI 辅助编程的教育工作者：
- **具体化：** 孩子立即看到代码运行的效果
- **激励性：** 他们构建游戏，而不是抽象练习
- **可扩展：** 从简单开始，逐步增加复杂性
- **包容性：** AI 助手消除语法挫折，专注于逻辑
- **可分享：** 展示给朋友，理解他们构建的内容

---

**Built with ❤️ and AI assistance by Lucas & Dad** | [CLAUDE.md](CLAUDE.md) for AI contributors
