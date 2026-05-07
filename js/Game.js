import { TYPES, TRAPS, MINE, GUARD_CONFIG, LEVELS, ACHIEVEMENTS, makePath, MAX_MONEY, distance } from './constants.js?v=7';
import { GameMap }     from './Map.js?v=7';
import { Tower }       from './Tower.js?v=7';
import { Enemy }       from './Enemy.js?v=7';
import { Projectile }  from './Projectile.js?v=7';
import { Trap }        from './Trap.js?v=7';
import { Mine }        from './Mine.js?v=7';
import { Guard }       from './Guard.js?v=7';
import { WaveManager } from './WaveManager.js?v=7';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    canvas.width  = window.innerWidth;
    canvas.height = Math.max(420, window.innerHeight - 88);

    this.path = makePath(canvas.width, canvas.height);
    this.map  = new GameMap(this.path, canvas.width, canvas.height);
    this.waveManager = new WaveManager();

    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.traps       = [];
    this.mines       = [];
    this.guards      = [];

    this.castleHp    = 10000;
    this.castleMaxHp = 10000;
    this.money    = 100;
    this.score    = 0;
    this.gameOver = false;
    this.levelComplete = false;
    this.currentLevel  = null;

    this.workers     = 0;
    this.workerTimer = 0;

    // Castle archer — always fires from the castle gate
    this.castleArcher = {
      x: canvas.width - 42,
      y: Math.round(canvas.height * 0.22) - 38,
      cooldown: 0,
      fireTimer: 0,
      angle: Math.PI,
    };

    this.selectedTower = null;
    this.flashMsg  = '';
    this.flashTimer = 0;
    this.mouse     = { x: 0, y: 0 };
    this.selectedType = 'basic';
    this.typeKeys  = Object.keys(TYPES);
    this.trapKeys  = Object.keys(TRAPS);

    this.titleActive    = true;
    this.selectedLevelId = 1;

    this._buildTitleScreen();
    this._setupInput();
    // Show title screen on first load
    document.getElementById('title-screen').style.display = 'flex';
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update() {
    if (this.titleActive || this.gameOver || this.levelComplete) return;
    if (this.flashTimer > 0) this.flashTimer--;

    const waveResult = this.waveManager.update(this.enemies.length);
    if (typeof waveResult === 'string') {
      this.enemies.push(new Enemy(waveResult, this.path[0].x - 40, this.path[0].y));
    } else if (waveResult?.levelComplete) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      this._onLevelComplete();
    } else if (waveResult?.waveCleared) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      this._updateButtons();
    }

    // Mine passive income (ticks even during wave break)
    for (const mine of this.mines) {
      const gold = mine.update();
      if (gold > 0) { this.money = Math.min(this.money + gold, MAX_MONEY); this._updateButtons(); }
    }
    // Worker passive income ($workers per 4s)
    this.workerTimer++;
    if (this.workerTimer >= 240 && this.workers > 0) {
      this.workerTimer = 0;
      this.money = Math.min(this.money + this.workers, MAX_MONEY);
      this._updateButtons();
    }
    // Achievement: mine baron
    if (this.mines.length >= 3) this._grantAchievement('miner');
    if (this.traps.length >= 5) this._grantAchievement('fortified');

    if (this.waveManager.inBreak) return;

    for (const e of this.enemies) e.update(this.path, this.towers, this.projectiles, this.traps);

    // Enemies that finish the path stop at the gate and besiege the castle
    for (const e of this.enemies) {
      if (!e.atGate && e.hasReachedEnd(this.path)) {
        e.atGate = true;
        e.x = Math.min(e.x, this.canvas.width - 28);
        e.gateAttackTimer = 10 + Math.floor(Math.random() * 20);
      }
    }
    for (const e of this.enemies) {
      if (e.atGate) {
        this.castleHp -= e.castleDamage / 60;
        if (this.castleHp <= 0) { this.castleHp = 0; this.gameOver = true; }
      }
    }

    for (const t of this.towers) {
      if (t === this.selectedTower) {
        if (t.manualCooldown > 0) t.manualCooldown--;
        continue;
      }
      t.update(this.enemies, this.projectiles);
    }

    // Castle archer auto-fires
    if (this.castleArcher.cooldown > 0) this.castleArcher.cooldown--;
    if (this.castleArcher.fireTimer  > 0) this.castleArcher.fireTimer--;
    const ca = this.castleArcher;
    const archerTarget = this.enemies
      .filter(e => distance({ x: ca.x, y: ca.y }, e) < 220)
      .sort((a, b) => (b.atGate ? 999 : b.waypoint) - (a.atGate ? 999 : a.waypoint))[0];
    if (archerTarget && ca.cooldown <= 0) {
      const dx = archerTarget.x - ca.x, dy = archerTarget.y - ca.y;
      const d = Math.hypot(dx, dy);
      ca.angle = Math.atan2(dy, dx);
      this.projectiles.push(new Projectile({
        x: ca.x, y: ca.y,
        vx: (dx / d) * 8, vy: (dy / d) * 8,
        damage: 2, arrow: true,
      }));
      ca.cooldown = 50;
      ca.fireTimer = 10;
    }

    for (const p of this.projectiles) p.update(this.enemies, this.towers);
    this.projectiles = this.projectiles.filter(p => !p.isDead());

    for (const trap of this.traps) trap.update(this.enemies);

    // Guard updates + enemy aggro onto guards
    for (const g of this.guards) g.update(this.enemies);
    for (const g of this.guards) {
      for (const e of this.enemies) {
        if (distance(g, e) < 42) {
          g.takeDamage(e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.018);
          e.triggerAttack(g.x, g.y);
        }
      }
    }
    this.guards = this.guards.filter(g => !g.isDead());

    // Enemies melee-chip towers and walls
    for (const t of this.towers) {
      for (const e of this.enemies) {
        if (distance(t, e) < 55) {
          t.takeDamage(e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.015);
          e.triggerAttack(t.x, t.y);
        }
      }
    }
    this.towers = this.towers.filter(t => {
      if (t.isDead()) { if (t === this.selectedTower) this.selectedTower = null; return false; }
      return true;
    });

    for (const trap of this.traps) {
      if (trap.typeKey === 'wall' || trap.typeKey === 'barricade') {
        for (const e of this.enemies) {
          const hitDist = trap.typeKey === 'barricade' ? 28 : 50;
          if (distance(trap, e) < hitDist) {
            trap.takeDamage(e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.02);
            e.triggerAttack(trap.x, trap.y);
          }
        }
      }
    }
    this.traps = this.traps.filter(t => !t.isDead());

    const before = this.enemies.length;
    this.enemies = this.enemies.filter(e => {
      if (e.isDead()) {
        // Dragon slayer achievement
        if (e.kind === 'dragon' || e.kind === 'dragonRider') this._grantAchievement('dragon_slayer');
        this.score++;
        this.money = Math.min(this.money + e.reward, MAX_MONEY);
        return false;
      }
      return true;
    });
    if (this.enemies.length < before) this._updateButtons();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw() {
    if (this.titleActive) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.map.draw(this.ctx);
    if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      if (TRAPS[key].onPath !== false) this._drawPathHighlight();
    }
    for (const mine  of this.mines)       mine.draw(this.ctx);
    for (const trap  of this.traps)       trap.draw(this.ctx);
    for (const g     of this.guards)      g.draw(this.ctx);
    for (const t     of this.towers)      t.draw(this.ctx, t === this.selectedTower, this.mouse);
    this._drawAimLine();
    this._drawCastleArcher();
    for (const e     of this.enemies)     e.draw(this.ctx, this.path);
    for (const p     of this.projectiles) p.draw(this.ctx);

    this._drawHUD();
    this._drawBreakOverlay();
    this._drawFlash();
    this._drawHint();
    this._drawGameOver();
    this._drawLevelComplete();
  }

  // ── Public actions ───────────────────────────────────────────────────────────

  tryPlaceTower(x, y) {
    if (this.towers.length >= 30) { this.flash('Tower limit reached! (30 max)'); return false; }
    if (this.map.isOnPath(x, y))  { this.flash("Can't build on the path!"); return false; }
    const type = TYPES[this.selectedType];
    if (this.money < type.cost) { this.flash(`Need $${type.cost} — you have $${this.money}!`); return false; }
    this.towers.push(new Tower(x, y, this.selectedType));
    this.money -= type.cost;
    this._updateButtons();
    return true;
  }

  tryPlaceTrap(x, y) {
    if (this.traps.length >= 10) { this.flash('Trap limit reached! (10 max)'); return false; }
    const key = this.selectedType.replace('trap_', '');
    const cfg = TRAPS[key];
    const needsPath = cfg.onPath !== false;
    if (needsPath  && !this.map.isOnPath(x, y)) { this.flash('Traps go on the road!'); return false; }
    if (!needsPath &&  this.map.isOnPath(x, y)) { this.flash("Can't place walls on the path!"); return false; }
    if (this.money < cfg.cost) { this.flash(`Need $${cfg.cost} — you have $${this.money}!`); return false; }
    if (this.traps.some(t => Math.hypot(t.x - x, t.y - y) < 24)) { this.flash('Too close to another trap!'); return false; }
    this.traps.push(new Trap(x, y, key));
    this.money -= cfg.cost;
    this._updateButtons();
    return true;
  }

  tryPlaceMine(x, y) {
    if (this.mines.length >= 5)  { this.flash('Mine limit reached! (5 max)'); return; }
    if (this.map.isOnPath(x, y)) { this.flash("Can't place mines on the path!"); return; }
    if (this.money < MINE.cost)  { this.flash(`Need $${MINE.cost} — you have $${this.money}!`); return; }
    if (this.mines.some(m => Math.hypot(m.x - x, m.y - y) < 28)) { this.flash('Too close to another mine!'); return; }
    this.mines.push(new Mine(x, y));
    this.money -= MINE.cost;
    this._updateButtons();
  }

  tryPlaceGuard(x, y) {
    if (this.guards.length >= 10) { this.flash('Guard limit reached! (10 max)'); return; }
    if (this.map.isOnPath(x, y))  { this.flash("Can't place guards on the path!"); return; }
    if (this.money < GUARD_CONFIG.cost) { this.flash(`Need $${GUARD_CONFIG.cost} — you have $${this.money}!`); return; }
    this.guards.push(new Guard(x, y));
    this.money -= GUARD_CONFIG.cost;
    this._updateButtons();
  }

  hireWorker() {
    if (this.workers >= 5)  { this.flash('Max 5 workers already hired!'); return; }
    if (this.money < 35)    { this.flash('Need $35 to hire a worker!'); return; }
    this.workers++;
    this.money -= 35;
    this.flash(`Worker hired! (${this.workers}/5) — +$${this.workers} every 4s`);
    this._updateButtons();
  }

  trySelectTower(x, y) {
    const clicked = this.towers.find(t => distance(t, { x, y }) < 20);
    if (!clicked) return false;
    this.selectedTower = this.selectedTower === clicked ? null : clicked;
    return true;
  }

  tryFireManual(x, y) {
    if (!this.selectedTower) return;
    if (this.selectedTower.manualCooldown > 0) { this.flash('Still reloading!'); return; }
    const dx = x - this.selectedTower.x, dy = y - this.selectedTower.y;
    const d = Math.hypot(dx, dy);
    this.projectiles.push(new Projectile({
      x: this.selectedTower.x, y: this.selectedTower.y,
      vx: (dx / d) * 12, vy: (dy / d) * 12,
      damage: this.selectedTower.damage * 4,
      slows: this.selectedTower.slows,
      manual: true,
    }));
    this.selectedTower.manualCooldown = this.selectedTower.fireRate * 2;
  }

  sellTower(tower) {
    const refund = Math.floor(tower.cost / 2);
    this.money = Math.min(this.money + refund, MAX_MONEY);
    this.towers = this.towers.filter(t => t !== tower);
    if (this.selectedTower === tower) this.selectedTower = null;
    this.flash(`Sold for $${refund}!`);
    this._updateButtons();
  }

  sellTrap(trap) {
    const refund = Math.floor(trap.cost / 2);
    this.money = Math.min(this.money + refund, MAX_MONEY);
    this.traps = this.traps.filter(t => t !== trap);
    this.flash(`Sold for $${refund}!`);
    this._updateButtons();
  }

  flash(msg) { this.flashMsg = msg; this.flashTimer = 120; }

  startLevel(levelDef) {
    this.currentLevel = levelDef;
    this.towers = []; this.enemies = []; this.projectiles = [];
    this.traps = []; this.mines = []; this.guards = [];
    this.castleHp = 10000; this.money = 100; this.score = 0;
    this.gameOver = false; this.levelComplete = false;
    this.flashMsg = ''; this.flashTimer = 0;
    this.selectedTower = null;
    this.workers = 0; this.workerTimer = 0;
    this.waveManager.setLevel(levelDef);
    this.selectedType = levelDef.towers[0];
    this._rebuildUI();
    document.getElementById('title-screen').style.display = 'none';
    this.titleActive = false;
  }

  showTitle() {
    this.titleActive = true;
    this._buildTitleScreen();
    document.getElementById('title-screen').style.display = 'flex';
  }

  restart() {
    if (this.levelComplete || this.gameOver) {
      this.showTitle();
    } else if (this.currentLevel) {
      this.startLevel(this.currentLevel);
    } else {
      this.showTitle();
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _onLevelComplete() {
    this.levelComplete = true;
    const nextId = this.currentLevel.id + 1;
    const saved  = parseInt(localStorage.getItem('td_maxLevel') || '1');
    if (nextId <= LEVELS.length && nextId > saved)
      localStorage.setItem('td_maxLevel', String(nextId));
    const achMap = { 1: 'first_win', 2: 'soldier', 3: 'warrior', 4: 'champion', 5: 'legend' };
    const aid = achMap[this.currentLevel.id];
    if (aid) this._grantAchievement(aid);
    this._updateButtons();
  }

  _grantAchievement(id) {
    const ach = JSON.parse(localStorage.getItem('td_achievements') || '[]');
    if (!ach.includes(id)) {
      ach.push(id);
      localStorage.setItem('td_achievements', JSON.stringify(ach));
    }
  }

  // ── UI building ─────────────────────────────────────────────────────────────

  _buildTitleScreen() {
    const maxUnlocked  = parseInt(localStorage.getItem('td_maxLevel') || '1');
    const achUnlocked  = JSON.parse(localStorage.getItem('td_achievements') || '[]');

    // Level buttons
    const levelsDiv = document.getElementById('ts-levels');
    levelsDiv.innerHTML = '';
    for (const lvl of LEVELS) {
      const locked = lvl.id > maxUnlocked;
      const btn = document.createElement('button');
      btn.className = 'ts-lvl-btn' + (locked ? ' locked' : ' unlocked') +
                      (this.selectedLevelId === lvl.id && !locked ? ' selected' : '');
      btn.dataset.lvlId = lvl.id;
      btn.innerHTML = `<div class="lv-num">LV${lvl.id}</div>
        <div class="lv-name">${lvl.name}</div>
        <div class="lv-desc">${lvl.desc}</div>
        <div class="lv-waves">${lvl.waves} waves</div>
        ${locked ? '<div style="font-size:16px;margin-top:4px">🔒</div>' : ''}`;
      if (!locked) {
        btn.onclick = () => {
          this.selectedLevelId = lvl.id;
          document.querySelectorAll('.ts-lvl-btn').forEach(b =>
            b.classList.toggle('selected', parseInt(b.dataset.lvlId) === lvl.id));
          document.getElementById('ts-play-btn').textContent = `▶ PLAY LEVEL ${lvl.id}`;
        };
      }
      levelsDiv.appendChild(btn);
    }

    // Achievement badges
    const achDiv = document.getElementById('ts-achievements');
    achDiv.innerHTML = '';
    for (const ach of ACHIEVEMENTS) {
      const div = document.createElement('div');
      div.className = 'ts-ach' + (achUnlocked.includes(ach.id) ? ' unlocked' : '');
      div.textContent = `${ach.icon} ${ach.name}`;
      div.title = ach.desc;
      achDiv.appendChild(div);
    }

    // Play button action
    const playBtn = document.getElementById('ts-play-btn');
    playBtn.textContent = `▶ PLAY LEVEL ${this.selectedLevelId}`;
    playBtn.onclick = () => {
      const lvl = LEVELS.find(l => l.id === this.selectedLevelId);
      if (lvl) this.startLevel(lvl);
    };
  }

  _rebuildUI() {
    const ui = document.getElementById('ui');
    ui.innerHTML = '';
    const allowedTowers = this.currentLevel ? this.currentLevel.towers : this.typeKeys;
    const allowedTraps  = this.currentLevel ? this.currentLevel.traps  : this.trapKeys;

    this.typeKeys.forEach(key => {
      if (!allowedTowers.includes(key)) return;
      const btn = document.createElement('button');
      btn.id = 'btn-' + key;
      btn.className = 'btn' + (key === this.selectedType ? ' selected' : '');
      btn.textContent = TYPES[key].label;
      btn.style.background = TYPES[key].color;
      btn.onclick = () => this._selectType(key);
      ui.appendChild(btn);
    });

    this.trapKeys.forEach(key => {
      if (!allowedTraps.includes(key)) return;
      const btn = document.createElement('button');
      btn.id = 'btn-trap_' + key;
      btn.className = 'btn' + ('trap_' + key === this.selectedType ? ' selected' : '');
      btn.textContent = TRAPS[key].label;
      btn.style.background = TRAPS[key].color;
      btn.style.outline = '2px solid #ff8800';
      btn.onclick = () => this._selectType('trap_' + key);
      ui.appendChild(btn);
    });

    // Mine button
    const mBtn = document.createElement('button');
    mBtn.id = 'btn-mine';
    mBtn.className = 'btn' + (this.selectedType === 'mine' ? ' selected' : '');
    mBtn.textContent = MINE.label;
    mBtn.style.background = MINE.color;
    mBtn.style.outline = '2px solid #ffd700';
    mBtn.onclick = () => this._selectType('mine');
    ui.appendChild(mBtn);

    // Guard button
    const gBtn = document.createElement('button');
    gBtn.id = 'btn-guard';
    gBtn.className = 'btn' + (this.selectedType === 'guard' ? ' selected' : '');
    gBtn.textContent = GUARD_CONFIG.label;
    gBtn.style.background = GUARD_CONFIG.color;
    gBtn.onclick = () => this._selectType('guard');
    ui.appendChild(gBtn);

    // Worker hire button (not placement — click = hire)
    const wBtn = document.createElement('button');
    wBtn.id = 'btn-worker';
    wBtn.className = 'btn';
    wBtn.style.background = '#7a4a1a';
    wBtn.onclick = () => this.hireWorker();
    ui.appendChild(wBtn);

    this._updateButtons();
  }

  _selectType(key) {
    this.selectedType = key;
    const allKeys = [
      ...this.typeKeys,
      ...this.trapKeys.map(k => 'trap_' + k),
      'mine', 'guard',
    ];
    for (const k of allKeys) {
      const btn = document.getElementById('btn-' + k);
      if (btn) btn.className = 'btn' + (k === key ? ' selected' : '');
    }
  }

  _updateButtons() {
    for (const k of this.typeKeys) {
      const btn = document.getElementById('btn-' + k);
      if (btn) btn.style.opacity = this.money >= TYPES[k].cost ? '0.9' : '0.35';
    }
    for (const k of this.trapKeys) {
      const btn = document.getElementById('btn-trap_' + k);
      if (btn) btn.style.opacity = this.money >= TRAPS[k].cost ? '0.9' : '0.35';
    }
    const mBtn = document.getElementById('btn-mine');
    if (mBtn) mBtn.style.opacity = this.money >= MINE.cost ? '0.9' : '0.35';
    const gBtn = document.getElementById('btn-guard');
    if (gBtn) gBtn.style.opacity = this.money >= GUARD_CONFIG.cost ? '0.9' : '0.35';
    const wBtn = document.getElementById('btn-worker');
    if (wBtn) {
      wBtn.style.opacity = this.money >= 35 && this.workers < 5 ? '0.9' : '0.35';
      wBtn.textContent = `W Worker $35 (${this.workers}/5)`;
    }
  }

  _setupInput() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('click', e => {
      if (this.gameOver || this.levelComplete || this.titleActive) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (this.trySelectTower(x, y)) return;
      if (this.selectedTower) { this.tryFireManual(x, y); return; }
      if (this.selectedType === 'mine')  { this.tryPlaceMine(x, y); return; }
      if (this.selectedType === 'guard') { this.tryPlaceGuard(x, y); return; }
      if (this.selectedType.startsWith('trap_')) { this.tryPlaceTrap(x, y); }
      else { this.tryPlaceTower(x, y); }
    });

    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.gameOver || this.levelComplete || this.titleActive) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const tower = this.towers.find(t => distance(t, { x, y }) < 20);
      if (tower) { this.sellTower(tower); return; }
      const trap = this.traps.find(t => Math.hypot(t.x - x, t.y - y) < 22);
      if (trap) { this.sellTrap(trap); return; }
      const mine = this.mines.find(m => Math.hypot(m.x - x, m.y - y) < 22);
      if (mine) {
        const refund = Math.floor(MINE.cost / 2);
        this.money = Math.min(this.money + refund, MAX_MONEY);
        this.mines = this.mines.filter(m2 => m2 !== mine);
        this.flash(`Mine sold for $${refund}`);
        this._updateButtons();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'r' || e.key === 'R') { this.restart(); return; }
      if (e.key === 'Escape') { this.selectedTower = null; return; }
      if (e.key === '0') { this._selectType('guard'); return; }
      const allowedTowers = this.currentLevel ? this.currentLevel.towers : this.typeKeys;
      const allowedTraps  = this.currentLevel ? this.currentLevel.traps  : this.trapKeys;
      const i = parseInt(e.key) - 1;
      if (i >= 0 && i < allowedTowers.length) {
        this._selectType(allowedTowers[i]);
      } else {
        const ti = i - this.typeKeys.length;
        if (ti >= 0 && ti < allowedTraps.length) this._selectType('trap_' + allowedTraps[ti]);
      }
    });
  }

  // ── Draw helpers ─────────────────────────────────────────────────────────────

  _drawCastleArcher() {
    const ca  = this.castleArcher;
    const ctx = this.ctx;
    const s   = 10;
    const a   = ca.angle;
    const hcy = ca.y - s * 0.3;

    // Body
    ctx.fillStyle = '#888';
    ctx.fillRect(ca.x - 5, hcy + s * 0.38, 10, 10);
    // Neck
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(ca.x - 2, hcy + s * 0.28, 4, 5);
    // Head
    ctx.fillStyle = '#e8b890';
    ctx.beginPath(); ctx.arc(ca.x, hcy, s * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#666'; // helmet half
    ctx.beginPath(); ctx.arc(ca.x, hcy, s * 0.42, Math.PI, Math.PI * 2); ctx.fill();

    // Bow arm rotating toward target
    ctx.save();
    ctx.translate(ca.x, hcy + 2);
    ctx.rotate(a);
    ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(2, -7); ctx.quadraticCurveTo(16, 0, 2, 7); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(2, 7); ctx.stroke();
    // Arrow
    if (ca.fireTimer > 0) {
      ctx.strokeStyle = '#c8b860'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(18, 0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(18, 2); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill();
    }
    ctx.lineCap = 'butt';
    ctx.restore();
  }

  _drawPathHighlight() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,220,50,0.22)';
    ctx.lineWidth = 48; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
    ctx.stroke();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  }

  _drawAimLine() {
    if (!this.selectedTower) return;
    const reloading = this.selectedTower.manualCooldown > 0;
    if (reloading) {
      const progress = 1 - this.selectedTower.manualCooldown / (this.selectedTower.fireRate * 2);
      this.ctx.strokeStyle = '#f84'; this.ctx.lineWidth = 4; this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.arc(this.selectedTower.x, this.selectedTower.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      this.ctx.stroke();
      this.ctx.lineCap = 'butt';
    }
    this.ctx.strokeStyle = reloading ? 'rgba(255,100,50,0.5)' : 'rgba(255,255,255,0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.selectedTower.x, this.selectedTower.y);
    this.ctx.lineTo(this.mouse.x, this.mouse.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  _drawHUD() {
    const ctx = this.ctx;
    const hpFrac = this.castleHp / this.castleMaxHp;
    const barW = 180, barH = 14, barX = 10, barY = 6;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = hpFrac > 0.5 ? '#2288ff' : hpFrac > 0.25 ? '#ff9900' : '#ff3333';
    ctx.fillRect(barX, barY, barW * hpFrac, barH);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`Castle  ${Math.ceil(this.castleHp)} / ${this.castleMaxHp}`, barX + 4, barY + 10);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fff';    ctx.fillText(`Kills: ${this.score}`, 200, 22);
    ctx.fillStyle = '#ffd700'; ctx.fillText(`$${this.money}`, 305, 22);
    ctx.fillStyle = '#7df';    ctx.fillText(`Wave: ${this.waveManager.wave}${this.currentLevel ? '/' + this.currentLevel.waves : ''}`, 375, 22);
    ctx.fillStyle = 'rgba(255,215,0,0.85)';
    ctx.fillText(`Mines:${this.mines.length}/5  Workers:${this.workers}/5`, 490, 22);
    if (this.currentLevel) {
      ctx.fillStyle = 'rgba(180,180,255,0.8)';
      ctx.fillText(`LV${this.currentLevel.id} ${this.currentLevel.name}`, this.canvas.width - 160, 22);
    }
  }

  _drawBreakOverlay() {
    if (!this.waveManager.inBreak || this.gameOver || this.levelComplete) return;
    const ctx = this.ctx;
    const sec  = Math.ceil(this.waveManager.breakTimer / 60);
    const wave = this.waveManager.wave;
    const maxWaves = this.currentLevel ? this.currentLevel.waves : '?';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7df'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText(wave === 0 ? 'Place your towers and mines!' : `Wave ${wave}/${maxWaves} cleared! +$${20 * wave}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Wave ${wave + 1} starts in ${sec}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillStyle = 'rgba(255,215,0,0.6)'; ctx.font = '14px sans-serif';
    ctx.fillText('Tip: Place Mines ($80) to earn passive income. Hire Workers for more gold!', this.canvas.width / 2, this.canvas.height / 2 + 55);
    ctx.textAlign = 'left';
  }

  _drawFlash() {
    if (this.flashTimer <= 0) return;
    this.ctx.fillStyle = `rgba(255,80,80,${this.flashTimer / 120})`;
    this.ctx.font = 'bold 22px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.flashMsg, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.textAlign = 'left';
  }

  _drawHint() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.35)'; this.ctx.font = '13px sans-serif';
    let hint;
    if (this.selectedTower) {
      hint = 'Click to shoot · click tower again or Esc to release · right-click to sell';
    } else if (this.selectedType === 'mine') {
      hint = 'Click on grass to place mine (+$2 every 4s) · right-click mine to sell (½ price)';
    } else if (this.selectedType === 'guard') {
      hint = 'Click off road to place guard soldier · they auto-attack nearby enemies';
    } else if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      hint = TRAPS[key].onPath === false
        ? 'Click off the road to place wall · right-click wall to sell (½ price)'
        : 'Click on the glowing road to place trap · right-click trap to sell (½ price)';
    } else {
      hint = '1–4 towers · 5–8 traps · 9 mine · 0 guard · W workers · right-click to sell · R = menu';
    }
    this.ctx.fillText(hint, this.canvas.width / 2 - 280, 22);
  }

  _drawGameOver() {
    if (!this.gameOver) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 64px sans-serif';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Survived ${this.waveManager.wave} waves  •  ${this.score} kills`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '18px sans-serif';
    ctx.fillText('Press R to return to the menu', this.canvas.width / 2, this.canvas.height / 2 + 60);
    ctx.textAlign = 'left';
  }

  _drawLevelComplete() {
    if (!this.levelComplete) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 58px sans-serif';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    ctx.fillStyle = '#7df'; ctx.font = '26px sans-serif';
    ctx.fillText(`${this.currentLevel.name} cleared  •  ${this.score} kills`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '18px sans-serif';
    const nxt = LEVELS.find(l => l.id === this.currentLevel.id + 1);
    ctx.fillText(nxt ? `Level ${nxt.id} — "${nxt.name}" unlocked!` : 'You beat all 5 levels! Legendary!', this.canvas.width / 2, this.canvas.height / 2 + 48);
    ctx.fillText('Press R to return to the menu', this.canvas.width / 2, this.canvas.height / 2 + 82);
    ctx.textAlign = 'left';
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────
const game = new Game(document.getElementById('game'));
function loop() {
  game.update();
  game.draw();
  requestAnimationFrame(loop);
}
loop();
