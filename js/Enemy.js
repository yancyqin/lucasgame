import { ENEMIES, distance } from './constants.js?v=16';
import { Projectile } from './Projectile.js?v=16';

export class Enemy {
  constructor(kind, spawnX, spawnY, difficulty = 1) {
    const cfg = ENEMIES[kind];
    Object.assign(this, cfg);
    this.x = spawnX;
    this.y = spawnY;
    // Scale HP and speed with difficulty
    this.hp = Math.round(cfg.hp * difficulty);
    this.maxHp = this.hp;
    this.speed = cfg.speed * Math.min(1 + (difficulty - 1) * 0.25, 2.5);
    this.waypoint = 1;
    this.slowTimer = 0;
    this.stunTimer = 0;
    this.hitTimer = 0;
    this.burnTimer = 0;
    this.shockTimer = 0;
    this.shootTimer  = Math.floor(Math.random() * 120);
    this.fireTimer   = Math.floor(Math.random() * 120);
    this.saboteurTimer = 0;
    this.trapTarget = null;
    // Attack swing animation state
    this.attackTimer = 0;
    this.attackAngle = 0;
    this.barrTimer = 0;     // cooldown between barricade hits
    // Off-path tower aggro
    this.offPathTarget = null;
    // Gate siege state
    this.atGate = false;
    this.gateAttackTimer = 30;
    this.comboPhase = 0;
  }

  update(path, towers, projectiles, traps = []) {
    if (this.hitTimer   > 0) this.hitTimer--;
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.slowTimer  > 0) this.slowTimer--;
    if (this.stunTimer  > 0) { this.stunTimer--; return; }
    if (this.burnTimer > 0) { this.burnTimer--; this.hp -= 0.08; if (this.burnTimer % 20 === 0) this.hitTimer = 6; }
    if (this.shockTimer > 0) this.shockTimer--;

    // Siege mode: stop moving, attack the castle periodically
    if (this.atGate) {
      this.gateAttackTimer--;
      if (this.gateAttackTimer <= 0) {
        this.attackTimer = this.kind === 'dragonRider' ? 22 : 14;
        this.attackAngle = 0; // always facing east toward the gate
        if (this.kind === 'dragonRider') {
          this.comboPhase = (this.comboPhase + 1) % 2;
          this.gateAttackTimer = 45; // fast combo cycle
        } else {
          this.gateAttackTimer = 75 + Math.floor(Math.random() * 30);
        }
      }
      return;
    }

    const spd = this.slowTimer > 0 ? this.speed * 0.35 : this.speed;
    const target = path[this.waypoint];

    // Saboteur: seek and destroy any trap within detection radius
    if (this.kind === 'saboteur') {
      if (this.trapTarget && (this.trapTarget.isDead() || Math.hypot(this.trapTarget.x - this.x, this.trapTarget.y - this.y) > 150)) {
        this.trapTarget = null;
      }
      if (!this.trapTarget) {
        this.trapTarget = traps.find(t => !t.isDead() && Math.hypot(t.x - this.x, t.y - this.y) < 100);
      }
      if (this.trapTarget) {
        const td = Math.hypot(this.trapTarget.x - this.x, this.trapTarget.y - this.y);
        if (td > 28) {
          this.x += ((this.trapTarget.x - this.x) / td) * spd;
          this.y += ((this.trapTarget.y - this.y) / td) * spd;
        } else {
          this.triggerAttack(this.trapTarget.x, this.trapTarget.y);
          if (this.saboteurTimer <= 0) {
            this.trapTarget.takeDamage(60); // destroys most traps in 1-2 hits
            this.saboteurTimer = 60;
          } else {
            this.saboteurTimer--;
          }
        }
        return;
      }
    }

    // Barricade blocking the path — ALL enemies stop and pound it until it breaks
    if (this.barrTimer > 0) this.barrTimer--;
    if (target) {
      const fdx = target.x - this.x, fdy = target.y - this.y;
      const blocker = traps.find(t => {
        if (t.typeKey !== 'barricade' || t.isDead()) return false;
        if (Math.hypot(t.x - this.x, t.y - this.y) > t.radius + this.size + 6) return false;
        return (t.x - this.x) * fdx + (t.y - this.y) * fdy > 0;
      });
      if (blocker) {
        this.triggerAttack(blocker.x, blocker.y);
        if (this.barrTimer <= 0) {
          // Damage scales with enemy strength; barricade has 80 HP so goblins take ~40s alone
          const dmg = { goblin:2, runner:1, saboteur:8, ogre:6, dragon:10, dragonRider:12 }[this.kind] ?? 2;
          blocker.takeDamage(dmg);
          this.barrTimer = 50; // hit once every ~0.8 seconds
        }
        this._runnerShoot(towers, projectiles);
        return;
      }
    }

