import { ENEMIES, distance } from './constants.js';
import { Projectile } from './Projectile.js';

export class Enemy {
  constructor(kind, spawnX, spawnY) {
    const cfg = ENEMIES[kind];
    Object.assign(this, cfg);
    this.x = spawnX;
    this.y = spawnY;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.waypoint = 1;
    this.slowTimer = 0;
    this.hitTimer = 0;
    this.shootTimer = Math.floor(Math.random() * 120);
    this.fireTimer  = Math.floor(Math.random() * 120);
  }

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

  takeDamage(amt) { this.hp -= amt; this.hitTimer = 8; }
  isDead()        { return this.hp <= 0; }
  hasReachedEnd(path) { return this.waypoint >= path.length; }

  draw(ctx, path) {
    const wp = path[Math.min(this.waypoint, path.length - 1)];
    const facing = Math.atan2(wp.y - this.y, wp.x - this.x);
    const bc = this.hitTimer > 0 ? '#fff' : this.slowTimer > 0 ? '#bb66ff' : this.color;

    if (this.kind === 'dragon' || this.kind === 'dragonRider') {
      this._drawDragon(ctx, facing, bc);
    } else {
      this._drawKnight(ctx, facing, bc);
    }

    // HP bar
    const s = this.size;
    const bw = s * 2.5, bh = 5, bx = this.x - bw / 2;
    const isDragon = this.kind === 'dragon' || this.kind === 'dragonRider';
    const by = isDragon ? this.y - s - 12 : this.y - s * 1.15 - 16;
    ctx.fillStyle = '#222'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#0f0' : '#f80';
    ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
  }

  // ── Private attack helpers ────────────────────────────────────────────────

  _runnerShoot(towers, projectiles) {
    if (this.kind !== 'runner') return;
    this.shootTimer--;
    if (this.shootTimer > 0) return;
    const tgt = towers
      .filter(t => distance(this, t) < 280 && distance(this, t) > 60)
      .sort((a, b) => distance(this, b) - distance(this, a))[0];
    if (tgt) {
      const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
      projectiles.push(new Projectile({ x: this.x, y: this.y, vx: (dx/d)*4, vy: (dy/d)*4, damage: 1, fromEnemy: true }));
    }
    this.shootTimer = 150 + Math.floor(Math.random() * 120);
  }

  _dragonBreath(path, projectiles) {
    if (this.kind !== 'dragon' && this.kind !== 'dragonRider') return;
    this.fireTimer--;
    if (this.fireTimer > 0) return;
    const wp = path[Math.min(this.waypoint, path.length - 1)];
    const ang = Math.atan2(wp.y - this.y, wp.x - this.x);
    for (let sp = -1; sp <= 1; sp++) {
      const a = ang + sp * 0.3;
      projectiles.push(new Projectile({ x: this.x, y: this.y, vx: Math.cos(a)*5, vy: Math.sin(a)*5, damage: this.kind === 'dragonRider' ? 3 : 2, fromEnemy: true, fire: true }));
    }
    this.fireTimer = 180 + Math.floor(Math.random() * 90);
  }

  // ── Drawing: knights ──────────────────────────────────────────────────────

