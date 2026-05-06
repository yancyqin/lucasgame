# Lucas Game 学习课程 📚

10 堂完整课程，从零开始学习 AI 辅助编程。

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

---

## 📖 Lesson 1: 修改数据 (20 分钟)

### 学习目标
- 理解数据和游戏行为的关系
- 找到并修改游戏数据
- 理解修改带来的影响

### 任务

**第一步：打开游戏文件**
1. 在 VS Code 中打开 `lucasgame` 文件夹
2. 找到 `js/constants.js` 文件
3. 打开它（点击文件名）

**第二步：找到塔的数据**
```javascript
// 找到这部分（大约在第 10-20 行）：
const TYPES = {
  sniper: {
    cost: 150,          // 狙击手的价格
    damage: 30,         // 狙击手的伤害
    range: 150,         // 狙击手的攻击范围
    fireRate: 1500      // 狙击手的射击速度
  },
  // ... 还有其他塔
}
```

**第三步：修改一个值**
```javascript
// 把狙击手的伤害从 30 改为 60
sniper: {
  cost: 150,
  damage: 60,   // ← 改这里（从 30 改为 60）
  range: 150,
  fireRate: 1500
}
```

**第四步：保存文件**
- 按 `Ctrl + S` 保存

**第五步：在浏览器中测试**
1. 打开游戏：`http://localhost:8080`
2. 如果没有看到变化，做硬刷新：`Ctrl + Shift + R`
3. 建造一座狙击手塔，观察伤害是否翻倍了

### 思考问题

1. **观察:** 伤害从 30 变成 60 后，塔杀敌更快了吗？
2. **对比:** 狙击手的伤害和机枪手的伤害相比怎样？
3. **思考:** 如果把伤害改成 10，游戏会怎样？

### 延伸任务

- 修改另一座塔的价格，看看影响
- 修改敌人的奖励值（`e.reward`）
- 记录 5 个不同的修改，观察效果

---

## 📖 Lesson 2: 游戏平衡 (30 分钟)

### 学习目标
- 理解游戏平衡的概念
- 通过数据设计实现平衡性
- 进行游戏测试和调整

### 背景知识

**游戏平衡的三个要素：**
1. **成本** — 建造塔需要多少钱
2. **收益** — 塔能杀多少敌人、造成多少伤害
3. **时间** — 塔需要多长时间才能工作

例如：
- 便宜的塔（cost 低）应该较弱（damage 低）
- 贵的塔（cost 高）应该较强（damage 高）

### 任务

**第一步：分析现有塔的平衡**

打开 `constants.js`，填写下表：

| 塔类型 | 价格 | 伤害 | 攻速 | 平衡指数 |
|------|------|------|------|---------|
| sniper | 150 | 30 | 1500 | ? |
| machinegun | ? | ? | ? | ? |
| cannon | ? | ? | ? | ? |
| tesla | ? | ? | ? | ? |
| ice | ? | ? | ? | ? |

**第二步：计算平衡指数**
```
平衡指数 = 伤害 / 价格
  
例如 Sniper: 30 / 150 = 0.2
```

**第三步：测试游戏**
1. 玩到第 5 波
2. 记录：哪座塔最好用？哪座最垃圾？
3. 为什么会这样？

**第四步：调整平衡**

根据测试结果，调整数据：
```javascript
// 如果 ice 塔太弱，提升它
ice: {
  cost: 100,
  damage: 25,
  range: 120,
  fireRate: 2000  // 改为 1500
}
```

### 思考问题

1. **平衡:** 你觉得现在的游戏平衡吗？为什么？
2. **设计:** 如果你设计一座新塔，它的属性应该是什么？
3. **测试:** 怎样判断游戏是否平衡？

### 延伸任务

- 设计一座"完美平衡"的新塔
- 把所有塔的平衡指数算一遍
- 制作一个"困难模式"（塔更贵，敌人更强）

---

## 📖 Lesson 3: 追踪代码 (25 分钟)

### 学习目标
- 理解代码是如何执行的
- 追踪一个对象从创建到销毁的全过程
- 理解"数据流"

### 任务

**第一步：跟踪敌人的生命周期**

打开 `Game.js`，找到这行：
```javascript
// 大约在第 60 行左右
this.enemies = [];
```

这就是敌人列表。现在我们追踪一个敌人的整个生命：

**第二步：敌人如何诞生？**

1. 打开 `WaveManager.js`
2. 找到 `spawn` 方法（方法是指函数）
3. 看这行：
```javascript
const enemy = new Enemy(x, y, type);
this.enemies.push(enemy);
```

