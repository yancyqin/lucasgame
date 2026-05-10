import { distance } from './constants.js?v=27';

export class Projectile {
  constructor({ x, y, target, speed, vx, vy, damage, slows, fromEnemy, fire, manual, boulder, arrow, magic,
                fireball, iceOrb, iceSlows, lightningBolt, chain, chainRadius, earthBoulder, splash, splashRadius, stuns, burns, shocks,
                magicOrb }) {
    this.x = x; this.y = y;
    this.target = target; this.speed = speed;
    this.vx = vx; this.vy = vy;
    this.damage = damage;
    this.slows = slows;
    this.fromEnemy = fromEnemy;
    this.fire = fire;
    this.manual = manual;
    this.boulder = boulder;
    this.arrow = arrow;
    this.magic = magic;
    // Elemental types
    this.fireball     = fireball;
    this.iceOrb       = iceOrb;
    this.iceSlows     = iceSlows;
    this.lightningBolt = lightningBolt;
    this.chain        = chain || 0;
    this.chainRadius  = chainRadius || 120;
    this.earthBoulder = earthBoulder;
    this.magicOrb     = magicOrb;
    this.splash       = splash;
    this.splashRadius = splashRadius || 40;
    this.stuns        = stuns || 0;
    this.burns        = burns || 0;
    this.shocks       = shocks || 0;
    this.dead = false;
  }

