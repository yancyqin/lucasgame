import { TYPES, TRAPS, PATH, MAX_MONEY, distance } from './constants.js';
import { GameMap }     from './Map.js';
import { Tower }       from './Tower.js';
import { Enemy }       from './Enemy.js';
import { Projectile }  from './Projectile.js';
import { Trap }        from './Trap.js';
import { WaveManager } from './WaveManager.js';

// Game is the orchestrator — owns all live state and coordinates every subsystem.
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.map         = new GameMap();
    this.waveManager = new WaveManager();

    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.traps       = [];

    this.lives    = 100;
    this.money    = 50;
    this.score    = 0;
    this.gameOver = false;

    this.selectedTower = null;
    this.flashMsg  = '';
    this.flashTimer = 0;
    this.mouse     = { x: 0, y: 0 };
    this.selectedType = 'basic';
    this.typeKeys  = Object.keys(TYPES);
    this.trapKeys  = Object.keys(TRAPS);

    this._buildUI();
    this._setupInput();
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update() {
    if (this.gameOver) return;
    if (this.flashTimer > 0) this.flashTimer--;

    const waveResult = this.waveManager.update(this.enemies.length);
    if (typeof waveResult === 'string') {
      this.enemies.push(new Enemy(waveResult, PATH[0].x, PATH[0].y));
    } else if (waveResult?.waveCleared) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      this._updateButtons();
    }

    if (this.waveManager.inBreak) return;

    for (const e of this.enemies) e.update(PATH, this.towers, this.projectiles);

    this.enemies = this.enemies.filter(e => {
      if (e.hasReachedEnd(PATH)) {
        this.lives -= e.castleDamage;
        if (this.lives <= 0) this.gameOver = true;
        return false;
      }
      return true;
    });

    for (const t of this.towers) {
      if (t === this.selectedTower) {
        if (t.manualCooldown > 0) t.manualCooldown--;
        continue;
      }
      t.update(this.enemies, this.projectiles);
    }

    for (const p of this.projectiles) p.update(this.enemies, this.towers);
    this.projectiles = this.projectiles.filter(p => !p.isDead());

    // Traps: spike/tar/wall each handle their own logic
    for (const trap of this.traps) trap.update(this.enemies);

    // Enemies melee-chip towers and walls
    for (const t of this.towers) {
      for (const e of this.enemies) {
        if (distance(t, e) < 55)
          t.takeDamage(e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.015);
      }
    }
    this.towers = this.towers.filter(t => {
      if (t.isDead()) { if (t === this.selectedTower) this.selectedTower = null; return false; }
      return true;
    });

    for (const trap of this.traps) {
      if (trap.typeKey === 'wall') {
        for (const e of this.enemies) {
          if (distance(trap, e) < 50)
            trap.takeDamage(e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.015);
        }
      }
    }
    this.traps = this.traps.filter(t => !t.isDead());

    const before = this.enemies.length;
    this.enemies = this.enemies.filter(e => {
      if (e.isDead()) { this.score++; this.money = Math.min(this.money + e.reward, MAX_MONEY); return false; }
      return true;
    });
    if (this.enemies.length < before) this._updateButtons();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.map.draw(this.ctx);
    // Path-highlight when a road-trap is selected
    if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      if (TRAPS[key].onPath !== false) this._drawPathHighlight();
    }
    for (const trap of this.traps)    trap.draw(this.ctx);
    for (const t of this.towers)      t.draw(this.ctx, t === this.selectedTower, this.mouse);
    this._drawAimLine();
    for (const e of this.enemies)     e.draw(this.ctx, PATH);
    for (const p of this.projectiles) p.draw(this.ctx);

    this._drawHUD();
    this._drawBreakOverlay();
    this._drawFlash();
    this._drawHint();
    this._drawGameOver();
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

  restart() {
    this.towers = []; this.enemies = []; this.projectiles = []; this.traps = [];
    this.lives = 100; this.money = 50; this.score = 0;
    this.gameOver = false; this.flashMsg = ''; this.flashTimer = 0;
    this.selectedTower = null;
    this.waveManager.reset();
    this._updateButtons();
  }

  // ── Private UI & drawing helpers ─────────────────────────────────────────────

  _buildUI() {
    const ui = document.getElementById('ui');
    // Tower buttons (keys 1–4)
    this.typeKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.id = 'btn-' + key;
      btn.className = 'btn' + (key === this.selectedType ? ' selected' : '');
      btn.textContent = TYPES[key].label;
      btn.style.background = TYPES[key].color;
      btn.onclick = () => this._selectType(key);
      ui.appendChild(btn);
    });
    // Trap buttons (keys 5–7) — orange outline distinguishes them from towers
    this.trapKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.id = 'btn-trap_' + key;
      btn.className = 'btn';
      btn.textContent = TRAPS[key].label;
      btn.style.background = TRAPS[key].color;
      btn.style.outline = '2px solid #ff8800';
      btn.onclick = () => this._selectType('trap_' + key);
      ui.appendChild(btn);
    });
  }

  _selectType(key) {
    this.selectedType = key;
    this.typeKeys.forEach(k =>
      document.getElementById('btn-' + k).className = 'btn' + (k === key ? ' selected' : ''));
    this.trapKeys.forEach(k =>
      document.getElementById('btn-trap_' + k).className = 'btn' + ('trap_' + k === key ? ' selected' : ''));
  }

  _updateButtons() {
    this.typeKeys.forEach(k =>
      (document.getElementById('btn-' + k).style.opacity = this.money >= TYPES[k].cost ? '0.9' : '0.35'));
    this.trapKeys.forEach(k =>
      (document.getElementById('btn-trap_' + k).style.opacity = this.money >= TRAPS[k].cost ? '0.9' : '0.35'));
  }

  _setupInput() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('click', e => {
      if (this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (this.trySelectTower(x, y)) return;
      if (this.selectedTower) { this.tryFireManual(x, y); return; }
      if (this.selectedType.startsWith('trap_')) {
        this.tryPlaceTrap(x, y);
      } else {
        this.tryPlaceTower(x, y);
      }
    });

    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const tower = this.towers.find(t => distance(t, { x, y }) < 20);
      if (tower) { this.sellTower(tower); return; }
      const trap = this.traps.find(t => Math.hypot(t.x - x, t.y - y) < 22);
      if (trap) this.sellTrap(trap);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'r' || e.key === 'R') { this.restart(); return; }
      if (e.key === 'Escape') { this.selectedTower = null; return; }
      const i = parseInt(e.key) - 1;
      if (i >= 0 && i < this.typeKeys.length) {
        this._selectType(this.typeKeys[i]);
      } else {
        const ti = i - this.typeKeys.length;
        if (ti >= 0 && ti < this.trapKeys.length) this._selectType('trap_' + this.trapKeys[ti]);
      }
    });
  }

  // Soft yellow glow over the path when a road-trap is being aimed
  _drawPathHighlight() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,220,50,0.22)';
    ctx.lineWidth = 48; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
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
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fff';    ctx.fillText(`Lives: ${this.lives}`, 10, 22);
    ctx.fillStyle = '#fff';    ctx.fillText(`Kills: ${this.score}`, 120, 22);
    ctx.fillStyle = '#ffd700'; ctx.fillText(`$${this.money}`, 220, 22);
    ctx.fillStyle = '#7df';    ctx.fillText(`Wave: ${this.waveManager.wave}`, 290, 22);
    ctx.fillStyle = 'rgba(255,140,0,0.8)';
    ctx.fillText(`Traps: ${this.traps.length}/10`, 380, 22);
  }

  _drawBreakOverlay() {
    if (!this.waveManager.inBreak || this.gameOver) return;
    const ctx = this.ctx;
    const sec  = Math.ceil(this.waveManager.breakTimer / 60);
    const wave = this.waveManager.wave;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7df'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText(wave === 0 ? 'Place your towers!' : `Wave ${wave} cleared! +$${20 * wave}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Wave ${wave + 1} starts in ${sec}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '14px sans-serif';
    ctx.fillText('Swordsmen  •  Scouts  •  Crusaders  •  Dragons (wave 7)  •  Dragon Riders (wave 10)', this.canvas.width / 2, this.canvas.height / 2 + 55);
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
    } else if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      hint = TRAPS[key].onPath === false
        ? 'Click off the road to place wall · right-click wall to sell (½ price)'
        : 'Click on the glowing road to place trap · right-click trap to sell (½ price)';
    } else {
      hint = '1–4 towers · 5–7 traps · click to place · right-click to sell (½ price)';
    }
    this.ctx.fillText(hint, this.canvas.width / 2 - 200, 22);
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
    ctx.fillText('Press R to play again', this.canvas.width / 2, this.canvas.height / 2 + 60);
    ctx.textAlign = 'left';
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────
const game = new Game(document.getElementById('game'));
function loop() { game.update(); game.draw(); requestAnimationFrame(loop); }
loop();