  _drawKnight(ctx, facing, bc) {
    const s = this.size;
    const cx = this.x, cy = this.y;
    const hit    = this.hitTimer > 0;
    const slowed = this.slowTimer > 0;
    const phase  = Math.sin((cx + cy) * 0.22);

    // Geometry
    const headR   = s * 0.42;
    const headCY  = cy - s * 0.65;
    const torsoTop = headCY + headR + s * 0.05;
    const torsoH  = s * 0.90;
    const torsoW  = s * 0.88;
    const hipY    = torsoTop + torsoH;
    const thighH  = s * 0.75;
    const shinH   = s * 0.65;
    const legW    = Math.max(3, s * 0.30);
    const lSwing  = phase * s * 0.30;
    const rSwing  = -lSwing;
    const armW    = Math.max(2, s * 0.26);
    const uAL     = s * 0.58;
    const fAL     = s * 0.48;

    const legColor  = hit ? '#fff' : slowed ? '#bb66ff' : '#445566';
    const footColor = hit ? '#fff' : '#333';
    const armColor  = hit ? '#fff' : slowed ? '#bb66ff' : '#7a8a9a';
    const skinColor = hit ? '#fff' : '#e8b890';

    // LEGS — left thigh → shin → foot, then right
    const lx = cx - legW * 0.75;
    ctx.fillStyle = legColor;
    ctx.fillRect(lx, hipY, legW, thighH);
    ctx.fillRect(lx + lSwing * 0.4, hipY + thighH, legW, shinH);
    ctx.fillStyle = footColor;
    ctx.fillRect(lx + lSwing * 0.4 - legW * 0.35, hipY + thighH + shinH - 2, legW * 1.65, legW * 0.65);

    const rx = cx + legW * 0.2;
    ctx.fillStyle = legColor;
    ctx.fillRect(rx, hipY, legW, thighH);
    ctx.fillRect(rx + rSwing * 0.4, hipY + thighH, legW, shinH);
    ctx.fillStyle = footColor;
    ctx.fillRect(rx + rSwing * 0.4 - legW * 0.35, hipY + thighH + shinH - 2, legW * 1.65, legW * 0.65);

    // SHIELD ARM — rotated away from target; carries a kite shield
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.18);
    ctx.rotate(facing + Math.PI * 0.70);
    ctx.fillStyle = armColor;
    ctx.fillRect(0, -armW / 2, uAL, armW);
    ctx.fillRect(uAL, -armW / 2, fAL * 0.75, armW);
    if (!hit && this.kind !== 'runner') {
      ctx.translate(uAL + fAL * 0.75, 0);
      // Kite shield
      ctx.fillStyle = '#8b3a10';
      ctx.beginPath();
      ctx.moveTo(-s*0.22, -s*0.42);
      ctx.lineTo(s*0.22, -s*0.42);
      ctx.lineTo(s*0.22, s*0.18);
      ctx.lineTo(0, s*0.46);
      ctx.lineTo(-s*0.22, s*0.18);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a2008'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-s*0.22, -s*0.42);
      ctx.lineTo(s*0.22, -s*0.42);
      ctx.lineTo(s*0.22, s*0.18);
      ctx.lineTo(0, s*0.46);
      ctx.lineTo(-s*0.22, s*0.18);
      ctx.closePath(); ctx.stroke();
      // Shield cross
      ctx.strokeStyle = '#cc2222'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -s*0.36); ctx.lineTo(0, s*0.32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.18, 0); ctx.lineTo(s*0.18, 0); ctx.stroke();
      // Boss
      ctx.fillStyle = '#bbb';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // TORSO — chest plate with groove, belt line, pauldrons
    ctx.fillStyle = bc;
    ctx.fillRect(cx - torsoW / 2, torsoTop, torsoW, torsoH);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - torsoW / 2, torsoTop, torsoW, torsoH);
    if (!hit && !slowed) {
      ctx.beginPath(); ctx.moveTo(cx, torsoTop + torsoH * 0.08); ctx.lineTo(cx, torsoTop + torsoH * 0.88); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - torsoW / 2 + 2, torsoTop + torsoH * 0.68); ctx.lineTo(cx + torsoW / 2 - 2, torsoTop + torsoH * 0.68); ctx.stroke();
    }
    ctx.fillStyle = armColor;
    ctx.beginPath(); ctx.arc(cx - torsoW / 2 + 1, torsoTop + 4, s * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + torsoW / 2 - 1, torsoTop + 4, s * 0.22, 0, Math.PI * 2); ctx.fill();

    // WEAPON ARM — arm extends toward target, weapon points forward at tip
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.18);
    ctx.rotate(facing);
    ctx.fillStyle = armColor;
    ctx.fillRect(0, -armW / 2, uAL, armW);
    ctx.fillRect(uAL, -armW / 2, fAL, armW);
    if (!hit) {
      ctx.translate(uAL + fAL, 0);
      if (this.kind === 'runner') {
        // Bow held vertically, arrow nocked pointing forward toward target
        ctx.save(); ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-2, -s * 0.82); ctx.quadraticCurveTo(10, 0, -2, s * 0.82); ctx.stroke();
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-2, -s * 0.82); ctx.lineTo(-2, s * 0.82); ctx.stroke();
        ctx.lineCap = 'butt'; ctx.restore();
        // Arrow pointing forward in arm direction
        ctx.strokeStyle = '#c8c880'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 1.2, 0); ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.moveTo(s*1.2, -3); ctx.lineTo(s*1.2, 3); ctx.lineTo(s*1.5, 0); ctx.closePath(); ctx.fill();
      } else if (this.kind === 'ogre') {
        // Greatsword pointing forward — two-handed thrust
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, -s * 0.22, s * 1.85, s * 0.44);
        ctx.beginPath(); ctx.moveTo(s*1.85, -s*0.22); ctx.lineTo(s*1.85, s*0.22); ctx.lineTo(s*2.32, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#888'; ctx.fillRect(-s * 0.10, -s * 0.50, s * 0.20, s * 1.00);
        ctx.fillStyle = '#6b3a10'; ctx.fillRect(-s * 0.32, -s * 0.14, s * 0.32, s * 0.28);
      } else {
        // Sword pointing forward — charging knight pose
        ctx.fillStyle = '#ddd';
        ctx.fillRect(0, -s * 0.12, s * 1.12, s * 0.24);
        ctx.beginPath(); ctx.moveTo(s*1.12, -s*0.12); ctx.lineTo(s*1.12, s*0.12); ctx.lineTo(s*1.52, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#888'; ctx.fillRect(-s * 0.06, -s * 0.38, s * 0.12, s * 0.76);
        ctx.fillStyle = '#6b3a10'; ctx.fillRect(-s * 0.26, -s * 0.11, s * 0.26, s * 0.22);
      }
    }
    ctx.restore();

    // NECK + HEAD
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - s * 0.14, headCY + headR - 2, s * 0.28, s * 0.22);
    ctx.fillStyle = bc;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.stroke();

    if (!hit) this._drawHelmet(ctx, cx, headCY, headR, facing);
  }

  _drawHelmet(ctx, hx, hy, hr, facing) {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(facing);
    if (this.kind === 'ogre') {
      // Great helm — full-face box helmet
      ctx.fillStyle = '#445566';
      ctx.fillRect(hr * 0.12, -hr * 1.78, hr * 2.02, hr * 3.57);
      ctx.fillStyle = '#334455';
      ctx.fillRect(0, -hr * 1.95, hr * 2.26, hr * 0.36);
      ctx.fillStyle = '#e8b890';
      ctx.fillRect(hr * 0.45, -hr * 0.22, hr * 1.55, hr * 0.35);
      ctx.fillStyle = '#111';
      ctx.fillRect(hr * 0.43, -hr * 0.33, hr * 1.57, hr * 0.55);
      ctx.fillRect(hr * 0.95, -hr * 1.30, hr * 0.36, hr * 2.60);
    } else {
      // Spangenhelm (goblin / runner)
      ctx.fillStyle = '#8899aa';
      ctx.beginPath(); ctx.arc(0, 0, hr, -Math.PI * 0.5, Math.PI * 0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#556677'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, hr, -Math.PI * 0.5, Math.PI * 0.5); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#e8b890';
      ctx.fillRect(hr * 0.28, -hr * 0.46, hr * 0.52, hr * 0.92);
      ctx.fillStyle = '#667788';
      ctx.fillRect(hr * 0.25, -hr * 0.50, hr * 0.55, hr * 1.00);
      ctx.fillStyle = '#331100';
      ctx.beginPath(); ctx.arc(hr * 0.5, -hr * 0.2, Math.max(1.5, hr * 0.12), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hr * 0.5,  hr * 0.2, Math.max(1.5, hr * 0.12), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ── Drawing: dragons ─────────────────────────────────────────────────────

  _drawDragon(ctx, facing, bc) {
    const s = this.size;
    const dark = bc === '#fff' ? '#fff' : (this.kind === 'dragonRider' ? '#5a0000' : '#1a6b30');
    const mid  = bc === '#fff' ? '#fff' : (this.kind === 'dragonRider' ? '#7a0000' : '#2d8840');

    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);

    // Tail — thick stroke that curves behind body
    ctx.strokeStyle = bc; ctx.lineWidth = s * 0.48; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, 0);
    ctx.bezierCurveTo(-s * 1.4, s * 0.8, -s * 2.7, -s * 0.5, -s * 3.1, s * 0.2);
    ctx.stroke();
    ctx.lineWidth = 1; ctx.lineCap = 'butt';
    // Diamond tail spike
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-s * 2.75, s * 0.08);
    ctx.lineTo(-s * 3.52, -s * 0.24);
    ctx.lineTo(-s * 3.15, s * 0.40);
    ctx.closePath(); ctx.fill();

    // Body oval
    ctx.save(); ctx.scale(1.15, 0.72);
    ctx.fillStyle = bc;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.6 / 0.72;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Spine ridges along the back
    if (bc !== '#fff') {
      ctx.fillStyle = dark;
      for (let i = -2; i <= 2; i++) {
        const px = i * s * 0.38;
        ctx.beginPath();
        ctx.moveTo(px - s*0.10, -s*0.62);
        ctx.lineTo(px, -s*0.90);
        ctx.lineTo(px + s*0.10, -s*0.62);
        ctx.closePath(); ctx.fill();
      }
    }

    // Four legs — front pair near head (+x), back pair near tail (-x)
    // Each position: [body-x, foot-offset-x]
    const lc = dark, fc = bc === '#fff' ? '#fff' : '#1a1a1a';
    const lw = s * 0.22, lh = s * 0.50, sh = s * 0.36, fw = s * 0.44, fh = s * 0.15;
    [
      [-s * 0.65, -s * 0.04],   // back-outer
      [-s * 0.30,  s * 0.02],   // back-inner
      [ s * 0.28,  s * 0.02],   // front-inner
      [ s * 0.62, -s * 0.04],   // front-outer
    ].forEach(([lx, ox]) => {
      ctx.fillStyle = lc;
      ctx.fillRect(lx - lw / 2, s * 0.50, lw, lh);
      ctx.fillRect(lx - lw / 2 + ox, s * 0.50 + lh, lw, sh);
      ctx.fillStyle = fc;
      ctx.fillRect(lx - lw / 2 + ox - s * 0.10, s * 0.50 + lh + sh - s * 0.03, fw, fh);
    });

    // Wings — drawn AFTER body so root overlaps body edge (looks attached)
    // In the rotated frame they extend in the -y direction (upward when facing right)
    ctx.fillStyle = dark; ctx.globalAlpha = 0.86;
    // Back wing (up and backward)
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 0.52);
    ctx.bezierCurveTo(-s * 0.55, -s * 1.88, -s * 2.18, -s * 2.48, -s * 2.68, -s * 1.30);
    ctx.bezierCurveTo(-s * 2.00, -s * 0.35, -s * 1.00, -s * 0.12, -s * 0.18, -s * 0.52);
    ctx.fill();
    // Back wing finger-bones
    ctx.strokeStyle = mid; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(-s*0.18, -s*0.52); ctx.lineTo(-s*2.68, -s*1.30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s*0.18, -s*0.52); ctx.lineTo(-s*1.92, -s*2.30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s*0.18, -s*0.52); ctx.lineTo(-s*0.88, -s*2.02); ctx.stroke();

    // Front wing (up and forward)
    ctx.globalAlpha = 0.86; ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(s * 0.32, -s * 0.50);
    ctx.bezierCurveTo(s * 0.72, -s * 1.85, s * 2.10, -s * 2.42, s * 2.58, -s * 1.22);
    ctx.bezierCurveTo(s * 1.88, -s * 0.28, s * 1.00, -s * 0.08, s * 0.32, -s * 0.50);
    ctx.fill();
    // Front wing finger-bones
    ctx.strokeStyle = mid; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(s*0.32, -s*0.50); ctx.lineTo(s*2.58, -s*1.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.32, -s*0.50); ctx.lineTo(s*1.85, -s*2.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.32, -s*0.50); ctx.lineTo(s*0.90, -s*1.98); ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Neck — filled quadratic curve
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.moveTo(s * 0.88, -s * 0.28);
    ctx.quadraticCurveTo(s * 1.55, -s * 0.68, s * 1.78, -s * 0.05);
    ctx.quadraticCurveTo(s * 1.55, s * 0.38, s * 0.88, s * 0.28);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s*0.88, -s*0.28); ctx.quadraticCurveTo(s*1.55, -s*0.68, s*1.78, -s*0.05); ctx.stroke();

    // Head (scale+arc instead of ellipse for browser compatibility)
    ctx.save();
    ctx.translate(s * 2.06, 0); ctx.rotate(-0.12); ctx.scale(s * 0.58, s * 0.44);
    ctx.fillStyle = bc;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5 / (s * 0.44);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Snout / lower jaw
    ctx.save();
    ctx.translate(s * 2.62, s * 0.07); ctx.rotate(0.22); ctx.scale(s * 0.34, s * 0.22);
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Nostrils
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s * 2.74, s * 0.02, s * 0.055, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 2.74, s * 0.16, s * 0.055, 0, Math.PI * 2); ctx.fill();

    // Eye with vertical slit pupil
    ctx.fillStyle = '#ffe000';
    ctx.beginPath(); ctx.arc(s * 1.90, -s * 0.18, s * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(s * 1.878, -s * 0.278, s * 0.052, s * 0.218);

    // Horns
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(s*1.82, -s*0.38); ctx.lineTo(s*1.62, -s*0.86); ctx.lineTo(s*1.96, -s*0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s*2.05, -s*0.36); ctx.lineTo(s*2.20, -s*0.86); ctx.lineTo(s*2.30, -s*0.34); ctx.closePath(); ctx.fill();

    ctx.restore();

    // Dragon Rider sitting on top — drawn in screen space so rider is upright
    if (this.kind === 'dragonRider') {
      ctx.save(); ctx.translate(this.x, this.y - s * 0.58); ctx.rotate(facing);
      // Rider body
      ctx.fillStyle = '#555'; ctx.fillRect(-5, -14, 10, 12);
      ctx.fillStyle = '#888'; ctx.fillRect(-6, -17, 12, 5);
      // Head + helmet
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.arc(0, -21, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.arc(0, -21, 5, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#777'; ctx.fillRect(-1, -18, 2, 5);
      // Lance pointing forward
      ctx.fillStyle = '#8b5e2a'; ctx.fillRect(0, -2, s + 22, 3);
      ctx.fillStyle = '#ccc';
      ctx.beginPath(); ctx.moveTo(s+22, -4); ctx.lineTo(s+34, 0); ctx.lineTo(s+22, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}
