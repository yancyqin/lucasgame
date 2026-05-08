# Lucas Game Learning Lessons 📚

**[中文版本 →](#-中文版本)**

10 complete lessons to learn AI-assisted programming from scratch.

---

## 📖 English Version

### Course Overview

| Lesson | Title | Level | Time | Core Concept |
|--------|-------|-------|------|--------------|
| 1 | Modify Data | ⭐ | 20 min | Data → Behavior |
| 2 | Game Balance | ⭐ | 30 min | Tuning |
| 3 | Trace Code | ⭐⭐ | 25 min | Code Flow |
| 4 | Understand Loops | ⭐⭐ | 35 min | for/while |
| 5 | Debug Tips | ⭐⭐ | 30 min | console.log |
| 6 | OOP Basics | ⭐⭐⭐ | 40 min | Classes |
| 7 | Inheritance | ⭐⭐⭐ | 45 min | Code Reuse |
| 8 | Modular Design | ⭐⭐⭐ | 35 min | Responsibility |
| 9 | Add New Tower | ⭐⭐⭐ | 60 min | Integration |
| 10 | Free Project | ⭐⭐⭐⭐ | 120 min | Creativity |

---

## 📖 Lesson 1: Modify Data (20 minutes)

### Learning Objectives
- Understand the relationship between data and game behavior
- Find and modify game data
- Understand the impact of modifications

### Tasks

**Step 1: Open the game file**
1. Open the `lucasgame` folder in VS Code
2. Find the `js/constants.js` file
3. Open it (click on the filename)

**Step 2: Find the tower data**
```javascript
// Look for this section (around lines 10-20):
const TYPES = {
  sniper: {
    cost: 150,          // Sniper tower cost
    damage: 30,         // Sniper tower damage
    range: 150,         // Sniper tower attack range
    fireRate: 1500      // Sniper tower fire rate
  },
  // ... other towers
}
```

**Step 3: Modify a value**
```javascript
// Change the sniper's damage from 30 to 60
sniper: {
  cost: 150,
  damage: 60,   // ← Change this (from 30 to 60)
  range: 150,
  fireRate: 1500
}
```

**Step 4: Save the file**
- Press `Ctrl + S` to save

**Step 5: Test in the browser**
1. Open the game: `http://localhost:8080`
2. If you don't see changes, do a hard refresh: `Ctrl + Shift + R`
3. Build a sniper tower and observe if the damage has doubled

### Thinking Questions

1. **Observation:** After the damage changed from 30 to 60, does the tower kill enemies faster?
2. **Comparison:** How does the sniper's damage compare to the machine gun's damage?
3. **Reflection:** What would happen if you changed the damage to 10?

### Extension Tasks

- Change another tower's cost and see the impact
- Modify the enemy reward value (`e.reward`)
- Record 5 different modifications and observe their effects

---

## 📖 Lesson 2: Game Balance (30 minutes)

### Learning Objectives
- Understand the concept of game balance
- Implement balance through data design
- Conduct game testing and adjustments

### Background Knowledge

**Three elements of game balance:**
1. **Cost** — How much money does it take to build a tower?
2. **Benefit** — How many enemies can a tower kill? How much damage does it do?
3. **Time** — How long does a tower take to start working?

For example:
- Cheap towers (low cost) should be weak (low damage)
- Expensive towers (high cost) should be strong (high damage)

### Tasks

**Step 1: Analyze the balance of existing towers**

Open `constants.js` and fill in the table:

| Tower Type | Cost | Damage | Attack Speed | Balance Index |
|-----------|------|--------|--------------|---------------|
| sniper | 150 | 30 | 1500 | ? |
| machinegun | ? | ? | ? | ? |
| cannon | ? | ? | ? | ? |
| tesla | ? | ? | ? | ? |
| ice | ? | ? | ? | ? |

**Step 2: Calculate the balance index**
```
Balance Index = Damage / Cost
  
For example, Sniper: 30 / 150 = 0.2
```

**Step 3: Test the game**
1. Play until wave 5
2. Record: Which tower is the best? Which is the worst?
3. Why is that?

**Step 4: Adjust balance**

Based on your test results, adjust the data:
```javascript
// If ice tower is too weak, boost it
ice: {
  cost: 100,
  damage: 25,
  range: 120,
  fireRate: 2000  // change to 1500
}
```

### Thinking Questions

1. **Balance:** Do you think the game is balanced now? Why?
2. **Design:** If you were designing a new tower, what would its attributes be?
3. **Testing:** How can you determine if the game is balanced?

### Extension Tasks

- Design a "perfectly balanced" new tower
- Calculate the balance index for all towers
- Create a "hard mode" (expensive towers, strong enemies)

---

## 📖 Lesson 3: Trace Code (25 minutes)

### Learning Objectives
- Understand how code is executed
- Trace an object from creation to destruction
- Understand "data flow"

### Tasks

**Step 1: Track the lifecycle of an enemy**

Open `Game.js` and find this line:
```javascript
// Around line 60
this.enemies = [];
```

This is the enemy list. Now let's trace an enemy's entire life:

**Step 2: How are enemies born?**

1. Open `WaveManager.js`
2. Find the `spawn` method
3. Look at this line:
```javascript
const enemy = new Enemy(x, y, type);
this.enemies.push(enemy);
```

This means: **Create a new enemy, then add it to the enemy list**

**Step 3: How do enemies move?**

1. Open `Enemy.js`
2. Find the `update` method
3. See how it changes the `x` and `y` coordinates

**Step 4: How do enemies die?**

1. In `Enemy.js`, find `isDead()`
2. This method checks if the enemy's health ≤ 0
3. When an enemy dies, it's removed from the list

**Step 5: Track with logs**

In `Game.js`'s `update()` method, add:
```javascript
console.log(`Enemies: ${this.enemies.length}`);
```

Reload the game and watch the console to see how the enemy count changes.

### Thinking Questions

1. **Flow:** What steps does an enemy go through from birth to death?
2. **Modification:** If I change `Enemy.speed`, what gets affected?
3. **Tracing:** Where does the enemy's damage value come from?

### Extension Tasks

- Trace the complete lifecycle of a tower (build → shoot → destroy)
- Trace a projectile from launch to impact
- Create a "trace log" that records enemy coordinate changes

---

## 📖 Lesson 4: Understanding Loops (35 minutes)

### Learning Objectives
- Understand how `for` loops work
- Find loops in the game
- Understand how loops create repetition

### Background Knowledge

**The three parts of a loop:**
```javascript
for (let i = 0; i < 5; i++) {
    //  ↑              ↑     ↑
    // start       condition increment
    console.log(i);  // 0, 1, 2, 3, 4
}
```

**Explanation:** i starts at 0, increases by 1 each iteration, and stops when i is no longer < 5.

### Tasks

**Step 1: Find loops in the game**

1. Open `WaveManager.js`
2. Find the `_buildWave()` method
3. Look at this code:
```javascript
for (let i = 0; i < 5; i++) {
    // This means spawn 5 enemies
    enemies.push(new Enemy(...));
}
```

**Step 2: Understand wave patterns**

Continue reading `_buildWave()`:
```javascript
for (let i = 0; i < count; i++) {
    if (i % 3 === 0) {
        // Every 3rd enemy is a tank
        enemies.push(new Enemy(x, y, 'tank'));
    } else {
        // Others are runners
        enemies.push(new Enemy(x, y, 'runner'));
    }
}
```

**This means:** Generate enemies in the pattern: tank, runner, runner, tank, runner, runner, ...

**Step 3: Modify wave patterns**

```javascript
// Original: tank, runner, runner
// Change to: tank, runner (alternating)
if (i % 2 === 0) {  // change 3 to 2
    enemies.push(new Enemy(x, y, 'tank'));
} else {
    enemies.push(new Enemy(x, y, 'runner'));
}
```

Save and test to see if the enemy pattern changed.

**Step 4: Understand nested loops**

In `Game.js`, find code like this:
```javascript
for (let tower of this.towers) {      // Loop 1: iterate all towers
    for (let enemy of this.enemies) { // Loop 2: iterate all enemies
        // Check if this tower can hit this enemy
        tower.tryShoot(enemy);
    }
}
```

**This means:** For each tower, check each enemy to see if it can be hit.

### Thinking Questions

1. **Pattern:** If `i % 4 === 0`, what's the enemy pattern?
2. **Efficiency:** How long does it take to spawn a wave of 100 enemies?
3. **Design:** How would you design a "hard wave" (more and stronger enemies)?

### Extension Tasks

- Modify the wave pattern to create an "alternating pattern"
- Calculate how many tanks and runners are in a particular wave
- Design a "pyramid pattern" (few at start, many in middle, few at end)

---

## 📖 Lesson 5: Debug Tips (30 minutes)

### Learning Objectives
- Learn to debug with `console.log`
- Understand "print debugging"
- Find the cause of bugs

### Tasks

**Step 1: Add basic logging**

In `Game.js`'s `update()` method, add:
```javascript
update() {
    console.log(`Wave: ${this.wave}, Money: ${this.money}`);
    // ... other code
}
```

Reload the game and watch the console output.

**Step 2: Track specific events**

In `Enemy.js`'s `takeDamage()` method, add:
```javascript
takeDamage(amount) {
    console.log(`Enemy hit! HP from ${this.hp} reduced by ${amount}`);
    this.hp -= amount;
    console.log(`Current HP: ${this.hp}`);
}
```

Watch the console when enemies take damage.

**Step 3: Debug conditionals**

In `WaveManager.js`, add:
```javascript
for (let i = 0; i < count; i++) {
    if (i % 3 === 0) {
        console.log(`Spawning tank, i = ${i}`);
        enemies.push(new Enemy(x, y, 'tank'));
    } else {
        console.log(`Spawning runner, i = ${i}`);
        enemies.push(new Enemy(x, y, 'runner'));
    }
}
```

Check if the pattern matches your expectations.

**Step 4: Debug object state**

```javascript
// Print entire objects
console.log("Player towers:", this.towers);
console.log("Current enemies:", this.enemies);
console.log("Game state:", {
    wave: this.wave,
    money: this.money,
    towerCount: this.towers.length,
    enemyCount: this.enemies.length
});
```

### Common Debug Patterns

```javascript
// 1. Check if function is called
console.log("Function called");

// 2. Print variable value
console.log("Variable x:", x);

// 3. Print timestamp (track order)
console.log("step 1");
console.log("step 2");
console.log("step 3");

// 4. Print error
if (value < 0) {
    console.log("Error! value cannot be negative:", value);
}

// 5. Print object
console.log("Entire object:", JSON.stringify(object, null, 2));
```

### Thinking Questions

1. **Debugging:** If money isn't increasing, how would you find the cause?
2. **Tracing:** If a tower isn't shooting, how would you verify it's updating?
3. **Verification:** How would you confirm enemies are spawning in the correct pattern?

### Extension Tasks

- Add 10 different `console.log` statements to track every game stage
- Find a bug (e.g., money not increasing) and use logs to trace it
- Create a "debug dashboard" that prints all important game states

---

## 📖 Lesson 6: OOP Basics (40 minutes)

### Learning Objectives
- Understand "classes" and "objects"
- Understand "encapsulation"
- Understand "single responsibility"

### Background Knowledge

**Classes vs Objects:**
- **Class** is a "blueprint" or "template"
- **Object** is an "instance" created from the blueprint

```javascript
// Class (blueprint)
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

// Objects (instances)
const tower1 = new Tower(100, 200, 'sniper');
const tower2 = new Tower(300, 400, 'machinegun');
```

### Tasks

**Step 1: Understand the Tower class**

Open `Tower.js` and find:
```javascript
class Tower {
    constructor(x, y, type) {
        // constructor initializes the object
        // It sets the tower's initial properties
    }
}
```

**Step 2: Understand properties and methods**

In `Tower.js` find:
```javascript
// Properties (what an object has)
this.x = x;           // Tower's X coordinate
this.y = y;           // Tower's Y coordinate
this.hp = 50;         // Tower's health

// Methods (what an object can do)
shoot() { }           // Tower can shoot
takeDamage(amount) { } // Tower can take damage
isDead() { }          // Check if tower is dead
```

**Step 3: Understand encapsulation**

```javascript
// In Tower.js
isDead() {
    // Callers don't need to know the hp <= 0 logic
    // They just call isDead()
    return this.hp <= 0;
}

// In Game.js using it
if (tower.isDead()) {
    // Remove this tower
    this.towers.splice(i, 1);
}
```

**This is "encapsulation":** Hide internal details, expose only needed interfaces.

**Step 4: Understand single responsibility**

Compare:
```javascript
// ❌ Bad: Tower manages itself AND enemies
class Tower {
    shoot() { }
    takeDamage() { }
    spawnEnemy() { }    // Shouldn't be here!
}

// ✅ Good: Tower only manages itself, Enemy only manages enemies
class Tower {
    shoot() { }
    takeDamage() { }
}

class Enemy {
    move() { }
    takeDamage() { }
}
```

### Thinking Questions

1. **Design:** Why should `Tower` and `Enemy` be separate classes?
2. **Interface:** What are the main methods `Tower` exposes to the outside?
3. **Privacy:** What are the internal details `Tower` hides?

### Extension Tasks

- List all properties and methods of the `Enemy` class
- Compare `Tower`, `Enemy`, `Projectile` classes
- Design a new class `Upgrade` to manage tower upgrades

---

## 📖 Lesson 7: Inheritance & Polymorphism (45 minutes)

### Learning Objectives
- Understand "inheritance" (code reuse)
- Understand "polymorphism" (same name, different behavior)
- Understand different Enemy types

### Background Knowledge

**Inheritance hierarchy:**
```
Enemy (parent class)
  ├─ Runner (child class)
  ├─ Tank (child class)
  ├─ Speedy (child class)
  └─ ...
```

All enemies have: `move()`, `takeDamage()`, `draw()`.

But their **specific behavior differs**:
- Runner moves fast but has low health
- Tank moves slow but has high health

### Tasks

**Step 1: Find the Enemy base class**

Open `Enemy.js`, at the top:
```javascript
class Enemy {
    constructor(x, y, type) {
        this.type = type;
        // Set different properties based on type
    }
}
```

**Step 2: Understand polymorphism**

In `Enemy.js` find the `move()` method:
```javascript
move() {
    if (this.type === 'runner') {
        // Runner's movement
        this.moveAlongPath(this.speed * 1.5);
    } else if (this.type === 'tank') {
        // Tank's movement
        this.moveAlongPath(this.speed * 0.5);
    }
    // ... other types
}
```

**This is "polymorphism":** Same method `move()`, different behavior for different objects.

**Step 3: Analyze each enemy type**

Fill in the table:

| Enemy Type | Speed | Health | Characteristic |
|-----------|-------|--------|--------------|
| Runner | ? | ? | ? |
| Tank | ? | ? | ? |
| Speedy | ? | ? | ? |
| Heavy | ? | ? | ? |
| Regenerator | ? | ? | ? |

**Step 4: Modify enemy attributes**

```javascript
// In constants.js find ENEMIES
const ENEMIES = {
    runner: { speed: 3, hp: 20, reward: 50 },
    // ... others
}

// Change an enemy's attributes and see the effect
```

### Thinking Questions

1. **Inheritance:** Why do all enemies inherit from Enemy?
2. **Reuse:** How much code is reused in the `move()` method?
3. **Extension:** How would you add a new enemy type?

### Extension Tasks

- Add a new enemy type with its own attributes
- Compare Runner and Tank to understand "speed-health tradeoff"
- Design an "ultimate enemy" that's fastest and strongest

---

## 📖 Lesson 8: Modular Design (35 minutes)

### Learning Objectives
- Understand the benefits of "modularity"
- Understand each file's responsibility
- Understand communication between modules

### Background Knowledge

**Benefits of modularity:**
1. Code is easy to understand (each file does one thing)
2. Code is easy to modify (change one place, don't affect others)
3. Code is easy to reuse (copy a file and use it)

### Tasks

**Step 1: Draw the module relationship**

```
index.html (entry point)
    ↓
js/Game.js (main program)
    ├─→ js/Map.js (map)
    ├─→ js/Tower.js (tower)
    ├─→ js/Enemy.js (enemy)
    ├─→ js/Projectile.js (projectile)
    ├─→ js/WaveManager.js (wave manager)
    └─→ js/constants.js (data)
```

**Step 2: Understand each module's responsibility**

| File | Responsibility | Should NOT do |
|------|---------|-----------|
| constants.js | Store data | Should not contain logic |
| Map.js | Manage map | Should not manage enemies or towers |
| Tower.js | Manage tower | Should not manage enemies |
| Enemy.js | Manage enemy | Should not manage towers |
| Game.js | Coordinate modules | Should not do specific tasks |

**Step 3: Trace an operation**

When a player builds a tower:
```
1. Player clicks button (index.html)
2. Triggers Game.tryBuildTower() (Game.js)
3. Creates new Tower object (Tower.js)
4. Adds to this.towers list (Game.js)
5. Next frame draws the tower (Tower.js draw())
```

**Step 4: Understand data flow**

```
constants.js defines data
    ↓
modules read data
    ↓
Game.js coordinates modules
    ↓
index.html displays result
```

### Thinking Questions

1. **Separation:** Why should `Tower` and `Enemy` be in different files?
2. **Communication:** How does `Tower` know an enemy is coming?
3. **Coordination:** What coordination work does `Game` do?

### Extension Tasks

- Draw a "detailed module relationship diagram" with all function calls
- Trace the complete flow "enemy dies → receive reward"
- Design a new module `UI.js` to display score, money, etc.

---

## 📖 Lesson 9: Add New Tower (60 minutes)

### Learning Objectives
- Apply all previous lessons
- Design and implement a new feature from scratch
- Understand "requirements → design → implementation → testing"

### Tasks

**Step 1: Design your tower**

Answer these questions:
- What's the tower's name? (e.g., "Laser")
- What's its attack style? (e.g., continuous beam)
- What should its attributes be?
  - Cost: How much?
  - Damage: How much?
  - Range: How far?
  - Fire Rate: How fast?

**Step 2: Add to constants.js**

```javascript
const TYPES = {
  // existing towers...
  laser: {
    cost: 200,        // determines rarity
    damage: 40,       // stronger than common tower
    range: 200,       // pretty far
    fireRate: 800     // shoots fast
  }
}
```

**Step 3: Add logic to Tower.js**

Find Tower's `shoot()` method, add laser special behavior:
```javascript
if (this.type === 'laser') {
    // laser special logic
    // e.g., more accurate, more damage, etc.
}
```

**Step 4: Add UI button**

In `index.html`, find the tower buttons section, add:
```html
<button onclick="game.tryBuildTower('laser')">Laser (200)</button>
```

**Step 5: Test**

1. Reload the game
2. Should see new "Laser" button
3. Try building laser towers
4. Observe if it works correctly
5. Adjust attributes until balanced

### Checklist

- [ ] Defined new tower in constants.js
- [ ] Added logic to Tower.js
- [ ] Added button to index.html
- [ ] Game successfully builds new tower
- [ ] New tower behaves as expected
- [ ] New tower is balanced with others

### Thinking Questions

1. **Tradeoff:** How does your tower compare to others?
2. **Uniqueness:** What makes your tower special?
3. **Balance:** Is the game still balanced?

### Extension Tasks

- Add 2-3 new towers
- Design an "ultimate tower" that's very powerful but very expensive
- Create a "special mode" using only your new towers

---

## 📖 Lesson 10: Free Project (120 minutes)

### Learning Objectives
- Apply all lessons
- Complete a self-designed project
- Experience the full journey from idea to implementation

### Project Options

**Option 1: Extend Enemy Types**
- Add 2-3 new enemy types
- Design unique attributes and behavior for each

**Option 2: Design New Maps**
- Modify enemy paths
- Create "easy" and "hard" difficulty maps

**Option 3: Upgrade System**
- Implement "towers can be upgraded"
- Upgraded towers become stronger

**Option 4: Wave Editor**
- Let players customize enemy waves
- Save and load custom waves

**Option 5: Your Own Idea**
- Come up with your own feature
- Implement it

### Implementation Steps

**Step 1: Define requirements**
- What feature do you want?
- What data and logic does it need?

**Step 2: Design the solution**
- Which files need modification?
- What code needs to be added?

**Step 3: Implement**
- Code step by step
- Test frequently, ensure each step works

**Step 4: Test & Debug**
- Play the game, test the feature
- Use `console.log` to debug
- Adjust data until satisfied

**Step 5: Optimize**
- Is the code clear?
- Any duplicate code?
- Can performance be improved?

### Checklist

- [ ] Core feature complete
- [ ] Feature thoroughly tested
- [ ] Code is clear and readable
- [ ] No obvious bugs
- [ ] Game still plays normally

### Show Your Work

1. Commit changes to Git
2. Write a brief description (what feature, how to use)
3. Invite friends to play your game

---

## Summary

Congratulations! You've completed all Lucas Game lessons!

### What You've Learned
- ✅ Data-driven development
- ✅ Game balance design
- ✅ Code reading and tracing
- ✅ Loops and conditionals
- ✅ Debugging techniques
- ✅ Object-oriented programming
- ✅ Inheritance and polymorphism
- ✅ Modular design
- ✅ Feature implementation and integration
- ✅ Project management

### Next Steps?
- Try modifying or extending Lucas Game
- Build other games using the same approach
- Learn more advanced programming concepts

---

## 📖 中文版本

### 课程概览

| 课程 | 名称 | 难度 | 时间 | 核心概念 |
|------|------|------|------|---------|
| 1 | 修改数据 | ⭐ | 20 分钟 | 数据 → 行为 |
| 2 | 游戏平衡 | ⭐ | 30 分钟 | 属性调整 |
| 3 | 追踪代码 | ⭐⭐ | 25 分钟 | 代码流程 |
| 4 | 理解循环 | ⭐⭐ | 35 分钟 | for/while 循环 |
| 5 | 调试技巧 | ⭐⭐ | 30 分钟 | console.log |
| 6 | OOP 概念 | ⭐⭐⭐ | 40 分钟 | 类、对象 |
| 7 | 继承与多态 | ⭐⭐⭐ | 45 分钟 | 代码重用 |
| 8 | 模块化设计 | ⭐⭐⭐ | 35 分钟 | 单一职责 |
| 9 | 添加新塔 | ⭐⭐⭐ | 60 分钟 | 综合应用 |
| 10 | 自由项目 | ⭐⭐⭐⭐ | 120 分钟 | 创意实现 |

（完整的中文课程内容见 [LESSONS.zh.md](LESSONS.zh.md) 或回到英文版本上方的对应部分）

---

**Built with ❤️ and AI assistance by Lucas & Dad**