这表示：**创建一个新敌人，然后加入敌人列表**

**第三步：敌人如何移动？**

1. 打开 `Enemy.js`
2. 找到 `update` 方法
3. 看它如何改变 `x` 和 `y` 坐标

**第四步：敌人如何死亡？**

1. 在 `Enemy.js` 中查找 `isDead()`
2. 这个方法检查敌人的血量是否 ≤ 0
3. 当敌人死亡后，从列表中移除

**第五步：用日志追踪**

在 `Game.js` 的 `update()` 方法中添加：
```javascript
console.log(`敌人数量: ${this.enemies.length}`);
```

重新加载游戏，在控制台看敌人数量如何变化。

### 思考问题

1. **流程:** 从敌人诞生到死亡，都经过了哪些步骤？
2. **修改:** 如果我改了 `Enemy.speed`，会影响什么？
3. **追踪:** 敌人的伤害值从哪里来？

### 延伸任务

- 追踪塔的完整生命周期（建造 → 射击 → 销毁）
- 追踪一枚射弹从发射到击中的过程
- 制作一个"追踪日志"，记录敌人的坐标变化

---

## 📖 Lesson 4: 理解循环 (35 分钟)

### 学习目标
- 理解 `for` 循环的工作原理
- 在游戏中找到循环
- 理解循环如何产生重复

### 背景知识

**循环的三个部分：**
```javascript
for (let i = 0; i < 5; i++) {
    //  ↑              ↑     ↑
    // 初始值        条件   每次增加
    console.log(i);  // 0, 1, 2, 3, 4
}
```

**解读：** i 从 0 开始，每次循环 i 增加 1，直到 i 不再 < 5 时停止。

### 任务

**第一步：在游戏中找到循环**

1. 打开 `WaveManager.js`
2. 找到 `_buildWave()` 方法
3. 看这段：
```javascript
for (let i = 0; i < 5; i++) {
    // 这表示生成 5 个敌人
    enemies.push(new Enemy(...));
}
```

**第二步：理解波次的规律**

继续看 `_buildWave()` 中的代码：
```javascript
for (let i = 0; i < count; i++) {
    if (i % 3 === 0) {
        // 每 3 个敌人中的第 1 个是 tank
        enemies.push(new Enemy(x, y, 'tank'));
    } else {
        // 其他的都是 runner
        enemies.push(new Enemy(x, y, 'runner'));
    }
}
```

**这表示：** 按 tank, runner, runner, tank, runner, runner, ... 的模式生成敌人

**第三步：修改波次规律**

```javascript
// 原来是：tank, runner, runner
// 改为：tank, runner（交替）
if (i % 2 === 0) {  // 改 3 为 2
    enemies.push(new Enemy(x, y, 'tank'));
} else {
    enemies.push(new Enemy(x, y, 'runner'));
}
```

保存并测试，看敌人模式是否改变了。

**第四步：理解嵌套循环**

在 `Game.js` 中，找到这样的代码：
```javascript
for (let tower of this.towers) {      // 循环 1：遍历所有塔
    for (let enemy of this.enemies) { // 循环 2：遍历所有敌人
        // 检查这个塔是否能击中这个敌人
        tower.tryShoot(enemy);
    }
}
```

**这表示：** 对每一座塔，检查每一个敌人，看是否能击中。

### 思考问题

1. **规律:** 如果 `i % 4 === 0`，敌人模式是什么？
2. **效率:** 100 个敌人的波次需要多少时间生成？
3. **设计:** 怎样设计一个"困难波次"（敌人更多更强）？

### 延伸任务

- 修改波次规律，设计一个"交替模式"
- 计算某个波次有多少个 tank，多少个 runner
- 设计一个"金字塔模式"（开始少，中间多，最后少）

---

## 📖 Lesson 5: 调试技巧 (30 分钟)

### 学习目标
- 学会用 `console.log` 调试
- 理解"打印调试法"
- 找出 bug 的原因

### 任务

**第一步：添加基础日志**

在 `Game.js` 的 `update()` 方法开头添加：
```javascript
update() {
    console.log(`Wave: ${this.wave}, Money: ${this.money}`);
    // ... 其他代码
}
```

重新加载游戏，在控制台看输出。

**第二步：追踪特定事件**

在 `Enemy.js` 的 `takeDamage()` 方法中添加：
```javascript
takeDamage(amount) {
    console.log(`敌人受伤！生命值从 ${this.hp} 减少 ${amount}`);
    this.hp -= amount;
    console.log(`现在的生命值: ${this.hp}`);
}
```

