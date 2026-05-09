import { TYPES, TRAPS, MINE, CAMP, CAMP_TYPES, LEVELS, ACHIEVEMENTS, SHOP_ITEMS, GEM_SHOP_ITEMS, UPGRADE_COST, UPGRADE_MULT, makePath, MAX_MONEY, distance } from './constants.js?v=17';
import { GameMap }     from './Map.js?v=17';
import { Tower }       from './Tower.js?v=17';
import { Enemy }       from './Enemy.js?v=17';
import { Projectile }  from './Projectile.js?v=17';
import { Trap }        from './Trap.js?v=17';
import { Mine }        from './Mine.js?v=17';
import { WaveManager } from './WaveManager.js?v=17';

// A worker that walks to mines and carries gold back to a home base
class Worker {
  constructor(homeX, homeY, mines) {
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX;
    this.y = homeY;
    this.mines = mines;
    this.target = null;
    this.carrying = false;
    this.gold = 0;
    this.speed = 0.35;
    this.flashTimer = 0;
  }

  update() {
    if (this.flashTimer > 0) this.flashTimer--;
    const activeMines = this.mines.filter(m => !m.isDead?.());

    if (!this.carrying) {
      // Find nearest mine with gold ready
      if (!this.target || !activeMines.includes(this.target)) {
        this.target = activeMines.sort((a, b) =>
          Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y)
        )[0] || null;
      }
      if (this.target) {
        const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (d < 10) {
          // Collect gold from mine
          this.carrying = true;
          this.gold = MINE.income;
          this.target = null;
          this.flashTimer = 20;
        } else {
          this.x += ((this.target.x - this.x) / d) * this.speed;
          this.y += ((this.target.y - this.y) / d) * this.speed;
        }
      } else {
        // Wander near home
        const d = Math.hypot(this.homeX - this.x, this.homeY - this.y);
        if (d > 5) {
          this.x += ((this.homeX - this.x) / d) * this.speed;
          this.y += ((this.homeY - this.y) / d) * this.speed;
        }
      }
    } else {
      // Return home with gold
      const d = Math.hypot(this.homeX - this.x, this.homeY - this.y);
      if (d < 10) {
        this.carrying = false;
        return this.gold; // delivered!
      }
      this.x += ((this.homeX - this.x) / d) * this.speed;
      this.y += ((this.homeY - this.y) / d) * this.speed;
    }
    return 0;
  }

  draw(ctx) {
    const carrying = this.carrying;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(this.x+2, this.y+8); ctx.scale(1,0.3);
    ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Body
    ctx.fillStyle = carrying ? '#cc8820' : '#7a4a1a';
    ctx.fillRect(this.x-4, this.y-4, 8, 8);
    // Neck
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(this.x-1.5, this.y-7, 3, 4);
    // Head
    ctx.fillStyle = '#e8b890';
    ctx.beginPath(); ctx.arc(this.x, this.y-10, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7a4a1a'; // hat
    ctx.beginPath(); ctx.arc(this.x, this.y-10, 4, Math.PI, Math.PI*2); ctx.fill();
    // Gold bag when carrying
    if (carrying) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(this.x+5, this.y-2, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#cc9900'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('$', this.x+5, this.y); ctx.textAlign = 'left';
    }
    // Gold delivery flash
    if (this.flashTimer > 0) {
      const p = this.flashTimer / 20;
      ctx.fillStyle = `rgba(255,215,0,${p * 0.8})`;
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('+$' + this.gold, this.x, this.y - 20 - (1-p)*10);
      ctx.textAlign = 'left';
    }
  }
}