  update(enemies, towers) {
    if (this.fromEnemy) {
      this.x += this.vx; this.y += this.vy;
      if (this._outOfBounds()) { this.dead = true; return; }
      const hit = towers.find(t => distance(this, t) < 18);
      if (hit) { hit.takeDamage(this.damage); this.dead = true; }
    } else if (this.manual) {
      this.x += this.vx; this.y += this.vy;
      if (this._outOfBounds()) { this.dead = true; return; }
      const hit = enemies.find(e => distance(this, e) < e.size + 5);
      if (hit) { hit.takeDamage(this.damage); if (this.slows) hit.slowTimer = 80; this.dead = true; }
    } else {
      if (!enemies.includes(this.target)) { this.dead = true; return; }
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < this.speed) {
        this._onHit(this.target, enemies);
        this.dead = true;
      } else {
        this.x += (dx/d) * this.speed;
        this.y += (dy/d) * this.speed;
      }
    }
  }

  _onHit(target, enemies) {
    target.takeDamage(this.damage);
    if (this.slows)    target.slowTimer = 80;
    if (this.iceSlows) target.slowTimer = 220;
    if (this.stuns > 0) target.stunTimer = this.stuns;
    if (this.burns)  target.burnTimer  = Math.max(target.burnTimer,  this.burns);
    if (this.shocks) target.shockTimer = Math.max(target.shockTimer, this.shocks);

    // Splash — damage all enemies in radius at half damage
    if (this.splash) {
      for (const e of enemies) {
        if (e !== target && distance(this, e) < this.splashRadius) {
          e.takeDamage(this.damage * 0.5);
          if (this.slows) e.slowTimer = 60;
        }
      }
    }

    // Chain lightning — jump to nearest N enemies
    if (this.chain > 0) {
      const nearby = enemies
        .filter(e => e !== target && distance(target, e) < this.chainRadius)
        .sort((a, b) => distance(target, a) - distance(target, b))
        .slice(0, this.chain);
      for (const e of nearby) {
        e.takeDamage(this.damage * 0.6);
        if (this.slows)  e.slowTimer  = 60;
        if (this.shocks) e.shockTimer = Math.max(e.shockTimer, this.shocks);
      }
      // Store for drawing
      this._chainTargets = nearby;
      this._chainOrigin = { x: target.x, y: target.y };
      this._chainTimer = 8;
    }
  }

  isDead() { return this.dead; }

  draw(ctx) {
    // Draw chain arcs before dying
    if (this._chainTimer > 0) {
      this._chainTimer--;
      const p = this._chainTimer / 8;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,100,${p})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const t of (this._chainTargets || [])) {
        ctx.beginPath();
        ctx.moveTo(this._chainOrigin.x, this._chainOrigin.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }
      ctx.lineCap = 'butt'; ctx.restore();
    }

    if (this.fromEnemy && this.fire) {
      ctx.save();
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(this.x, this.y, 7, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffee88'; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(this.x-2, this.y-2, 2, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    } else if (this.magicOrb) {
      // Purple explosive orb fired by mage soldiers
      ctx.save();
      ctx.shadowColor = '#cc44ff'; ctx.shadowBlur = 24;
      ctx.fillStyle = '#aa22ee'; ctx.beginPath(); ctx.arc(this.x, this.y, 9, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#dd66ff'; ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(this.x-2, this.y-2, 2.5, 0, Math.PI*2); ctx.fill();
      // Sparkle spikes
      ctx.strokeStyle = '#ee88ff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(a)*9, this.y + Math.sin(a)*9);
        ctx.lineTo(this.x + Math.cos(a)*14, this.y + Math.sin(a)*14);
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.restore();
    } else if (this.fireball) {
      ctx.save();
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 22;
      ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(this.x, this.y, 9, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff2200'; ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffdd44'; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(this.x-2, this.y-2, 3, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    } else if (this.iceOrb) {
      ctx.save();
      ctx.shadowColor = '#88ddff'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#aaeeff'; ctx.beginPath(); ctx.arc(this.x, this.y, 7, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ddf8ff'; ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
      for (let i = 0; i < 4; i++) {
        const a = (i/4)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(this.x+Math.cos(a)*3, this.y+Math.sin(a)*3);
        ctx.lineTo(this.x+Math.cos(a)*8, this.y+Math.sin(a)*8); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.restore();
    } else if (this.lightningBolt) {
      ctx.save();
      const ang = this.target ? Math.atan2(this.target.y-this.y, this.target.x-this.x) : 0;
      ctx.translate(this.x, this.y); ctx.rotate(ang);
      ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ffff88'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(5,-4); ctx.lineTo(2,-8); ctx.lineTo(7,-12); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(5,-4); ctx.lineTo(2,-8); ctx.lineTo(7,-12); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
    } else if (this.earthBoulder) {
      ctx.save();
      ctx.shadowColor = '#886644'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#554433'; ctx.beginPath(); ctx.arc(this.x, this.y, 11, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#7a6654'; ctx.beginPath(); ctx.arc(this.x, this.y, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#998877'; ctx.beginPath(); ctx.arc(this.x-2, this.y-2, 5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(this.x-6,this.y+2); ctx.lineTo(this.x-2,this.y-4); ctx.stroke();
      ctx.restore();
    } else if (this.fromEnemy) {
      const ang = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(ang);
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(8,-2.5); ctx.lineTo(13,0); ctx.lineTo(8,2.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#884422';
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-12,-3); ctx.lineTo(-9,0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-12, 3); ctx.lineTo(-9,0); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt'; ctx.restore();
    } else if (this.boulder) {
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(this.x, this.y, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(this.x-2.5, this.y-2.5, 2.5, 0, Math.PI*2); ctx.fill();
    } else if (this.arrow) {
      const ang = this.vx != null ? Math.atan2(this.vy, this.vx)
        : (this.target ? Math.atan2(this.target.y-this.y, this.target.x-this.x) : 0);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(ang);
      ctx.strokeStyle = '#c8b060'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.stroke();
      ctx.fillStyle = '#ccc';
      ctx.beginPath(); ctx.moveTo(9,-3); ctx.lineTo(14,0); ctx.lineTo(9,3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cc3333';
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-14,-3.5); ctx.lineTo(-10,0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-14, 3.5); ctx.lineTo(-10,0); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt'; ctx.restore();
    } else if (this.magic) {
      ctx.save();
      ctx.shadowColor = '#cc66ff'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#aa44ee'; ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#dd99ff'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(this.x-1.5, this.y-2, 2, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    } else {
      ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }
  }

  _outOfBounds() {
    return this.x < -60 || this.x > 3000 || this.y < -60 || this.y > 2000;
  }
}
