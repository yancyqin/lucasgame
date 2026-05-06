import { TRAPS } from './constants.js';

// Trap is placed on the road (spike/tar) or beside it (wall).
// Composition: Game has-many Traps, just like it has-many Towers.
export class Trap {
  constructor(x, y, typeKey) {
    const cfg = TRAPS[typeKey];
    Object.assign(this, cfg);
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    this.cooldownTimer = 0;
  }

  update(enemies) {
    if (this.typeKey === 'spike') {
      if (this.cooldownTimer > 0) { this.cooldownTimer--; return; }
      let hit = false;
      for (const e of enemies) {
        if (Math.hypot(e.x - this.x, e.y - this.y) < this.radius) {
          e.takeDamage(this.damage);
          hit = true;
        }
      }
      if (hit) this.cooldownTimer = this.cooldown;
    } else if (this.typeKey === 'tar') {
      for (const e of enemies) {
        if (Math.hypot(e.x - this.x, e.y - this.y) < this.radius) {
          e.slowTimer = Math.max(e.slowTimer, 30); // keep refreshed while on tar
        }
      }
    } else if (this.typeKey === 'wall') {
      // Thorns: chip damage to any enemy that strays close
      for (const e of enemies) {
        if (Math.hypot(e.x - this.x, e.y - this.y) < this.radius) {
          e.takeDamage(0.025);
        }
      }
    }
  }

  takeDamage(amt) { if (this.hp != null) this.hp -= amt; }
  isDead()        { return this.hp != null && this.hp <= 0; }

  draw(ctx) {
    if      (this.typeKey === 'spike') this._drawSpike(ctx);
    else if (this.typeKey === 'tar')   this._drawTar(ctx);
    else                               this._drawWall(ctx);
  }

  _drawSpike(ctx) {
    const active = this.cooldownTimer === 0;

    // Metal base plate with rivets
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(this.x - 18, this.y - 8, 36, 16);
    ctx.fillStyle = '#666';
    ctx.fillRect(this.x - 16, this.y - 6, 32, 12);
    ctx.fillStyle = '#888';
    for (const rx of [-14, 14]) {
      ctx.beginPath(); ctx.arc(this.x + rx, this.y, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Three spikes — raised when active, flat when reloading
    const tipOffset = active ? -10 : -1;
    ctx.fillStyle = active ? '#ddd' : '#555';
    for (const dx of [-9, 0, 9]) {
      const px = this.x + dx;
      ctx.beginPath();
      ctx.moveTo(px - 4, this.y + 3);
      ctx.lineTo(px,     this.y + tipOffset);
      ctx.lineTo(px + 4, this.y + 3);
      ctx.closePath(); ctx.fill();
      if (active) {
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(px - 1, this.y + 2); ctx.lineTo(px - 1, this.y + tipOffset + 3); ctx.stroke();
      }
    }

    // Reload arc indicator
    if (!active) {
      const p = 1 - this.cooldownTimer / this.cooldown;
      ctx.strokeStyle = '#f84'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
      ctx.stroke();
    }
  }

  _drawTar(ctx) {
    // Oval tar pool
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(1.45, 0.62);
    ctx.fillStyle = '#1a1a06';
    ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#282810';
    ctx.beginPath(); ctx.arc(-5, -3, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#353518';
    ctx.beginPath(); ctx.arc(-7, -4, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#424220';
    ctx.beginPath(); ctx.arc(-9, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Tar bubbles
    ctx.fillStyle = '#303010';
    ctx.beginPath(); ctx.arc(this.x + 8,  this.y - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x - 10, this.y + 5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + 2,  this.y + 6, 2,   0, Math.PI * 2); ctx.fill();
    // Label
    ctx.fillStyle = 'rgba(180,180,50,0.6)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('TAR', this.x, this.y - 14); ctx.textAlign = 'left';
  }

  _drawWall(ctx) {
    const hpFrac = this.hp / this.maxHp;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(this.x - 19, this.y + 10, 38, 8);

    // Palisade posts
    ctx.fillStyle = '#4a2e0a';
    ctx.fillRect(this.x - 20, this.y - 24, 40, 35);
    ctx.fillStyle = '#6e4418';
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(this.x + i * 8 - 3, this.y - 24, 6, 35);
    }
    // Post highlights
    ctx.fillStyle = '#8a5820';
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(this.x + i * 8 - 1, this.y - 22, 2, 30);
    }

    // Top spikes on each post
    ctx.fillStyle = '#3a2008';
    for (let i = -2; i <= 2; i++) {
      const px = this.x + i * 8;
      ctx.beginPath();
      ctx.moveTo(px - 3, this.y - 24);
      ctx.lineTo(px,     this.y - 34);
      ctx.lineTo(px + 3, this.y - 24);
      ctx.closePath(); ctx.fill();
    }

    // Horizontal rope / binding
    ctx.fillStyle = '#8b6030'; ctx.fillRect(this.x - 20, this.y - 14, 40, 4);
    ctx.fillStyle = '#6a4820'; ctx.fillRect(this.x - 20, this.y + 2,  40, 4);

    // HP bar
    ctx.fillStyle = '#222'; ctx.fillRect(this.x - 19, this.y + 13, 38, 5);
    ctx.fillStyle = hpFrac > 0.5 ? '#0f0' : hpFrac > 0.25 ? '#f80' : '#f00';
    ctx.fillRect(this.x - 19, this.y + 13, 38 * hpFrac, 5);
  }
}
