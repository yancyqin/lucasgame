import { ENEMIES, distance } from './constants.js';
import { Projectile } from './Projectile.js';

// A single enemy walking the path.
// Each enemy knows how to move, attack (runners/dragons), and draw itself.
export class Enemy {
  constructor(kind, spawnX, spawnY) {
    // Copy all config values (color, speed, hp, size, reward, castleDamage) from ENEMIES
    const cfg = ENEMIES[kind];
    Object.assign(this, cfg);
    this.x = spawnX;
    this.y = spawnY;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.waypoint = 1;   // index of the next corner to walk toward
    this.slowTimer = 0;  // frames remaining of slow effect
    this.hitTimer = 0;   // frames remaining of white flash when hit
    // Stagger timers so not all enemies of the same type fire at once
    this.shootTimer = Math.floor(Math.random() * 120); // runners only
    this.fireTimer  = Math.floor(Math.random() * 120); // dragons only
  }

  // Move one step and trigger any special attacks.
  update(path, towers, projectiles) {
    const spd = this.slowTimer > 0 ? this.speed * 0.35 : this.speed;
    if (this.slowTimer > 0) this.slowTimer--;
    if (this.hitTimer  > 0) this.hitTimer--;

    const target = path[this.waypoint];
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < spd) { this.waypoint++; }
      else { this.x += (dx / d) * spd; this.y += (dy / d) * spd; }
    }

    this._runnerShoot(towers, projectiles);
    this._dragonBreath(path, projectiles);
  }

  // Encapsulation: callers don't need to know what a "hit" does internally
  takeDamage(amt) { this.hp -= amt; this.hitTimer = 8; }
  isDead()        { return this.hp <= 0; }
  hasReachedEnd(path) { return this.waypoint >= path.length; }

  draw(ctx, path) {
    const wp = path[Math.min(this.waypoint, path.length - 1)];
    const facing = Math.atan2(wp.y - this.y, wp.x - this.x);

    // Dragon wings drawn first so the body appears in front of them
    if (this.kind === 'dragon' || this.kind === 'dragonRider') {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);
      ctx.fillStyle = this.kind === 'dragonRider' ? '#5a0000' : '#1a6b30';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-this.size, -this.size * 1.6, -this.size * 2.2, -this.size * 0.4, -this.size * 2, this.size * 0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-this.size, this.size * 1.6, -this.size * 2.2, this.size * 0.4, -this.size * 2, -this.size * 0.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Body circle — flashes white when hit, purple when slowed
    ctx.fillStyle = this.hitTimer > 0 ? '#fff' : this.slowTimer > 0 ? '#bb66ff' : this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.stroke();

    if (this.hitTimer === 0) this._drawFace(ctx, facing);

    // Weapons (dragons ARE the weapon, so skip them)
    if (this.kind !== 'dragon' && this.kind !== 'dragonRider') {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);
      this._drawWeapon(ctx);
      ctx.restore();
    }

    // HP bar above the enemy
    const bw = this.size * 2.5, bh = 5, bx = this.x - bw / 2, by = this.y - this.size - 12;
    ctx.fillStyle = '#222'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#0f0' : '#f80';
    ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
  }

  // --- Private attack methods ---

  _runnerShoot(towers, projectiles) {
    if (this.kind !== 'runner') return;
    this.shootTimer--;
    if (this.shootTimer > 0) return;
    // Prefer farthest tower in range — targets backline snipers
    const tgt = towers
      .filter(t => distance(this, t) < 280 && distance(this, t) > 60)
      .sort((a, b) => distance(this, b) - distance(this, a))[0];
    if (tgt) {
      const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
      projectiles.push(new Projectile({ x: this.x, y: this.y, vx: (dx / d) * 4, vy: (dy / d) * 4, damage: 1, fromEnemy: true }));
    }
    this.shootTimer = 150 + Math.floor(Math.random() * 120);
  }

  _dragonBreath(path, projectiles) {
    if (this.kind !== 'dragon' && this.kind !== 'dragonRider') return;
    this.fireTimer--;
    if (this.fireTimer > 0) return;
    const wp = path[Math.min(this.waypoint, path.length - 1)];
    const ang = Math.atan2(wp.y - this.y, wp.x - this.x);
    // 3-shot spread cone forward
    for (let s = -1; s <= 1; s++) {
      const a = ang + s * 0.3;
      projectiles.push(new Projectile({
        x: this.x, y: this.y,
        vx: Math.cos(a) * 5, vy: Math.sin(a) * 5,
        damage: this.kind === 'dragonRider' ? 3 : 2,
        fromEnemy: true, fire: true,
      }));
    }
    this.fireTimer = 180 + Math.floor(Math.random() * 90);
  }

  // --- Private drawing helpers ---

  _drawFace(ctx, facing) {
    if (this.kind === 'ogre') {
      ctx.fillStyle = '#2a1005';
      ctx.beginPath(); ctx.moveTo(this.x - 8, this.y - this.size + 3); ctx.lineTo(this.x - 3, this.y - this.size - 10); ctx.lineTo(this.x + 1, this.y - this.size + 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(this.x - 1, this.y - this.size + 3); ctx.lineTo(this.x + 4, this.y - this.size - 10); ctx.lineTo(this.x + 9, this.y - this.size + 3); ctx.fill();
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);
      ctx.fillStyle = '#ff6600';
      ctx.beginPath(); ctx.arc(this.size * 0.45, -5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(this.size * 0.45,  5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(this.size * 0.45 + 1.5, -5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(this.size * 0.45 + 1.5,  5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (this.kind === 'dragon' || this.kind === 'dragonRider') {
      ctx.fillStyle = this.kind === 'dragonRider' ? '#3a0000' : '#0d4020';
      ctx.beginPath(); ctx.moveTo(this.x - 6, this.y - this.size + 2); ctx.lineTo(this.x - 9, this.y - this.size - 14); ctx.lineTo(this.x - 2, this.y - this.size + 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(this.x + 2, this.y - this.size + 2); ctx.lineTo(this.x + 9, this.y - this.size - 14); ctx.lineTo(this.x + 6, this.y - this.size + 2); ctx.fill();
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);
      ctx.fillStyle = '#ffe000';
      ctx.beginPath(); ctx.arc(this.size * 0.55, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(this.size * 0.55 - 1.5, -4, 3, 8);
      ctx.fillStyle = this.kind === 'dragonRider' ? '#5a0000' : '#1a6b30';
      ctx.beginPath(); ctx.moveTo(-this.size, -4); ctx.lineTo(-this.size - 18, 0); ctx.lineTo(-this.size, 4); ctx.fill();
      ctx.restore();
      if (this.kind === 'dragonRider') {
        ctx.save(); ctx.translate(this.x, this.y - this.size - 4);
        ctx.fillStyle = '#777'; ctx.fillRect(-4, -12, 8, 10);
        ctx.fillStyle = '#999'; ctx.fillRect(-5, -14, 10, 4);
        ctx.fillStyle = '#aaa';
        ctx.beginPath(); ctx.arc(0, -17, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#555'; ctx.fillRect(-1, -16, 2, 5);
        ctx.rotate(facing);
        ctx.fillStyle = '#8b5e2a'; ctx.fillRect(0, -2, this.size + 18, 4);
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(this.size + 18, -4); ctx.lineTo(this.size + 28, 0); ctx.lineTo(this.size + 18, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    } else {
      // Goblin / Runner: white eyes with black pupils
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);
      const ex = this.size * 0.48, ey = this.size * 0.38;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, -ey, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex,  ey, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(ex + 0.8, -ey, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 0.8,  ey, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  _drawWeapon(ctx) {
    if (this.kind === 'ogre') {
      ctx.rotate(-0.4);
      ctx.fillStyle = '#3d1f08'; ctx.fillRect(-3, -this.size - 16, 6, this.size * 0.55);
      ctx.fillStyle = '#2a1005';
      ctx.beginPath(); ctx.arc(0, -this.size - 16, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#777';
      ctx.beginPath(); ctx.arc(-2, -this.size - 19, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3,  -this.size - 14, 2,   0, Math.PI * 2); ctx.fill();
    } else if (this.kind === 'runner') {
      ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-2, -this.size * 0.85); ctx.quadraticCurveTo(8, 0, -2, this.size * 0.85); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-2, -this.size * 0.85); ctx.lineTo(-2, this.size * 0.85); ctx.stroke();
      ctx.lineCap = 'butt';
    } else {
      // Goblin sword
      ctx.fillStyle = '#8b5e2a'; ctx.fillRect(this.size * 0.4, -4, 4, 7);
      ctx.fillStyle = '#aaa';    ctx.fillRect(this.size * 0.3, -5, 7, 3);
      ctx.fillStyle = '#ddd';    ctx.fillRect(this.size * 0.45, -this.size - 4, 3, this.size * 0.7);
    }
  }
}
