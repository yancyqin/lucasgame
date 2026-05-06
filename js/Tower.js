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
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 6, damage: this.damage, slows: this.slows }));
      this.cooldown = this.fireRate;
    }
  }

  // Encapsulation: hide the damage formula behind a method name
  takeDamage(amt) { this.hp -= amt; }
  isDead()        { return this.hp <= 0; }

  draw(ctx, isSelected, mouse) {
    const angle = isSelected ? Math.atan2(mouse.y - this.y, mouse.x - this.x) : (this.angle || 0);
    const tx = this.x - 15, ty = this.y - 18;

    // Range circle — brighter when selected
    ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.stroke();

    // Stone tower body
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(tx, ty, 30, 38);
    ctx.fillStyle = '#646464'; ctx.fillRect(tx + 2, ty + 2, 26, 34);

    // Battlements (3 merlons on top)
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(tx,      ty - 10, 8, 11);
    ctx.fillRect(tx + 11, ty - 10, 8, 11);
    ctx.fillRect(tx + 22, ty - 10, 8, 11);

    // Arrow slit + person head peeking out
    ctx.fillStyle = '#111'; ctx.fillRect(this.x - 4, ty + 6, 8, 14);
    ctx.fillStyle = '#e8b890';
    ctx.beginPath(); ctx.arc(this.x, ty + 9, 5, 0, Math.PI * 2); ctx.fill();

    // Weapon rotates to face the current target
    ctx.save(); ctx.translate(this.x, this.y - 5); ctx.rotate(angle);
    this._drawWeapon(ctx);
    ctx.restore();

    // HP bar below tower
    const hpFrac = this.hp != null ? this.hp / this.maxHp : 1;
    ctx.fillStyle = '#222'; ctx.fillRect(tx, this.y + 22, 30, 5);
    ctx.fillStyle = hpFrac > 0.5 ? '#0f0' : hpFrac > 0.25 ? '#f80' : '#f00';
    ctx.fillRect(tx, this.y + 22, 30 * hpFrac, 5);

    // White selection ring
    if (isSelected) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 26, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Private: draws the weapon graphic based on tower type
  _drawWeapon(ctx) {
    if (this.typeKey === 'sniper') {
      // Catapult: wooden frame + throwing arm + boulder
      ctx.fillStyle = '#6b3a10';
      ctx.fillRect(-10, -3, 20, 6);   // base beam
      ctx.fillRect(-9, -3, 4, 10);    // left leg
      ctx.fillRect(5, -3, 4, 10);     // right leg
      ctx.fillStyle = '#8b4c12';
      ctx.save(); ctx.translate(0, -3); ctx.rotate(-0.7);
      ctx.fillRect(-2, -14, 4, 16);   // throwing arm
      ctx.restore();
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(8, -12, 5, 0, Math.PI * 2); ctx.fill(); // boulder
    } else if (this.typeKey === 'rapid') {
      // Crossbow: stock + prod arms + string + bolt
      ctx.fillStyle = '#5a3010'; ctx.fillRect(0, -2, 20, 4); ctx.fillRect(-2, -1, 6, 2);
      ctx.fillStyle = '#4a2808'; ctx.fillRect(4, -8, 4, 16);
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(8, 0); ctx.lineTo(4, 8); ctx.stroke();
      ctx.fillStyle = '#aaa'; ctx.fillRect(8, -1, 14, 2);
      ctx.fillStyle = '#888';
      ctx.beginPath(); ctx.moveTo(22, -3); ctx.lineTo(22, 3); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill();
    } else if (this.typeKey === 'slow') {
      // Staff with glowing magic orb
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1.5, -22, 3, 24);
      ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, -22, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Bow + nocked arrow (archers tower)
      ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(4, -11); ctx.quadraticCurveTo(17, 0, 4, 11); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(4, -11); ctx.lineTo(4, 11); ctx.stroke();
      ctx.strokeStyle = '#c8c880'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(22, 0); ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }
}
