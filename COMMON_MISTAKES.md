# Common Mistakes & Solutions 🐛

**[中文版本 →](#-中文版本)**

Common problems students encounter while learning Lucas Game and how to fix them.

---

## 📖 English Version

### Error 1: Code Changes Don't Appear ❌

**Symptom:** I changed `constants.js`, but the game didn't change.

**Cause:** Browser cache stored the old version.

**Solution:**

```
Solution 1: Hard Refresh
  Windows: Ctrl + Shift + R
  Mac: Cmd + Shift + R
  
Solution 2: Clear Cache in DevTools
  1. Press F12 to open DevTools
  2. Right-click the refresh button
  3. Select "Clear cache and hard refresh"
```

**Prevention:** Use Python local server to avoid browser cache.

---

### Error 2: Can't Find Code to Edit ❌

**Symptom:** I want to change tower price, but don't know which file.

**Solution:**

```
Step 1: Guess the filename
  - Change tower → Tower.js or constants.js
  - Change enemy → Enemy.js or constants.js
  - Change waves → WaveManager.js
  
Step 2: Use search
  In VS Code:
  1. Press Ctrl + F (Find)
  2. Type your keyword, e.g., "sniper"
  3. See all occurrences
  
Step 3: Check documentation
  - Open CLAUDE.md, find "Architecture" section
  - Learn each file's purpose
```

**Checklist:**
- [ ] Change data → check `constants.js`
- [ ] Change tower behavior → check `Tower.js`
- [ ] Change enemy behavior → check `Enemy.js`
- [ ] Change wave rules → check `WaveManager.js`

---

### Error 3: Syntax Errors Break Game ❌

**Symptom:** Game completely broken, red errors in console.

**Solution:**

```
Step 1: Open console to see error
  1. Press F12
  2. Click "Console" tab
  3. Look at red error message
  
Step 2: Check common syntax errors
  [ ] Missing comma?
      ❌ { cost: 100 damage: 20 }
      ✅ { cost: 100, damage: 20 }
  
  [ ] Missing quotes?
      ❌ const TYPE_SNIPER = sniper
      ✅ const TYPE_SNIPER = 'sniper'
  
  [ ] Wrong bracket count?
      ❌ function test( {
      ✅ function test() {
  
  [ ] Chinese punctuation?
      ❌ const name = "tower"；
      ✅ const name = "tower";
  
Step 3: Undo changes
  - Press Ctrl + Z to undo
  - Until game works again
  - Then change carefully one step at a time
```

---

### Error 4: Numbers vs Strings ❌

**Symptom:** I changed `150` to `"150"` and now the game behaves strangely.

**Solution:**

```javascript
// ❌ Wrong: numbers and strings are different
let price1 = 150;       // number
let price2 = "150";     // string

console.log(price1 + 50);   // = 200 (number addition)
console.log(price2 + 50);   // = "15050" (string concatenation!)

// ✅ Correct: ensure consistent types
let cost = 150;         // number
let name = "sniper";    // string
```

**Checklist:**
- [ ] Prices, damage, health are numbers: `150` (not `"150"`)
- [ ] Names, types are strings: `"sniper"` (with quotes)

---

### Error 5: Don't Understand `%` Operator ❌

**Symptom:** I see `i % 3 === 0` and don't understand it.

**Solution:**

```javascript
// % is "remainder" (modulo operation)
// 10 % 3 = 1 (10 divided by 3 leaves remainder 1)
// 9 % 3 = 0 (9 divided by 3 leaves remainder 0)

// Example:
if (i % 3 === 0) {
  // This runs when i is divisible by 3
  // i.e., i = 0, 3, 6, 9, 12, ...
}

// Common patterns:
i % 2 === 0    // i is even
i % 2 === 1    // i is odd
i % 5 === 0    // i is divisible by 5
```

**Applied to the game:**
```javascript
// In WaveManager.js
if (i % 3 === 0) {
  enemies.push(new Enemy('runner'));
}
// Means: every 3 enemies, the 1st is a runner
```

---

### Error 6: Don't Know How to Debug ❌

**Symptom:** Game has a problem, but I don't know where.

**Solution:**

```javascript
// Use console.log to print information

// Example 1: Check variable value
console.log("Current money:", this.money);

// Example 2: Check if code runs
console.log("This function was called");

// Example 3: Check object contents
console.log("Enemy list:", this.enemies);

// Example 4: Track execution order
console.log("1. Game started");
console.log("2. Updated enemies");
console.log("3. Drew screen");
```

**Steps:**
1. Guess where the problem is
2. Add `console.log()` there
3. Reload game, check console output
4. Deduce the problem from output

**Common log patterns:**
```javascript
// When entering function
console.log("Entered update function");

// When state changes
console.log(`Money changed from ${oldMoney} to ${this.money}`);

// When checking conditions
if (enemy.isDead) {
  console.log("Enemy died");
} else {
  console.log("Enemy alive");
}
```

---

### Error 7: Wrong Operators ❌

**Symptom:** Code looks correct but game behaves wrong.

**Operator Reference:**

| Operator | Name | Purpose | Example |
|----------|------|---------|---------|
| `=` | Assignment | Set value | `cost = 150` |
| `==` | Equals | Loose comparison | `if (a == b)` |
| `===` | Strict Equals | Strict comparison | `if (a === b)` |
| `!` | Not | Negate | `if (!isDead)` |
| `&&` | And | Both must be true | `if (a && b)` |
| `\|\|` | Or | Either can be true | `if (a \|\| b)` |
| `+` | Plus | Math or concatenate | `a + b` |
| `+=` | Plus Equals | Increase | `money += 50` |
| `-` | Minus | Math | `a - b` |
| `-=` | Minus Equals | Decrease | `hp -= 10` |

**Common mistake:**
```javascript
// ❌ Wrong: using = instead of ===
if (enemy.type = "runner") {  // This CHANGES the type!
}

// ✅ Correct: === just compares
if (enemy.type === "runner") {  // This only checks
}
```

---

### Error 8: Wrong Assignment Operator ❌

**Symptom:** Damage should increase but it decreases.

**Operator Checklist:**

```javascript
// Assignment
x = 10;         // x is 10

// Operations
x += 5;         // x = x + 5  (x becomes 15)
x -= 3;         // x = x - 3  (x becomes 12)
x *= 2;         // x = x * 2  (x becomes 24)
x /= 4;         // x = x / 4  (x becomes 6)

// ❌ Common mistakes
x =+ 5;         // Should be += not =+
x -= -5;        // Results in x + 5, confusing
```

---

### Error 9: Edited Wrong File ❌

**Symptom:** I changed `constants.js`, but maybe I edited the wrong one.

**Prevention:**

```
Solution 1: Check file path
  - Look at window title in VS Code
  - Should show: lucasgame > js > constants.js

Solution 2: Search to confirm
  - Press Ctrl + P (Quick Open)
  - Type filename
  - Check if only one result

Solution 3: Verify before saving
  - Look at tab filename clearly
  - After saving (Ctrl + S), check if "*" appears (unsaved)
```

---

## Quick Troubleshooting Checklist ✅

### Game Won't Start?
- [ ] Started local server? (`python3 -m http.server 8080`)
- [ ] Using correct URL? (`http://localhost:8080`)
- [ ] Did hard refresh? (Ctrl + Shift + R)
- [ ] Checked console for errors? (F12)

### Changes Don't Show?
- [ ] File saved?
- [ ] Hard refresh done?
- [ ] Correct file edited?
- [ ] Correct line changed?

### Game Crashed?
- [ ] Checked console for errors? (F12)
- [ ] Look for syntax errors?
- [ ] Undo last change? (Ctrl + Z)
- [ ] Restore from backup?

---

## 📖 中文版本

### 错误 1：改完代码游戏没有变化 ❌

**现象：** 我改了 `constants.js` 里的数字，但重新加载游戏后没有变化。

**原因：** 浏览器缓存了旧版本的代码。

**解决方案：**

```
方案 1：硬刷新
  Windows: Ctrl + Shift + R
  Mac: Cmd + Shift + R
  
方案 2：打开开发者工具禁用缓存
  1. 按 F12 打开开发者工具
  2. 右键点击刷新按钮
  3. 选择"清空缓存并硬刷新"
```

**预防：** 本地开发时用 Python 服务器，避免浏览器缓存

---

### 错误 2：找不到要改的代码 ❌

**现象：** 我想改塔的价格，但不知道在哪个文件里。

**解决方案：**

```
步骤 1：猜测文件名
  - 改塔 → Tower.js 或 constants.js
  - 改敌人 → Enemy.js 或 constants.js
  - 改波次 → WaveManager.js
  
步骤 2：用搜索功能
  在 VS Code 中：
  1. 按 Ctrl + F（查找）
  2. 输入你要找的关键字，例如 "sniper"
  3. 查看所有出现的地方

步骤 3：查看文档
  - 打开 CLAUDE.md，查看"Architecture"章节
  - 了解每个文件的用途
```

**清单：**
- [ ] 改数据 → 查看 `constants.js`
- [ ] 改塔的行为 → 查看 `Tower.js`
- [ ] 改敌人的行为 → 查看 `Enemy.js`
- [ ] 改波次规则 → 查看 `WaveManager.js`

---

### 错误 3：语法错误导致游戏崩溃 ❌

**现象：** 改完代码后游戏完全不工作，控制台显示红色错误。

**解决方案：**

```
步骤 1：打开控制台查看错误
  1. 按 F12
  2. 点击"Console"标签
  3. 看红色的错误信息
  
步骤 2：常见语法错误检查清单
  [ ] 是否漏掉了逗号？
      ❌ { cost: 100 damage: 20 }
      ✅ { cost: 100, damage: 20 }
  
  [ ] 是否漏掉了引号？
      ❌ const TYPE_SNIPER = sniper
      ✅ const TYPE_SNIPER = 'sniper'
  
  [ ] 是否多了或少了括号？
      ❌ function test( {
      ✅ function test() {
  
  [ ] 是否用了中文标点？
      ❌ const name = "塔"；
      ✅ const name = "塔";
  
步骤 3：回滚改动
  - 按 Ctrl + Z 撤销最后的改动
  - 直到游戏恢复工作
  - 然后一个一个小心地改
```

---

### 错误 4：数字和字符串混淆 ❌

**现象：** 我把 `150` 改成了 `"150"`，现在游戏表现很奇怪。

**解决方案：**

```javascript
// ❌ 错误：数字和字符串不同
let price1 = 150;       // 数字
let price2 = "150";     // 字符串

console.log(price1 + 50);   // = 200（数字加法）
console.log(price2 + 50);   // = "15050"（字符串拼接！）

// ✅ 正确：确保类型一致
let cost = 150;         // 数字
let name = "sniper";    // 字符串
```

**检查清单：**
- [ ] 价格、伤害、血量应该是数字：`150`（不是 `"150"`）
- [ ] 名字、类型应该是字符串：`"sniper"`（有引号）

---

### 错误 5：不理解百分号 `%` ❌

**现象：** 我看到 `i % 3 === 0`，不知道是什么意思。

**解决方案：**

```javascript
// % 是"取余数"（模运算）
// 10 % 3 = 1（10 除以 3 余 1）
// 9 % 3 = 0（9 除以 3 余 0）

// 例子：
if (i % 3 === 0) {
  // 这表示：每当 i 能被 3 整除时执行
  // 即：i = 0, 3, 6, 9, 12, ...
}

// 常见模式：
i % 2 === 0    // i 是偶数
i % 2 === 1    // i 是奇数
i % 5 === 0    // i 能被 5 整除
```

**应用到游戏：**
```javascript
// 在 WaveManager.js 中
if (i % 3 === 0) {
  enemies.push(new Enemy('runner'));
}
// 意思：每 3 个敌人中，第 1 个是 runner
```

---

### 错误 6：不知道怎样调试 ❌

**现象：** 游戏有问题，但我不知道是哪里出错了。

**解决方案：**

```javascript
// 使用 console.log 打印信息

// 例子 1：查看变量值
console.log("当前金钱：", this.money);

// 例子 2：查看是否进入代码
console.log("这个函数被调用了");

// 例子 3：查看对象内容
console.log("敌人列表：", this.enemies);

// 例子 4：追踪执行顺序
console.log("1. 游戏开始");
console.log("2. 更新敌人");
console.log("3. 绘制界面");
```

**步骤：**
1. 猜测哪里有问题
2. 在那里添加 `console.log()`
3. 重新加载游戏，看控制台输出
4. 根据输出推断问题

**常见日志模式：**
```javascript
// 进入函数时
console.log("进入 update 函数");

// 改变状态时
console.log(`金钱从 ${oldMoney} 变为 ${this.money}`);

// 条件判断时
if (enemy.isDead) {
  console.log("敌人死亡");
} else {
  console.log("敌人还活着");
}
```

---

### 错误 7：改错了符号 ❌

**现象：** 代码看起来是对的，但游戏行为不对。

**符号对照表：**

| 符号 | 名字 | 用途 | 例子 |
|------|------|------|------|
| `=` | 赋值 | 设置值 | `cost = 150` |
| `==` | 相等 | 比较（宽松） | `if (a == b)` |
| `===` | 全等 | 比较（严格） | `if (a === b)` |
| `!` | 否 | 取反 | `if (!isDead)` |
| `&&` | 且 | 同时满足 | `if (a && b)` |
| `\|\|` | 或 | 满足其一 | `if (a \|\| b)` |
| `+` | 加 | 数学运算或字符串连接 | `a + b` |
| `+=` | 加等 | 增加 | `money += 50` |
| `-` | 减 | 数学运算 | `a - b` |
| `-=` | 减等 | 减少 | `hp -= 10` |

**常见错误：**
```javascript
// ❌ 错误：用了 = 而不是 ===
if (enemy.type = "runner") {  // 这会改变类型！
}

// ✅ 正确
if (enemy.type === "runner") {  // 这只是比较
}
```

---

### 错误 8：改错了操作符 ❌

**现象：** 伤害应该增加，但反而减少了。

**操作符清单：**

```javascript
// 赋值
x = 10;         // x 是 10

// 运算
x += 5;         // x = x + 5  (x 是 15)
x -= 3;         // x = x - 3  (x 是 12)
x *= 2;         // x = x * 2  (x 是 24)
x /= 4;         // x = x / 4  (x 是 6)

// ❌ 常见错误
x =+ 5;         // 应该是 += 不是 =+
x -= -5;        // 结果是 x + 5，容易混淆
```

---

### 错误 9：改错了文件 ❌

**现象：** 我改了 `constants.js`，但改的是另一个 `constants.js`。

**预防方案：**

```
方案 1：确认文件路径
  - 在 VS Code 中打开文件时，看窗口标题
  - 应该显示：lucasgame > js > constants.js

方案 2：搜索前确认文件
  - Ctrl + P（快速打开）
  - 输入文件名
  - 看结果是否只有一个

方案 3：保存前检查
  - 改文件前，把标签页的文件名看清楚
  - 保存后（Ctrl + S），看文件标题是否有 "*"（未保存）
```

---

## 快速问题排查清单 ✅

### 游戏启动失败？
- [ ] 打开了本地服务器吗？（`python3 -m http.server 8080`）
- [ ] 用了正确的 URL？（`http://localhost:8080`）
- [ ] 按了硬刷新？（Ctrl + Shift + R）
- [ ] 检查控制台有没有错误？（F12）

### 改动没有生效？
- [ ] 文件保存了吗？
- [ ] 做了硬刷新吗？
- [ ] 改的是正确的文件吗？
- [ ] 改的是正确的行吗？

### 游戏崩溃了？
- [ ] 打开控制台看错误信息（F12）
- [ ] 检查是否有语法错误（逗号、引号等）
- [ ] 撤销最后的改动（Ctrl + Z）
- [ ] 从备份恢复（如果有的话）

---

**Built with ❤️ and AI assistance by Lucas & Dad**
