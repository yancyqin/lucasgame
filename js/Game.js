import { TYPES, PATH, MAX_MONEY, distance } from './constants.js';
import { GameMap }     from './Map.js';
import { Tower }       from './Tower.js';
import { Enemy }       from './Enemy.js';
import { Projectile }  from './Projectile.js';
import { WaveManager } from './WaveManager.js';

// Game is the orchestrator.
// It owns all live state (towers, enemies, projectiles, money, lives…)
// and coordinates between all the other classes each frame.
// Composition: Game has-a GameMap, has-a WaveManager, has-many Towers, Enemies, Projectiles.
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Sub-systems — each has a single responsibility
    this.map         = new GameMap();
    this.waveManager = new WaveManager();

    // Live arrays — grow and shrink every frame
    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];

    // Economy & game state
    this.lives    = 100;
    this.money    = 50;
    this.score    = 0;
    this.gameOver = false;

    // UI state
    this.selectedTower = null;
    this.flashMsg  = '';
    this.flashTimer = 0;
    this.mouse     = { x: 0, y: 0 };
    this.selectedType = 'basic';
    this.typeKeys  = Object.keys(TYPES);

    this._buildUI();
    this._setupInput();
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update() {
    if (this.gameOver) return;
    if (this.flashTimer > 0) this.flashTimer--;

    // Ask the wave manager what to do this frame
    const waveResult = this.waveManager.update(this.enemies.length);
    if (typeof waveResult === 'string') {
      this.enemies.push(new Enemy(waveResult, PATH[0].x, PATH[0].y));
    } else if (waveResult?.waveCleared) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      this._updateButtons();
    }

    // No combat during the break between waves
    if (this.waveManager.inBreak) return;

    // Move enemies and trigger their special attacks
    for (const e of this.enemies) e.update(PATH, this.towers, this.projectiles);

    // Remove enemies that reached the castle — subtract lives based on strength
    this.enemies = this.enemies.filter(e => {
      if (e.hasReachedEnd(PATH)) {
        this.lives -= e.castleDamage;
        if (this.lives <= 0) this.gameOver = true;
        return false;
      }
      return true;
    });

    // Auto-shooting towers (the manually selected tower is controlled by the player)
    for (const t of this.towers) {
      if (t === this.selectedTower) {
        if (t.manualCooldown > 0) t.manualCooldown--;
        continue;
      }
      t.update(this.enemies, this.projectiles);
    }

    // Move all projectiles and resolve hits
    for (const p of this.projectiles) p.update(this.enemies, this.towers);
    this.projectiles = this.projectiles.filter(p => !p.isDead());

    // Enemies walking close to a tower chip away at its HP
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

    // Remove dead enemies and award gold
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

    // Draw order matters: world → towers → aim line → enemies → projectiles → HUD → overlays
    this.map.draw(this.ctx);
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

  // ── Public actions (called from input handlers) ──────────────────────────────

  // Place a new tower at (x, y). Returns false and flashes a message if blocked.
  tryPlaceTower(x, y) {
    if (this.map.isOnPath(x, y)) { this.flash("Can't build on the path!"); return false; }
    const type = TYPES[this.selectedType];
    if (this.money < type.cost) { this.flash(`Need $${type.cost} — you have $${this.money}!`); return false; }
    this.towers.push(new Tower(x, y, this.selectedType));
    this.money -= type.cost;
    this._updateButtons();
    return true;
  }

  // Click on a tower to select/deselect it for manual control.
  trySelectTower(x, y) {
    const clicked = this.towers.find(t => distance(t, { x, y }) < 20);
    if (!clicked) return false;
    this.selectedTower = this.selectedTower === clicked ? null : clicked;
    return true;
  }

  // Fire a powerful manual shot from the selected tower toward (x, y).
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

  flash(msg) { this.flashMsg = msg; this.flashTimer = 120; }

  restart() {
    this.towers = []; this.enemies = []; this.projectiles = [];
    this.lives = 100; this.money = 50; this.score = 0;
    this.gameOver = false; this.flashMsg = ''; this.flashTimer = 0;
    this.selectedTower = null;
    this.waveManager.reset();
    this._updateButtons();
  }

  // ── Private UI & drawing helpers ─────────────────────────────────────────────

  _buildUI() {
    const ui = document.getElementById('ui');
    this.typeKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.id = 'btn-' + key;
      btn.className = 'btn' + (key === this.selectedType ? ' selected' : '');
      btn.textContent = TYPES[key].label;
      btn.style.background = TYPES[key].color;
      btn.onclick = () => this._selectType(key);
      ui.appendChild(btn);
    });
  }

  _selectType(key) {
    this.selectedType = key;
    this.typeKeys.forEach(k => {
      document.getElementById('btn-' + k).className = 'btn' + (k === key ? ' selected' : '');
    });
  }

  _updateButtons() {
    this.typeKeys.forEach(k => {
      document.getElementById('btn-' + k).style.opacity = this.money >= TYPES[k].cost ? '0.9' : '0.35';
    });
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
      this.tryPlaceTower(x, y);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'r' || e.key === 'R') { this.restart(); return; }
      if (e.key === 'Escape') { this.selectedTower = null; return; }
      const i = parseInt(e.key) - 1;
      if (i >= 0 && i < this.typeKeys.length) this._selectType(this.typeKeys[i]);
    });
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
    ctx.fillText('Goblins  •  Runners  •  Ogres  •  Dragons (wave 7)  •  Dragon Riders (wave 10)', this.canvas.width / 2, this.canvas.height / 2 + 55);
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
    const hint = this.selectedTower
      ? 'Click to shoot · click tower again or Esc to release'
      : '1-4 select type · click to place · click tower to control';
    this.ctx.fillText(hint, this.canvas.width / 2 - 160, 22);
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
// Create one Game instance and start the loop.
// loop() calls itself ~60 times per second via requestAnimationFrame.
const game = new Game(document.getElementById('game'));
function loop() { game.update(); game.draw(); requestAnimationFrame(loop); }
loop();
