import { TYPES, distance } from './constants.js?v=12';
import { Projectile } from './Projectile.js?v=12';

export class Tower {
  constructor(x, y, typeKey) {
    const cfg = TYPES[typeKey];
    Object.assign(this, cfg);
    this.x = x; this.y = y; this.typeKey = typeKey;
    this.cooldown = 0; this.hp = 8; this.maxHp = 8;
    this.angle = 0; this.manualCooldown = 0; this.fireTimer = 0;
  }

  update(enemies, projectiles) {
    if (this.fireTimer > 0) this.fireTimer--;
    this.cooldown--;
    if (this.cooldown > 0) return;
    const target = enemies.find(e => distance(this, e) < this.range);
    if (!target) return;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.fireTimer = 10;
    if (this.typeKey === 'rapid') {
      for (const spread of [-0.22, 0, 0.22]) {
        const a = this.angle + spread;
        projectiles.push(new Projectile({ x: this.x, y: this.y, vx: Math.cos(a)*8, vy: Math.sin(a)*8, damage: this.damage, slows: this.slows, manual: true, arrow: true }));
      }
    } else if (this.typeKey === 'slow') {
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 5, damage: this.damage, slows: true, magic: true }));
    } else if (this.typeKey === 'fire') {
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 5, damage: this.damage, splash: true, splashRadius: 45, fireball: true }));
    } else if (this.typeKey === 'ice') {
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 7, damage: this.damage, iceSlows: true, iceOrb: true }));
    } else if (this.typeKey === 'lightning') {
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 14, damage: this.damage, chain: 2, chainRadius: 120, lightningBolt: true }));
    } else if (this.typeKey === 'earth') {
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 3, damage: this.damage, stuns: 100, earthBoulder: true }));
    } else {
      projectiles.push(new Projectile({ x: this.x, y: this.y, target, speed: 6, damage: this.damage, slows: this.slows, boulder: this.typeKey === 'sniper', arrow: this.typeKey === 'basic' }));
    }
    this.cooldown = this.fireRate;
  }

  takeDamage(amt) { this.hp -= amt; }
  isDead()        { return this.hp <= 0; }

  draw(ctx, isSelected, mouse) {
    const angle = isSelected ? Math.atan2(mouse.y - this.y, mouse.x - this.x) : (this.angle || 0);
    const tx = this.x - 16, ty = this.y - 20;

    ctx.strokeStyle = isSelected ? `${this.color}88` : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI*2); ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.save(); ctx.translate(this.x+3, this.y+24); ctx.scale(1.1,0.35);
    ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill(); ctx.restore();

    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(tx-3, this.y+14, 38, 8);
    ctx.fillStyle = '#555';    ctx.fillRect(tx-2, this.y+14, 36, 6);
    ctx.fillStyle = '#404040'; ctx.fillRect(tx, ty, 32, 36);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(tx+2, ty+1, 28, 33);
    ctx.fillStyle = '#686868'; ctx.fillRect(tx+3, ty+2, 26, 30);
    ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1;
    for (let row = ty+8; row < ty+34; row += 10) {
      ctx.beginPath(); ctx.moveTo(tx+3,row); ctx.lineTo(tx+29,row); ctx.stroke();
    }
    for (const col of [tx+10, tx+20]) {
      ctx.beginPath(); ctx.moveTo(col,ty+2); ctx.lineTo(col,ty+32); ctx.stroke();
    }
    ctx.fillStyle = this.color+'66'; ctx.fillRect(tx+2, ty+1, 28, 4);
    ctx.fillStyle = '#3e3e3e';
    for (let i = 0; i < 4; i++) ctx.fillRect(tx+i*9, ty-10, 7, 12);
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) ctx.fillRect(tx+i*9+1, ty-9, 5, 10);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(this.x-3, ty+7, 6, 13);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(this.x-2, ty+8, 4, 11);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(this.x-2, ty+3, 4, 5);
    ctx.beginPath(); ctx.arc(this.x, ty-2, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(this.x, ty-2, 5, Math.PI, Math.PI*2); ctx.fill();

    if      (this.typeKey === 'sniper')    this._drawCatapult(ctx, angle);
    else if (this.typeKey === 'fire')      this._drawFire(ctx, angle);
    else if (this.typeKey === 'ice')       this._drawIce(ctx, angle);
    else if (this.typeKey === 'lightning') this._drawLightning(ctx, angle);
    else if (this.typeKey === 'earth')     this._drawEarth(ctx, angle);
    else {
      ctx.save(); ctx.translate(this.x, this.y-5); ctx.rotate(angle);
      this._drawWeapon(ctx); ctx.restore();
    }

    if (this.fireTimer > 0) {
      const p = this.fireTimer/10;
      const fc = ({slow:'#cc66ff',sniper:'#aaa',fire:'#ff6600',ice:'#aaeeff',lightning:'#ffffff',earth:'#886644'})[this.typeKey] || '#ffe080';
      const tipX = this.x+Math.cos(angle)*28, tipY = (this.y-5)+Math.sin(angle)*28;
      ctx.save(); ctx.globalAlpha = p*0.85; ctx.shadowColor = fc; ctx.shadowBlur = 16;
      ctx.fillStyle = fc;
      ctx.beginPath(); ctx.arc(tipX,tipY,9*p,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
    }

    const hpFrac = this.hp/this.maxHp;
    ctx.fillStyle = '#111'; ctx.fillRect(tx, this.y+23, 32, 5);
    ctx.fillStyle = hpFrac > 0.5 ? '#0f0' : hpFrac > 0.25 ? '#f80' : '#f00';
    ctx.fillRect(tx, this.y+23, 32*hpFrac, 5);

    if (isSelected) {
      ctx.strokeStyle = this.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI*2); ctx.stroke();
    }
  }

  _drawCatapult(ctx, angle) {
    ctx.save(); ctx.translate(this.x, this.y-10); ctx.rotate(angle);
    ctx.fillStyle = '#6b3a10'; ctx.fillRect(-12,-3,26,7); ctx.fillRect(-10,3,6,9); ctx.fillRect(9,3,6,9);
    ctx.fillStyle = '#4a2808'; ctx.fillRect(-2,-3,4,10);
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(0,0,2.5,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.rotate(-0.65);
    ctx.fillStyle = '#8b4c12'; ctx.fillRect(-2,-20,4,22);
    ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(0,-21,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(-2,-22,2.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#5a2e08';
    ctx.beginPath(); ctx.arc(-8,10,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8,10,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(-8,10,1.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8,10,1.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  _drawFire(ctx, angle) {
    ctx.save(); ctx.translate(this.x, this.y-8);
    ctx.fillStyle = '#5a3010'; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8a4818'; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
    for (const a of [-2.2,-1.0,0.1,1.3]) {
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*7,Math.sin(a)*7); ctx.lineTo(Math.cos(a)*12,Math.sin(a)*12-8); ctx.stroke();
    }
    ctx.rotate(angle);
    const ft = (this.fireTimer > 0) ? this.fireTimer/10 : 0.4;
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10+ft*12;
    ctx.fillStyle = '#ff2200';
    ctx.beginPath(); ctx.moveTo(0,-5); ctx.bezierCurveTo(6,-14,3,-24,0,-28); ctx.bezierCurveTo(-3,-24,-6,-14,0,-5); ctx.fill();
    ctx.fillStyle = '#ff8800';
    ctx.beginPath(); ctx.moveTo(0,-5); ctx.bezierCurveTo(4,-12,2,-20,0,-23); ctx.bezierCurveTo(-2,-20,-4,-12,0,-5); ctx.fill();
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath(); ctx.moveTo(0,-5); ctx.bezierCurveTo(2,-10,1,-15,0,-18); ctx.bezierCurveTo(-1,-15,-2,-10,0,-5); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  _drawIce(ctx, angle) {
    ctx.save(); ctx.translate(this.x, this.y-6);
    ctx.fillStyle = '#4488aa'; ctx.fillRect(-2,-22,4,18);
    ctx.fillStyle = '#5599bb'; ctx.fillRect(-3,-24,6,4);
    ctx.strokeStyle = '#aaeeff'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = angle+(i/6)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*3,Math.sin(a)*3-26); ctx.lineTo(Math.cos(a)*11,Math.sin(a)*11-26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(Math.cos(a+0.4)*7,Math.sin(a+0.4)*7-26); ctx.lineTo(Math.cos(a)*9,Math.sin(a)*9-26); ctx.stroke();
    }
    ctx.shadowColor = '#88ddff'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#aaeeff'; ctx.beginPath(); ctx.arc(0,-26,7,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ddf6ff'; ctx.beginPath(); ctx.arc(-2,-28,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  _drawLightning(ctx, angle) {
    ctx.save(); ctx.translate(this.x, this.y-8);
    ctx.fillStyle = '#4a5520'; ctx.fillRect(-6,-14,12,14);
    ctx.fillStyle = '#6a7830'; ctx.fillRect(-4,-16,8,4);
    ctx.strokeStyle = '#aabb66'; ctx.lineWidth = 2;
    for (const y2 of [-5,-9]) { ctx.beginPath(); ctx.ellipse(0,y2,9,4,0,0,Math.PI*2); ctx.stroke(); }
    if (this.fireTimer > 0) {
      ctx.rotate(angle);
      const p = this.fireTimer/10;
      ctx.strokeStyle = `rgba(255,255,100,${p})`; ctx.lineWidth = 2;
      for (const ox of [-3,0,3]) {
        ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(ox*2,-22); ctx.lineTo(ox,-28); ctx.lineTo(ox*3,-34); ctx.stroke();
      }
    }
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffff88'; ctx.beginPath(); ctx.arc(0,-16,4,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  _drawEarth(ctx, angle) {
    ctx.save(); ctx.translate(this.x, this.y-8); ctx.rotate(angle);
    ctx.fillStyle = '#5a3808'; ctx.fillRect(-14,-4,30,8); ctx.fillRect(-12,3,7,11); ctx.fillRect(11,3,7,11);
    ctx.fillStyle = '#3a2205'; ctx.fillRect(-3,-4,6,12);
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.rotate(-0.45);
    ctx.fillStyle = '#6b3a0a'; ctx.fillRect(-3,-28,6,30);
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(0,-29,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(-2,-31,7,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#4a2808';
    ctx.beginPath(); ctx.arc(-10,12,6,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 10,12,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(-10,12,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 10,12,2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  _drawWeapon(ctx) {
    if (this.typeKey === 'rapid') {
      ctx.fillStyle = '#5a3010'; ctx.fillRect(-2,-2,24,4);
      ctx.fillStyle = '#3a2008'; ctx.fillRect(-2,-1,7,2);
      ctx.fillStyle = '#4a2808'; ctx.fillRect(5,-9,5,18);
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(5,-9); ctx.lineTo(10,0); ctx.lineTo(5,9); ctx.stroke();
      ctx.fillStyle = '#bbb'; ctx.fillRect(10,-1.5,15,3);
      ctx.fillStyle = '#999'; ctx.beginPath(); ctx.moveTo(25,-3.5); ctx.lineTo(25,3.5); ctx.lineTo(30,0); ctx.closePath(); ctx.fill();
    } else if (this.typeKey === 'slow') {
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-2,-24,4,26);
      ctx.fillStyle = '#8b6030'; ctx.fillRect(-4,-24,8,4);
      ctx.shadowColor = this.color; ctx.shadowBlur = 14;
      ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0,-26,6,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(-2,-28,2.5,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(8,-18,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-9,-14,1.5,0,Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(3,-13); ctx.quadraticCurveTo(20,0,3,13); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(3,-13); ctx.lineTo(3,13); ctx.stroke();
      ctx.strokeStyle = '#c8b860'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(3,0); ctx.lineTo(24,0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(24,-3); ctx.lineTo(24,3); ctx.lineTo(29,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cc4444';
      ctx.beginPath(); ctx.moveTo(3,0); ctx.lineTo(0,-4); ctx.lineTo(5,0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(3,0); ctx.lineTo(0, 4); ctx.lineTo(5,0); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt';
    }
  }
}
