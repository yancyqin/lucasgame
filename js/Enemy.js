import { ENEMIES, distance } from './constants.js?v=41';
import { Projectile } from './Projectile.js?v=41';

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
    // Soldier combat
    this.soldierTarget    = null;
    this.soldierAtkTimer  = 0;   // cooldown between hits on a soldier
    // Titan multi-attack system
    this.titanAtkCooldown = 200; // initial delay before first attack
    this.titanAtkCycle    = 0;   // 0=slash, 1=fireball, 2=shockwave
    this.titanJumpOffset  = 0;   // visual Y offset during jump
    this.titanJumpVel     = 0;
    this.titanShockwaveR  = 0;   // expanding ring radius (0 = inactive)
    this.titanRegenTimer  = 0;   // counts up to 240 (4 sec) then heals 10% max HP
    // Gate siege state
    this.atGate = false;
    this.gateAttackTimer = 30;
    this.comboPhase = 0;
  }

  update(path, towers, projectiles, traps = [], soldiers = []) {
    if (this.hitTimer   > 0) this.hitTimer--;
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.slowTimer  > 0) this.slowTimer--;
    if (this.stunTimer  > 0) { this.stunTimer--; return; }
    if (this.burnTimer > 0) { this.burnTimer--; this.hp -= 0.08; if (this.burnTimer % 20 === 0) this.hitTimer = 6; }
    if (this.shockTimer > 0) this.shockTimer--;

    // Titan: cycle through 3 special attacks (shared by elderDragonRider)
    if (this.kind === 'titan' || this.kind === 'elderDragonRider') {
      // ── Regen: 10% max HP every 4 seconds (240 frames) ──────────────────
      this.titanRegenTimer++;
      if (this.titanRegenTimer >= 240) {
        this.titanRegenTimer = 0;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.10);
      }
      if (this.titanAtkCooldown > 0) this.titanAtkCooldown--;
      // Jump physics (shockwave attack)
      if (this.titanJumpOffset !== 0 || this.titanJumpVel !== 0) {
        this.titanJumpOffset -= this.titanJumpVel;
        this.titanJumpVel -= 0.8;
        if (this.titanJumpOffset >= 0) {
          // Landed — shockwave
          this.titanJumpOffset = 0; this.titanJumpVel = 0;
          this.titanShockwaveR = 1;
          const shockR = this.size * 4.5;
          let shockSteal = 0;
          for (const s of soldiers) {
            if (distance(this, s) < shockR) {
              s.takeDamage(90); shockSteal += 90 * 0.15;
              const dd = Math.hypot(s.x-this.x, s.y-this.y) || 1;
              s.stunTimer = 50; s.pushVx = ((s.x-this.x)/dd)*12; s.pushVy = ((s.y-this.y)/dd)*12;
            }
          }
          for (const t of towers) {
            if (distance(this, t) < shockR * 0.7) { t.takeDamage(120); shockSteal += 120 * 0.15; }
          }
          this.hp = Math.min(this.maxHp, this.hp + shockSteal);
        }
      }
      if (this.titanShockwaveR > 0) this.titanShockwaveR += 5;
      if (this.titanShockwaveR > this.size * 5) this.titanShockwaveR = 0;

      if (this.titanAtkCooldown <= 0) {
        this.titanAtkCooldown = this.kind === 'elderDragonRider' ? 300 : 380;
        const cycle = this.titanAtkCycle;
        this.titanAtkCycle = (this.titanAtkCycle + 1) % 3;

        if (this.kind === 'elderDragonRider') {
          // ══ ELDER DRAGON RIDER — 3 unique attacks ═══════════════════════
          if (cycle === 0) {
            // ── Attack 1: FIRESTORM — damages everything on screen ──────────
            // Hits ALL soldiers + ALL towers with massive fire damage
            let stealAmt = 0;
            for (const s of soldiers) {
              s.takeDamage(200); stealAmt += 200 * 0.15;
              const dd = Math.hypot(s.x-this.x, s.y-this.y) || 1;
              s.stunTimer = 70; s.pushVx = ((s.x-this.x)/dd)*18; s.pushVy = ((s.y-this.y)/dd)*18;
            }
            for (const t of towers) { t.takeDamage(150); stealAmt += 150 * 0.15; }
            this.hp = Math.min(this.maxHp, this.hp + stealAmt);
            this.attackTimer = 30;
            this.attackAngle = Math.atan2(path[Math.min(this.waypoint,path.length-1)].y-this.y, path[Math.min(this.waypoint,path.length-1)].x-this.x);
            // Firestorm visual: scatter 12 fireballs in all directions
            for (let i = 0; i < 12; i++) {
              const a = (i / 12) * Math.PI * 2;
              projectiles.push(new Projectile({ x: this.x, y: this.y, vx: Math.cos(a)*7, vy: Math.sin(a)*7, damage: 150, darkFireball: true }));
            }
          } else if (cycle === 1) {
            // ── Attack 2: WING SLAM — spread of 5 fireballs in a fan ───────
            const baseAng = Math.atan2(path[Math.min(this.waypoint,path.length-1)].y-this.y, path[Math.min(this.waypoint,path.length-1)].x-this.x);
            for (let i = -2; i <= 2; i++) {
              const a = baseAng + i * 0.3;
              projectiles.push(new Projectile({ x: this.x, y: this.y, vx: Math.cos(a)*9, vy: Math.sin(a)*9, damage: 280, darkFireball: true }));
            }
            this.attackTimer = 20; this.attackAngle = baseAng;
          } else {
            // ── Attack 3: INFERNO BREATH — instant fire cone along the path ─
            // Hits all soldiers and towers within a wide cone ahead
            const coneAng = Math.atan2(path[Math.min(this.waypoint,path.length-1)].y-this.y, path[Math.min(this.waypoint,path.length-1)].x-this.x);
            const coneR = this.size * 6;
            let stealAmt = 0;
            for (const s of soldiers) {
              const ang = Math.atan2(s.y-this.y, s.x-this.x);
              const diff = Math.abs(((ang - coneAng + Math.PI*3) % (Math.PI*2)) - Math.PI);
              if (diff < 0.9 && distance(this, s) < coneR) {
                s.takeDamage(350); stealAmt += 350 * 0.15;
                s.burnTimer = Math.max(s.burnTimer||0, 180);
                const dd = Math.hypot(s.x-this.x, s.y-this.y) || 1;
                s.stunTimer = 40; s.pushVx = ((s.x-this.x)/dd)*8; s.pushVy = ((s.y-this.y)/dd)*8;
              }
            }
            for (const t of towers) {
              const ang = Math.atan2(t.y-this.y, t.x-this.x);
              const diff = Math.abs(((ang - coneAng + Math.PI*3) % (Math.PI*2)) - Math.PI);
              if (diff < 0.9 && distance(this, t) < coneR) { t.takeDamage(200); stealAmt += 200 * 0.15; }
            }
            this.hp = Math.min(this.maxHp, this.hp + stealAmt);
            this.attackTimer = 25; this.attackAngle = coneAng;
            // Inferno visual: dense fireballs along the cone
            for (let i = -3; i <= 3; i++) {
              const a = coneAng + i * 0.18;
              for (let dist2 = 1; dist2 <= 3; dist2++) {
                projectiles.push(new Projectile({ x: this.x + Math.cos(a)*dist2*40, y: this.y + Math.sin(a)*dist2*40, vx: Math.cos(a)*5, vy: Math.sin(a)*5, damage: 0, darkFireball: true }));
              }
            }
          }
        } else {
          // ══ TITAN — original 3 attacks ══════════════════════════════════
          if (cycle === 0) {
            // ── Wide slash: hits soldiers AND nearby towers ──
            this.attackTimer = 18; this.attackAngle = Math.atan2(path[Math.min(this.waypoint, path.length-1)].y - this.y, path[Math.min(this.waypoint, path.length-1)].x - this.x);
            const slashR = this.size * 3.2;
            let slashSteal = 0;
            for (const s of soldiers) {
              if (distance(this, s) < slashR) {
                s.takeDamage(120);
                slashSteal += 120 * 0.15;
                const dd = Math.hypot(s.x-this.x, s.y-this.y) || 1;
                s.stunTimer = 45; s.pushVx = ((s.x-this.x)/dd)*10; s.pushVy = ((s.y-this.y)/dd)*10;
              }
            }
            for (const t of towers) {
              if (distance(this, t) < slashR) { t.takeDamage(80); slashSteal += 80 * 0.15; }
            }
            this.hp = Math.min(this.maxHp, this.hp + slashSteal);
          } else if (cycle === 1) {
            // ── Triple dark orbs: 3 spread toward nearest tower ──
            const tgt = towers.sort((a,b) => distance(this,a)-distance(this,b))[0];
            if (tgt) {
              const dx = tgt.x - this.x, dy = tgt.y - this.y;
              const dd = Math.hypot(dx, dy) || 1;
              const baseAng = Math.atan2(dy, dx);
              for (let oi = -1; oi <= 1; oi++) {
                const a = baseAng + oi * 0.28;
                projectiles.push(new Projectile({ x: this.x, y: this.y, vx: Math.cos(a)*6, vy: Math.sin(a)*6, damage: 180, darkFireball: true }));
              }
            }
          } else {
            // ── Shockwave jump: launch titan upward ──
            this.titanJumpVel = 18;
            this.titanJumpOffset = -1; // kick off physics
          }
        }
      }
    }

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
            this.trapTarget.takeDamage(5); // ~5 sec to destroy a trap (300 frames / 60 per hit)
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

    // Soldier combat — enemies stop and fight any soldier that gets in their way
    if (this.soldierAtkTimer > 0) this.soldierAtkTimer--;
    // Detection radius scales with enemy size so large enemies (titan) can reach soldiers
    const solDetectRange = Math.max(65, this.size + 10);
    // Drop stale soldier target (dead or too far away)
    if (this.soldierTarget && (this.soldierTarget.isDead() ||
        Math.hypot(this.soldierTarget.x - this.x, this.soldierTarget.y - this.y) > solDetectRange + 50)) {
      this.soldierTarget = null;
    }
    // Pick up a new nearby soldier target
    if (!this.soldierTarget) {
      this.soldierTarget = soldiers.find(s => !s.isDead() &&
        Math.hypot(s.x - this.x, s.y - this.y) < solDetectRange) || null;
    }
    if (this.soldierTarget) {
      const sx = this.soldierTarget.x, sy = this.soldierTarget.y;
      const d = Math.hypot(sx - this.x, sy - this.y);
      if (d > 28) {
        // Chase the soldier
        this.x += ((sx - this.x) / d) * spd;
        this.y += ((sy - this.y) / d) * spd;
      } else {
        // In melee range — swing and deal damage
        this.triggerAttack(sx, sy);
        if (this.soldierAtkTimer <= 0) {
          // Damage per enemy type — stronger enemies hit harder; titan swats like flies
          const dmg = { goblin:4, runner:3, saboteur:10, ogre:18, dragon:30, dragonRider:50, titan:120, elderDragonRider:150 }[this.kind] ?? 4;
          this.soldierTarget.takeDamage(dmg);
          // Titan scythe: stun + blast the soldier away + lifesteal
          if (this.kind === 'titan' || this.kind === 'elderDragonRider') {
            const dist = Math.hypot(sx - this.x, sy - this.y) || 1;
            this.soldierTarget.stunTimer = 55;
            this.soldierTarget.pushVx = ((sx - this.x) / dist) * 14;
            this.soldierTarget.pushVy = ((sy - this.y) / dist) * 14;
            // Lifesteal: 15% of damage dealt heals the titan
            this.hp = Math.min(this.maxHp, this.hp + dmg * 0.15);
          }
          this.soldierAtkTimer = 50;
        }
      }
      this._runnerShoot(towers, projectiles);
      return; // don't path-walk while fighting a soldier
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

    if (this.kind === 'elderDragonRider') {
      this._drawElderDragonRider(ctx, facing, bc);
    } else if (this.kind === 'titan') {
      this._drawTitan(ctx, facing, bc);
    } else if (this.kind === 'dragon' || this.kind === 'dragonRider') {
      this._drawDragon(ctx, facing, bc);
    } else if (this.kind === 'saboteur') {
      this._drawSaboteur(ctx, facing, bc);
    } else {
      this._drawKnight(ctx, facing, bc);
    }

    // Burn visual — flickering orange flame dots around enemy
    if (this.burnTimer > 0) {
      const bp = Math.min(this.burnTimer/180, 1);
      ctx.strokeStyle = `rgba(255,100,0,${bp*0.7})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size+4, 0, Math.PI*2); ctx.stroke();
      // Flame dots that flicker using Date.now()
      const ft = Date.now() / 80;
      for (let fi = 0; fi < 3; fi++) {
        const fa = ft + fi * Math.PI * 2 / 3;
        const fr = this.size + 3 + Math.sin(ft * 2 + fi) * 3;
        const fdx = Math.cos(fa) * fr, fdy = Math.sin(fa) * fr;
        const flicker = 0.6 + 0.4 * Math.sin(ft * 3 + fi * 1.5);
        ctx.fillStyle = `rgba(255,${Math.floor(80 + flicker*100)},0,${bp * flicker})`;
        ctx.beginPath(); ctx.arc(this.x + fdx, this.y + fdy - 4, 3 + flicker*2, 0, Math.PI*2); ctx.fill();
      }
    }

    // Slow/freeze — snowflake above head
    if (this.slowTimer > 0) {
      ctx.fillStyle = `rgba(140,200,255,${Math.min(1, this.slowTimer/60)})`;
      ctx.font = `bold ${Math.max(10, this.size)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('❄', this.x, this.y - this.size - 18);
      ctx.textAlign = 'left';
    }

    // Stun stars — spinning grey circles above head
    if (this.stunTimer > 0) {
      const s2 = this.size;
      for (let i = 0; i < 3; i++) {
        const a = (Date.now() / 200 + i * Math.PI * 2 / 3) % (Math.PI * 2);
        const sx = this.x + Math.cos(a) * (s2 + 6), sy = this.y - s2 - 16 + Math.sin(a) * 6;
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffff44';
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('★', sx, sy + 1);
      }
      ctx.textAlign = 'left';
    }

    // Shock visual — yellow zigzag lightning bolt near enemy
    if (this.shockTimer > 0) {
      const alpha = this.shockTimer/30;
      ctx.strokeStyle = `rgba(255,255,80,${alpha})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = (Date.now()/100 + i*Math.PI/2) % (Math.PI*2);
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x+Math.cos(a)*(this.size+8), this.y+Math.sin(a)*(this.size+8)); ctx.stroke();
      }
      // Zigzag bolt to the right side
      const bx = this.x + this.size + 4, by = this.y - this.size;
      ctx.strokeStyle = `rgba(255,240,0,${alpha * 0.9})`;
      ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 4, by + 5);
      ctx.lineTo(bx, by + 10);
      ctx.lineTo(bx + 5, by + 16);
      ctx.stroke();
      ctx.lineJoin = 'miter';
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
    this.attackTimer = 22;
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

  // ── Drawing: Ancient Titan ──────────────────────────────────────────────
  _drawTitan(ctx, facing, bc) {
    const s = this.size;          // s = 72 — very large
    const cx = this.x, cy = this.y + (this.titanJumpOffset || 0);
    const hit = this.hitTimer > 0;
    const t   = Date.now() / 1000;

    // Colour palette — dark void-purple with sickly green glow on hit
    const bodyCol  = hit ? '#ccffcc' : '#1a0a2e';
    const armorCol = hit ? '#ffffff' : '#2d1050';
    const skinCol  = hit ? '#ffffff' : '#3a1a5a';

    // Proportions — knight skeleton but bigger and heavier
    const headR    = s * 0.38;
    const headCY   = cy - s * 0.72;
    const torsoTop = headCY + headR + s * 0.04;
    const torsoH   = s * 1.05;
    const torsoW   = s * 1.00;
    const hipY     = torsoTop + torsoH;
    const legW     = s * 0.38;
    const thighH   = s * 0.80;
    const shinH    = s * 0.70;
    const phase    = Math.sin(t * 1.4) * s * 0.18;

    // ── DARK AURA ───────────────────────────────────────────────────────────
    const aura = 0.18 + 0.08 * Math.sin(t * 2.5);
    ctx.save();
    const ag = ctx.createRadialGradient(cx, cy, s * 0.2, cx, cy, s * 1.8);
    ag.addColorStop(0, `rgba(80,0,160,${aura})`);
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(cx, cy, s * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── LEGS ────────────────────────────────────────────────────────────────
    ctx.fillStyle = armorCol;
    const lx = cx - legW * 0.9;
    ctx.fillRect(lx, hipY, legW, thighH);
    ctx.fillRect(lx + phase * 0.3, hipY + thighH, legW, shinH);
    ctx.fillStyle = '#111';
    ctx.fillRect(lx + phase * 0.3 - legW * 0.3, hipY + thighH + shinH - 3, legW * 1.55, legW * 0.55);

    const rx = cx + legW * 0.5;
    ctx.fillStyle = armorCol;
    ctx.fillRect(rx, hipY, legW, thighH);
    ctx.fillRect(rx - phase * 0.3, hipY + thighH, legW, shinH);
    ctx.fillStyle = '#111';
    ctx.fillRect(rx - phase * 0.3 - legW * 0.3, hipY + thighH + shinH - 3, legW * 1.55, legW * 0.55);

    // ── TORSO ───────────────────────────────────────────────────────────────
    ctx.fillStyle = bodyCol;
    ctx.fillRect(cx - torsoW / 2, torsoTop, torsoW, torsoH);
    if (!hit) {
      // Ribcage lines
      ctx.strokeStyle = 'rgba(120,0,200,0.45)'; ctx.lineWidth = 2;
      for (let i = 1; i <= 4; i++) {
        const ry = torsoTop + torsoH * (i / 5);
        ctx.beginPath(); ctx.moveTo(cx - torsoW * 0.42, ry); ctx.lineTo(cx + torsoW * 0.42, ry); ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(80,0,160,0.6)'; ctx.lineWidth = 2;
    ctx.strokeRect(cx - torsoW / 2, torsoTop, torsoW, torsoH);

    // Shoulder pads
    ctx.fillStyle = armorCol;
    ctx.beginPath(); ctx.arc(cx - torsoW / 2, torsoTop + s * 0.12, s * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + torsoW / 2, torsoTop + s * 0.12, s * 0.28, 0, Math.PI * 2); ctx.fill();

    // ── CHAINS with skulls ───────────────────────────────────────────────────
    if (!hit) {
      ctx.save();
      // Three diagonal chains across torso
      const chainDefs = [
        { x1: cx - torsoW*0.48, y1: torsoTop + torsoH*0.1,  x2: cx + torsoW*0.48, y2: torsoTop + torsoH*0.45 },
        { x1: cx - torsoW*0.48, y1: torsoTop + torsoH*0.45, x2: cx + torsoW*0.48, y2: torsoTop + torsoH*0.8  },
        { x1: cx - torsoW*0.4,  y1: torsoTop + torsoH*0.75, x2: cx + torsoW*0.2,  y2: torsoTop + torsoH*0.15 },
      ];
      for (const ch of chainDefs) {
        const len = Math.hypot(ch.x2-ch.x1, ch.y2-ch.y1);
        const steps = Math.floor(len / (s * 0.28));
        const ang = Math.atan2(ch.y2-ch.y1, ch.x2-ch.x1);
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = s * 0.07;
        ctx.beginPath(); ctx.moveTo(ch.x1, ch.y1); ctx.lineTo(ch.x2, ch.y2); ctx.stroke();
        for (let i = 0; i <= steps; i++) {
          const t3 = i / steps;
          const lx2 = ch.x1 + (ch.x2-ch.x1)*t3;
          const ly2 = ch.y1 + (ch.y2-ch.y1)*t3;
          ctx.save(); ctx.translate(lx2, ly2); ctx.rotate(ang);
          ctx.strokeStyle = '#555'; ctx.lineWidth = s * 0.055;
          ctx.beginPath(); ctx.ellipse(0, 0, s*0.11, s*0.07, 0, 0, Math.PI*2); ctx.stroke();
          ctx.restore();
          // Every 3rd link is a skull
          if (i % 3 === 1) {
            ctx.save(); ctx.translate(lx2, ly2);
            const sk = s * 0.13;
            ctx.fillStyle = '#e8d8a0';
            ctx.beginPath(); ctx.arc(0, -sk*0.1, sk, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-sk*0.35, -sk*0.25, sk*0.28, sk*0.3);
            ctx.fillRect( sk*0.07, -sk*0.25, sk*0.28, sk*0.3);
            ctx.strokeStyle = '#c8b880'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(0, -sk*0.1, sk, 0, Math.PI*2); ctx.stroke();
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }

    // ── SCYTHE ARM ──────────────────────────────────────────────────────────
    let scytheFacing = facing;
    if (this.attackTimer > 0) {
      const p = 1 - this.attackTimer / 14;
      scytheFacing = this.attackAngle - 1.1 + p * 2.2;   // big wide swing arc
    }
    const armW = s * 0.28;
    const uAL  = s * 0.65;
    const fAL  = s * 0.55;

    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.22);
    ctx.rotate(scytheFacing);

    // Upper arm
    ctx.fillStyle = armorCol;
    ctx.fillRect(0, -armW / 2, uAL, armW);
    // Forearm
    ctx.fillRect(uAL, -armW / 2, fAL, armW);

    if (!hit) {
      ctx.translate(uAL + fAL, 0);

      // ── Scythe handle ────────────────────────────────────────────────────
      const hLen = s * 3.4;
      ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(hLen, -s * 0.15); ctx.stroke();
      // Handle wrap bands
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = s * 0.06;
      for (let i = 0; i < 4; i++) {
        const bx2 = (hLen / 5) * (i + 1);
        ctx.beginPath(); ctx.moveTo(bx2, -s * 0.18); ctx.lineTo(bx2, s * 0.18); ctx.stroke();
      }

      // ── Scythe blade (large crescent) ────────────────────────────────────
      ctx.translate(hLen, -s * 0.15);
      ctx.save();
      // Outer blade arc
      ctx.strokeStyle = hit ? '#fff' : '#ccc'; ctx.lineWidth = s * 0.22; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(-s * 0.5, 0, s * 1.05, -Math.PI * 0.72, Math.PI * 0.08); ctx.stroke();
      // Inner edge (darker, sharper)
      ctx.strokeStyle = hit ? '#aaffaa' : '#666'; ctx.lineWidth = s * 0.09;
      ctx.beginPath(); ctx.arc(-s * 0.5, 0, s * 0.78, -Math.PI * 0.68, Math.PI * 0.05); ctx.stroke();
      // Blade tip glow
      ctx.fillStyle = hit ? '#fff' : '#8800ff';
      ctx.beginPath(); ctx.arc(-s * 0.5, -s * 1.02, s * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.lineCap = 'butt';
    ctx.restore();

    // ── OFF HAND (left arm, no weapon) ──────────────────────────────────────
    ctx.save();
    ctx.translate(cx, torsoTop + s * 0.22);
    ctx.rotate(facing + Math.PI * 0.75);
    ctx.fillStyle = armorCol;
    ctx.fillRect(0, -armW / 2, uAL, armW);
    ctx.fillRect(uAL, -armW / 2, fAL * 0.7, armW);
    ctx.restore();

    // ── NECK + HEAD ──────────────────────────────────────────────────────────
    ctx.fillStyle = skinCol;
    ctx.fillRect(cx - s * 0.16, headCY + headR - 3, s * 0.32, s * 0.26);

    // Head
    ctx.fillStyle = bodyCol;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hit ? '#0f0' : 'rgba(120,0,200,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.stroke();

    if (!hit) {
      // Crown horns
      ctx.fillStyle = '#3d0070';
      const hornPts = [[-headR*0.55, -headR*0.6], [0, -headR*0.9], [headR*0.55, -headR*0.6]];
      for (const [hx, hy] of hornPts) {
        ctx.beginPath();
        ctx.moveTo(cx + hx - headR*0.18, headCY + hy + headR*0.5);
        ctx.lineTo(cx + hx, headCY + hy - headR*0.55);
        ctx.lineTo(cx + hx + headR*0.18, headCY + hy + headR*0.5);
        ctx.closePath(); ctx.fill();
      }
      // Eyes — glowing slits
      ctx.fillStyle = `rgba(180,0,255,${0.8 + 0.2 * Math.sin(t * 3)})`;
      ctx.fillRect(cx + headR*0.12, headCY - headR*0.18, headR*0.42, headR*0.22);
      ctx.fillRect(cx - headR*0.54, headCY - headR*0.18, headR*0.42, headR*0.22);
    }

    // ── SCYTHE SWING ARC ────────────────────────────────────────────────────
    if (this.attackTimer > 0) {
      const p = this.attackTimer / 14;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.attackAngle);
      ctx.strokeStyle = `rgba(160,0,255,${p * 0.9})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, s * 3.6, -1.0, 1.0); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${p * 0.35})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, s * 2.8, -0.8, 0.8); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.restore();
    }

    // Expanding shockwave ring on landing
    if (this.titanShockwaveR > 0) {
      const alpha = Math.max(0, 1 - this.titanShockwaveR / (this.size * 5));
      ctx.save();
      ctx.strokeStyle = `rgba(160,0,255,${alpha * 0.85})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, this.titanShockwaveR, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, this.titanShockwaveR * 0.7, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
  }

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

  // ── Drawing: Elder Dragon Rider ──────────────────────────────────────────
  _drawElderDragonRider(ctx, facing, bc) {
    const s = this.size;          // s = 88
    const hit = this.hitTimer > 0;
    const t = Date.now() / 1000;

    // Dark aura (larger than titan's)
    const aura = 0.22 + 0.1 * Math.sin(t * 2.2);
    ctx.save();
    const ag = ctx.createRadialGradient(this.x, this.y, s * 0.1, this.x, this.y, s * 2.2);
    ag.addColorStop(0, `rgba(0,80,200,${aura})`);
    ag.addColorStop(0.5, `rgba(80,0,160,${aura * 0.5})`);
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(this.x, this.y, s * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── Dragon body (scaled-up dragon, dark blue/black) ──────────────────────
    const dragonColor = hit ? '#ccccff' : '#0a0020';
    const dragonDark  = hit ? '#ffffff' : '#1a0040';
    const dragonMid   = hit ? '#ffffff' : '#2a0060';

    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(facing);

    // Tail
    ctx.strokeStyle = dragonColor; ctx.lineWidth = s * 0.42; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s*0.7, 0);
    ctx.bezierCurveTo(-s*1.4, s*0.8, -s*2.7, -s*0.5, -s*3.1, s*0.2);
    ctx.stroke();
    ctx.lineWidth = 1; ctx.lineCap = 'butt';
    ctx.fillStyle = dragonDark;
    ctx.beginPath(); ctx.moveTo(-s*2.75,s*0.08); ctx.lineTo(-s*3.52,-s*0.24); ctx.lineTo(-s*3.15,s*0.40); ctx.closePath(); ctx.fill();

    // Body
    ctx.save(); ctx.scale(1.15, 0.72);
    ctx.fillStyle = dragonColor;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,50,150,0.6)'; ctx.lineWidth = 2/0.72;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI*2); ctx.stroke();
    ctx.restore();

    // Spine ridges — purple tips
    if (!hit) {
      ctx.fillStyle = '#3a0070';
      for (let i = -2; i <= 2; i++) {
        const px2 = i * s * 0.27;
        ctx.beginPath(); ctx.moveTo(px2-s*0.08,-s*0.44); ctx.lineTo(px2,-s*0.66); ctx.lineTo(px2+s*0.08,-s*0.44); ctx.closePath(); ctx.fill();
      }
    }

    // Wings — dark blue with purple tips
    ctx.fillStyle = dragonDark; ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(-s*0.13,-s*0.36);
    ctx.bezierCurveTo(-s*0.40,-s*1.32,-s*1.55,-s*1.76,-s*1.92,-s*0.92);
    ctx.bezierCurveTo(-s*1.44,-s*0.25,-s*0.72,-s*0.09,-s*0.13,-s*0.36);
    ctx.fill();
    ctx.fillStyle = '#4400aa'; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(-s*1.4, -s*1.4, s*0.22, 0, Math.PI*2); ctx.fill();

    ctx.globalAlpha = 0.88; ctx.fillStyle = dragonDark;
    ctx.beginPath();
    ctx.moveTo(s*0.23,-s*0.36);
    ctx.bezierCurveTo(s*0.52,-s*1.30,s*1.52,-s*1.72,s*1.86,-s*0.88);
    ctx.bezierCurveTo(s*1.36,-s*0.20,s*0.72,-s*0.06,s*0.23,-s*0.36);
    ctx.fill();
    ctx.fillStyle = '#4400aa'; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(s*1.38, -s*1.36, s*0.22, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // Chains draped across body
    if (!hit) {
      ctx.save();
      const chainDefs2 = [
        { x1: -s*0.5, y1: -s*0.3, x2: s*0.5, y2: s*0.1 },
        { x1: -s*0.3, y1: s*0.1,  x2: s*0.6, y2: -s*0.2 },
      ];
      for (const ch of chainDefs2) {
        ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = s * 0.06;
        ctx.beginPath(); ctx.moveTo(ch.x1, ch.y1); ctx.lineTo(ch.x2, ch.y2); ctx.stroke();
        const len = Math.hypot(ch.x2-ch.x1, ch.y2-ch.y1);
        const steps = Math.floor(len / (s * 0.22));
        for (let i = 0; i <= steps; i++) {
          const t3 = i / steps;
          const lx2 = ch.x1 + (ch.x2-ch.x1)*t3;
          const ly2 = ch.y1 + (ch.y2-ch.y1)*t3;
          if (i % 3 === 1) {
            ctx.save(); ctx.translate(lx2, ly2);
            const sk = s * 0.10;
            ctx.fillStyle = '#e8d8a0';
            ctx.beginPath(); ctx.arc(0, -sk*0.1, sk, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-sk*0.28, -sk*0.22, sk*0.22, sk*0.24);
            ctx.fillRect( sk*0.06, -sk*0.22, sk*0.22, sk*0.24);
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }

    // Legs
    const lc2 = dragonDark, fw2 = s*0.32, fh2 = s*0.11;
    const lw2 = s*0.16, lh2 = s*0.36, sh2 = s*0.26;
    [[-s*0.47,-s*0.03],[-s*0.22,s*0.01],[s*0.20,s*0.01],[s*0.45,-s*0.03]].forEach(([lx2,ox2]) => {
      ctx.fillStyle = lc2;
      ctx.fillRect(lx2-lw2/2, s*0.36, lw2, lh2);
      ctx.fillRect(lx2-lw2/2+ox2, s*0.36+lh2, lw2, sh2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(lx2-lw2/2+ox2-s*0.07, s*0.36+lh2+sh2-s*0.02, fw2, fh2);
    });

    // Neck
    ctx.fillStyle = dragonColor;
    ctx.beginPath();
    ctx.moveTo(s*0.63,-s*0.20); ctx.quadraticCurveTo(s*1.12,-s*0.48,s*1.28,-s*0.04);
    ctx.quadraticCurveTo(s*1.12,s*0.27,s*0.63,s*0.20); ctx.closePath(); ctx.fill();

    // Dragon head
    ctx.save();
    ctx.translate(s*1.48,0); ctx.rotate(-0.12); ctx.scale(s*0.42,s*0.32);
    ctx.fillStyle = dragonColor;
    ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // Snout
    ctx.save();
    ctx.translate(s*1.88,s*0.05); ctx.rotate(0.22); ctx.scale(s*0.24,s*0.16);
    ctx.fillStyle = dragonDark;
    ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // Eye — glowing purple for elder
    ctx.fillStyle = hit ? '#ff00ff' : `rgba(180,0,255,${0.85 + 0.15*Math.sin(t*3)})`;
    ctx.beginPath(); ctx.arc(s*1.36,-s*0.13,s*0.11,0,Math.PI*2); ctx.fill();

    // Horns — larger, purple tipped
    ctx.fillStyle = dragonDark;
    ctx.beginPath(); ctx.moveTo(s*1.30,-s*0.28); ctx.lineTo(s*1.14,-s*0.62); ctx.lineTo(s*1.42,-s*0.30); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s*1.48,-s*0.26); ctx.lineTo(s*1.58,-s*0.62); ctx.lineTo(s*1.66,-s*0.24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8800ff';
    ctx.beginPath(); ctx.arc(s*1.14,-s*0.62,s*0.05,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*1.58,-s*0.62,s*0.05,0,Math.PI*2); ctx.fill();

    ctx.restore(); // end dragon body transform

    // ── Titan rider on dragon's back ────────────────────────────────────────
    const riderScale = 0.38;
    const riderX = this.x + Math.cos(facing) * s * 0.0;
    const riderY = this.y + Math.sin(facing) * s * 0.0 - s * 0.55;

    ctx.save(); ctx.translate(riderX, riderY); ctx.scale(riderScale, riderScale);

    const rs = s; // rider draw size (will be scaled down)
    const headR = rs * 0.28;
    const headCY = -rs * 0.52;
    const torsoTop = headCY + headR + rs * 0.03;
    const torsoH = rs * 0.75;
    const torsoW = rs * 0.72;

    // Rider torso
    ctx.fillStyle = hit ? '#ccffcc' : '#1a0a2e';
    ctx.fillRect(-torsoW/2, torsoTop, torsoW, torsoH);
    // Shoulder pads
    ctx.fillStyle = hit ? '#fff' : '#2d1050';
    ctx.beginPath(); ctx.arc(-torsoW/2, torsoTop + rs*0.09, rs*0.20, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(torsoW/2, torsoTop + rs*0.09, rs*0.20, 0, Math.PI*2); ctx.fill();

    // Rider scythe arm (facing direction)
    const scytheFacing2 = this.attackTimer > 0
      ? this.attackAngle - 1.1 + (1 - this.attackTimer/14) * 2.2
      : facing;
    const armW2 = rs * 0.20, uAL2 = rs * 0.46, fAL2 = rs * 0.38;
    ctx.save(); ctx.translate(0, torsoTop + rs*0.16); ctx.rotate(scytheFacing2);
    ctx.fillStyle = hit ? '#fff' : '#2d1050';
    ctx.fillRect(0, -armW2/2, uAL2+fAL2, armW2);
    if (!hit) {
      ctx.translate(uAL2+fAL2, 0);
      const hLen2 = rs * 2.5;
      ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = rs*0.10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-rs*0.2, 0); ctx.lineTo(hLen2, -rs*0.10); ctx.stroke();
      ctx.translate(hLen2, -rs*0.10);
      ctx.strokeStyle = hit ? '#fff' : '#ccc'; ctx.lineWidth = rs*0.16; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(-rs*0.36, 0, rs*0.75, -Math.PI*0.70, Math.PI*0.06); ctx.stroke();
      // Blade glow purple
      ctx.fillStyle = hit ? '#fff' : '#8800ff';
      ctx.beginPath(); ctx.arc(-rs*0.36, -rs*0.74, rs*0.10, 0, Math.PI*2); ctx.fill();
    }
    ctx.lineCap = 'butt'; ctx.restore();

    // Rider neck + head
    ctx.fillStyle = hit ? '#ffffff' : '#1a0a2e';
    ctx.fillRect(-rs*0.12, headCY + headR - 2, rs*0.24, rs*0.18);
    ctx.beginPath(); ctx.arc(0, headCY, headR, 0, Math.PI*2); ctx.fill();
    if (!hit) {
      // Crown horns
      ctx.fillStyle = '#3d0070';
      for (const [hx2, hy2] of [[-headR*0.4, -headR*0.45], [0, -headR*0.65], [headR*0.4, -headR*0.45]]) {
        ctx.beginPath();
        ctx.moveTo(hx2 - headR*0.13, headCY + hy2 + headR*0.36);
        ctx.lineTo(hx2, headCY + hy2 - headR*0.40);
        ctx.lineTo(hx2 + headR*0.13, headCY + hy2 + headR*0.36);
        ctx.closePath(); ctx.fill();
      }
      // Purple glowing eyes
      ctx.fillStyle = `rgba(180,0,255,${0.85 + 0.15*Math.sin(t*3)})`;
      ctx.fillRect(headR*0.09, headCY - headR*0.13, headR*0.30, headR*0.16);
      ctx.fillRect(-headR*0.39, headCY - headR*0.13, headR*0.30, headR*0.16);
    }
    ctx.restore(); // end rider scale transform

    // ── Scythe swing arc ────────────────────────────────────────────────────
    if (this.attackTimer > 0) {
      const p = this.attackTimer / 14;
      ctx.save(); ctx.translate(this.x, this.y + (this.titanJumpOffset || 0)); ctx.rotate(this.attackAngle);
      ctx.strokeStyle = `rgba(100,0,255,${p * 0.9})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, s * 2.8, -1.0, 1.0); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${p * 0.35})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, s * 2.2, -0.8, 0.8); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.restore();
    }

    // Shockwave ring
    if (this.titanShockwaveR > 0) {
      const alpha = Math.max(0, 1 - this.titanShockwaveR / (this.size * 5));
      ctx.save();
      ctx.strokeStyle = `rgba(100,0,255,${alpha * 0.85})`; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.titanShockwaveR, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(0,100,255,${alpha * 0.4})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.titanShockwaveR * 0.7, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
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

    // Scales — overlapping arcs in a fish-scale pattern
    if (bc !== '#fff') {
      ctx.save();
      ctx.globalAlpha = 0.22;
      const scaleColor = this.kind === 'dragonRider' ? '#ff2200' : '#00aa44';
      ctx.strokeStyle = scaleColor;
      ctx.lineWidth = 1.2;
      // Draw rows of semicircle scales across the body oval
      for (let row = -2; row <= 2; row++) {
        const ry = row * s * 0.28;
        const rowW = Math.sqrt(Math.max(0, 1 - (ry/(s*0.72))**2)) * s * 1.15;
        const cols = Math.floor(rowW / (s * 0.32)) + 1;
        for (let col = -cols; col <= cols; col++) {
          const rx = col * s * 0.30 + (row % 2 === 0 ? s * 0.15 : 0);
          const scaleR = s * 0.22;
          // Only draw if within the body ellipse
          if ((rx / (s*1.15))**2 + (ry / (s*0.72))**2 < 0.92) {
            ctx.beginPath();
            ctx.arc(rx, ry, scaleR, Math.PI, Math.PI*2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

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

    // Fire breath when attacking
    if (this.attackTimer > 0 || (this.fireTimer !== undefined && this.fireTimer < 10)) {
      ctx.save();
      const breathAng = facing;
      const headX = this.x + Math.cos(facing) * s * 1.1;
      const headY = this.y + Math.sin(facing) * s * 1.1;
      const p2 = this.attackTimer > 0 ? this.attackTimer / 22 : 0.5;
      const breathLen = s * (2.2 + p2 * 2.0);
      const grad = ctx.createLinearGradient(headX, headY, headX + Math.cos(breathAng)*breathLen, headY + Math.sin(breathAng)*breathLen);
      if (this.kind === 'dragonRider') {
        grad.addColorStop(0, `rgba(255,60,0,${p2*0.9})`);
        grad.addColorStop(0.5, `rgba(255,140,0,${p2*0.6})`);
        grad.addColorStop(1, 'rgba(255,200,0,0)');
      } else {
        grad.addColorStop(0, `rgba(0,200,80,${p2*0.9})`);
        grad.addColorStop(0.5, `rgba(100,255,0,${p2*0.6})`);
        grad.addColorStop(1, 'rgba(200,255,100,0)');
      }
      ctx.strokeStyle = grad; ctx.lineWidth = s * 0.45; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(headX + Math.cos(breathAng)*breathLen, headY + Math.sin(breathAng)*breathLen);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.restore();
    }
  }
}
