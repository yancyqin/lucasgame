# Lucas Game 🎮

**[中文版本 →](https://github.com/yancyqin/lucasgame/blob/main/README.zh.md)**

**[Play Online →](https://yancyqin.github.io/lucasgame/)**

---

## 📖 English Version

### What is This?

**Lucas Game** is a tower defense game built by a 12-year-old learning AI-assisted programming with his dad. It's not just a game—it's a **complete learning journey** in modern web development.

This project demonstrates how children can leverage AI as a programming mentor, transforming ideas into reality through a progression from simple HTML/JavaScript to professional object-oriented architecture.

### 🎯 Learning Journey

#### **Phase 1: Foundation (Single File)**
- Start with `index.html` containing HTML, CSS, and JavaScript
- Learn game loops and DOM manipulation
- Understand coordinates, movement, collision detection
- **Skills:** Variables, functions, event listeners

#### **Phase 2: Data & Balance**
- Read and analyze existing code (constants, tower properties, enemy waves)
- Modify game data: tower prices, damage, health, enemy rewards
- Understand how data flows through the entire game
- **Skills:** Code reading, debugging, game balance design
- **Practice Tasks:**
  - "Change sniper tower cost to 200 and damage to 50"
  - "Make wave 5 spawn 10 enemies instead of 5"
  - "Increase player starting money to 600"

#### **Phase 3: Modules & OOP**
- Refactor: single file → ES6 modules (one class per file)
- Learn Object-Oriented Programming:
  - **Encapsulation** — `tower.isDead()` hides the internal `hp <= 0` logic
  - **Single Responsibility** — `Enemy.js` only manages enemies, not towers
  - **Constructor Pattern** — `new Tower(x, y, 'sniper')` creates ready-to-use objects
  - **Composition** — `Game` contains `GameMap`, `WaveManager`, towers, and enemies
  - **Private Methods** — Prefix `_` indicates internal details

#### **Phase 4: Advanced Patterns** (Future)
- Learn programming logic through game mechanics:
  - **Loops** — How enemy waves are generated in patterns
  - **Conditionals** — Pathfinding logic
  - **Arrays & Objects** — Storing towers, enemies, projectiles
  - **Callbacks** — Event handling and frame animation

### 🚀 Quick Start

**Play Online:**
- [Lucas Game](https://yancyqin.github.io/lucasgame/)

**Local Development:**
```bash
cd lucasgame
python3 -m http.server 8080
```

### 📚 Learning Resources

- **[LESSONS.md](LESSONS.md)** — 10 Complete Lessons (English-first with Chinese)
- **[COMMON_MISTAKES.md](COMMON_MISTAKES.md)** — Common Errors & Solutions
- **[CLAUDE.md](CLAUDE.md)** — AI Assistant Guide

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

#### **第四阶段：高级模式** （未来）
- 通过游戏机制学习编程逻辑：
  - **循环** — 敌人波次如何以特定模式生成
  - **条件语句** — 寻路逻辑
  - **数组与对象** — 存储塔、敌人、射弹
  - **回调函数** — 事件处理和帧动画

### 🚀 快速开始

**在线游玩：**
- [Lucas Game](https://yancyqin.github.io/lucasgame/)

**本地开发：**
```bash
cd lucasgame
python3 -m http.server 8080
```

### 📚 学习资源

- **[LESSONS.md](LESSONS.md)** — 10 堂完整课程（英文优先，中文版本见下方）
- **[COMMON_MISTAKES.md](COMMON_MISTAKES.md)** — 常见错误与解决方案
- **[CLAUDE.md](CLAUDE.md)** — AI 助手指南

---

**Built with ❤️ and AI assistance by Lucas & Dad**