观察敌人受伤时的输出。

**第三步：条件判断的调试**

在 `WaveManager.js` 中添加：
```javascript
for (let i = 0; i < count; i++) {
    if (i % 3 === 0) {
        console.log(`生成 tank，i = ${i}`);
        enemies.push(new Enemy(x, y, 'tank'));
    } else {
        console.log(`生成 runner，i = ${i}`);
        enemies.push(new Enemy(x, y, 'runner'));
    }
}
```

看规律是否符合预期。

**第四步：对象状态的调试**

```javascript
// 打印完整的对象
console.log("玩家的塔:", this.towers);
console.log("当前敌人:", this.enemies);
console.log("游戏状态:", {
    wave: this.wave,
    money: this.money,
    towerCount: this.towers.length,
    enemyCount: this.enemies.length
});
```

### 常用的调试模式

```javascript
// 1. 打印函数是否被调用
console.log("这个函数被调用了");

// 2. 打印变量的值
console.log("变量 x 的值:", x);

// 3. 打印时间戳（追踪顺序）
console.log("step 1");
console.log("step 2");
console.log("step 3");

// 4. 打印错误
if (value < 0) {
    console.log("错误！value 不能是负数:", value);
}

// 5. 打印对象
console.log("整个对象:", JSON.stringify(object, null, 2));
```

### 思考问题

1. **调试:** 如果金钱没有增加，怎样找出原因？
2. **追踪:** 如果塔没有射击，怎样验证它是否在更新？
3. **验证:** 怎样确保敌人按照正确的模式生成？

### 延伸任务

- 添加 10 条不同的 `console.log`，记录游戏的每个阶段
- 找出一个 bug（例如钱没有增加），用日志追踪它
- 制作一个"调试仪表盘"，打印所有重要的游戏状态

---

## 📖 Lesson 6: OOP 概念 (40 分钟)

### 学习目标
- 理解"类"和"对象"
- 理解"封装"概念
- 理解"单一职责"

### 背景知识

**类 vs 对象：**
- **类** 是一个"蓝图"或"模板"
- **对象** 是根据蓝图创建的"实例"

```javascript
// 类（蓝图）
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

// 对象（实例）
const tower1 = new Tower(100, 200, 'sniper');
const tower2 = new Tower(300, 400, 'machinegun');
```

### 任务

**第一步：理解 Tower 类**

打开 `Tower.js`，找到：
```javascript
class Tower {
    constructor(x, y, type) {
        // constructor 是"构造器"，用来初始化对象
        // 这里设置塔的初始属性
    }
}
```

**第二步：理解属性和方法**

在 `Tower.js` 中找到：
```javascript
// 属性（对象拥有什么）
this.x = x;           // 塔的 X 坐标
this.y = y;           // 塔的 Y 坐标
this.hp = 50;         // 塔的血量

// 方法（对象能做什么）
shoot() { }           // 塔能射击
takeDamage(amount) { } // 塔能受伤
isDead() { }          // 检查塔是否死亡
```

**第三步：理解封装**

```javascript
// 在 Tower.js 中
isDead() {
    // 外部不需要知道 hp <= 0 的内部逻辑
    // 只需要调用 isDead()
    return this.hp <= 0;
}

// 在 Game.js 中使用
if (tower.isDead()) {
    // 移除这座塔
    this.towers.splice(i, 1);
}
```

**这就是"封装":** 隐藏内部细节，只暴露需要的接口。

**第四步：理解单一职责**

比较：
```javascript
// ❌ 不好：Tower 既管自己，又管敌人
class Tower {
    shoot() { }
    takeDamage() { }
    spawnEnemy() { }    // 不应该在这里！
}

// ✅ 好：Tower 只管自己，Enemy 只管敌人
class Tower {
    shoot() { }
    takeDamage() { }
}

class Enemy {
    move() { }
    takeDamage() { }
}
```

### 思考问题

1. **设计:** 为什么 `Tower` 和 `Enemy` 要分开成两个类？
2. **接口:** `Tower` 暴露给外部的主要方法有哪些？
3. **隐藏:** `Tower` 内部的私有细节有哪些？

### 延伸任务

- 列出 `Enemy` 类的所有属性和方法
- 比较 `Tower`、`Enemy`、`Projectile` 三个类
- 设计一个新类 `Upgrade`，用来管理塔的升级

---

## 📖 Lesson 7: 继承与多态 (45 分钟)

### 学习目标
- 理解"继承"（代码重用）
- 理解"多态"（同名不同行为）
- 理解 Enemy 类的不同类型

