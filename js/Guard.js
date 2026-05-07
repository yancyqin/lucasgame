export class Guard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.typeKey = 'guard';
    this.cost = 60;
    this.hp = 25;
    this.maxHp = 25;
    this.damage = 4;
    this.range = 60;
    this.cooldown = 0;
    this.attackTimer = 0;
    this.attackAngle = 0;
    this.facing = 0;
  }

  update(enemies) {
    if (this.cooldown > 0) this.cooldown--;
    if (this.attackTimer > 0) this.attackTimer--;
    const target = enemies.find(e => Math.hypot(e.x - this.x, e.y - this.y) < this.range);
    if (target) {
      this.facing = Math.atan2(target.y - this.y, target.x - this.x);
      if (this.cooldown <= 0) {
        target.takeDamage(this.damage);
        this.attackAngle = this.facing;
        this.attackTimer = 14;
        this.cooldown = 45;
      }
    }
  }

  takeDamage(amt) { this.hp -= amt; }
  isDead()        { return this.hp <= 0; }

  draw(ctx) {
    const { x, y } = this;
    const s = 10;
    const facing = this.facing;
    const hpFrac = this.hp / this.maxHp;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x + 2, y + 20, 9, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Range ring (faint)
    ctx.strokeStyle = 'rgba(68,136,204,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, this.range, 0, Math.PI * 2); ctx.stroke();

    const headR    = s * 0.42;
    const headCY   = y - s * 0.65;
    const torsoTop = headCY + headR + s * 0.05;
    const torsoH   = s * 0.90;
    const torsoW   = s * 0.88;
    const hipY     = torsoTop + torsoH;

    // Legs
    ctx.fillStyle = '#223355';
    ctx.fillRect(x - 4, hipY, 4, 8);
    ctx.fillRect(x + 1, hipY, 4, 8);
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 5, hipY + 8, 6, 3);
    ctx.fillRect(x,     hipY + 8, 6, 3);

    // Shield arm
    ctx.save();
    ctx.translate(x, torsoTop + s * 0.18);
    ctx.rotate(facing + Math.PI * 0.70);
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(0, -2, 8, 4);
    ctx.fillRect(8, -2, 5, 4);
    ctx.translate(13, 0);
    ctx.fillStyle = '#2255aa';
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(4, 3);
    ctx.lineTo(0, 7);   ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0a3388'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(4, 3);
    ctx.lineTo(0, 7);   ctx.lineTo(-4, 3); ctx.closePath(); ctx.stroke();
    ctx.restore();

    // Torso
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(x - torsoW / 2, torsoTop, torsoW, torsoH);
    ctx.strokeStyle = '#2266aa'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x - torsoW / 2, torsoTop, torsoW, torsoH);

    // Weapon arm — swings during attack
    let weaponAngle = facing;
    if (this.attackTimer > 0) {
      const t = 1 - this.attackTimer / 14;
      weaponAngle = this.attackAngle - 0.65 + t * 1.3;
    }
    ctx.save();
    ctx.translate(x, torsoTop + s * 0.18);
    ctx.rotate(weaponAngle);
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(0, -2, 8, 4);
    ctx.fillRect(8, -2, 6, 4);
    ctx.translate(14, 0);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(0, -s * 0.12, s * 1.15, s * 0.24);
    ctx.beginPath(); ctx.moveTo(s*1.15,-s*0.12); ctx.lineTo(s*1.15,s*0.12); ctx.lineTo(s*1.55,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8b5020';
    ctx.fillRect(-s * 0.26, -s * 0.11, s * 0.26, s * 0.22);
    ctx.restore();

    // Neck
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(x - 2, headCY + headR - 2, 4, 5);

    // Head (blue helmet)
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.arc(x, headCY, headR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2266aa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, headCY, headR, 0, Math.PI * 2); ctx.stroke();
    // Face opening
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(x - headR * 0.4, headCY - headR * 0.3, headR * 0.8, headR * 0.65);

    // HP bar
    const bx = x - 12;
    const by = headCY - headR - 8;
    ctx.fillStyle = '#222'; ctx.fillRect(bx - 1, by - 1, 26, 6);
    ctx.fillStyle = hpFrac > 0.5 ? '#0f0' : hpFrac > 0.25 ? '#f80' : '#f00';
    ctx.fillRect(bx, by, 24 * hpFrac, 4);

    // Attack arc
    if (this.attackTimer > 0) {
      const p = this.attackTimer / 14;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.attackAngle);
      ctx.strokeStyle = `rgba(180,220,255,${p * 0.85})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, this.range * 0.75, -0.52, 0.52); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.restore();
    }
  }
}
