import { MINE } from './constants.js?v=28';

export class Mine {
  constructor(x, y) {
    Object.assign(this, MINE);
    this.x = x;
    this.y = y;
    this.typeKey = 'mine';
    this.timer = 0;
    this.flashTimer = 0;
  }

  // Returns gold earned this frame (>0 only when timer fires), 0 otherwise
  update() {
    if (this.flashTimer > 0) this.flashTimer--;
    this.timer++;
    if (this.timer >= this.period) {
      this.timer = 0;
      this.flashTimer = 25;
      return this.income;
    }
    return 0;
  }

  draw(ctx) {
    const { x, y } = this;
    const progress = this.timer / this.period;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(x + 2, y + 20, 16, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Mine shaft — dark hole
    ctx.fillStyle = '#100c00';
    ctx.beginPath(); ctx.ellipse(x, y + 6, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1600';
    ctx.beginPath(); ctx.ellipse(x - 1, y + 4, 9, 6, 0, 0, Math.PI * 2); ctx.fill();

    // Wooden mine frame — two posts + lintel
    ctx.fillStyle = '#4a2808';
    ctx.fillRect(x - 14, y - 8,  5, 20);
    ctx.fillRect(x +  9, y - 8,  5, 20);
    ctx.fillRect(x - 14, y - 12, 28, 6);
    ctx.fillStyle = '#6b3a10';
    ctx.fillRect(x - 12, y - 6,  3, 17);
    ctx.fillRect(x + 10, y - 6,  3, 17);
    ctx.fillRect(x - 12, y - 11, 24, 4);

    // Sign above shaft
    ctx.fillStyle = '#3a2008';
    ctx.fillRect(x - 9, y - 24, 18, 10);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('$$', x, y - 16); ctx.textAlign = 'left';

    // Income progress arc (gold ring fills clockwise)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x, y + 6, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;

    // Gold coin pop when income triggers
    if (this.flashTimer > 0) {
      const p = this.flashTimer / 25;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${10 + (1 - p) * 6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`+$${this.income}`, x, y - 28 - (1 - p) * 12);
      ctx.textAlign = 'left';
      ctx.restore();
    }
  }
}