### 背景知识

**继承的思想：**
```
Enemy（父类）
  ├─ Runner（子类）
  ├─ Tank（子类）
  ├─ Speedy（子类）
  └─ ...
```

所有敌人都有：`move()`、`takeDamage()`、`draw()`。

但它们的**具体行为不同**：
- Runner 移动快但血量少
- Tank 移动慢但血量多

### 任务

**第一步：找到 Enemy 基类**

打开 `Enemy.js`，最顶部有：
```javascript
class Enemy {
    constructor(x, y, type) {
        this.type = type;
        // 根据 type 设置不同的属性
    }
}
```

**第二步：理解多态**

在 `Enemy.js` 中找到 `move()` 方法：
```javascript
move() {
    if (this.type === 'runner') {
        // Runner 的移动方式
        this.moveAlongPath(this.speed * 1.5);
    } else if (this.type === 'tank') {
        // Tank 的移动方式
        this.moveAlongPath(this.speed * 0.5);
    }
    // ... 其他类型
}
```

**这就是"多态":** 同一个方法 `move()`，不同的对象有不同的行为。

**第三步：分析每种敌人**

填写下表：

| 敌人类型 | 速度 | 血量 | 特点 |
|---------|------|------|------|
| Runner | ? | ? | ? |
| Tank | ? | ? | ? |
| Speedy | ? | ? | ? |
| Heavy | ? | ? | ? |
| Regenerator | ? | ? | ? |

**第四步：修改敌人属性**

```javascript
// 在 constants.js 中找到 ENEMIES
const ENEMIES = {
    runner: { speed: 3, hp: 20, reward: 50 },
    // ... 其他
}

// 改一个敌人的属性，看效果
```

### 思考问题

1. **继承:** 为什么所有敌人都继承自 Enemy？
2. **重用:** `move()` 方法中有多少代码是重用的？
3. **扩展:** 怎样添加一个新的敌人类型？

### 延伸任务

- 添加一个新的敌人类型，定义它的属性
- 对比 Runner 和 Tank，理解"速度-血量"权衡
- 设计一个"终极敌人"，最快最强

---

## 📖 Lesson 8: 模块化设计 (35 分钟)

### 学习目标
- 理解"模块化"的意义
- 理解各个文件的职责
- 理解模块之间的通信

### 背景知识

**模块化的好处：**
1. 代码容易理解（每个文件做一件事）
2. 代码容易修改（改一个地方不影响其他地方）
3. 代码容易重用（复制一个文件就能用）

### 任务

**第一步：绘制模块关系图**

```
index.html （入口）
    ↓
js/Game.js （主程序）
    ├─→ js/Map.js （地图）
    ├─→ js/Tower.js （塔）
    ├─→ js/Enemy.js （敌人）
    ├─→ js/Projectile.js （射弹）
    ├─→ js/WaveManager.js （波次管理）
    └─→ js/constants.js （数据）
```

**第二步：理解各模块的职责**

| 文件 | 职责 | 不应该做的事 |
|------|------|-----------|
| constants.js | 存储数据 | 不应该有逻辑 |
| Map.js | 管理地图 | 不应该管敌人或塔 |
| Tower.js | 管理塔 | 不应该管敌人 |
| Enemy.js | 管理敌人 | 不应该管塔 |
| Game.js | 协调所有模块 | 不应该做具体业务 |

**第三步：追踪一个操作**

当玩家建造一座塔时：
```
1. 玩家点击按钮（index.html）
2. 触发 Game.tryBuildTower()（Game.js）
3. 创建新 Tower 对象（Tower.js）
4. 添加到 this.towers 列表（Game.js）
5. 下一帧绘制塔（Tower.js 的 draw()）
```

**第四步：理解数据流**

```
constants.js 定义数据
    ↓
各模块读取数据
    ↓
Game.js 协调各模块
    ↓
index.html 展示结果
```

### 思考问题

1. **分离:** 为什么 `Tower` 和 `Enemy` 要在不同文件？
2. **通信:** `Tower` 怎样知道有敌人来了？
3. **协调:** `Game` 做了哪些协调工作？

### 延伸任务

- 绘制一个"详细的模块关系图"，包括所有的函数调用
- 追踪"敌人死亡时获得奖励"的完整流程
- 设计一个新模块 `UI.js`，负责显示分数、金钱等

---

## 📖 Lesson 9: 添加新塔 (60 分钟)

### 学习目标
- 综合应用前面学到的所有知识
- 从零设计并实现一个新功能
- 理解"需求 → 设计 → 实现 → 测试"的完整流程

