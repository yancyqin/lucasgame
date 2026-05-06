import { TYPES, distance } from './constants.js';
import { Projectile } from './Projectile.js';

// A single tower on the map.
// Constructor pattern: new Tower(x, y, 'sniper') gives back a fully ready tower object.
export class Tower {
  constructor(x, y, typeKey) {
    // Copy all config values (range, fireRate, damage, cost, color, slows) from TYPES
    const cfg = TYPES[typeKey];
    Object.assign(this, cfg);
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    this.cooldown = 0;
    this.hp = 8;
    this.maxHp = 8;
    this.angle = 0;        // direction the weapon currently points
    this.manualCooldown = 0; // reload timer for manual player shots
  }

  // Auto-shoot: find the first enemy in range and fire at it.
  // Pushes a new Projectile into the shared projectiles array.
  update(enemies, projectiles) {
    this.cooldown--;
    if (this.cooldown > 0) return;
    const target = enemies.find(e => distance(this, e) < this.range);
    if (target) {
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      if (this.typeKey === 'rapid') {
        for (const spread of [-0.22, 0, 0.22]) {
          const a = this.angle + spread;
          projectiles.push(new Projectile({ x: this.x, y: this.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, damage: this.damage, slows: this.slows, manual: true }));
        }
      } else {
        projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 6, damage: this.damage, slows: this.slows, boulder: this.typeKey === 'sniper' }));
      }
      this.cooldown = this.fireRate;
    }
  }

  // Encapsulation: hide the damage formula behind a method name
  takeDamage(amt) { this.hp -= amt; }
  isDead()        { return this.hp <= 0; }

  draw(ctx, isSelected, mouse) {
    const angle = isSelected ? Math.atan2(mouse.y - this.y, mouse.x - this.x) : (this.angle || 0);
    const tx = this.x - 16, ty = this.y - 20;

    // Range circle — brighter when selected
    ctx.strokeStyle = isSelected ? `${this.color}88` : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.stroke();

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.save(); ctx.translate(this.x + 3, this.y + 24); ctx.scale(1.1, 0.35);
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // Tower base — wider than body, stone-colored
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(tx - 3, this.y + 14, 38, 8);
    ctx.fillStyle = '#555';
    ctx.fillRect(tx - 2, this.y + 14, 36, 6);

    // Tower body — 3-layer stone effect
    ctx.fillStyle = '#404040'; ctx.fillRect(tx, ty, 32, 36);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(tx + 2, ty + 1, 28, 33);
    ctx.fillStyle = '#686868'; ctx.fillRect(tx + 3, ty + 2, 26, 30);
    // Stone block lines
    ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1;
    for (let row = ty + 8; row < ty + 34; row += 10) {
      ctx.beginPath(); ctx.moveTo(tx + 3, row); ctx.lineTo(tx + 29, row); ctx.stroke();
    }
    for (let col of [tx + 10, tx + 20]) {
      ctx.beginPath(); ctx.moveTo(col, ty + 2); ctx.lineTo(col, ty + 32); ctx.stroke();
    }

    // Type-colored accent stripe just below battlements
    ctx.fillStyle = this.color + '66';
    ctx.fillRect(tx + 2, ty + 1, 28, 4);

    // Battlements (4 merlons — wider tower fits 4)
    ctx.fillStyle = '#3e3e3e';
    for (let i = 0; i < 4; i++) ctx.fillRect(tx + i * 9, ty - 10, 7, 12);
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) ctx.fillRect(tx + i * 9 + 1, ty - 9, 5, 10);

    // Arrow slit (dark narrow window)
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(this.x - 3, ty + 7, 6, 13);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(this.x - 2, ty + 8, 4, 11);

    // Archer head peeking from battlement gap
    ctx.fillStyle = '#e8b890';
    ctx.beginPath(); ctx.arc(this.x, ty - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888'; // helmet
    ctx.beginPath(); ctx.arc(this.x, ty - 2, 5, Math.PI, Math.PI * 2); ctx.fill();

    // Weapon / siege machine mounted on top
    if (this.typeKey === 'sniper') {
      this._drawCatapult(ctx, angle);
    } else {
      ctx.save(); ctx.translate(this.x, this.y - 5); ctx.rotate(angle);
      this._drawWeapon(ctx);
      ctx.restore();
    }

    // HP bar below base
    const hpFrac = this.hp != null ? this.hp / this.maxHp : 1;
    ctx.fillStyle = '#111'; ctx.fillRect(tx, this.y + 23, 32, 5);
    ctx.fillStyle = hpFrac > 0.5 ? '#0f0' : hpFrac > 0.25 ? '#f80' : '#f00';
    ctx.fillRect(tx, this.y + 23, 32 * hpFrac, 5);

    // Colored selection ring
    if (isSelected) {
      ctx.strokeStyle = this.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Catapult: whole machine rotates together — person pushes it to aim
  _drawCatapult(ctx, angle) {
    ctx.save();
    ctx.translate(this.x, this.y - 10);
    ctx.rotate(angle);
    // Base frame — wooden cross-beams
    ctx.fillStyle = '#6b3a10';
    ctx.fillRect(-12, -3, 26, 7);
    ctx.fillRect(-10, 3, 6, 9);
    ctx.fillRect(9,   3, 6, 9);
    ctx.fillStyle = '#4a2808';
    ctx.fillRect(-2, -3, 4, 10);
    // Axle pin
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    // Throwing arm with boulder
    ctx.save(); ctx.rotate(-0.65);
    ctx.fillStyle = '#8b4c12'; ctx.fillRect(-2, -20, 4, 22);
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(0, -21, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.arc(-2, -22, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Wheel circles
    ctx.fillStyle = '#5a2e08';
    ctx.beginPath(); ctx.arc(-8, 10, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8, 10, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(-8, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8, 10, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Private: draws the weapon graphic based on tower type
  _drawWeapon(ctx) {
    if (this.typeKey === 'rapid') {
      // Crossbow: tiller + prod + string + bolt
      ctx.fillStyle = '#5a3010'; ctx.fillRect(-2, -2, 24, 4);
      ctx.fillStyle = '#3a2008'; ctx.fillRect(-2, -1, 7, 2);
      ctx.fillStyle = '#4a2808'; ctx.fillRect(5, -9, 5, 18);
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(5, -9); ctx.lineTo(10, 0); ctx.lineTo(5, 9); ctx.stroke();
      ctx.fillStyle = '#bbb'; ctx.fillRect(10, -1.5, 15, 3);
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.moveTo(25, -3.5); ctx.lineTo(25, 3.5); ctx.lineTo(30, 0); ctx.closePath(); ctx.fill();
    } else if (this.typeKey === 'slow') {
      // Wizard staff with glowing orb and runes
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-2, -24, 4, 26);
      // Staff tip decorations
      ctx.fillStyle = '#8b6030'; ctx.fillRect(-4, -24, 8, 4);
      // Glowing orb
      ctx.shadowColor = this.color; ctx.shadowBlur = 14;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(0, -26, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Inner orb highlight
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(-2, -28, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
      // Rune sparkles
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(8, -18, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-9, -14, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
      // Longbow — wider curve, better string, nocked arrow
      ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(3, -13); ctx.quadraticCurveTo(20, 0, 3, 13); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(3, -13); ctx.lineTo(3, 13); ctx.stroke();
      // Arrow shaft
      ctx.strokeStyle = '#c8b860'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(24, 0); ctx.stroke();
      // Arrow tip
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(24, -3); ctx.lineTo(24, 3); ctx.lineTo(29, 0); ctx.closePath(); ctx.fill();
      // Fletching
      ctx.fillStyle = '#cc4444';
      ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(0, -4); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(0,  4); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt';
    }
  }
}