// Camp now supports multiple camp types — basic, archer, knight, mage, siege
class Camp {
  constructor(x, y, campTypeName = 'basic') {
    this.x = x; this.y = y;
    this.campType = CAMP_TYPES[campTypeName] || CAMP_TYPES.basic; // store the type config
    this.typeName = campTypeName;
    this.hp = 100; this.maxHp = 100;
    this.spawnTimer = 0;
    this.spawnRate = this.campType.spawnRate; // different types spawn at different rates
  }
  takeDamage(amt) { this.hp -= amt; }
  isDead() { return this.hp <= 0; }
  draw(ctx) {
    const hf = this.hp / this.maxHp;
    const c = this.campType.color; // each camp type has its own color
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(this.x+4, this.y+22); ctx.scale(1, 0.3);
    ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Tent body (use camp's color)
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(this.x-28,this.y+18); ctx.lineTo(this.x,this.y-26); ctx.lineTo(this.x+28,this.y+18); ctx.closePath(); ctx.fill();
    // Lighter highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.moveTo(this.x-22,this.y+18); ctx.lineTo(this.x-2,this.y-22); ctx.lineTo(this.x+2,this.y-22); ctx.lineTo(this.x+22,this.y+18); ctx.closePath(); ctx.fill();
    // Door
    ctx.fillStyle = '#2a1408'; ctx.fillRect(this.x-7, this.y+2, 14, 16);
    // Flag pole + flag (color matches camp type)
    ctx.fillStyle = '#3a1a05'; ctx.fillRect(this.x-1, this.y-42, 2, 20);
    ctx.fillStyle = c; ctx.fillRect(this.x+1, this.y-42, 14, 9);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', this.x+8, this.y-35); ctx.textAlign = 'left';
    // Type label
    const shortNames = { basic:'CAMP', archer:'ARCHER', knight:'KNIGHT', mage:'MAGE', siege:'SIEGE' };
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(shortNames[this.typeName] || 'CAMP', this.x, this.y+36); ctx.textAlign = 'left';
    // HP bar
    ctx.fillStyle = '#111'; ctx.fillRect(this.x-22, this.y+40, 44, 5);
    ctx.fillStyle = hf > 0.5 ? '#0f0' : '#f80';
    ctx.fillRect(this.x-22, this.y+40, 44*hf, 5);
  }
}

// Soldier now gets stats from its camp type (hp, damage vary by camp)
class Soldier {
  constructor(x, y, campType = null) {
    this.x = x; this.y = y;
    // Use camp type stats if provided, otherwise fall back to defaults
    const hp  = campType ? campType.soldierHp  : 50;
    const dmg = campType ? campType.soldierDmg : 8;
    this.hp = hp; this.maxHp = hp;
    this.speed = 1.0;
    this.damage = dmg;
    this.range = 52;
    this.waypoint = 0; // will be set to path.length-1 on spawn
    this.attackTimer = 0;
    this.target = null;
    this.blocking = false;
    this.blockTimer = 0;
    this.jumpHeight = 0;
    this.jumpVel = 0;
    this.swingTimer = 0;
    this.hitTimer = 0;
    this._3dx = null; this._3dy = null; this._3dr = 0;
  }
  update(enemies, path) {
    if (this.hitTimer > 0) this.hitTimer--;
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.swingTimer > 0) this.swingTimer--;
    if (this.blockTimer > 0) { this.blockTimer--; if (this.blockTimer <= 0) this.blocking = false; }
    // Jump physics
    if (this.jumpVel !== 0 || this.jumpHeight > 0) {
      this.jumpHeight += this.jumpVel;
      this.jumpVel -= 0.5;
      if (this.jumpHeight <= 0) { this.jumpHeight = 0; this.jumpVel = 0; }
    }
    // Find nearest enemy in range
    this.target = enemies
      .filter(e => Math.hypot(e.x-this.x, e.y-this.y) < this.range)
      .sort((a,b) => Math.hypot(a.x-this.x,a.y-this.y) - Math.hypot(b.x-this.x,b.y-this.y))[0] || null;
    if (this.target) {
      if (this.attackTimer <= 0) {
        this.target.takeDamage(this.damage);
        this.attackTimer = 45;
        this.swingTimer = 14;
      }
    } else {
      // Walk toward enemies (decreasing waypoint toward 0)
      const dest = path[Math.max(0, this.waypoint - 1)];
      const d = Math.hypot(dest.x - this.x, dest.y - this.y);
      if (d < this.speed) { if (this.waypoint > 0) this.waypoint--; }
      else { this.x += ((dest.x-this.x)/d)*this.speed; this.y += ((dest.y-this.y)/d)*this.speed; }
    }
  }
  takeDamage(amt) {
    this.hp -= this.blocking ? amt * 0.3 : amt;
    this.hitTimer = 10;
  }
  isDead() { return this.hp <= 0; }
  jump() { if (this.jumpHeight === 0) this.jumpVel = 6; }
  draw(ctx) {
    const hit = this.hitTimer > 0;
    const jy = this.jumpHeight * 0.4;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(this.x+2,this.y+9); ctx.scale(1,0.3);
    ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Legs
    ctx.fillStyle = hit ? '#fff' : '#334488';
    ctx.fillRect(this.x-5, this.y+2-jy, 4, 6); ctx.fillRect(this.x+1, this.y+2-jy, 4, 6);
    // Body
    ctx.fillStyle = hit ? '#fff' : '#2255aa';
    ctx.fillRect(this.x-5, this.y-8-jy, 10, 10);
    // Neck
    ctx.fillStyle = '#e8b890'; ctx.fillRect(this.x-1.5, this.y-11-jy, 3, 4);
    // Head
    ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 5, 0, Math.PI*2); ctx.fill();
    // Helmet
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 5.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(this.x-7, this.y-16-jy, 14, 3);
    // Shield
    if (this.blocking) {
      ctx.fillStyle = '#cc8822'; ctx.fillRect(this.x-12, this.y-10-jy, 6, 14);
      ctx.strokeStyle = '#885500'; ctx.lineWidth = 1; ctx.strokeRect(this.x-12, this.y-10-jy, 6, 14);
    }
    // Sword
    const sw = this.swingTimer > 0 ? Math.sin(this.swingTimer/14*Math.PI)*10 : 0;
    ctx.fillStyle = '#ccc';
    ctx.save(); ctx.translate(this.x+8, this.y-5-jy-sw);
    ctx.fillRect(-1,-13,2,14); ctx.fillStyle='#884400'; ctx.fillRect(-3,-1,7,2); ctx.restore();
    // HP bar
    const bw = 18;
    ctx.fillStyle = '#111'; ctx.fillRect(this.x-bw/2, this.y-24-jy, bw, 3);
    ctx.fillStyle = '#2f8'; ctx.fillRect(this.x-bw/2, this.y-24-jy, bw*(this.hp/this.maxHp), 3);
    // Block indicator
    if (this.blocking) {
      ctx.fillStyle = 'rgba(200,180,50,0.7)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🛡', this.x, this.y-28-jy); ctx.textAlign = 'left';
    }
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    canvas.width  = window.innerWidth;
    canvas.height = Math.max(420, window.innerHeight - 88);

    this.path = makePath(canvas.width, canvas.height, 0);
    this.map  = new GameMap(this.path, canvas.width, canvas.height);
    this.waveManager = new WaveManager();

    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.traps       = [];
    this.mines       = [];
    this.guards      = [];
    this.camps       = [];
    this.soldiers    = [];
    this.workerUnits = []; // animated worker characters

    this.castleHp    = 10000;
    this.castleMaxHp = 10000;
    this.money    = 100;
    this.score    = 0;
    this.gameOver = false;
    this.levelComplete = false;
    this.currentLevel  = null;

    this.workers     = 0;
    this.workerTimer = 0;

    const pathEnd = this.path[this.path.length - 1];
    this.castleArcher = {
      x: pathEnd.x - 42,
      y: pathEnd.y - 38,
      cooldown: 0, fireTimer: 0, angle: Math.PI,
    };

    this.selectedTower = null;
    this.viewMode  = 'flat';  // 'flat' or '3d'
    this.viewTower = null;
    this.flashMsg  = '';
    this.flashTimer = 0;
    this.mouse     = { x: 0, y: 0 };
    // Camera yaw offset for 3D views — dragging left/right rotates the view
    this.camYaw = 0;
    this._3dDragging  = false;
    this._3dDragLastX = 0;
    this.selectedType = 'basic';
    this.typeKeys  = Object.keys(TYPES);
    this.trapKeys  = Object.keys(TRAPS);

    // ── Shop state ─────────────────────────────────────────────────────────────
    this.shopOpen   = false;   // is the shop overlay open?
    this.shopScroll = 0;       // for future scrolling
    this.shopBuyCount = 0;     // track how many items bought (for 'shopaholic' achievement)

    // ── Daily Wheel state ──────────────────────────────────────────────────────
    this.wheelOpen     = false;  // is the wheel overlay showing?
    this.wheelAngle    = 0;      // current rotation of the wheel (radians)
    this.wheelSpinning = false;  // is the wheel currently spinning?
    this.wheelResult   = null;   // the prize we landed on
    this.wheelSpeed    = 0;      // current spin speed (radians per frame)
    this.pendingWheelReward = null; // reward waiting to be applied when level starts

    // ── Gameplay tracking for achievements ─────────────────────────────────────
    this.totalKills    = 0;    // total enemies killed across all play (for kill achievements)
    this.towerPlaceCount = 0;  // towers placed in this game (for 'builder' achievement)

    // ── Active power-up timers ──────────────────────────────────────────────────
    this.rageTimer    = 0;   // Tower Rage: all towers fire 2x faster
    this.shieldTimer  = 0;   // Castle Shield: castle can't take damage
    this.timeSlowTimer= 0;   // Time Slow: enemies move at half speed
    this.poisonTimer  = 0;   // Poison Cloud: enemies take damage over time
    this.berserkTimer = 0;   // Berserk: enemies deal friendly-fire damage
    this.goldBonus      = 1.0;  // +30% Gold upgrade multiplier
    this.armorActive    = false; // Tower Armor: towers take half damage
    this.regenActive    = false; // HP Regen: towers slowly heal
    this.multiShotActive = false; // Multishot: towers fire 2 projectiles
    this.bounceActive   = false; // Bouncing Arrows: arrows bounce to a second target

    this.titleActive    = true;
    this.selectedLevelId = 1;
    this.campLimit = 10; // raised to 15 by gem_camps upgrade
    this.gemFastFire = false; this.gemHeadStart = false;
    this.gemMinerDouble = false; this.gemSoldierDmg = false;

    // ── Gem currency ───────────────────────────────────────────────────────────
    // Gems are rare — earned from level completions, achievements, and daily wheel
    this.gems = parseInt(localStorage.getItem('td_gems') || '0');

    this._buildTitleScreen();
    this._setupInput();
    document.getElementById('title-screen').style.display = 'flex';
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update() {
    // Tick the wheel spin animation even on title screen
    if (this.wheelSpinning) {
      this.wheelAngle += this.wheelSpeed;
      this.wheelSpeed *= 0.985; // gradually slow down
      if (this.wheelSpeed < 0.005) {
        // Wheel has stopped! Figure out the prize
        this.wheelSpinning = false;
        this._resolveWheelPrize();
      }
    }

    if (this.titleActive || this.gameOver || this.levelComplete) return;
    if (this.flashTimer > 0) this.flashTimer--;

    // Tick down power-up timers
    if (this.rageTimer     > 0) this.rageTimer--;
    if (this.shieldTimer   > 0) this.shieldTimer--;
    if (this.timeSlowTimer > 0) this.timeSlowTimer--;
    if (this.poisonTimer   > 0) {
      this.poisonTimer--;
      // Poison does a tiny bit of damage to every enemy each frame
      for (const e of this.enemies) e.takeDamage(0.1);
    }
    // Berserk mode — enemies take random friendly-fire damage while active
    if (this.berserkTimer > 0) {
      this.berserkTimer--;
      if (this.berserkTimer % 30 === 0) { // every 0.5s
        for (const e of this.enemies) {
          if (Math.random() < 0.4) e.takeDamage(3 + Math.random() * 5);
        }
      }
    }

    // HP Regen — towers slowly heal over time if the upgrade is active
    if (this.regenActive) {
      for (const t of this.towers) {
        if (t.hp < t.maxHp) t.hp = Math.min(t.hp + 0.005, t.maxHp);
      }
    }

    const waveResult = this.waveManager.update(this.enemies.length);
    if (typeof waveResult === 'string') {
      const diff = this.currentLevel ? this.currentLevel.difficulty : 1;
      // Apply Time Slow if active — enemies spawn slower
      const e = new Enemy(waveResult, this.path[0].x - 40, this.path[0].y, diff);
      if (this.timeSlowTimer > 0) e.speed *= 0.5;
      this.enemies.push(e);
    } else if (waveResult?.levelComplete) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      this._onLevelComplete();
    } else if (waveResult?.waveCleared) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      // Wave 5 achievement
      if (this.waveManager.wave >= 5) this._grantAchievement('wave5');
      this._updateButtons();
    }

    // Mine passive income
    for (const mine of this.mines) {
      const gold = mine.update();
      if (gold > 0) { this.money = Math.min(this.money + gold, MAX_MONEY); this._updateButtons(); }
    }

    // Animated workers walk to mines and bring back gold
    for (const w of this.workerUnits) {
      const delivered = w.update();
      if (delivered > 0) {
        // Gem upgrade: Expert Miners doubles worker gold income
        const amount = (this.gemMinerDouble ? delivered * 2 : delivered);
        this.money = Math.min(this.money + amount, MAX_MONEY);
        this._updateButtons();
      }
    }

    // Achievement checks
    if (this.mines.length >= 3) this._grantAchievement('miner');
    if (this.traps.length >= 5) this._grantAchievement('fortified');

    if (this.waveManager.inBreak) return;

    for (const e of this.enemies) e.update(this.path, this.towers, this.projectiles, this.traps);

    for (const e of this.enemies) {
      if (!e.atGate && e.hasReachedEnd(this.path)) {
        e.atGate = true;
        e.x = Math.min(e.x, this.canvas.width - 28);
        e.gateAttackTimer = 10 + Math.floor(Math.random() * 20);
      }
    }
    for (const e of this.enemies) {
      if (e.atGate) {
        // Castle Shield blocks all damage!
        if (this.shieldTimer <= 0) {
          this.castleHp -= e.castleDamage / 60;
          if (this.castleHp <= 0) { this.castleHp = 0; this.gameOver = true; }
        }
      }
    }

    for (const t of this.towers) {
      // In 3D view the viewTower handles its own cooldown but still auto-fires other towers
      if (t === this.selectedTower || t === this.viewTower) { if (t.manualCooldown > 0) t.manualCooldown--; continue; }
      // Tower Rage: temporarily halve fire rate (fires 2x as fast)
      if (this.rageTimer > 0) {
        const savedRate = t._savedFireRate || t.fireRate;
        t._savedFireRate = savedRate;
        t.fireRate = Math.max(1, Math.floor(savedRate / 2));
      } else if (t._savedFireRate) {
        t.fireRate = t._savedFireRate; // restore original fire rate when rage ends
        t._savedFireRate = null;
      }
      t.update(this.enemies, this.projectiles);
    }

    // Castle archer
    if (this.castleArcher.cooldown > 0) this.castleArcher.cooldown--;
    if (this.castleArcher.fireTimer  > 0) this.castleArcher.fireTimer--;
    const ca = this.castleArcher;
    const archerTarget = this.enemies
      .filter(e => distance({ x: ca.x, y: ca.y }, e) < 220)
      .sort((a, b) => (b.atGate ? 999 : b.waypoint) - (a.atGate ? 999 : a.waypoint))[0];
    if (archerTarget && ca.cooldown <= 0) {
      const dx = archerTarget.x - ca.x, dy = archerTarget.y - ca.y, d = Math.hypot(dx, dy);
      ca.angle = Math.atan2(dy, dx);
      this.projectiles.push(new Projectile({ x: ca.x, y: ca.y, vx: (dx/d)*8, vy: (dy/d)*8, damage: 2, arrow: true, manual: true }));
      ca.cooldown = 50; ca.fireTimer = 10;
    }

    for (const p of this.projectiles) p.update(this.enemies, this.towers);
    this.projectiles = this.projectiles.filter(p => !p.isDead());

    for (const trap of this.traps) trap.update(this.enemies);

    // Camps spawn soldiers — each camp type spawns soldiers with different stats
    for (const camp of this.camps) {
      // Rapid Training upgrade makes camps spawn 2x faster
      const effectiveRate = this.rapidSpawnActive ? Math.floor(camp.spawnRate / 2) : camp.spawnRate;
      camp.spawnTimer++;
      if (camp.spawnTimer >= effectiveRate) {
        camp.spawnTimer = 0;
        if (this.soldiers.length < this.camps.length * 3) {
          const pathEnd = this.path[this.path.length - 1];
          // Pass the camp's type so soldier gets the right HP and damage
          const sol = new Soldier(
            pathEnd.x - 30 + Math.random()*20,
            pathEnd.y - 10 + Math.random()*20,
            camp.campType  // <-- this is what gives different soldier stats
          );
          // Swift Soldiers upgrade
          if (this.swiftSoldiers) sol.speed *= 1.5;
          // Gem upgrade: Elite Army — soldiers deal 2x damage
          if (this.gemSoldierDmg) sol.damage *= 2;
          sol.waypoint = this.path.length - 1;
          this.soldiers.push(sol);
        }
      }
    }
    // Soldiers fight
    for (const s of this.soldiers) s.update(this.enemies, this.path);
    this.soldiers = this.soldiers.filter(s => !s.isDead());

    // Check soldier count achievements
    if (this.soldiers.length >= 5)  this._grantAchievement('soldier5');
    if (this.soldiers.length >= 15) this._grantAchievement('soldier15');
    // Check camp count achievement
    if (this.camps.length >= 5) this._grantAchievement('camp5');

    for (const t of this.towers) {
      for (const e of this.enemies) {
        if (distance(t, e) < 55) {
          let dmg = e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.015;
          // Tower Armor upgrade: towers take 50% less damage
          if (this.armorActive) dmg *= 0.5;
          t.takeDamage(dmg);
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

    // Apply time slow to all enemies that are currently on the field
    if (this.timeSlowTimer > 0) {
      for (const e of this.enemies) {
        if (!e._slowApplied) { e.speed *= 0.5; e._slowApplied = true; }
      }
    } else {
      // Time slow expired — restore speeds
      for (const e of this.enemies) {
        if (e._slowApplied) { e.speed /= 0.5; e._slowApplied = false; }
      }
    }

    const before = this.enemies.length;
    this.enemies = this.enemies.filter(e => {
      if (e.isDead()) {
        if (e.kind === 'dragon' || e.kind === 'dragonRider') this._grantAchievement('dragon_slayer');
        this.score++;
        this.totalKills++;
        // Apply gold bonus multiplier (from +30% Gold upgrade)
        const goldEarned = Math.ceil(e.reward * this.goldBonus);
        this.money = Math.min(this.money + goldEarned, MAX_MONEY);
        return false;
      }
      return true;
    });
    if (this.enemies.length < before) this._updateButtons();

    // Kill count achievements
    if (this.totalKills >= 100) this._grantAchievement('kill100');
    if (this.totalKills >= 500) this._grantAchievement('kill500');
    // Rich achievement
    if (this.money >= 500) this._grantAchievement('rich');
    // All towers achievement — check if all 8 tower types are placed
    const placedTypes = new Set(this.towers.map(t => t.typeKey));
    if (placedTypes.size >= 8) this._grantAchievement('all_towers');
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw() {
    // Special case: wheel open from title screen
    if (this.wheelOpen && !this.currentLevel && !this.gameOver) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this._drawWheel();
      return;
    }
    if (this.titleActive) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.viewMode === '3d') { this._draw3D(); return; }
    if (this.viewMode === '3d-soldier') { this._draw3DSoldier(); return; }

    this.map.draw(this.ctx);
    if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      if (TRAPS[key].onPath !== false) this._drawPathHighlight();
    }
    for (const mine  of this.mines)       mine.draw(this.ctx);
    for (const trap  of this.traps)       trap.draw(this.ctx);
    for (const camp  of this.camps)       camp.draw(this.ctx);
    for (const sol   of this.soldiers)    sol.draw(this.ctx);
    for (const w     of this.workerUnits) w.draw(this.ctx);
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
    // Draw shop on top of everything if it's open
    if (this.shopOpen) this._drawShop();
    // Draw wheel on top if it's open
    if (this.wheelOpen) this._drawWheel();
  }

  // ── Public actions ───────────────────────────────────────────────────────────

  tryPlaceTower(x, y) {
    if (this.towers.length >= 30) { this.flash('Tower limit reached! (30 max)'); return false; }
    if (this.map.isOnPath(x, y))  { this.flash("Can't build on the path!"); return false; }
    if (this.map.isOnFeature(x, y)) { this.flash("Can't place on a tree or rock!"); return false; }
    const type = TYPES[this.selectedType];
    if (this.money < type.cost) { this.flash(`Need $${type.cost} — you have $${this.money}!`); return false; }
    const newTower = new Tower(x, y, this.selectedType);
    // Gem upgrade: Head Start — all placed towers begin at Level 2
    if (this.gemHeadStart && newTower.level < 2) {
      const m2 = UPGRADE_MULT[2];
      newTower.damage   *= m2.damage;
      newTower.range    *= m2.range;
      newTower.fireRate  = Math.floor(newTower.fireRate * m2.fireRate);
      newTower.hp = newTower.maxHp;
      newTower.level = 2;
    }
    // Gem upgrade: Rapid Reload — towers fire 30% faster
    if (this.gemFastFire) newTower.fireRate = Math.floor(newTower.fireRate * 0.7);
    this.towers.push(newTower);
    this.money -= type.cost;
    this.towerPlaceCount++;
    // Tower count achievement
    if (this.towerPlaceCount >= 10) this._grantAchievement('tower10');
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
    if (!needsPath && this.map.isOnFeature(x, y)) { this.flash("Can't place on a tree or rock!"); return false; }
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
    if (this.map.isOnFeature(x, y)) { this.flash("Can't place on a tree or rock!"); return; }
    if (this.money < MINE.cost)  { this.flash(`Need $${MINE.cost} — you have $${this.money}!`); return; }
    if (this.mines.some(m => Math.hypot(m.x - x, m.y - y) < 28)) { this.flash('Too close to another mine!'); return; }
    this.mines.push(new Mine(x, y));
    this.money -= MINE.cost;
    // Assign idle workers to this new mine
    this._assignWorkers();
    this._updateButtons();
  }

  tryPlaceCamp(x, y) {
    // Enforce camp limit (default 10, raised to 15 by gem_camps upgrade)
    if (this.camps.length >= this.campLimit) { this.flash(`Camp limit reached! (${this.campLimit} max)`); return; }
    if (this.map.isOnPath(x, y)) { this.flash("Can't place camp on the path!"); return; }
    if (this.map.isOnFeature(x, y)) { this.flash("Too close to a tree or rock!"); return; }

    // Figure out which camp type is selected (selectedType = 'camp_basic', 'camp_archer', etc.)
    const typeName = this.selectedType.replace('camp_', '');
    const campCfg  = CAMP_TYPES[typeName] || CAMP_TYPES.basic;

    if (this.money < campCfg.cost) { this.flash(`Need $${campCfg.cost} for ${campCfg.label}`); return; }
    this.money -= campCfg.cost;
    this.camps.push(new Camp(x, y, typeName));
    this._updateButtons();
    this.flash(`${campCfg.label.replace(/ \$\d+/, '')} placed! Soldiers will spawn!`);
  }

  hireWorker() {
    if (this.workers >= 5)  { this.flash('Max 5 workers already hired!'); return; }
    if (this.money < 35)    { this.flash('Need $35 to hire a worker!'); return; }
    this.workers++;
    this.money -= 35;
    // Spawn animated worker near castle
    const pathEnd = this.path[this.path.length - 1];
    const w = new Worker(pathEnd.x - 60, pathEnd.y + 10, this.mines);
    w.x = pathEnd.x - 60 + (Math.random() - 0.5) * 20;
    w.y = pathEnd.y + 10 + (Math.random() - 0.5) * 20;
    this.workerUnits.push(w);
    this.flash(`Worker hired! (${this.workers}/5) — walks to mines for gold!`);
    this._updateButtons();
  }

  _assignWorkers() {
    // Update all workers' mine lists so they can target new mines
    for (const w of this.workerUnits) {
      w.mines = this.mines;
    }
  }

  trySelectTower(x, y) {
    const clicked = this.towers.find(t => distance(t, { x, y }) < 20);
    if (!clicked) return false;
    if (this.selectedTower === clicked) {
      // Second click on the same tower → enter first-person 3D view
      this._enter3D(clicked);
    } else {
      // First click → select it (shows upgrade panel at bottom, aim line, range ring)
      this.selectedTower = clicked;
      this.flash('Tower selected! Click again for 3D view • Upgrade panel below • Right-click=Sell');
    }
    return true;
  }

  // ── 3D view ──────────────────────────────────────────────────────────────────

  _enter3D(tower) {
    this.viewMode  = '3d';
    this.viewTower = tower;
    this.camYaw    = 0;
    this.selectedTower = null;
    this.flash('Click enemies to shoot! Drag to look around. ESC=Exit');
  }

  _exit3D() {
    this.viewMode  = 'flat';
    this.viewTower = null;
    this.camYaw    = 0;
    this._3dDragging = false;
  }

  _enter3DSoldier(soldier) {
    this.viewMode    = '3d-soldier';
    this.viewSoldier = soldier;
    this.camYaw      = 0;
    this.flash('Click=Attack  Right-click=Block  Space=Jump  Drag=Look  ESC=Exit');
  }

  _exit3DSoldier() {
    this.viewMode    = 'flat';
    this.viewSoldier = null;
    this.camYaw      = 0;
    this._3dDragging = false;
  }

  _attack3DSoldier(mx, my) {
    const sol = this.viewSoldier;
    if (sol.attackTimer > 0) { this.flash('Still swinging!'); return; }
    let best = null, bestD = 70;
    for (const e of this.enemies) {
      if (e._3dx == null) continue;
      const d = Math.hypot(mx - e._3dx, my - e._3dy);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      best.takeDamage(sol.damage * 2);
      sol.swingTimer = 14;
      this.flash(best.isDead() ? `KILL! +$${best.reward}` : `HIT! −${sol.damage*2} dmg`);
    } else {
      sol.swingTimer = 14;
      this.flash('Missed!');
    }
    sol.attackTimer = 45;
  }

  _toggleBlock3DSoldier() {
    const sol = this.viewSoldier;
    sol.blocking = !sol.blocking;
    if (sol.blocking) { sol.blockTimer = 300; this.flash('Blocking! Damage reduced 70%'); }
    else { sol.blockTimer = 0; this.flash('Block dropped'); }
  }

  _draw3DSoldier() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const sol = this.viewSoldier;
    // Camera at soldier position, looking toward enemies
    const cx = sol.x, cy = sol.y;
    const jumpCameraY = sol.jumpHeight * 0.5; // camera rises during jump

    const camAng = Math.atan2(this.path[0].y - cy, this.path[0].x - cx) + this.camYaw;
    const cosA = Math.cos(camAng), sinA = Math.sin(camAng);
    const eyeH = 55 + jumpCameraY;
    const horizon = H * 0.42 - jumpCameraY * 0.5;
    const focal = (W / 2) / Math.tan(0.58);

    const proj = (wx, wy, wh = 0) => {
      const dx = wx - cx, dy = wy - cy;
      const fwd = dx * cosA + dy * sinA;
      const side = -dx * sinA + dy * cosA;
      if (fwd < 2) return null;
      return { x: W/2 + (side/fwd)*focal, y: horizon + ((eyeH-wh)/fwd)*focal, fwd, sc: focal/fwd };
    };

    // SKY
    const sg = ctx.createLinearGradient(0, 0, 0, horizon);
    sg.addColorStop(0, '#0d1a2a'); sg.addColorStop(0.5, '#1a3a5a'); sg.addColorStop(1, '#3a4a3a');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon);
    // Distant tree line
    ctx.fillStyle = '#182e12';
    ctx.beginPath(); ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, horizon - 20 + Math.sin(x*0.022)*18 + Math.sin(x*0.058)*9);
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

    // GROUND
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0, '#4a3018'); gg.addColorStop(0.4, '#3a2410'); gg.addColorStop(1, '#2a1808');
    ctx.fillStyle = gg; ctx.fillRect(0, horizon, W, H - horizon);
    // Ground grid
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (let z = 40; z <= 600; z += 40) {
      const lp = proj(cx+cosA*z-sinA*500, cy+sinA*z+cosA*500);
      const rp = proj(cx+cosA*z+sinA*500, cy+sinA*z-cosA*500);
      if (!lp || !rp) continue;
      ctx.beginPath(); ctx.moveTo(lp.x,lp.y); ctx.lineTo(rp.x,rp.y); ctx.stroke();
    }

    // PATH
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg+1];
      const ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
      const pw = 28, px = Math.cos(ang)*pw, py = Math.sin(ang)*pw;
      for (let t = 0; t < 10; t++) {
        const t0=t/10, t1=(t+1)/10;
        const x0=a.x+(b.x-a.x)*t0, y0=a.y+(b.y-a.y)*t0;
        const x1=a.x+(b.x-a.x)*t1, y1=a.y+(b.y-a.y)*t1;
        const c = [proj(x0-px,y0-py),proj(x0+px,y0+py),proj(x1+px,y1+py),proj(x1-px,y1-py)];
        if (c.some(p=>!p)) continue;
        ctx.fillStyle = (seg+t)%2===0 ? '#7a5520':'#6a4818';
        ctx.beginPath(); ctx.moveTo(c[0].x,c[0].y); ctx.lineTo(c[1].x,c[1].y);
        ctx.lineTo(c[2].x,c[2].y); ctx.lineTo(c[3].x,c[3].y); ctx.closePath(); ctx.fill();
      }
    }

    // FIRES (projected)
    const ft = Date.now()/120;
    for (const f of (this.map.fires || [])) {
      const p = proj(f.x, f.y);
      if (!p || p.x < -50 || p.x > W+50) continue;
      const sz = f.size * p.sc * 2.5;
      if (sz < 1) continue;
      const fl = Math.sin(ft + f.x*0.1)*0.3+0.7;
      ctx.fillStyle = `rgba(255,80,0,${0.4*fl})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, sz*1.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.moveTo(p.x-sz*0.5, p.y); ctx.lineTo(p.x, p.y-sz*1.5); ctx.lineTo(p.x+sz*0.5, p.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.moveTo(p.x-sz*0.25, p.y); ctx.lineTo(p.x, p.y-sz); ctx.lineTo(p.x+sz*0.25, p.y); ctx.closePath(); ctx.fill();
    }

    // OBJECTS: trees, other soldiers, enemies (far to near)
    const objs = [];
    const openB = H * 0.73;
    for (const tr of this.map.trees) {
      const p = proj(tr.x, tr.y);
      if (p && p.x > -100 && p.x < W+100) objs.push({ kind:'tree', p, tr });
    }
    for (const s2 of this.soldiers) {
      if (s2 === sol) continue;
      const p = proj(s2.x, s2.y);
      if (p) objs.push({ kind:'ally', p, s2 });
    }
    for (const e of this.enemies) {
      e._3dx = null;
      const p = proj(e.x, e.y);
      if (p) objs.push({ kind:'enemy', p, e });
    }
    objs.sort((a,b) => b.p.fwd - a.p.fwd);

    for (const obj of objs) {
      const { p } = obj;
      if (obj.kind === 'tree') {
        const sz = obj.tr.r * p.sc;
        const gy = Math.min(p.y, openB);
        ctx.fillStyle = '#2a1a06'; ctx.fillRect(p.x-sz*0.22, gy-sz*2.2, sz*0.44, sz*2.2);
        ctx.fillStyle = '#1e3d18'; ctx.beginPath(); ctx.arc(p.x, gy-sz*2.2, sz, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2e5a24'; ctx.beginPath(); ctx.arc(p.x-sz*0.15, gy-sz*2.5, sz*0.72, 0, Math.PI*2); ctx.fill();
      } else if (obj.kind === 'ally') {
        const { s2 } = obj;
        const sz = 8 * p.sc;
        if (sz < 1) continue;
        const gy = Math.min(p.y, openB);
        const bh = sz * 3;
        ctx.fillStyle = '#334488'; ctx.fillRect(p.x-sz*0.7, gy-bh, sz*1.4, bh);
        ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(p.x, gy-bh-sz*0.7, sz*0.7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(p.x, gy-bh-sz*0.7, sz*0.75, Math.PI, 0); ctx.fill();
        // Ally HP bar
        const bw = Math.max(sz*2,14);
        ctx.fillStyle='#111'; ctx.fillRect(p.x-bw/2, gy-bh-sz*2, bw, 4);
        ctx.fillStyle='#2f8'; ctx.fillRect(p.x-bw/2, gy-bh-sz*2, bw*(s2.hp/s2.maxHp), 4);
      } else if (obj.kind === 'enemy') {
        const { e } = obj;
        const sz = e.size * p.sc * 1.8;
        if (sz < 2) continue;
        const gy = Math.min(p.y, openB);
        const bh = sz * 2.2;
        ctx.fillStyle='rgba(0,0,0,0.3)';
        ctx.save(); ctx.translate(p.x+sz*0.3,gy); ctx.scale(1.1,0.25);
        ctx.beginPath(); ctx.arc(0,0,sz*1.1,0,Math.PI*2); ctx.fill(); ctx.restore();
        ctx.fillStyle='#2a2a2a'; ctx.fillRect(p.x-sz*0.5,gy-bh*0.5,sz*0.38,bh*0.52); ctx.fillRect(p.x+sz*0.12,gy-bh*0.5,sz*0.38,bh*0.52);
        ctx.fillStyle=e.color; ctx.fillRect(p.x-sz*0.72,gy-bh,sz*1.44,bh*0.65);
        ctx.beginPath(); ctx.arc(p.x,gy-bh-sz*0.6,sz*0.65,0,Math.PI*2); ctx.fill();
        const bw=Math.max(sz*2.5,22);
        ctx.fillStyle='#111'; ctx.fillRect(p.x-bw/2-1,gy-bh-sz*1.9-1,bw+2,7);
        ctx.fillStyle=e.hp/e.maxHp>0.5?'#2f2':'#f82';
        ctx.fillRect(p.x-bw/2,gy-bh-sz*1.9,bw*(e.hp/e.maxHp),5);
        e._3dx=p.x; e._3dy=gy-bh/2; e._3dr=Math.max(sz*1.3,20);
      }
    }

    // STONE BATTLEMENT FRAME (same as tower view)
    const openL = W*0.14, openR = W*0.86;
    const drawStone = (x1, x2) => {
      ctx.fillStyle='#4e4e4e'; ctx.fillRect(x1,0,x2-x1,H);
      ctx.fillStyle='#5c5c5c'; ctx.fillRect(x1,0,x2-x1,H);
      ctx.strokeStyle='#383838'; ctx.lineWidth=1;
      for (let row=0; row<H; row+=14) {
        const off=(Math.floor(row/14)%2)*22;
        for (let col=x1-22+off; col<x2+22; col+=44) ctx.strokeRect(col,row,42,13);
      }
    };
    drawStone(0, openL); drawStone(openR, W);
    ctx.fillStyle='#4e4e4e'; ctx.fillRect(0,openB,W,H-openB);
    ctx.fillStyle='#5c5c5c'; ctx.fillRect(0,openB,W,10);
    for (let y=10; y<H*0.55; y+=56) {
      ctx.fillStyle='#4e4e4e';
      ctx.fillRect(openL-14,y,20,32); ctx.fillRect(openR-6,y,20,32);
    }

    // FIRST-PERSON ARMS
    const armY = H * 0.78;
    // Right arm + sword
    const swingAmt = sol.swingTimer > 0 ? Math.sin(sol.swingTimer/14*Math.PI)*40 : 0;
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(W*0.6, armY - 40 - swingAmt, 50, 40); // forearm
    ctx.fillStyle = '#e8b890'; ctx.fillRect(W*0.64, armY - 55 - swingAmt, 28, 18); // hand
    ctx.fillStyle = '#ccc'; ctx.fillRect(W*0.72, armY - 100 - swingAmt, 8, 50); // blade
    ctx.fillStyle = '#884400'; ctx.fillRect(W*0.66, armY - 58 - swingAmt, 24, 6); // guard
    // Left arm + shield (if blocking)
    if (sol.blocking) {
      ctx.fillStyle = '#2255aa'; ctx.fillRect(W*0.32, armY - 50, 50, 50);
      ctx.fillStyle = '#cc8822'; ctx.fillRect(W*0.22, armY - 80, 40, 60);
      ctx.strokeStyle = '#885500'; ctx.lineWidth = 2; ctx.strokeRect(W*0.22, armY - 80, 40, 60);
      ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(W*0.24+20, armY-50, 8, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = '#2255aa'; ctx.fillRect(W*0.32, armY - 40, 50, 40);
      ctx.fillStyle = '#e8b890'; ctx.fillRect(W*0.34, armY - 55, 28, 18);
    }

    // HUD
    const mx2 = W/2, my2 = (horizon+openB)/2;
    ctx.strokeStyle='rgba(255,230,80,0.88)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(mx2-20,my2); ctx.lineTo(mx2-7,my2);
    ctx.moveTo(mx2+7,my2);  ctx.lineTo(mx2+20,my2);
    ctx.moveTo(mx2,my2-20); ctx.lineTo(mx2,my2-7);
    ctx.moveTo(mx2,my2+7);  ctx.lineTo(mx2,my2+20);
    ctx.stroke();
    ctx.strokeStyle='rgba(255,230,80,0.35)';
    ctx.beginPath(); ctx.arc(mx2,my2,14,0,Math.PI*2); ctx.stroke();

    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(openL+6,6,220,68);
    ctx.fillStyle='#2255aa'; ctx.font='bold 14px sans-serif'; ctx.fillText('⚔ SOLDIER', openL+14, 26);
    ctx.fillStyle='#aaa'; ctx.font='11px sans-serif'; ctx.fillText('Click=Attack  Drag=Look  RClick=Block  Space=Jump', openL+14, 44);
    // HP bar
    ctx.fillStyle='#111'; ctx.fillRect(openL+14, 52, 180, 8);
    ctx.fillStyle = sol.hp/sol.maxHp > 0.5 ? '#2f8' : '#f82';
    ctx.fillRect(openL+14, 52, 180*(sol.hp/sol.maxHp), 8);
    ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.fillText(`HP: ${Math.ceil(sol.hp)}/${sol.maxHp}${sol.blocking?' 🛡 BLOCKING':''}`, openL+14, 68);

    // Exit button
    ctx.fillStyle='#8a0000'; ctx.fillRect(openR-90,6,84,30);
    ctx.fillStyle='#cc2222'; ctx.fillRect(openR-90,6,84,3);
    ctx.fillStyle='#fff'; ctx.font='bold 14px sans-serif'; ctx.fillText('✕  EXIT', openR-76, 26);

    // Enemies/wave
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(openL+6,openB-26,200,22);
    ctx.fillStyle='#fff'; ctx.font='12px sans-serif';
    ctx.fillText(`Enemies: ${this.enemies.length}   Wave: ${this.waveManager.wave}/${this.waveManager.levelDef?.waves ?? '?'}`, openL+12, openB-10);

    // Flash
    if (this.flashTimer > 0) {
      const fp = this.flashTimer/90;
      ctx.fillStyle=`rgba(0,0,0,${fp*0.55})`; ctx.fillRect(W/2-140,openB-54,280,26);
      ctx.fillStyle=`rgba(255,240,80,${fp})`; ctx.font='bold 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(this.flashMsg, W/2, openB-36); ctx.textAlign='left';
    }
  }

  _shoot3D(mx, my) {
    const tower = this.viewTower;
    if (tower.manualCooldown > 0) { this.flash('Still reloading!'); return; }
    // Find enemy closest to click in screen space (uses coords stored by _draw3D)
    let best = null, bestD = 60;
    for (const e of this.enemies) {
      if (e._3dx == null) continue;
      const d = Math.hypot(mx - e._3dx, my - e._3dy);
      if (d < bestD) { bestD = d; best = e; }
    }
    const dmg = tower.damage * 4;
    if (best) {
      best.takeDamage(dmg);
      this.flash(best.isDead() ? `KILL! +$${best.reward}` : `HIT! −${dmg} dmg`);
    } else {
      this.flash('Missed!');
    }
    tower.manualCooldown = tower.fireRate * 2;
  }

  _draw3D() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const tower = this.viewTower;
    const cx = tower.x, cy = tower.y;

    // Camera: faces the enemy spawn side, offset by player drag yaw
    const camAng = Math.atan2(this.path[0].y - cy, this.path[0].x - cx) + this.camYaw;
    const cosA = Math.cos(camAng), sinA = Math.sin(camAng);
    const eyeH = 85, horizon = H * 0.38;
    const focal = (W / 2) / Math.tan(0.58); // ~66° FoV

    // Project ground point (wx,wy) → screen {x,y,fwd,sc}
    const proj = (wx, wy) => {
      const dx = wx - cx, dy = wy - cy;
      const fwd  = dx * cosA + dy * sinA;
      const side = -dx * sinA + dy * cosA;
      if (fwd < 2) return null;
      return { x: W/2 + (side/fwd)*focal, y: horizon + (eyeH/fwd)*focal, fwd, sc: focal/fwd };
    };

    // ── SKY ──
    const sg = ctx.createLinearGradient(0, 0, 0, horizon);
    sg.addColorStop(0, '#0d1a2a'); sg.addColorStop(0.55, '#1a3a5a'); sg.addColorStop(1, '#3a5a48');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon);

    // Sun (glowing circle in the sky) — positioned based on camYaw
    const sunX = W * 0.5 + Math.sin(this.camYaw) * W * 0.4;
    const sunY = horizon * 0.3;
    if (sunX > -60 && sunX < W + 60) {
      ctx.save();
      ctx.shadowColor = '#ffdd44'; ctx.shadowBlur = 40;
      ctx.fillStyle = '#ffee88';
      ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
      // Sun glow ring
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 60);
      sunGlow.addColorStop(0, 'rgba(255,220,100,0.3)');
      sunGlow.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath(); ctx.arc(sunX, sunY, 60, 0, Math.PI*2); ctx.fill();
    }

    // Distant clouds
    ctx.fillStyle = 'rgba(200,200,175,0.07)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(W*(0.1+i*0.2)+Math.sin(i*1.7)*50, horizon*(0.25+i*0.06), 90+i*12, 18+i*3, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // Far tree-line silhouette
    ctx.fillStyle = '#182e12';
    ctx.beginPath(); ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 12)
      ctx.lineTo(x, horizon - 22 + Math.sin(x*0.022)*20 + Math.sin(x*0.058)*10);
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

    // ── GROUND ──
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0, '#3a4824'); gg.addColorStop(0.3, '#30401c'); gg.addColorStop(0.6, '#2a3815'); gg.addColorStop(1, '#1e2c0e');
    ctx.fillStyle = gg; ctx.fillRect(0, horizon, W, H - horizon);

    // Dirt texture strips — alternating slightly darker patches for variety
    ctx.strokeStyle = 'rgba(20,10,0,0.08)'; ctx.lineWidth = 14;
    for (let z = 30; z <= 600; z += 60) {
      const lp = proj(cx + cosA*z - sinA*400, cy + sinA*z + cosA*400);
      const rp = proj(cx + cosA*z + sinA*400, cy + sinA*z - cosA*400);
      if (!lp || !rp) continue;
      ctx.beginPath(); ctx.moveTo(lp.x, lp.y); ctx.lineTo(rp.x, rp.y); ctx.stroke();
    }

    // Perspective depth grid
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1;
    for (let z = 40; z <= 600; z += 40) {
      const lp = proj(cx + cosA*z - sinA*500, cy + sinA*z + cosA*500);
      const rp = proj(cx + cosA*z + sinA*500, cy + sinA*z - cosA*500);
      if (!lp || !rp) continue;
      ctx.beginPath(); ctx.moveTo(lp.x, lp.y); ctx.lineTo(rp.x, rp.y); ctx.stroke();
    }

    // ── CRATERS (dark ellipses on the ground) ──
    for (const cr of (this.map.craters || [])) {
      const p = proj(cr.x, cr.y);
      if (!p || p.fwd < 5 || p.x < -80 || p.x > W+80) continue;
      const rw = cr.r * p.sc * 2.5, rh = rw * 0.35;
      ctx.fillStyle = 'rgba(15,8,0,0.45)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rw, rh, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,20,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rw, rh, 0, 0, Math.PI*2); ctx.stroke();
    }

    // ── PATH ──
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg+1];
      const ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
      const pw = 28, px = Math.cos(ang)*pw, py = Math.sin(ang)*pw;
      for (let t = 0; t < 10; t++) {
        const t0=t/10, t1=(t+1)/10;
        const x0=a.x+(b.x-a.x)*t0, y0=a.y+(b.y-a.y)*t0;
        const x1=a.x+(b.x-a.x)*t1, y1=a.y+(b.y-a.y)*t1;
        const c = [proj(x0-px,y0-py), proj(x0+px,y0+py), proj(x1+px,y1+py), proj(x1-px,y1-py)];
        if (c.some(p => !p)) continue;
        ctx.fillStyle = (seg+t)%2===0 ? '#7a5520' : '#6a4818';
        ctx.beginPath();
        ctx.moveTo(c[0].x,c[0].y); ctx.lineTo(c[1].x,c[1].y);
        ctx.lineTo(c[2].x,c[2].y); ctx.lineTo(c[3].x,c[3].y);
        ctx.closePath(); ctx.fill();
      }
    }

    // ── TREES + ENEMIES (sorted far→near) ──
    const objs = [];
    for (const tr of this.map.trees) {
      const p = proj(tr.x, tr.y);
      if (p && p.x > -100 && p.x < W+100) objs.push({ kind:'tree', p, tr });
    }
    for (const e of this.enemies) {
      e._3dx = null; // reset each frame
      const p = proj(e.x, e.y);
      if (p) objs.push({ kind:'enemy', p, e });
    }
    // Also add fire positions to the sort list
    for (const f of (this.map.fires || [])) {
      const p = proj(f.x, f.y);
      if (p && p.x > -50 && p.x < W+50) objs.push({ kind:'fire', p, f });
    }
    objs.sort((a,b) => b.p.fwd - a.p.fwd);

    const openB = H * 0.73; // bottom of viewport opening
    const ft3d = Date.now() / 120; // time variable for fire flicker animation
    for (const obj of objs) {
      const { p } = obj;
      if (obj.kind === 'tree') {
        const sz = obj.tr.r * p.sc;
        const gy = Math.min(p.y, openB);
        ctx.fillStyle = '#2a1a06';
        ctx.fillRect(p.x - sz*0.22, gy - sz*2.2, sz*0.44, sz*2.2);
        ctx.fillStyle = '#1e3d18';
        ctx.beginPath(); ctx.arc(p.x, gy - sz*2.2, sz, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2e5a24';
        ctx.beginPath(); ctx.arc(p.x - sz*0.15, gy - sz*2.5, sz*0.72, 0, Math.PI*2); ctx.fill();
        // Atmospheric fog for far trees
        if (p.fwd > 200) {
          const fogAlpha = Math.min(0.7, (p.fwd - 200) / 300);
          ctx.fillStyle = `rgba(100,110,90,${fogAlpha})`;
          const gy2 = Math.min(p.y, openB);
          ctx.beginPath(); ctx.arc(p.x, gy2 - sz*2.2, sz * 1.1, 0, Math.PI*2); ctx.fill();
        }
      } else if (obj.kind === 'fire') {
        // Fire particles — flickering orange triangles
        const { f } = obj;
        const sz = f.size * p.sc * 2.5;
        if (sz < 1) continue;
        const fl = Math.sin(ft3d + f.x*0.1) * 0.3 + 0.7;
        // Glow halo
        ctx.fillStyle = `rgba(255,80,0,${0.35*fl})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, sz*1.8, 0, Math.PI*2); ctx.fill();
        // Bright orange triangle (main flame)
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(p.x - sz*0.5, p.y);
        ctx.lineTo(p.x, p.y - sz*(1.5 + fl*0.5));
        ctx.lineTo(p.x + sz*0.5, p.y);
        ctx.closePath(); ctx.fill();
        // Yellow inner flame
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(p.x - sz*0.25, p.y);
        ctx.lineTo(p.x, p.y - sz*(1.0 + fl*0.3));
        ctx.lineTo(p.x + sz*0.25, p.y);
        ctx.closePath(); ctx.fill();
      } else {
        const { e } = obj;
        const sz = e.size * p.sc * 1.8;
        if (sz < 2) continue;
        const gy = Math.min(p.y, openB);
        const bh = sz * 2.2;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.save(); ctx.translate(p.x+sz*0.3, gy); ctx.scale(1.1, 0.25);
        ctx.beginPath(); ctx.arc(0, 0, sz*1.1, 0, Math.PI*2); ctx.fill(); ctx.restore();
        // Legs
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(p.x-sz*0.5, gy-bh*0.5, sz*0.38, bh*0.52);
        ctx.fillRect(p.x+sz*0.12, gy-bh*0.5, sz*0.38, bh*0.52);
        // Body
        ctx.fillStyle = e.color;
        ctx.fillRect(p.x-sz*0.72, gy-bh, sz*1.44, bh*0.65);
        // Head
        ctx.beginPath(); ctx.arc(p.x, gy-bh-sz*0.6, sz*0.65, 0, Math.PI*2); ctx.fill();
        // HP bar
        const bw = Math.max(sz*2.5, 22);
        ctx.fillStyle = '#111'; ctx.fillRect(p.x-bw/2-1, gy-bh-sz*1.9-1, bw+2, 7);
        ctx.fillStyle = e.hp/e.maxHp > 0.5 ? '#2f2' : '#f82';
        ctx.fillRect(p.x-bw/2, gy-bh-sz*1.9, bw*(e.hp/e.maxHp), 5);
        // Store for _shoot3D click detection
        e._3dx = p.x; e._3dy = gy - bh/2; e._3dr = Math.max(sz*1.3, 20);
        // Atmospheric fog for far enemies
        if (p.fwd > 200) {
          const fogAlpha = Math.min(0.6, (p.fwd - 200) / 400);
          ctx.fillStyle = `rgba(80,90,70,${fogAlpha})`;
          ctx.fillRect(p.x-sz*0.72, gy-bh-sz*1.3, sz*1.44, bh + sz*1.3);
        }
      }
    }

    // ── CASTLE WALL (projected 3D wall at path end) ──
    const pathEnd = this.path[this.path.length - 1];
    const wallP = proj(pathEnd.x, pathEnd.y);
    if (wallP && wallP.x > -200 && wallP.x < W + 200) {
      const wallW = 80 * wallP.sc, wallH = 120 * wallP.sc;
      const wx = wallP.x - wallW / 2, wy = wallP.y - wallH;
      // Wall body
      ctx.fillStyle = '#555055';
      ctx.fillRect(wx, wy, wallW, wallH);
      // Stone texture lines on wall
      ctx.strokeStyle = 'rgba(30,30,30,0.4)'; ctx.lineWidth = 1;
      for (let row = wy; row < wy + wallH; row += wallH/6)
        ctx.strokeRect(wx, row, wallW, wallH/6);
      // Battlements on top
      ctx.fillStyle = '#4a4050';
      const mw = wallW / 5;
      for (let m = 0; m < 5; m += 2) ctx.fillRect(wx + m * mw, wy - mw*0.8, mw*0.9, mw*0.8);
      // Gate arch
      ctx.fillStyle = '#1a1018';
      ctx.beginPath();
      ctx.arc(wallP.x, wy + wallH * 0.55, wallW * 0.2, Math.PI, Math.PI * 2);
      ctx.rect(wallP.x - wallW*0.2, wy + wallH * 0.55, wallW*0.4, wallH*0.45);
      ctx.fill();
    }

    // ── STONE BATTLEMENT FRAME ──
    const openL = W * 0.14, openR = W * 0.86;
    const drawStone = (x1, x2) => {
      ctx.fillStyle = '#4e4e4e'; ctx.fillRect(x1, 0, x2-x1, H);
      ctx.fillStyle = '#5c5c5c'; ctx.fillRect(x1, 0, x2-x1, H);
      ctx.strokeStyle = '#383838'; ctx.lineWidth = 1;
      for (let row = 0; row < H; row += 14) {
        const off = (Math.floor(row/14)%2)*22;
        for (let col = x1-22+off; col < x2+22; col += 44)
          ctx.strokeRect(col, row, 42, 13);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = 0.8;
      for (let row = 0; row < H; row += 14) {
        ctx.beginPath(); ctx.moveTo(x1, row+1); ctx.lineTo(x2, row+1); ctx.stroke();
      }
    };
    drawStone(0, openL); drawStone(openR, W);

    // Crenellations (merlons) on inner edge of walls
    ctx.fillStyle = '#4e4e4e';
    for (let y = 10; y < H*0.55; y += 56) {
      ctx.fillRect(openL-14, y, 20, 32); ctx.fillRect(openR-6, y, 20, 32);
    }
    // Bottom stone sill
    ctx.fillStyle = '#4e4e4e'; ctx.fillRect(0, openB, W, H-openB);
    ctx.fillStyle = '#5c5c5c'; ctx.fillRect(0, openB, W, 10);
    ctx.strokeStyle = '#383838'; ctx.lineWidth = 1;
    for (let col = 0; col < W; col += 48) ctx.strokeRect(col, openB+1, 46, H-openB-2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, openB); ctx.lineTo(W, openB); ctx.stroke();

    // ── CROSSHAIR ──
    const mx2 = W/2, my2 = (horizon + openB)/2;
    ctx.strokeStyle = 'rgba(255,230,80,0.88)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx2-20, my2); ctx.lineTo(mx2-7, my2);
    ctx.moveTo(mx2+7, my2);  ctx.lineTo(mx2+20, my2);
    ctx.moveTo(mx2, my2-20); ctx.lineTo(mx2, my2-7);
    ctx.moveTo(mx2, my2+7);  ctx.lineTo(mx2, my2+20);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,80,0.35)';
    ctx.beginPath(); ctx.arc(mx2, my2, 14, 0, Math.PI*2); ctx.stroke();

    // ── COMPASS (top-center) ──
    const compassCx = W/2, compassCy = 28, compassR = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.arc(compassCx, compassCy, compassR + 4, 0, Math.PI*2); ctx.fill();
    // Draw N/S/E/W markers rotating with camera yaw
    const dirs = [['N', 0], ['E', Math.PI/2], ['S', Math.PI], ['W', -Math.PI/2]];
    for (const [label, baseAngle] of dirs) {
      const angle = baseAngle - this.camYaw - Math.PI/2;
      const lx = compassCx + Math.cos(angle) * compassR;
      const ly = compassCy + Math.sin(angle) * compassR;
      ctx.fillStyle = label === 'N' ? '#ff4444' : '#aaaaaa';
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, lx, ly + 3);
    }
    ctx.textAlign = 'left';

    // ── HUD ──
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(openL+6, 6, 210, 60);
    ctx.fillStyle = tower.color; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`⚔ ${tower.typeKey.toUpperCase()} TOWER`, openL+14, 26);
    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif';
    ctx.fillText('Click=Shoot  •  Drag=Look  •  ESC=Exit', openL+14, 44);
    // Reload bar
    const maxCD = tower.fireRate * 2;
    const pct = tower.manualCooldown > 0 ? 1 - tower.manualCooldown/maxCD : 1;
    ctx.fillStyle = '#222'; ctx.fillRect(openL+14, 52, 180, 8);
    ctx.fillStyle = pct < 1 ? '#f84' : '#2d8'; ctx.fillRect(openL+14, 52, 180*pct, 8);

    // Exit button
    ctx.fillStyle = '#8a0000'; ctx.fillRect(openR-90, 6, 84, 30);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(openR-90, 6, 84, 3);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('✕  EXIT', openR-76, 26);

    // Enemy count
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(openL+6, openB-26, 180, 22);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
    ctx.fillText(`Enemies: ${this.enemies.length}   Wave: ${this.waveManager.wave}/${this.waveManager.levelDef?.waves ?? '?'}`, openL+12, openB-10);

    // Flash message
    if (this.flashTimer > 0) {
      const p = this.flashTimer / 90;
      ctx.fillStyle = `rgba(0,0,0,${p*0.55})`;
      ctx.fillRect(W/2-140, openB-54, 280, 26);
      ctx.fillStyle = `rgba(255,240,80,${p})`;
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(this.flashMsg, W/2, openB-36);
      ctx.textAlign = 'left';
    }
  }

  tryFireManual(x, y) {
    if (!this.selectedTower) return;
    if (this.selectedTower.manualCooldown > 0) { this.flash('Still reloading!'); return; }
    const dx = x - this.selectedTower.x, dy = y - this.selectedTower.y;
    const d = Math.hypot(dx, dy);
    this.projectiles.push(new Projectile({
      x: this.selectedTower.x, y: this.selectedTower.y,
      vx: (dx/d)*12, vy: (dy/d)*12,
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

  // Upgrade a tower from level 1→2 or level 2→3
  tryUpgradeTower(tower) {
    if (tower.level >= 3) { this.flash('Already at MAX LEVEL!'); return; }
    const nextLevel = tower.level + 1;
    const cost = Math.floor(tower.cost * UPGRADE_COST[nextLevel]);
    if (this.money < cost) { this.flash(`Need $${cost} to upgrade!`); return; }
    const mult = UPGRADE_MULT[nextLevel];
    // Apply the upgrade multipliers to the tower's stats
    tower.damage   *= mult.damage;
    tower.range    *= mult.range;
    tower.fireRate  = Math.max(1, Math.floor(tower.fireRate * mult.fireRate));
    tower.level     = nextLevel;
    tower.hp = tower.maxHp; // heal to full on upgrade (nice reward!)
    this.money -= cost;
    this.flash(`Tower upgraded to Level ${nextLevel}! 💪`);
    if (nextLevel === 3) this._grantAchievement('upgrade_max');
    this._updateButtons();
  }

  flash(msg) { this.flashMsg = msg; this.flashTimer = 120; }

  startLevel(levelDef) {
    this.currentLevel = levelDef;
    const variant = levelDef.mapVariant || 0;
    this.path = makePath(this.canvas.width, this.canvas.height, variant);
    this.map  = new GameMap(this.path, this.canvas.width, this.canvas.height);
    const pathEnd = this.path[this.path.length - 1];
    this.castleArcher.x = pathEnd.x - 42;
    this.castleArcher.y = pathEnd.y - 38;
    this.castleArcher.angle = Math.PI;

    this.towers = []; this.enemies = []; this.projectiles = [];
    this.traps = []; this.mines = []; this.guards = []; this.camps = []; this.soldiers = []; this.workerUnits = [];
    this.viewMode = 'flat'; this.viewTower = null;

    // Pre-place 3 mines at the start of each level — try candidate spots until 3 land off-path
    const W = this.canvas.width, H = this.canvas.height;
    const candidates = [
      [0.15, 0.50], [0.45, 0.50], [0.75, 0.50],
      [0.25, 0.35], [0.55, 0.35], [0.85, 0.35],
      [0.25, 0.65], [0.55, 0.65], [0.85, 0.65],
      [0.10, 0.80], [0.50, 0.80], [0.90, 0.80],
    ];
    let placed = 0;
    for (const [fx, fy] of candidates) {
      if (placed >= 3) break;
      const mx = Math.round(W * fx), my = Math.round(H * fy);
      if (!this.map.isOnPath(mx, my)) {
        this.mines.push(new Mine(mx, my));
        placed++;
      }
    }
    this.castleHp = 10000; this.money = 100; this.score = 0;
    this.gameOver = false; this.levelComplete = false;
    this.flashMsg = ''; this.flashTimer = 0;
    this.selectedTower = null;
    this.workers = 0; this.workerTimer = 0;
    this.towerPlaceCount = 0; // reset tower count for this game

    // Reset power-up state for new level
    this.rageTimer = 0; this.shieldTimer = 0; this.timeSlowTimer = 0; this.poisonTimer = 0; this.berserkTimer = 0;
    this.goldBonus = 1.0; this.armorActive = false; this.regenActive = false;
    this.multiShotActive = false; this.bounceActive = false;
    this.swiftSoldiers = false; this.rapidSpawnActive = false;
    // Reset gem upgrade flags (re-applied by _applyGemUpgrades below)
    this.gemFastFire = false; this.gemHeadStart = false;
    this.gemMinerDouble = false; this.gemSoldierDmg = false;
    this.campLimit = 10; // default camp limit
    // Reset tower _savedFireRate flags
    for (const t of this.towers) t._savedFireRate = null;

    this.waveManager.setLevel(levelDef);
    this.selectedType = 'camp_basic'; // default to camp tab for clarity
    // Actually default to first tower type
    this.selectedType = levelDef.towers[0];

    // Apply gem shop permanent upgrades (happens before wheel reward so both stack)
    this._applyGemUpgrades();

    // Apply pending wheel reward (from daily spin)
    if (this.pendingWheelReward) {
      this._applyWheelReward(this.pendingWheelReward);
      this.pendingWheelReward = null;
    }

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
    const id = this.currentLevel.id;
    const nextId = id + 1;
    const saved  = parseInt(localStorage.getItem('td_maxLevel') || '1');
    if (nextId <= LEVELS.length && nextId > saved)
      localStorage.setItem('td_maxLevel', String(nextId));
    const achMap = { 1:'first_win', 2:'soldier', 3:'warrior', 4:'champion', 5:'legend', 10:'veteran', 20:'endure', 25:'master', 50:'unstoppable', 100:'ancient' };
    if (achMap[id]) this._grantAchievement(achMap[id]);
    // Perfect — no castle damage taken!
    if (this.castleHp >= this.castleMaxHp) this._grantAchievement('no_damage');

    // Gem reward for completing a level — higher levels = more gems!
    // Levels 1-5: 1 gem  |  6-20: 2 gems  |  21-50: 3 gems  |  51+: 5 gems
    const gemAmt = id >= 51 ? 5 : id >= 21 ? 3 : id >= 6 ? 2 : 1;
    this._grantGems(gemAmt);
    this.flash(`Level complete! 💎 +${gemAmt} gem${gemAmt > 1 ? 's' : ''}!`);

    this._updateButtons();
  }

  _grantAchievement(id) {
    const ach = JSON.parse(localStorage.getItem('td_achievements') || '[]');
    if (!ach.includes(id)) {
      ach.push(id);
      localStorage.setItem('td_achievements', JSON.stringify(ach));
      // Every new achievement earns 1 gem — gems are rare, celebrate!
      this._grantGems(1);
      this.flash('🏆 Achievement + 💎 1 Gem!');
    }
  }

  // Add gems to the player's balance and save to localStorage
  _grantGems(n) {
    this.gems += n;
    localStorage.setItem('td_gems', String(this.gems));
  }

  // ── UI building ─────────────────────────────────────────────────────────────

  _buildTitleScreen() {
    const maxUnlocked = parseInt(localStorage.getItem('td_maxLevel') || '1');
    const achUnlocked = JSON.parse(localStorage.getItem('td_achievements') || '[]');

    // Draw map background
    this._drawTitleBg();

    const levelsDiv = document.getElementById('ts-levels');
    levelsDiv.innerHTML = '';
    for (const lvl of LEVELS) {
      const locked = lvl.id > maxUnlocked;
      const btn = document.createElement('button');
      btn.className = 'ts-lvl-btn' + (locked ? ' locked' : ' unlocked') +
                      (this.selectedLevelId === lvl.id && !locked ? ' selected' : '');
      btn.dataset.lvlId = lvl.id;
      btn.title = `${lvl.name}: ${lvl.desc} (${lvl.waves} waves)`;
      btn.innerHTML = `<div class="lv-num">LV${lvl.id}</div>
        <div class="lv-name">${lvl.name.replace(/ \d+$/, '')}</div>
        ${locked ? '<div style="font-size:12px">🔒</div>' : ''}`;
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

    const achDiv = document.getElementById('ts-achievements');
    achDiv.innerHTML = '';
    for (const ach of ACHIEVEMENTS) {
      const div = document.createElement('div');
      div.className = 'ts-ach' + (achUnlocked.includes(ach.id) ? ' unlocked' : '');
      div.textContent = `${ach.icon} ${ach.name}`;
      div.title = ach.desc;
      achDiv.appendChild(div);
    }

    const playBtn = document.getElementById('ts-play-btn');
    playBtn.textContent = `▶ PLAY LEVEL ${this.selectedLevelId}`;
    playBtn.onclick = () => {
      const lvl = LEVELS.find(l => l.id === this.selectedLevelId);
      if (lvl) this.startLevel(lvl);
    };

    // Show gem balance and legend title
    const gemBal = document.getElementById('gem-balance');
    if (gemBal) gemBal.textContent = `💎 ${this.gems} Gem${this.gems !== 1 ? 's' : ''}`;

    // Show ✦LEGEND✦ badge if purchased
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    let legendEl = document.getElementById('ts-legend-badge');
    if (purchases.includes('gem_legend')) {
      if (!legendEl) {
        legendEl = document.createElement('div');
        legendEl.id = 'ts-legend-badge';
        legendEl.style.cssText = 'font-size:14px;font-weight:bold;color:#ffd700;letter-spacing:2px;margin-bottom:6px;text-shadow:0 0 10px rgba(255,215,0,0.7);';
        legendEl.textContent = '✦ LEGEND ✦';
        document.querySelector('.ts-title').after(legendEl);
      }
    }

    // Gem shop button toggle
    const gemBtn = document.getElementById('ts-gem-btn');
    if (gemBtn) {
      gemBtn.onclick = () => {
        const panel = document.getElementById('gem-shop-panel');
        if (!panel) return;
        const showing = panel.style.display !== 'none';
        panel.style.display = showing ? 'none' : 'block';
        gemBtn.textContent = showing ? '💎 GEM SHOP' : '💎 GEM SHOP ▲';
        if (!showing) this._buildGemShop();
      };
    }

    // Add or update the daily wheel button
    let wheelBtn = document.getElementById('ts-wheel-btn');
    if (!wheelBtn) {
      wheelBtn = document.createElement('button');
      wheelBtn.id = 'ts-wheel-btn';
      wheelBtn.style.cssText = 'margin-top:10px;padding:10px 28px;font-size:16px;font-weight:bold;background:#334488;color:#fff;border:2px solid #6688ff;border-radius:8px;cursor:pointer;letter-spacing:1px;';
      wheelBtn.onclick = () => {
        document.getElementById('title-screen').style.display = 'none';
        this.titleActive = false;
        this.wheelOpen = true;
      };
      playBtn.parentNode.insertBefore(wheelBtn, playBtn.nextSibling);
    }
    // Always refresh text so "done" state is current (even after returning from a spin)
    const alreadySpun = localStorage.getItem('td_last_spin') === new Date().toDateString();
    wheelBtn.textContent = alreadySpun ? '🎡 Daily Spin (done today)' : '🎡 DAILY SPIN';
    wheelBtn.style.opacity = alreadySpun ? '0.5' : '1';
  }

  _drawTitleBg() {
    const bgCanvas = document.getElementById('title-bg');
    if (!bgCanvas) return;
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const ctx = bgCanvas.getContext('2d');
    const W = bgCanvas.width, H = bgCanvas.height;
    const path = makePath(W, H, 0);

    ctx.fillStyle = '#1a3810'; ctx.fillRect(0, 0, W, H);

    // Grass variation
    const seed = 42;
    for (let i = 0; i < 300; i++) {
      const xi = ((seed * i * 1234567 + 891011) % 100000) / 100000;
      const yi = ((seed * i * 9876543 + 112233) % 100000) / 100000;
      ctx.fillStyle = i % 3 === 0 ? '#2a5820' : i % 3 === 1 ? '#1e4a18' : '#356628';
      ctx.beginPath(); ctx.arc(xi * W, yi * H, 3 + (i % 5) * 4, 0, Math.PI*2); ctx.fill();
    }

    // Path shadow
    ctx.strokeStyle = '#1a0a05'; ctx.lineWidth = 56; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.strokeStyle = '#6a3810'; ctx.lineWidth = 44;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.strokeStyle = '#a06030'; ctx.lineWidth = 30;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';

    // Trees (deterministic positions)
    for (let i = 0; i < 28; i++) {
      const xi = ((seed * i * 777777 + 333333) % 100000) / 100000;
      const yi = ((seed * i * 888888 + 444444) % 100000) / 100000;
      const tx = xi * W, ty = yi * H;
      const r = 14 + (i % 4) * 5;
      let onPath = false;
      for (let j = 0; j < path.length - 1 && !onPath; j++) {
        const a = path[j], b = path[j+1];
        const dx = b.x-a.x, dy = b.y-a.y, len2 = dx*dx+dy*dy;
        const t = Math.max(0, Math.min(1, ((tx-a.x)*dx+(ty-a.y)*dy)/len2));
        if (Math.hypot(tx-(a.x+t*dx), ty-(a.y+t*dy)) < 50) onPath = true;
      }
      if (!onPath) {
        ctx.fillStyle = '#0e2a10';
        ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a4018';
        ctx.beginPath(); ctx.arc(tx-r*0.15, ty-r*0.2, r*0.75, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2a6028';
        ctx.beginPath(); ctx.arc(tx-r*0.25, ty-r*0.38, r*0.45, 0, Math.PI*2); ctx.fill();
      }
    }

    // Dark vignette overlay
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H);
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

    // No mine button — mines are pre-placed only (players can't buy them)

    // 5 camp type buttons (one per camp type)
    for (const [typeName, cfg] of Object.entries(CAMP_TYPES)) {
      const btn = document.createElement('button');
      btn.id = 'btn-camp_' + typeName;
      btn.className = 'btn' + (this.selectedType === 'camp_' + typeName ? ' selected' : '');
      btn.style.background = cfg.color;
      btn.style.outline = '2px solid #ffd700';
      btn.textContent = cfg.label;
      btn.onclick = () => this._selectType('camp_' + typeName);
      ui.appendChild(btn);
    }

    const wBtn = document.createElement('button');
    wBtn.id = 'btn-worker';
    wBtn.className = 'btn';
    wBtn.style.background = '#7a4a1a';
    wBtn.onclick = () => this.hireWorker();
    ui.appendChild(wBtn);

    // Shop button
    const shopBtn = document.createElement('button');
    shopBtn.id = 'btn-shop';
    shopBtn.className = 'btn';
    shopBtn.style.background = '#442266';
    shopBtn.style.outline = '2px solid #cc66ff';
    shopBtn.textContent = '🛒 SHOP (P)';
    shopBtn.onclick = () => { this.shopOpen = !this.shopOpen; };
    ui.appendChild(shopBtn);

    this._updateButtons();
  }

  _selectType(key) {
    if (this.viewMode === '3d-soldier') this._exit3DSoldier();
    this.selectedTower = null; // exit manual-shot mode when switching tool
    this.selectedType = key;
    // Build the list of all button IDs to update
    const campKeys = Object.keys(CAMP_TYPES).map(n => 'camp_' + n);
    const allKeys = [...this.typeKeys, ...this.trapKeys.map(k => 'trap_' + k), ...campKeys];
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
    // Update all 5 camp type buttons
    for (const [typeName, cfg] of Object.entries(CAMP_TYPES)) {
      const btn = document.getElementById('btn-camp_' + typeName);
      const canAfford = this.money >= cfg.cost && this.camps.length < 10;
      if (btn) btn.style.opacity = canAfford ? '0.9' : '0.35';
    }
    const wBtn = document.getElementById('btn-worker');
    if (wBtn) {
      wBtn.style.opacity = this.money >= 35 && this.workers < 5 ? '0.9' : '0.35';
      wBtn.textContent = `W Worker $35 (${this.workers}/5)`;
    }
  }

  _setupInput() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      this.mouse.x = mx;
      this.mouse.y = e.clientY - rect.top;

      // Camera drag rotation — only active while dragging in a 3D view
      if (this._3dDragging && (this.viewMode === '3d' || this.viewMode === '3d-soldier')) {
        const delta = mx - this._3dDragLastX;
        this._3dDragLastX = mx;
        this.camYaw += delta * 0.005; // 0.005 rad per pixel — tweak for feel
      }
    });

    this.canvas.addEventListener('mousedown', e => {
      if (this.viewMode === '3d' || this.viewMode === '3d-soldier') {
        const rect = this.canvas.getBoundingClientRect();
        this._3dDragging    = true;
        this._3dDragLastX   = e.clientX - rect.left;
        this._3dDragStartX  = e.clientX - rect.left; // track total drag distance
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this._3dDragging = false;
    });

    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;

      // Handle wheel clicks even from title screen
      if (this.wheelOpen) { this._handleWheelClick(x, y); return; }

      if (this.gameOver || this.levelComplete || this.titleActive) return;

      // If shop is open, handle shop clicks
      if (this.shopOpen) { this._handleShopClick(x, y); return; }

      // 3D view: exit button or shoot — but suppress if user was rotating camera
      if (this.viewMode === '3d') {
        const openR = this.canvas.width * 0.86;
        if (x > openR - 94 && x < openR + 2 && y > 6 && y < 36) { this._exit3D(); return; }
        // Ignore click if it was a drag rotation (moved > 6px horizontally)
        if (Math.abs(x - (this._3dDragStartX ?? x)) > 6) return;
        this._shoot3D(x, y);
        return;
      }
      // 3D soldier view: exit button or attack
      if (this.viewMode === '3d-soldier') {
        const W = this.canvas.width, openR = W * 0.86;
        if (x > openR - 94 && y < 42) { this._exit3DSoldier(); return; }
        if (Math.abs(x - (this._3dDragStartX ?? x)) > 6) return;
        this._attack3DSoldier(x, y);
        return;
      }
      // Click on soldier → enter 3D soldier view
      const clickedSoldier = this.soldiers.find(s => Math.hypot(s.x-x, s.y-y) < 16);
      if (clickedSoldier) { this._enter3DSoldier(clickedSoldier); return; }

      // Click on tower → check for upgrade panel click, or enter 3D view
      if (this.selectedTower) {
        // Check if clicked the upgrade button area (drawn in _drawHUD)
        if (this._checkUpgradeClick(x, y)) return;
        this.tryFireManual(x, y); return;
      }
      if (this.trySelectTower(x, y)) return;
      if (this.selectedType === 'mine')  { this.tryPlaceMine(x, y); return; }
      // Camp types are named 'camp_basic', 'camp_archer', etc.
      if (this.selectedType.startsWith('camp_')) { this.tryPlaceCamp(x, y); return; }
      if (this.selectedType.startsWith('trap_')) { this.tryPlaceTrap(x, y); }
      else { this.tryPlaceTower(x, y); }
    });

    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.gameOver || this.levelComplete || this.titleActive) return;
      if (this.viewMode === '3d-soldier') { this._toggleBlock3DSoldier(); return; }
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const tower = this.towers.find(t => distance(t, { x, y }) < 20);
      if (tower) { this.sellTower(tower); return; }
      const trap = this.traps.find(t => Math.hypot(t.x-x, t.y-y) < 22);
      if (trap) { this.sellTrap(trap); return; }
      const mine = this.mines.find(m => Math.hypot(m.x-x, m.y-y) < 22);
      if (mine) {
        const refund = Math.floor(MINE.cost / 2);
        this.money = Math.min(this.money + refund, MAX_MONEY);
        this.mines = this.mines.filter(m2 => m2 !== mine);
        this._assignWorkers();
        this.flash(`Mine sold for $${refund}`);
        this._updateButtons();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'r' || e.key === 'R') { this.restart(); return; }
      // P key toggles the shop
      if (e.key === 'p' || e.key === 'P') {
        if (!this.titleActive) { this.shopOpen = !this.shopOpen; return; }
      }
      if (e.key === 'Escape') {
        if (this.shopOpen)  { this.shopOpen  = false; return; }
        if (this.wheelOpen) {
          this.wheelOpen = false;
          if (!this.currentLevel) {
            this.titleActive = true;
            document.getElementById('title-screen').style.display = 'flex';
          }
          return;
        }
        if (this.viewMode === '3d-soldier') { this._exit3DSoldier(); return; }
        if (this.viewMode === '3d') { this._exit3D(); return; }
        this.selectedTower = null; return;
      }
      if (e.code === 'Space' && this.viewMode === '3d-soldier') { e.preventDefault(); this.viewSoldier?.jump(); return; }
      if (this.shopOpen || this.wheelOpen) return; // don't handle hotkeys while overlays are open
      const allowedTowers = this.currentLevel ? this.currentLevel.towers : this.typeKeys;
      const allowedTraps  = this.currentLevel ? this.currentLevel.traps  : this.trapKeys;
      const i = parseInt(e.key) - 1;
      if (i >= 0 && i < allowedTowers.length) {
        this._selectType(allowedTowers[i]);
      } else {
        const ti = i - allowedTowers.length;
        if (ti >= 0 && ti < allowedTraps.length) this._selectType('trap_' + allowedTraps[ti]);
      }
    });
  }

  // ── Draw helpers ─────────────────────────────────────────────────────────────

  _drawCastleArcher() {
    const ca = this.castleArcher, ctx = this.ctx;
    const hcy = ca.y - 3;
    ctx.fillStyle = '#888'; ctx.fillRect(ca.x-5, hcy+4, 10, 10);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(ca.x-2, hcy-2, 4, 5);
    ctx.beginPath(); ctx.arc(ca.x, hcy-6, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#666';
    ctx.beginPath(); ctx.arc(ca.x, hcy-6, 4, Math.PI, Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(ca.x, hcy-4); ctx.rotate(ca.angle);
    ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(2,-7); ctx.quadraticCurveTo(16,0,2,7); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(2,-7); ctx.lineTo(2,7); ctx.stroke();
    if (ca.fireTimer > 0) {
      ctx.strokeStyle = '#c8b860'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(18,0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(18,2); ctx.lineTo(22,0); ctx.closePath(); ctx.fill();
    }
    ctx.lineCap = 'butt'; ctx.restore();
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
      this.ctx.arc(this.selectedTower.x, this.selectedTower.y, 24, -Math.PI/2, -Math.PI/2 + Math.PI*2*progress);
      this.ctx.stroke(); this.ctx.lineCap = 'butt';
    }
    this.ctx.strokeStyle = reloading ? 'rgba(255,100,50,0.5)' : 'rgba(255,255,255,0.6)';
    this.ctx.lineWidth = 1; this.ctx.setLineDash([6,4]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.selectedTower.x, this.selectedTower.y);
    this.ctx.lineTo(this.mouse.x, this.mouse.y);
    this.ctx.stroke(); this.ctx.setLineDash([]);
  }

  _drawHUD() {
    const ctx = this.ctx;
    const hpFrac = this.castleHp / this.castleMaxHp;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(9, 5, 182, 16);
    ctx.fillStyle = hpFrac > 0.5 ? '#2288ff' : hpFrac > 0.25 ? '#ff9900' : '#ff3333';
    ctx.fillRect(10, 6, 180 * hpFrac, 14);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(10, 6, 180, 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`Castle  ${Math.ceil(this.castleHp)} / ${this.castleMaxHp}`, 14, 16);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fff';    ctx.fillText(`Kills: ${this.score}`, 200, 22);
    ctx.fillStyle = '#ffd700'; ctx.fillText(`$${this.money}`, 305, 22);
    ctx.fillStyle = '#7df';    ctx.fillText(`Wave: ${this.waveManager.wave}${this.currentLevel ? '/'+this.currentLevel.waves : ''}`, 375, 22);
    ctx.fillStyle = 'rgba(255,215,0,0.85)';
    ctx.fillText(`Mines:${this.mines.length}  Workers:${this.workers}/5`, 490, 22);
    if (this.currentLevel) {
      ctx.fillStyle = 'rgba(180,180,255,0.8)';
      ctx.fillText(`LV${this.currentLevel.id} ${this.currentLevel.name}`, this.canvas.width - 180, 22);
    }

    // Active power-up indicators
    let px = 700;
    ctx.font = 'bold 12px sans-serif';
    if (this.rageTimer     > 0) { ctx.fillStyle='#ff6600'; ctx.fillText(`🔥RAGE ${Math.ceil(this.rageTimer/60)}s`, px, 22); px += 90; }
    if (this.shieldTimer   > 0) { ctx.fillStyle='#88aaff'; ctx.fillText(`🛡 ${Math.ceil(this.shieldTimer/60)}s`, px, 22); px += 60; }
    if (this.timeSlowTimer > 0) { ctx.fillStyle='#aabbff'; ctx.fillText(`⏳SLOW ${Math.ceil(this.timeSlowTimer/60)}s`, px, 22); px += 90; }
    if (this.poisonTimer   > 0) { ctx.fillStyle='#88ff44'; ctx.fillText(`☠POISON ${Math.ceil(this.poisonTimer/60)}s`, px, 22); }

    // Gem balance shown in-game so players know what they've earned
    ctx.fillStyle = '#88eeff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`💎 ${this.gems}`, this.canvas.width - 80, 38);

    // P=Shop hint in the HUD
    ctx.fillStyle = 'rgba(200,150,255,0.7)';
    ctx.font = '11px sans-serif';
    ctx.fillText('P=Shop', this.canvas.width - 60, 52);

    // ── Upgrade panel (shown when a tower is selected) ──────────────────────
    if (this.selectedTower) {
      const t = this.selectedTower;
      const W = this.canvas.width;
      const panelW = 220, panelH = 40, panelX = W/2 - panelW/2, panelY = this.canvas.height - 56;

      // Remember the upgrade panel bounds so click handler can check them
      this._upgradePanelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(panelX - 4, panelY - 4, panelW + 8, panelH + 8);

      if (t.level >= 3) {
        // Already max level
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ MAX LEVEL ⭐', W/2, panelY + 26);
        ctx.textAlign = 'left';
      } else {
        const nextLevel = t.level + 1;
        const cost = Math.floor(t.cost * UPGRADE_COST[nextLevel]);
        const canAfford = this.money >= cost;
        // Draw the upgrade button
        ctx.fillStyle = canAfford ? '#224422' : '#442222';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = canAfford ? '#44ff44' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        ctx.fillStyle = canAfford ? '#aaffaa' : '#ffaaaa';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⬆ UPGRADE to Lv${nextLevel}: $${cost}`, W/2, panelY + 25);
        ctx.textAlign = 'left';
      }
    } else {
      this._upgradePanelBounds = null;
    }
  }

  // Check if a click lands on the upgrade button panel
  _checkUpgradeClick(x, y) {
    const b = this._upgradePanelBounds;
    if (!b) return false;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (this.selectedTower) this.tryUpgradeTower(this.selectedTower);
      return true;
    }
    return false;
  }

  _drawBreakOverlay() {
    if (!this.waveManager.inBreak || this.gameOver || this.levelComplete) return;
    const ctx = this.ctx;
    const sec  = Math.ceil(this.waveManager.breakTimer / 60);
    const wave = this.waveManager.wave;
    const maxW = this.currentLevel ? this.currentLevel.waves : '?';
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7df'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText(wave === 0 ? 'Place your towers and camps!' : `Wave ${wave}/${maxW} cleared!`, this.canvas.width/2, this.canvas.height/2-20);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Wave ${wave+1} starts in ${sec}...`, this.canvas.width/2, this.canvas.height/2+20);
    ctx.fillStyle = 'rgba(255,215,0,0.6)'; ctx.font = '14px sans-serif';
    ctx.fillText('Tip: Place Camps to spawn soldiers! Press P to open the Shop for power-ups!', this.canvas.width/2, this.canvas.height/2+55);
    ctx.textAlign = 'left';
  }

  _drawFlash() {
    if (this.flashTimer <= 0) return;
    this.ctx.fillStyle = `rgba(255,80,80,${this.flashTimer/120})`;
    this.ctx.font = 'bold 22px sans-serif'; this.ctx.textAlign = 'center';
    this.ctx.fillText(this.flashMsg, this.canvas.width/2, this.canvas.height/2);
    this.ctx.textAlign = 'left';
  }

  _drawHint() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.35)'; this.ctx.font = '13px sans-serif';
    let hint;
    if (this.selectedTower) {
      hint = 'Click to shoot · Esc to release · right-click to sell';
    } else if (this.selectedType === 'mine') {
      hint = 'Click grass to place mine · hire Workers to collect gold automatically';
    } else if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      hint = TRAPS[key].onPath === false
        ? 'Click off road to place wall · right-click to sell'
        : 'Click glowing road to place trap · right-click to sell';
    } else if (this.selectedType.startsWith('camp_')) {
      hint = 'Click off road to place camp · right-click to sell · P=Shop';
    } else {
      hint = '1-8 towers · traps · W worker · P=Shop · right-click sell · R = menu';
    }
    this.ctx.fillText(hint, this.canvas.width/2-320, 22);
  }

  _drawGameOver() {
    if (!this.gameOver) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 64px sans-serif';
    ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2-30);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Survived ${this.waveManager.wave} waves  •  ${this.score} kills`, this.canvas.width/2, this.canvas.height/2+20);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '18px sans-serif';
    ctx.fillText('Press R to return to the menu', this.canvas.width/2, this.canvas.height/2+60);
    ctx.textAlign = 'left';
  }

  _drawLevelComplete() {
    if (!this.levelComplete) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 58px sans-serif';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width/2, this.canvas.height/2-40);
    ctx.fillStyle = '#7df'; ctx.font = '26px sans-serif';
    ctx.fillText(`${this.currentLevel.name} cleared  •  ${this.score} kills`, this.canvas.width/2, this.canvas.height/2+10);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '18px sans-serif';
    const nxt = LEVELS.find(l => l.id === this.currentLevel.id + 1);
    ctx.fillText(nxt ? `Level ${nxt.id} — "${nxt.name}" unlocked!` : 'You beat all 100 levels! Legendary!', this.canvas.width/2, this.canvas.height/2+48);
    ctx.fillText('Press R to return to the menu', this.canvas.width/2, this.canvas.height/2+82);
    ctx.textAlign = 'left';
  }

  // ── Shop overlay ─────────────────────────────────────────────────────────────
  // Draws a big panel with all shop items in a 5-column grid
  _drawShop() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    // Dark background overlay
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    // Panel
    const panW = Math.min(W - 40, 820), panH = Math.min(H - 40, 600);
    const panX = (W - panW) / 2, panY = (H - panH) / 2;
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(panX, panY, panW, panH);
    ctx.strokeStyle = '#aa66ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(panX, panY, panW, panH);

    // Title
    ctx.fillStyle = '#cc88ff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔ SHOP', W/2, panY + 38);
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Gold: $${this.money}   •   Press P or ESC to close`, W/2, panY + 60);
    ctx.textAlign = 'left';

    // Draw items in a 5-column grid
    const cols = 5;
    const itemW = (panW - 40) / cols;
    const itemH = 90;
    const startX = panX + 20;
    const startY = panY + 72;

    // Store item bounds for click detection
    this._shopItemBounds = [];

    SHOP_ITEMS.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix = startX + col * itemW;
      const iy = startY + row * itemH;

      // Skip items that would go out of the panel
      if (iy + itemH > panY + panH - 10) return;

      const canAfford = this.money >= item.cost;
      // Different border colors for different categories
      const catColors = { ally:'#4488ff', power:'#ff6644', upgrade:'#44cc44', special:'#ffaa00' };
      const borderCol = catColors[item.category] || '#888';

      // Item background
      ctx.fillStyle = canAfford ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.4)';
      ctx.fillRect(ix + 2, iy + 2, itemW - 6, itemH - 6);
      ctx.strokeStyle = canAfford ? borderCol : '#444';
      ctx.lineWidth = canAfford ? 2 : 1;
      ctx.strokeRect(ix + 2, iy + 2, itemW - 6, itemH - 6);

      // Icon (big emoji)
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, ix + itemW/2, iy + 28);

      // Name
      ctx.fillStyle = canAfford ? '#fff' : '#888';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(item.name, ix + itemW/2, iy + 46);

      // Cost
      ctx.fillStyle = canAfford ? '#ffd700' : '#886600';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`$${item.cost}`, ix + itemW/2, iy + 60);

      // Description (tiny text)
      ctx.fillStyle = 'rgba(200,200,200,0.6)';
      ctx.font = '8px sans-serif';
      ctx.fillText(item.desc, ix + itemW/2, iy + 74);

      ctx.textAlign = 'left';

      // Remember bounds for clicks
      this._shopItemBounds.push({ item, x: ix + 2, y: iy + 2, w: itemW - 6, h: itemH - 6 });
    });

    // Close button
    ctx.fillStyle = '#882222';
    ctx.fillRect(panX + panW - 40, panY + 6, 34, 28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', panX + panW - 23, panY + 25);
    ctx.textAlign = 'left';
    this._shopCloseBounds = { x: panX + panW - 40, y: panY + 6, w: 34, h: 28 };
  }

  // Handle a click inside the shop overlay
  _handleShopClick(x, y) {
    // Close button
    const cb = this._shopCloseBounds;
    if (cb && x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
      this.shopOpen = false; return;
    }
    // Item click
    if (!this._shopItemBounds) return;
    for (const b of this._shopItemBounds) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this._buyShopItem(b.item);
        return;
      }
    }
  }

  // Buy a shop item and apply its effect
  _buyShopItem(item) {
    if (this.money < item.cost) { this.flash(`Need $${item.cost}!`); return; }
    this.money -= item.cost;
    this.shopBuyCount++;
    if (this.shopBuyCount >= 5) this._grantAchievement('shop_buyer');
    this._updateButtons();
    this.flash(`Bought ${item.name}!`);

    // Apply the item's effect based on its ID
    switch (item.id) {
      // ── Allies ──────────────────────────────────────────────────────────────
      case 'ally_dragon':
      case 'ally_griffin': {
        // Spawn 1 powerful friendly soldier near the castle
        const pathEnd = this.path[this.path.length - 1];
        const s = new Soldier(pathEnd.x - 30, pathEnd.y - 20, { soldierHp: 200, soldierDmg: 30 });
        s.waypoint = this.path.length - 1; s.speed = 1.8;
        this.soldiers.push(s); break;
      }
      case 'ally_knight': {
        // Spawn 3 knights
        const pathEnd = this.path[this.path.length - 1];
        for (let i = 0; i < 3; i++) {
          const s = new Soldier(pathEnd.x - 20 + i*15, pathEnd.y - 15, { soldierHp: 100, soldierDmg: 15 });
          s.waypoint = this.path.length - 1;
          this.soldiers.push(s);
        }
        break;
      }
      case 'ally_wizard':
      case 'ally_golem': {
        const pathEnd = this.path[this.path.length - 1];
        const hp = item.id === 'ally_golem' ? 300 : 60;
        const dmg = item.id === 'ally_golem' ? 10 : 25;
        const s = new Soldier(pathEnd.x - 30, pathEnd.y - 20, { soldierHp: hp, soldierDmg: dmg });
        s.waypoint = this.path.length - 1; s.speed = item.id === 'ally_golem' ? 0.5 : 1.2;
        this.soldiers.push(s); break;
      }
      // ── Power-ups ────────────────────────────────────────────────────────────
      case 'pow_airstrike':
      case 'pow_meteor': {
        // Bomb all enemies for big damage
        const dmg = item.id === 'pow_meteor' ? 999 : 30;
        for (const e of this.enemies) e.takeDamage(dmg);
        this.flash(`💥 ${item.name}! All enemies take ${dmg} damage!`); break;
      }
      case 'pow_freeze': {
        // Freeze all enemies for 5 seconds (300 frames)
        this.timeSlowTimer = 300;
        for (const e of this.enemies) { e._slowApplied = false; } // reset so slow gets re-applied
        this.flash('❄️ All enemies frozen for 5 seconds!');
        this._grantAchievement('freeze'); break;
      }
      case 'pow_heal': {
        const healAmt = Math.floor(this.castleMaxHp * 0.2);
        this.castleHp = Math.min(this.castleHp + healAmt, this.castleMaxHp);
        this.flash(`🏰 Castle repaired! +${healAmt} HP`); break;
      }
      case 'pow_gold': {
        this.money = Math.min(this.money + 150, MAX_MONEY);
        this.flash('💰 +150 Gold!'); this._updateButtons(); break;
      }
      case 'pow_rage': {
        this.rageTimer = 30 * 60; // 30 seconds
        this.flash('🔥 Tower Rage! All towers fire 2x faster for 30s!'); break;
      }
      case 'pow_shield': {
        this.shieldTimer = 10 * 60; // 10 seconds
        this.flash('🛡️ Castle Shield! Invincible for 10s!'); break;
      }
      case 'pow_lightning': {
        // Strike 10 random enemies
        const targets = [...this.enemies].sort(() => Math.random()-0.5).slice(0, 10);
        for (const e of targets) e.takeDamage(20);
        this.flash(`⚡ Chain Lightning! Hit ${targets.length} enemies!`); break;
      }
      case 'pow_poison': {
        this.poisonTimer = 5 * 60; // 5 seconds of poison
        this.flash('☠️ Poison Cloud! All enemies poisoned!'); break;
      }
      case 'pow_time': {
        this.timeSlowTimer = 20 * 60;
        for (const e of this.enemies) { e._slowApplied = false; }
        this.flash('⏳ Time Slow! Enemies at half speed for 20s!'); break;
      }
      // ── Permanent upgrades ────────────────────────────────────────────────────
      case 'upg_dmg': {
        for (const t of this.towers) t.damage *= 1.25;
        this.flash('💥 All towers +25% damage!'); break;
      }
      case 'upg_range': {
        for (const t of this.towers) t.range *= 1.2;
        this.flash('🎯 All towers +20% range!'); break;
      }
      case 'upg_gold': {
        this.goldBonus *= 1.3;
        this.flash('🪙 +30% gold from kills!'); break;
      }
      case 'upg_castle': {
        const oldMax = this.castleMaxHp;
        this.castleMaxHp = Math.floor(this.castleMaxHp * 1.5);
        this.castleHp += (this.castleMaxHp - oldMax); // add the extra HP
        this.flash('🏯 Castle reinforced! +50% max HP!'); break;
      }
      case 'upg_speed': {
        this.swiftSoldiers = true;
        for (const s of this.soldiers) s.speed *= 1.5;
        this.flash('👟 Soldiers move 50% faster!'); break;
      }
      case 'upg_spawn': {
        this.rapidSpawnActive = true;
        this.flash('⏱️ Rapid Training! Camps spawn 2x faster!'); break;
      }
      case 'upg_armor': {
        this.armorActive = true;
        this.flash('🛡 Tower Armor! Towers take 50% less damage!'); break;
      }
      case 'upg_bounce': {
        this.bounceActive = true;
        // Mark all current towers so their projectiles bounce to a second enemy
        for (const t of this.towers) t.bounceShot = true;
        this.flash('🏹 Bouncing Arrows! Projectiles now bounce to a second target!'); break;
      }
      case 'upg_multi': {
        this.multiShotActive = true;
        // Mark all current towers so they fire 2 projectiles each shot
        for (const t of this.towers) t.multiShot = true;
        this.flash('🌟 Multishot! All towers now fire 2 projectiles!'); break;
      }
      case 'upg_regen': {
        this.regenActive = true;
        this.flash('💚 HP Regen! Towers slowly heal over time!'); break;
      }
      // ── Special items ──────────────────────────────────────────────────────────
      case 'sp_nuke': {
        const killed = this.enemies.length;
        for (const e of this.enemies) e.takeDamage(99999);
        this.flash(`💣 NUCLEAR OPTION! ${killed} enemies destroyed!`);
        this._grantAchievement('nuke'); break;
      }
      case 'sp_angel': {
        this.shieldTimer = 60 * 60; // 60 seconds
        this.flash('👼 Angel Guard! Castle invincible for 60s!'); break;
      }
      case 'sp_chest': {
        const reward = 50 + Math.floor(Math.random() * 451); // 50 to 500
        this.money = Math.min(this.money + reward, MAX_MONEY);
        this.flash(`🎁 Treasure Chest! Found $${reward}!`);
        this._updateButtons(); break;
      }
      case 'sp_clone': {
        // Clone the selected tower (or first tower if none selected)
        const src = this.selectedTower || this.towers[0];
        if (!src) { this.flash('No tower to clone!'); break; }
        // Place clone at a random offset so it doesn't overlap the original
        const angle = Math.random() * Math.PI * 2;
        const clone = new Tower(src.x + Math.cos(angle)*55, src.y + Math.sin(angle)*55, src.typeKey);
        clone.damage = src.damage; clone.range = src.range; clone.fireRate = src.fireRate; clone.level = src.level;
        this.towers.push(clone);
        this.flash('🔮 Tower cloned!'); break;
      }
      case 'sp_berserk': {
        // Enemies attack each other — simulate by having them take random damage
        const duration = 15 * 60;
        this.berserkTimer = duration;
        this.flash('😤 Berserker Mode! Enemies fight each other!'); break;
      }
      default:
        this.flash(`${item.icon} ${item.name} activated!`);
    }
  }

  // ── Daily Wheel ───────────────────────────────────────────────────────────────
  // Prize list for the spinning wheel
  _getWheelPrizes() {
    return [
      { label:'+200g',    icon:'💰', color:'#ffd700' },
      { label:'+100g',    icon:'💵', color:'#ffaa00' },
      { label:'+50g',     icon:'🪙', color:'#cc8800' },
      { label:'Airstrike',icon:'✈️', color:'#4488ff' },
      { label:'Freeze',   icon:'❄️', color:'#88ddff' },
      { label:'+1 Life',  icon:'❤️', color:'#ff4444' },
      { label:'+3 Lives', icon:'💖', color:'#ff88aa' },
      { label:'Nothing',  icon:'😢', color:'#666666' },
      { label:'+500g',    icon:'🤑', color:'#ffff00' },
      { label:'Dragon!',  icon:'🐉', color:'#44cc44' },
      // Rare gem prizes — only 2 slots out of 12 so they're hard to land on!
      { label:'+1 Gem',   icon:'💎', color:'#2288cc' },
      { label:'+3 Gems',  icon:'💎', color:'#0044aa' },
    ];
  }

  // Draw the spinning wheel overlay
  _drawWheel() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const prizes = this._getWheelPrizes();
    const sliceAngle = (Math.PI * 2) / prizes.length;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎡 DAILY SPIN', W/2, H/2 - 200);

    const cx = W/2, cy = H/2 - 30, radius = 160;

    // Draw each pie slice
    for (let i = 0; i < prizes.length; i++) {
      const startA = this.wheelAngle + i * sliceAngle;
      const endA   = startA + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = prizes[i].color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label in the slice
      const midA = startA + sliceAngle / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(midA) * radius * 0.65, cy + Math.sin(midA) * radius * 0.65);
      ctx.rotate(midA + Math.PI/2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(prizes[i].label, 0, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2);
    ctx.fillStyle = '#333'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();

    // Pointer arrow (at the top of the wheel)
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 10);
    ctx.lineTo(cx - 12, cy - radius + 14);
    ctx.lineTo(cx + 12, cy - radius + 14);
    ctx.closePath(); ctx.fill();

    // Spin button or result
    if (this.wheelResult) {
      // Show the result
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`You won: ${this.wheelResult.icon} ${this.wheelResult.label}!`, W/2, H/2 + 170);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px sans-serif';
      ctx.fillText('Reward will apply when you start the next level!', W/2, H/2 + 200);
      // Close button
      ctx.fillStyle = '#224422';
      ctx.fillRect(W/2 - 60, H/2 + 210, 120, 36);
      ctx.strokeStyle = '#44ff44'; ctx.lineWidth = 2;
      ctx.strokeRect(W/2 - 60, H/2 + 210, 120, 36);
      ctx.fillStyle = '#aaffaa'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('CLOSE', W/2, H/2 + 234);
      this._wheelCloseBounds = { x: W/2 - 60, y: H/2 + 210, w: 120, h: 36 };
    } else if (this.wheelSpinning) {
      ctx.fillStyle = 'rgba(200,200,200,0.5)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Spinning...', W/2, H/2 + 155);
      this._wheelSpinBounds = null;
    } else {
      // Spin button
      const alreadySpun = localStorage.getItem('td_last_spin') === new Date().toDateString();
      ctx.fillStyle = alreadySpun ? '#443333' : '#224422';
      ctx.fillRect(W/2 - 80, H/2 + 145, 160, 40);
      ctx.strokeStyle = alreadySpun ? '#ff4444' : '#44ff44';
      ctx.lineWidth = 2; ctx.strokeRect(W/2 - 80, H/2 + 145, 160, 40);
      ctx.fillStyle = alreadySpun ? '#ff8888' : '#aaffaa';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(alreadySpun ? 'Already spun today!' : '🎡 SPIN!', W/2, H/2 + 172);
      this._wheelSpinBounds = alreadySpun ? null : { x: W/2 - 80, y: H/2 + 145, w: 160, h: 40 };
    }

    // ESC to close hint
    ctx.fillStyle = 'rgba(180,180,180,0.5)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Press ESC to close', W/2, H - 30);
    ctx.textAlign = 'left';
  }

  // Handle clicks in the wheel overlay
  _handleWheelClick(x, y) {
    // Spin button
    if (this._wheelSpinBounds) {
      const b = this._wheelSpinBounds;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        // Start spinning!
        this.wheelSpinning = true;
        this.wheelResult   = null;
        this.wheelSpeed    = 0.18 + Math.random() * 0.12; // random starting speed
        localStorage.setItem('td_last_spin', new Date().toDateString());
        this._grantAchievement('daily_spin');
      }
    }
    // Close button (shown after result)
    if (this._wheelCloseBounds) {
      const b = this._wheelCloseBounds;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.wheelOpen = false;
        // If we came from title screen, go back to it
        if (!this.currentLevel) {
          this.titleActive = true;
          document.getElementById('title-screen').style.display = 'flex';
          this._buildTitleScreen(); // refresh to show "done" on the button
        }
      }
    }
  }

  // Called when the wheel stops — pick the prize based on final angle
  _resolveWheelPrize() {
    const prizes = this._getWheelPrizes();
    const sliceAngle = (Math.PI * 2) / prizes.length;
    // The pointer is at the TOP of the wheel (angle = -PI/2)
    // Figure out which slice is at the top
    const normalised = (((-Math.PI/2) - this.wheelAngle) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
    const idx = Math.floor(normalised / sliceAngle) % prizes.length;
    this.wheelResult = prizes[idx];
    this.pendingWheelReward = prizes[idx]; // will be applied when level starts
  }

  // Apply a wheel reward to the current game state
  _applyWheelReward(reward) {
    switch (reward.label) {
      case '+500g': this.money = Math.min(this.money + 500, MAX_MONEY); this.flash('🎡 Wheel: +500 Gold!'); break;
      case '+200g': this.money = Math.min(this.money + 200, MAX_MONEY); this.flash('🎡 Wheel: +200 Gold!'); break;
      case '+100g': this.money = Math.min(this.money + 100, MAX_MONEY); this.flash('🎡 Wheel: +100 Gold!'); break;
      case '+50g':  this.money = Math.min(this.money + 50,  MAX_MONEY); this.flash('🎡 Wheel: +50 Gold!');  break;
      case '+1 Life':
      case '+3 Lives': {
        const amt = reward.label === '+3 Lives' ? 3 : 1;
        this.castleHp = Math.min(this.castleHp + amt * 500, this.castleMaxHp);
        this.flash(`🎡 Wheel: Castle healed!`); break;
      }
      case 'Airstrike':
        for (const e of this.enemies) e.takeDamage(30);
        this.flash('🎡 Wheel: Free Airstrike!'); break;
      case 'Freeze':
        this.timeSlowTimer = 300;
        this.flash('🎡 Wheel: Free Freeze!'); break;
      case 'Dragon!': {
        const pathEnd = this.path[this.path.length - 1];
        const s = new Soldier(pathEnd.x - 30, pathEnd.y - 20, { soldierHp: 300, soldierDmg: 40 });
        s.waypoint = this.path.length - 1; s.speed = 2.0;
        this.soldiers.push(s);
        this.flash('🎡 Wheel: Dragon Ally spawned!'); break;
      }
      case '+1 Gem':
        this._grantGems(1);
        this.flash('🎡 Wheel: 💎 +1 Gem! So rare!'); break;
      case '+3 Gems':
        this._grantGems(3);
        this.flash('🎡 Wheel: 💎💎💎 +3 Gems! Amazing!'); break;
      default: this.flash('🎡 Wheel: Better luck next time!');
    }
    this._updateButtons();
  }

  // ── Gem Shop ─────────────────────────────────────────────────────────────────

  // Build the HTML gem shop items inside #gem-shop-items
  _buildGemShop() {
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    const container = document.getElementById('gem-shop-items');
    if (!container) return;
    container.innerHTML = '';

    for (const item of GEM_SHOP_ITEMS) {
      const owned = purchases.includes(item.id);
      const canAfford = this.gems >= item.cost;
      const div = document.createElement('div');
      div.className = 'gem-item' + (owned ? ' owned' : canAfford ? '' : ' cant-afford');
      div.innerHTML = `
        <div class="gi-icon">${item.icon}</div>
        <div class="gi-name">${item.name}</div>
        <div class="gi-cost">${owned ? '✓ OWNED' : '💎 ' + item.cost}</div>
        <div class="gi-desc">${item.desc}</div>
      `;
      div.title = item.desc;
      if (!owned) {
        div.onclick = () => this._buyGemItem(item);
      }
      container.appendChild(div);
    }

    // Update gem balance display
    const bal = document.getElementById('gem-balance');
    if (bal) bal.textContent = `💎 ${this.gems} Gem${this.gems !== 1 ? 's' : ''}`;
  }

  // Buy a gem shop item — deduct gems and save purchase
  _buyGemItem(item) {
    if (this.gems < item.cost) {
      // Shake feedback — no alert needed
      this.flash(`Need 💎 ${item.cost} gems!`);
      return;
    }
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    if (purchases.includes(item.id)) return; // already owned
    this.gems -= item.cost;
    localStorage.setItem('td_gems', String(this.gems));
    purchases.push(item.id);
    localStorage.setItem('td_gem_purchases', JSON.stringify(purchases));
    this._buildGemShop(); // refresh to show ownership
    const bal = document.getElementById('gem-balance');
    if (bal) bal.textContent = `💎 ${this.gems} Gem${this.gems !== 1 ? 's' : ''}`;
  }

  // Apply all active gem purchases at the start of a level.
  // This is called right after startLevel() resets everything.
  _applyGemUpgrades() {
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    if (purchases.length === 0) return;

    if (purchases.includes('gem_gold')) {
      // Start with extra gold
      this.money = Math.min(this.money + 150, MAX_MONEY);
    }
    if (purchases.includes('gem_castle')) {
      // Double the castle HP
      this.castleMaxHp *= 2;
      this.castleHp = this.castleMaxHp;
    }
    if (purchases.includes('gem_goldbonus')) {
      // +50% gold from kills — stacks with in-game shop bonus
      this.goldBonus *= 1.5;
    }
    if (purchases.includes('gem_fastfire')) {
      // Towers placed during this level will fire 30% faster (applied in tryPlaceTower)
      this.gemFastFire = true;
    }
    if (purchases.includes('gem_headstart')) {
      // New towers placed start at Level 2 (applied in tryPlaceTower)
      this.gemHeadStart = true;
    }
    if (purchases.includes('gem_miners')) {
      // Mine income doubled (applied in Worker.update via flag)
      this.gemMinerDouble = true;
    }
    if (purchases.includes('gem_soldiers')) {
      // Soldiers deal 2x damage (applied at soldier spawn time)
      this.gemSoldierDmg = true;
    }
    if (purchases.includes('gem_camps')) {
      // Raise the camp limit from 10 to 15
      this.campLimit = 15;
    }
    if (purchases.includes('gem_dragon')) {
      // Spawn a dragon ally at the start of the level
      const pathEnd = this.path[this.path.length - 1];
      const s = new Soldier(pathEnd.x - 30, pathEnd.y - 20, { soldierHp: 300, soldierDmg: 40 });
      s.waypoint = this.path.length - 1; s.speed = 2.0;
      this.soldiers.push(s);
    }
    // gem_legend is purely cosmetic — handled in _buildTitleScreen
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
