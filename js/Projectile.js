import { distance } from './constants.js';

// A single projectile in flight.
// Three flavours depending on which flags are set:
//   fromEnemy + fire  → dragon fireball (damages towers)
//   fromEnemy         → runner arrow    (damages towers)
//   manual            → player shot     (damages enemies, flies straight)
//   (none)            → tower auto-shot (tracks an enemy target)
export class Projectile {
  constructor({ x, y, target, speed, vx, vy, damage, slows, fromEnemy, fire, manual }) {
    this.x = x; this.y = y;
    this.target = target; this.speed = speed; // used by auto-tracking shots
    this.vx = vx; this.vy = vy;              // used by straight-line shots
    this.damage = damage;
    this.slows = slows;
    this.fromEnemy = fromEnemy;
    this.fire = fire;
    this.manual = manual;
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
      // Dragon fireball — glowing orange/yellow ball
      ctx.save();
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (this.fromEnemy) {
      // Runner arrow — small line pointing in direction of travel
      const ang = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(ang);
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(7, -2.5); ctx.lineTo(12, 0); ctx.lineTo(7, 2.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      // Tower shot — coloured circle
      ctx.fillStyle = this.slows ? '#cc66ff' : this.damage > 1 ? '#4ab4ff' : '#ff0';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.damage > 1 ? 6 : 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  _outOfBounds() {
    return this.x < -20 || this.x > 820 || this.y < -20 || this.y > 520;
  }
}
