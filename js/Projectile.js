import { distance } from './constants.js?v=7';

// A single projectile in flight.
// Three flavours depending on which flags are set:
//   fromEnemy + fire  → dragon fireball (damages towers)
//   fromEnemy         → runner arrow    (damages towers)
//   manual            → player shot     (damages enemies, flies straight)
//   (none)            → tower auto-shot (tracks an enemy target)
export class Projectile {
  constructor({ x, y, target, speed, vx, vy, damage, slows, fromEnemy, fire, manual, boulder, arrow, magic }) {
    this.x = x; this.y = y;
    this.target = target; this.speed = speed; // used by auto-tracking shots
    this.vx = vx; this.vy = vy;              // used by straight-line shots
    this.damage = damage;
    this.slows = slows;
    this.fromEnemy = fromEnemy;
    this.fire = fire;
    this.manual = manual;
    this.boulder = boulder;
    this.arrow = arrow;   // draws as flying arrow
    this.magic = magic;   // draws as glowing orb
    this.dead = false;
  }

  // Move one step and check for a hit. enemies and towers arrays come from Game.
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
      // Auto-tracking: steer toward the target each frame
      if (!enemies.includes(this.target)) { this.dead = true; return; }
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < this.speed) {
        this.target.takeDamage(this.damage);
        if (this.slows) this.target.slowTimer = 80;
        this.dead = true;
      } else {
        this.x += (dx / d) * this.speed;
        this.y += (dy / d) * this.speed;
      }
    }
  }

  // Encapsulation: callers ask isDead() instead of reading .dead directly
  isDead() { return this.dead; }

  draw(ctx) {
    if (this.fromEnemy && this.fire) {
      // Dragon fireball — glowing orange/yellow ball with inner core
      ctx.save();
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(this.x, this.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffee88'; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    } else if (this.fromEnemy) {
      // Runner arrow — shaft + tip + fletching
      const ang = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(ang);
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(8, -2.5); ctx.lineTo(13, 0); ctx.lineTo(8, 2.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#884422';
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-12, -3); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-12,  3); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt'; ctx.restore();
    } else if (this.boulder) {
      // Catapult boulder — rough rock with cracks and highlight
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#777';
      ctx.beginPath(); ctx.arc(this.x, this.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.moveTo(this.x - 3, this.y - 5); ctx.lineTo(this.x + 1, this.y - 2); ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(this.x - 2.5, this.y - 2.5, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (this.arrow) {
      // Archer / crossbow arrow — shaft, steel tip, red fletching
      const ang = this.vx != null
        ? Math.atan2(this.vy, this.vx)
        : (this.target ? Math.atan2(this.target.y - this.y, this.target.x - this.x) : 0);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(ang);
      ctx.strokeStyle = '#c8b060'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
      ctx.fillStyle = '#ccc';
      ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(14, 0); ctx.lineTo(9, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cc3333';
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-14, -3.5); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-14,  3.5); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt'; ctx.restore();
    } else if (this.magic) {
      // Mage slow orb — glowing purple sphere with inner highlight
      ctx.save();
      ctx.shadowColor = '#cc66ff'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#aa44ee';
      ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#dd99ff';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(this.x - 1.5, this.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    } else {
      // Generic fallback — coloured circle
      ctx.fillStyle = '#ff0';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  _outOfBounds() {
    return this.x < -60 || this.x > 3000 || this.y < -60 || this.y > 2000;
  }
}