### 任务

**第一步：设计新塔**

回答这些问题：
- 塔的名字是什么？（例如："Laser"）
- 它的攻击方式是什么？（例如：连续射线）
- 它的属性应该是什么？
  - 价格：多少钱？
  - 伤害：多少伤害？
  - 范围：多远的范围？
  - 攻速：多快的射击？

**第二步：添加到 constants.js**

```javascript
const TYPES = {
  // 原有的塔...
  laser: {
    cost: 200,        // 决定稀有度
    damage: 40,       // 比普通塔强
    range: 200,       // 比较远
    fireRate: 800     // 射击很快
  }
}
```

**第三步：在 Tower.js 中添加逻辑**

找到 Tower 的 `shoot()` 方法，添加 laser 的特殊行为：
```javascript
if (this.type === 'laser') {
    // laser 特殊逻辑
    // 例如：射击更准、伤害更高、等等
}
```

**第四步：添加 UI 按钮**

在 `index.html` 中，找到塔的按钮部分，添加：
```html
<button onclick="game.tryBuildTower('laser')">Laser (200)</button>
```

**第五步：测试**

1. 重新加载游戏
2. 应该看到新的"Laser"按钮
3. 尝试建造 laser 塔
4. 观察它是否工作正常
5. 调整属性，直到平衡满意

### 检查清单

- [ ] 在 constants.js 中定义了新塔
- [ ] 在 Tower.js 中添加了逻辑
- [ ] 在 index.html 中添加了按钮
- [ ] 游戏能成功建造新塔
- [ ] 新塔的行为符合预期
- [ ] 新塔与其他塔的平衡合理

### 思考问题

1. **权衡:** 新塔的属性与其他塔相比如何？
2. **独特性:** 新塔有什么独特的地方？
3. **平衡:** 游戏是否还平衡？

### 延伸任务

- 添加 2-3 座新塔
- 设计一个"终极塔"，非常强大但非常贵
- 制作一个"专属模式"，只用新塔

---

## 📖 Lesson 10: 自由项目 (120 分钟)

### 学习目标
- 综合运用所有知识
- 完成一个自己设计的项目
- 体验从想法到实现的全过程

### 项目选项

**选项 1：扩展敌人类型**
- 添加 2-3 个新的敌人类型
- 为每个敌人设计独特的属性和行为

**选项 2：设计新地图**
- 修改敌人的路径
- 创建"困难"、"简单"两个难度的地图

**选项 3：升级系统**
- 实现"塔可以升级"的功能
- 升级后塔变得更强

**选项 4：波次编辑器**
- 让玩家自定义敌人波次
- 保存和加载自定义波次

**选项 5：自由创意**
- 提出你自己的想法
- 实现它

### 实现步骤

**第一步：定义需求**
- 你想实现什么功能？
- 它需要什么数据和逻辑？

**第二步：设计方案**
- 需要修改哪些文件？
- 需要添加什么代码？

**第三步：实现**
- 一步步完成代码
- 经常测试，确保每步都正确

**第四步：测试和调试**
- 玩游戏，测试新功能
- 用 `console.log` 调试问题
- 调整数据直到满意

**第五步：优化**
- 代码是否清晰？
- 有没有重复代码？
- 性能是否可以优化？

### 检查清单

- [ ] 完成了核心功能
- [ ] 功能经过充分测试
- [ ] 代码清晰易懂
- [ ] 没有明显的 bug
- [ ] 游戏仍然可以正常玩

### 展示你的作品

1. 把修改提交到 Git
2. 写一个简短的说明（什么功能、怎样使用）
3. 邀请朋友玩你的游戏

---

## 总结

恭喜！你已经完成了 Lucas Game 的全部课程！

### 你学到了什么？
- ✅ 数据驱动开发
- ✅ 游戏平衡设计
- ✅ 代码阅读和追踪
- ✅ 循环和条件逻辑
- ✅ 调试技巧
- ✅ 面向对象编程
- ✅ 继承和多态
- ✅ 模块化设计
- ✅ 功能实现和集成
- ✅ 项目管理

### 下一步？
- 尝试修改或扩展 Lucas Game
- 用同样的方法制作其他游戏
- 学习更高级的编程概念

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

(English versions of all 10 lessons follow the same structure as above, covering:
- Learning Objectives
- Tasks with step-by-step instructions
- Thinking Questions
- Extension Tasks)

---

**Total Duration:** ~6 hours of learning
**Best Practice:** 1 lesson per day, or 2-3 lessons per week

**Built with ❤️ and AI assistance by Lucas & Dad**