    // Off-path tower aggro
    if (!this.offPathTarget) {
      const near = towers.find(t => Math.hypot(t.x - this.x, t.y - this.y) < 80);
      if (near) this.offPathTarget = near;
    }
    if (this.offPathTarget) {
      const tgt = this.offPathTarget;
      if (tgt.isDead() || Math.hypot(tgt.x - this.x, tgt.y - this.y) > 130) {
        this.offPathTarget = null;
      } else {
        const dx = tgt.x - this.x, dy = tgt.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 38) { this.x += (dx / d) * spd; this.y += (dy / d) * spd; }
        else { this.triggerAttack(tgt.x, tgt.y); }
        this._runnerShoot(towers, projectiles);
        this._dragonBreath(path, projectiles);
        return;
      }
    }

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

  // Called by Game.js when this enemy is in melee range of a tower/trap
  triggerAttack(tx, ty) {
    if (this.attackTimer > 0) return; // don't restart mid-swing
    this.attackTimer = 14;
    this.attackAngle = Math.atan2(ty - this.y, tx - this.x);
  }

  draw(ctx, path) {
    const wp = path[Math.min(this.waypoint, path.length - 1)];
    const facing = Math.atan2(wp.y - this.y, wp.x - this.x);
    const bc = this.hitTimer > 0 ? '#fff' : this.slowTimer > 0 ? '#bb66ff' : this.color;

    if (this.kind === 'dragon' || this.kind === 'dragonRider') {
      this._drawDragon(ctx, facing, bc);
    } else if (this.kind === 'saboteur') {
      this._drawSaboteur(ctx, facing, bc);
    } else {
      this._drawKnight(ctx, facing, bc);
    }

    // Stun stars
    if (this.stunTimer > 0) {
      const s2 = this.size;
      for (let i = 0; i < 3; i++) {
        const a = (Date.now() / 200 + i * Math.PI * 2 / 3) % (Math.PI * 2);
        const sx = this.x + Math.cos(a) * (s2 + 6), sy = this.y - s2 - 16 + Math.sin(a) * 6;
        ctx.fillStyle = '#ffff44';
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('★', sx, sy);
      }
      ctx.textAlign = 'left';
    }

    // Shock visual
    if (this.shockTimer > 0) {
      ctx.strokeStyle = `rgba(255,255,80,${this.shockTimer/30})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = (Date.now()/100 + i*Math.PI/2) % (Math.PI*2);
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x+Math.cos(a)*(this.size+8), this.y+Math.sin(a)*(this.size+8)); ctx.stroke();
      }
    }

    // Burn visual
    if (this.burnTimer > 0) {
      const bp = Math.min(this.burnTimer/180, 1);
      ctx.strokeStyle = `rgba(255,100,0,${bp*0.7})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size+4, 0, Math.PI*2); ctx.stroke();
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

  // ── Drawing helpers ───────────────────────────────────────────────────────

  _swingArc(ctx, cx, cy, radius, color, width) {
    if (this.attackTimer <= 0) return;
    const p = this.attackTimer / 14;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.attackAngle);
    ctx.strokeStyle = color.replace(')', `,${p * 0.9})`).replace('rgb', 'rgba');
    ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, radius, -0.6, 0.6); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.restore();
  }

  // ── Drawing: knights ──────────────────────────────────────────────────────

  _drawKnight(ctx, facing, bc) {
    const s = this.size;
    const cx = this.x, cy = this.y;
    const hit    = this.hitTimer > 0;
    const slowed = this.slowTimer > 0;
    const phase  = Math.sin((cx + cy) * 0.22);

    const headR    = s * 0.42;
    const headCY   = cy - s * 0.65;
    const torsoTop = headCY + headR + s * 0.05;
    const torsoH   = s * 0.90;
    const torsoW   = s * 0.88;
    const hipY     = torsoTop + torsoH;
    const thighH   = s * 0.75;
    const shinH    = s * 0.65;
    const legW     = Math.max(3, s * 0.30);
    const lSwing   = phase * s * 0.30;
    const rSwing   = -lSwing;
    const armW     = Math.max(2, s * 0.26);
    const uAL      = s * 0.58;
    const fAL      = s * 0.48;

    const legColor  = hit ? '#fff' : slowed ? '#bb66ff' : '#445566';
    const footColor = hit ? '#fff' : '#333';
    const armColor  = hit ? '#fff' : slowed ? '#bb66ff' : '#7a8a9a';
    const skinColor = hit ? '#fff' : '#e8b890';

    // LEGS
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

    // SHIELD ARM
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.18);
    ctx.rotate(facing + Math.PI * 0.70);
    ctx.fillStyle = armColor;
    ctx.fillRect(0, -armW / 2, uAL, armW);
    ctx.fillRect(uAL, -armW / 2, fAL * 0.75, armW);
    if (!hit && this.kind !== 'runner') {
      ctx.translate(uAL + fAL * 0.75, 0);
      ctx.fillStyle = '#8b3a10';
      ctx.beginPath();
      ctx.moveTo(-s*0.22, -s*0.42); ctx.lineTo(s*0.22, -s*0.42);
      ctx.lineTo(s*0.22, s*0.18);   ctx.lineTo(0, s*0.46);
      ctx.lineTo(-s*0.22, s*0.18);  ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a2008'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-s*0.22, -s*0.42); ctx.lineTo(s*0.22, -s*0.42);
      ctx.lineTo(s*0.22, s*0.18);   ctx.lineTo(0, s*0.46);
      ctx.lineTo(-s*0.22, s*0.18);  ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = '#cc2222'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -s*0.36); ctx.lineTo(0, s*0.32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.18, 0); ctx.lineTo(s*0.18, 0); ctx.stroke();
      ctx.fillStyle = '#bbb';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // TORSO
    ctx.fillStyle = bc;
    ctx.fillRect(cx - torsoW / 2, torsoTop, torsoW, torsoH);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - torsoW / 2, torsoTop, torsoW, torsoH);
    if (!hit && !slowed) {
      ctx.beginPath(); ctx.moveTo(cx, torsoTop + torsoH * 0.08); ctx.lineTo(cx, torsoTop + torsoH * 0.88); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - torsoW/2 + 2, torsoTop + torsoH * 0.68); ctx.lineTo(cx + torsoW/2 - 2, torsoTop + torsoH * 0.68); ctx.stroke();
    }
    ctx.fillStyle = armColor;
    ctx.beginPath(); ctx.arc(cx - torsoW/2 + 1, torsoTop + 4, s * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + torsoW/2 - 1, torsoTop + 4, s * 0.22, 0, Math.PI * 2); ctx.fill();

    // WEAPON ARM — swings toward attackAngle when attacking, else faces forward
    let weaponFacing = facing;
    if (this.attackTimer > 0) {
      const t = 1 - this.attackTimer / 14;
      weaponFacing = this.attackAngle - 0.65 + t * 1.3;
    }
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.18);
    ctx.rotate(weaponFacing);
    ctx.fillStyle = armColor;
    ctx.fillRect(0, -armW / 2, uAL, armW);
    ctx.fillRect(uAL, -armW / 2, fAL, armW);
    if (!hit) {
      ctx.translate(uAL + fAL, 0);
      if (this.kind === 'runner') {
        ctx.save(); ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-2, -s*0.82); ctx.quadraticCurveTo(10, 0, -2, s*0.82); ctx.stroke();
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-2, -s*0.82); ctx.lineTo(-2, s*0.82); ctx.stroke();
        ctx.lineCap = 'butt'; ctx.restore();
        ctx.strokeStyle = '#c8c880'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 1.2, 0); ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.moveTo(s*1.2, -3); ctx.lineTo(s*1.2, 3); ctx.lineTo(s*1.5, 0); ctx.closePath(); ctx.fill();
      } else if (this.kind === 'ogre') {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, -s*0.22, s*1.85, s*0.44);
        ctx.beginPath(); ctx.moveTo(s*1.85,-s*0.22); ctx.lineTo(s*1.85,s*0.22); ctx.lineTo(s*2.32,0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#888'; ctx.fillRect(-s*0.10, -s*0.50, s*0.20, s*1.00);
        ctx.fillStyle = '#6b3a10'; ctx.fillRect(-s*0.32, -s*0.14, s*0.32, s*0.28);
      } else {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(0, -s*0.12, s*1.12, s*0.24);
        ctx.beginPath(); ctx.moveTo(s*1.12,-s*0.12); ctx.lineTo(s*1.12,s*0.12); ctx.lineTo(s*1.52,0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#888'; ctx.fillRect(-s*0.06, -s*0.38, s*0.12, s*0.76);
        ctx.fillStyle = '#6b3a10'; ctx.fillRect(-s*0.26, -s*0.11, s*0.26, s*0.22);
      }
    }
    ctx.restore();

    // NECK + HEAD
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - s*0.14, headCY + headR - 2, s*0.28, s*0.22);
    ctx.fillStyle = bc;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.stroke();

    if (!hit) this._drawHelmet(ctx, cx, headCY, headR, facing);

    // Sword swing arc
    if (this.attackTimer > 0) {
      const p = this.attackTimer / 14;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.attackAngle);
      ctx.strokeStyle = `rgba(255,240,160,${p * 0.88})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, s * 2.4, -0.58, 0.58); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${p * 0.45})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, s * 1.9, -0.38, 0.38); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.restore();
    }
  }

  _drawHelmet(ctx, hx, hy, hr, facing) {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(facing);
    if (this.kind === 'ogre') {
      ctx.fillStyle = '#445566';
      ctx.fillRect(hr*0.12, -hr*1.78, hr*2.02, hr*3.57);
      ctx.fillStyle = '#334455';
      ctx.fillRect(0, -hr*1.95, hr*2.26, hr*0.36);
      ctx.fillStyle = '#e8b890';
      ctx.fillRect(hr*0.45, -hr*0.22, hr*1.55, hr*0.35);
      ctx.fillStyle = '#111';
      ctx.fillRect(hr*0.43, -hr*0.33, hr*1.57, hr*0.55);
      ctx.fillRect(hr*0.95, -hr*1.30, hr*0.36, hr*2.60);
    } else {
      ctx.fillStyle = '#8899aa';
      ctx.beginPath(); ctx.arc(0, 0, hr, -Math.PI*0.5, Math.PI*0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#556677'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, hr, -Math.PI*0.5, Math.PI*0.5); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#e8b890';
      ctx.fillRect(hr*0.28, -hr*0.46, hr*0.52, hr*0.92);
      ctx.fillStyle = '#667788';
      ctx.fillRect(hr*0.25, -hr*0.50, hr*0.55, hr*1.00);
      ctx.fillStyle = '#331100';
      ctx.beginPath(); ctx.arc(hr*0.5, -hr*0.2, Math.max(1.5, hr*0.12), 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(hr*0.5,  hr*0.2, Math.max(1.5, hr*0.12), 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // ── Drawing: saboteur ────────────────────────────────────────────────────

  _drawSaboteur(ctx, facing, bc) {
    const s = this.size;
    const cx = this.x, cy = this.y;
    const hit    = this.hitTimer > 0;
    const slowed = this.slowTimer > 0;
    const phase  = Math.sin((cx + cy) * 0.22);

    const headR    = s * 0.38;
    const headCY   = cy - s * 0.55;
    const torsoTop = headCY + headR + s * 0.04;
    const torsoH   = s * 0.78;
    const torsoW   = s * 0.75;
    const hipY     = torsoTop + torsoH;
    const legW     = Math.max(2, s * 0.25);
    const thighH   = s * 0.68;
    const shinH    = s * 0.58;
    const lSwing   = phase * s * 0.25;
    const rSwing   = -lSwing;
    const armW     = Math.max(2, s * 0.22);
    const uAL      = s * 0.50;
    const fAL      = s * 0.42;

    const darkPurple = hit ? '#fff' : slowed ? '#bb66ff' : '#2a1535';
    const midPurple  = hit ? '#fff' : slowed ? '#cc77ff' : '#4a2565';
    const skinColor  = hit ? '#fff' : '#d0a070';

    // LEGS
    const lx = cx - legW * 0.75;
    ctx.fillStyle = darkPurple;
    ctx.fillRect(lx, hipY, legW, thighH);
    ctx.fillRect(lx + lSwing * 0.35, hipY + thighH, legW, shinH);
    ctx.fillStyle = '#111';
    ctx.fillRect(lx + lSwing * 0.35 - legW*0.3, hipY + thighH + shinH - 2, legW*1.5, legW*0.6);

    const rx = cx + legW * 0.2;
    ctx.fillStyle = darkPurple;
    ctx.fillRect(rx, hipY, legW, thighH);
    ctx.fillRect(rx + rSwing * 0.35, hipY + thighH, legW, shinH);
    ctx.fillStyle = '#111';
    ctx.fillRect(rx + rSwing * 0.35 - legW*0.3, hipY + thighH + shinH - 2, legW*1.5, legW*0.6);

    // TOOL ARM (crowbar for disabling)
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.16);
    ctx.rotate(facing + Math.PI * 0.65);
    ctx.fillStyle = midPurple;
    ctx.fillRect(0, -armW/2, uAL + fAL, armW);
    if (!hit) {
      ctx.translate(uAL + fAL, 0);
      ctx.fillStyle = '#999'; ctx.fillRect(0, -2, s*0.85, 4);
      ctx.fillStyle = '#777'; ctx.fillRect(s*0.85 - 2, -5, 5, 10);
      ctx.fillStyle = '#bbb'; ctx.fillRect(s*0.85, -3.5, 3, 7);
    }
    ctx.restore();

    // TORSO — slim cloak
    ctx.fillStyle = darkPurple;
    ctx.fillRect(cx - torsoW/2, torsoTop, torsoW, torsoH);
    ctx.fillStyle = midPurple;
    ctx.fillRect(cx - torsoW/2 + 1, torsoTop + 1, torsoW - 2, torsoH - 2);
    if (!hit && !slowed) {
      ctx.fillStyle = '#1a0a22';
      ctx.fillRect(cx - torsoW/2 + 2, torsoTop + torsoH*0.62, torsoW - 4, 3);
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(cx - 3, torsoTop + torsoH*0.62 - 1, 6, 5);
    }

    // DAGGER ARM — swings toward attackAngle during attack
    let daggerFacing = facing;
    if (this.attackTimer > 0) {
      const t = 1 - this.attackTimer / 14;
      daggerFacing = this.attackAngle - 0.55 + t * 1.1;
    }
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.16);
    ctx.rotate(daggerFacing);
    ctx.fillStyle = midPurple;
    ctx.fillRect(0, -armW/2, uAL + fAL, armW);
    if (!hit) {
      ctx.translate(uAL + fAL, 0);
      ctx.fillStyle = '#ccc'; ctx.fillRect(0, -s*0.09, s*0.78, s*0.18);
      ctx.beginPath(); ctx.moveTo(s*0.78,-s*0.09); ctx.lineTo(s*0.78,s*0.09); ctx.lineTo(s*1.08,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a4a18'; ctx.fillRect(-s*0.18, -s*0.09, s*0.18, s*0.18);
    }
    ctx.restore();

    // NECK + HEAD
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - s*0.12, headCY + headR - 2, s*0.24, s*0.18);
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI*2); ctx.fill();

    // Hood / cowl
    ctx.fillStyle = hit ? '#fff' : '#1a0a22';
    ctx.beginPath(); ctx.arc(cx, headCY, headR * 1.12, Math.PI*0.85, Math.PI*2.15); ctx.fill();
    ctx.fillStyle = hit ? '#eee' : '#110818';
    ctx.beginPath(); ctx.arc(cx, headCY, headR * 0.80, Math.PI, Math.PI*2); ctx.fill();
    // Lower face / chin showing
    ctx.fillStyle = hit ? '#fff' : '#c8a070';
    ctx.beginPath(); ctx.arc(cx, headCY + headR * 0.18, headR * 0.62, 0, Math.PI); ctx.fill();
    // Glowing purple eyes
    ctx.fillStyle = hit ? '#f00' : '#cc44ff';
    ctx.beginPath(); ctx.arc(cx - headR*0.28, headCY - headR*0.05, Math.max(1.2, headR*0.14), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + headR*0.28, headCY - headR*0.05, Math.max(1.2, headR*0.14), 0, Math.PI*2); ctx.fill();

    // Dagger swing (purple arc)
    if (this.attackTimer > 0) {
      const p = this.attackTimer / 14;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(this.attackAngle);
      ctx.strokeStyle = `rgba(180,100,255,${p * 0.9})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, s * 2.2, -0.55, 0.55); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.restore();
    }
  }

  // ── Drawing: dragons ─────────────────────────────────────────────────────

  _drawDragon(ctx, facing, bc) {
    const s = this.size;
    const dark = bc === '#fff' ? '#fff' : (this.kind === 'dragonRider' ? '#5a0000' : '#1a6b30');
    const mid  = bc === '#fff' ? '#fff' : (this.kind === 'dragonRider' ? '#7a0000' : '#2d8840');

    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);

    // Tail
    ctx.strokeStyle = bc; ctx.lineWidth = s * 0.48; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s*0.7, 0);
    ctx.bezierCurveTo(-s*1.4, s*0.8, -s*2.7, -s*0.5, -s*3.1, s*0.2);
    ctx.stroke();
    ctx.lineWidth = 1; ctx.lineCap = 'butt';
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(-s*2.75,s*0.08); ctx.lineTo(-s*3.52,-s*0.24); ctx.lineTo(-s*3.15,s*0.40); ctx.closePath(); ctx.fill();

    // Body
    ctx.save(); ctx.scale(1.15, 0.72);
    ctx.fillStyle = bc;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.6/0.72;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.stroke();
    ctx.restore();

    // Spine ridges
    if (bc !== '#fff') {
      ctx.fillStyle = dark;
      for (let i = -2; i <= 2; i++) {
        const px = i * s * 0.38;
        ctx.beginPath(); ctx.moveTo(px-s*0.10,-s*0.62); ctx.lineTo(px,-s*0.90); ctx.lineTo(px+s*0.10,-s*0.62); ctx.closePath(); ctx.fill();
      }
    }

    // Four legs
    const lc = dark, fc = bc === '#fff' ? '#fff' : '#1a1a1a';
    const lw = s*0.22, lh = s*0.50, sh = s*0.36, fw = s*0.44, fh = s*0.15;
    [[-s*0.65,-s*0.04],[-s*0.30,s*0.02],[s*0.28,s*0.02],[s*0.62,-s*0.04]].forEach(([lx,ox]) => {
      ctx.fillStyle = lc;
      ctx.fillRect(lx-lw/2, s*0.50, lw, lh);
      ctx.fillRect(lx-lw/2+ox, s*0.50+lh, lw, sh);
      ctx.fillStyle = fc;
      ctx.fillRect(lx-lw/2+ox-s*0.10, s*0.50+lh+sh-s*0.03, fw, fh);
    });

    // Wings (drawn after body so roots overlap)
    ctx.fillStyle = dark; ctx.globalAlpha = 0.86;
    ctx.beginPath();
    ctx.moveTo(-s*0.18,-s*0.52);
    ctx.bezierCurveTo(-s*0.55,-s*1.88,-s*2.18,-s*2.48,-s*2.68,-s*1.30);
    ctx.bezierCurveTo(-s*2.00,-s*0.35,-s*1.00,-s*0.12,-s*0.18,-s*0.52);
    ctx.fill();
    ctx.strokeStyle = mid; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(-s*0.18,-s*0.52); ctx.lineTo(-s*2.68,-s*1.30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s*0.18,-s*0.52); ctx.lineTo(-s*1.92,-s*2.30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s*0.18,-s*0.52); ctx.lineTo(-s*0.88,-s*2.02); ctx.stroke();

    ctx.globalAlpha = 0.86; ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(s*0.32,-s*0.50);
    ctx.bezierCurveTo(s*0.72,-s*1.85,s*2.10,-s*2.42,s*2.58,-s*1.22);
    ctx.bezierCurveTo(s*1.88,-s*0.28,s*1.00,-s*0.08,s*0.32,-s*0.50);
    ctx.fill();
    ctx.strokeStyle = mid; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(s*0.32,-s*0.50); ctx.lineTo(s*2.58,-s*1.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.32,-s*0.50); ctx.lineTo(s*1.85,-s*2.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.32,-s*0.50); ctx.lineTo(s*0.90,-s*1.98); ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Neck
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.moveTo(s*0.88,-s*0.28); ctx.quadraticCurveTo(s*1.55,-s*0.68,s*1.78,-s*0.05);
    ctx.quadraticCurveTo(s*1.55,s*0.38,s*0.88,s*0.28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s*0.88,-s*0.28); ctx.quadraticCurveTo(s*1.55,-s*0.68,s*1.78,-s*0.05); ctx.stroke();

    // Head
    ctx.save();
    ctx.translate(s*2.06,0); ctx.rotate(-0.12); ctx.scale(s*0.58,s*0.44);
    ctx.fillStyle = bc;
    ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5/(s*0.44);
    ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.stroke();
    ctx.restore();

    // Snout
    ctx.save();
    ctx.translate(s*2.62,s*0.07); ctx.rotate(0.22); ctx.scale(s*0.34,s*0.22);
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s*2.74,s*0.02,s*0.055,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*2.74,s*0.16,s*0.055,0,Math.PI*2); ctx.fill();

    // Eye
    ctx.fillStyle = '#ffe000';
    ctx.beginPath(); ctx.arc(s*1.90,-s*0.18,s*0.15,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(s*1.878,-s*0.278,s*0.052,s*0.218);

    // Horns
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(s*1.82,-s*0.38); ctx.lineTo(s*1.62,-s*0.86); ctx.lineTo(s*1.96,-s*0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s*2.05,-s*0.36); ctx.lineTo(s*2.20,-s*0.86); ctx.lineTo(s*2.30,-s*0.34); ctx.closePath(); ctx.fill();

    // Claw swipe (only while moving, not during gate siege)
    if (this.attackTimer > 0 && !this.atGate) {
      const p = this.attackTimer / 14;
      ctx.save();
      ctx.translate(0, 0); ctx.rotate(this.attackAngle - facing);
      ctx.strokeStyle = `rgba(255,110,0,${p * 0.9})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, s * 1.85, -0.65, 0.65); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.restore();
    }

    // Gate combo phase 0: dragon breathes a massive fire cone toward the castle
    if (this.atGate && this.comboPhase === 0 && this.attackTimer > 0) {
      const p = this.attackTimer / 22;
      ctx.save(); ctx.translate(s * 2.7, 0);
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 40;
      ctx.fillStyle = `rgba(255, 80, 0, ${p * 0.82})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 1.4, -s * 1.4, s * 4.0, -s * 0.85, s * 4.8, 0);
      ctx.bezierCurveTo(s * 4.0, s * 0.85, s * 1.4, s * 1.4, 0, 0);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 230, 50, ${p * 0.65})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.9, -s * 0.55, s * 2.4, -s * 0.32, s * 3.0, 0);
      ctx.bezierCurveTo(s * 2.4, s * 0.32, s * 0.9, s * 0.55, 0, 0);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
    }

    ctx.restore();

    // Dragon Rider
    if (this.kind === 'dragonRider') {
      ctx.save(); ctx.translate(this.x, this.y - s*0.58); ctx.rotate(facing);

      // Torso / armour
      ctx.fillStyle = '#555'; ctx.fillRect(-5,-14,10,12);
      ctx.fillStyle = '#888'; ctx.fillRect(-6,-17,12,5);
      // Head + helmet
      ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(0,-21,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(0,-21,5,Math.PI,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#777'; ctx.fillRect(-1,-18,2,5);

      // Lance / sword arm
      ctx.fillStyle = '#888'; ctx.fillRect(-2,-8,4,10); // sword arm
      if (this.atGate && this.comboPhase === 1 && this.attackTimer > 0) {
        // Phase 1 combo: rider leaps up with a massive cleaving strike
        const p = this.attackTimer / 22;
        // Big glowing sword
        ctx.save(); ctx.translate(8, -10);
        ctx.fillStyle = `rgba(210,210,255,${p})`;
        ctx.fillRect(0, -s*0.15, s*2.2, s*0.30);
        ctx.beginPath(); ctx.moveTo(s*2.2,-s*0.15); ctx.lineTo(s*2.2,s*0.15); ctx.lineTo(s*2.7,0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8b5e2a'; ctx.fillRect(-s*0.28,-s*0.11,s*0.28,s*0.22);
        ctx.restore();
        // Bright arc sweep
        ctx.save(); ctx.translate(s * 1.4, -14);
        ctx.shadowColor = '#ffffaa'; ctx.shadowBlur = 28;
        ctx.strokeStyle = `rgba(255,250,160,${p * 0.95})`;
        ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, s * 2.6, -1.2, 0.55); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${p * 0.55})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, s * 2.6, -1.2, 0.55); ctx.stroke();
        ctx.shadowBlur = 0; ctx.lineCap = 'butt'; ctx.restore();
      } else {
        // Normal lance pointing forward
        ctx.fillStyle = '#8b5e2a'; ctx.fillRect(0,-2,s+22,3);
        ctx.fillStyle = '#ccc';
        ctx.beginPath(); ctx.moveTo(s+22,-4); ctx.lineTo(s+34,0); ctx.lineTo(s+22,4); ctx.closePath(); ctx.fill();
      }

      ctx.restore();
    }
  }
}
