import { distance } from './constants.js?v=8';

// GameMap owns the terrain: the path, grass tufts, trees, rocks, and the enemy camp.
export class GameMap {
  constructor(path, W, H) {
    this.path = path;
    this.W = W;
    this.H = H;
    this.grassTufts = this._generateGrass();
    this.trees = this._generateTrees();
    this.rocks = this._generateRocks();
  }

  // Returns true if (x, y) is too close to the path for tower placement.
  isOnPath(x, y) {
    const margin = 30;
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i], b = this.path[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2));
      if (Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy)) < margin) return true;
    }
    return false;
  }

  draw(ctx) {
    // Base grass
    ctx.fillStyle = '#4a7a3e';
    ctx.fillRect(0, 0, this.W, this.H);

    // Grass tufts
    for (const g of this.grassTufts) {
      ctx.fillStyle = g.c;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    }

    // Rocks
    for (const r of this.rocks) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.save(); ctx.translate(r.x + 2, r.y + 3); ctx.scale(r.rx, r.ry * 0.5);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = r.dark;
      ctx.save(); ctx.translate(r.x, r.y + 1); ctx.scale(r.rx * 1.05, r.ry);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = r.light;
      ctx.save(); ctx.translate(r.x, r.y); ctx.scale(r.rx, r.ry);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    // Enemy camp dirt ground — drawn before path so the road leads out of it
    const sp = this.path[0];
    ctx.fillStyle = '#2d1205';
    ctx.fillRect(sp.x, sp.y - 54, 92, 112);
    ctx.fillStyle = '#3a1a08';
    ctx.fillRect(sp.x + 5, sp.y - 48, 82, 100);

    // Path — 4 layers: shadow edge, dark dirt, mid dirt, light center rut
    const drawLine = (color, width) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
      ctx.stroke();
    };
    drawLine('#3a1a06', 52);
    drawLine('#8c5020', 44);
    drawLine('#b47840', 30);
    drawLine('#c8944e', 16);
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';

    // Path ruts / cracks
    ctx.strokeStyle = 'rgba(70,35,8,0.22)'; ctx.lineWidth = 1;
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg + 1];
      for (let t = 0.04; t < 1.0; t += 0.10) {
        const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
        const perp = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
        const len = 7 + Math.sin(t * 19 + seg) * 4;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(perp) * len, py + Math.sin(perp) * len);
        ctx.lineTo(px - Math.cos(perp) * len * 0.5, py - Math.sin(perp) * len * 0.5);
        ctx.stroke();
      }
    }

    // Trees
    for (const tr of this.trees) {
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.save(); ctx.translate(tr.x + tr.r * 0.5, tr.y + tr.r * 0.35); ctx.scale(1.15, 0.38);
      ctx.beginPath(); ctx.arc(0, 0, tr.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#5a3310'; ctx.fillRect(tr.x - 3, tr.y, 6, tr.r * 0.75);
      ctx.fillStyle = '#1e4220';
      ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d6b32';
      ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.18, tr.y - tr.r * 0.22, tr.r * 0.74, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a8040';
      ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.28, tr.y - tr.r * 0.38, tr.r * 0.48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#52a052';
      ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.34, tr.y - tr.r * 0.52, tr.r * 0.26, 0, Math.PI * 2); ctx.fill();
    }

    this._drawCampStructures(ctx);
    this._drawCastle(ctx);
  }

  _drawCampStructures(ctx) {
    const sp = this.path[0];
    const ox = sp.x + 46, oy = sp.y;

    ctx.fillStyle = '#3a2008';
    ctx.save(); ctx.translate(ox - 28, oy + 12); ctx.rotate(0.5);
    ctx.fillRect(-11, -3, 22, 5); ctx.restore();
    ctx.save(); ctx.translate(ox - 28, oy + 12); ctx.rotate(-0.5);
    ctx.fillRect(-11, -3, 22, 5); ctx.restore();
    ctx.fillStyle = '#ff3300';
    ctx.beginPath(); ctx.moveTo(ox-34, oy+13); ctx.lineTo(ox-28, oy-8); ctx.lineTo(ox-22, oy+13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff7700';
    ctx.beginPath(); ctx.moveTo(ox-33, oy+13); ctx.lineTo(ox-28, oy-2); ctx.lineTo(ox-23, oy+13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.moveTo(ox-31, oy+13); ctx.lineTo(ox-28, oy+4); ctx.lineTo(ox-25, oy+13); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#7a3a10';
    ctx.beginPath(); ctx.moveTo(ox - 8, oy - 52); ctx.lineTo(ox + 40, oy - 6); ctx.lineTo(ox - 56, oy - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a2808';
    ctx.beginPath(); ctx.moveTo(ox - 8, oy - 52); ctx.lineTo(ox + 4, oy - 6); ctx.lineTo(ox - 20, oy - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a1a05'; ctx.fillRect(ox - 10, oy - 55, 5, 52);

    ctx.fillStyle = '#6a3015';
    ctx.beginPath(); ctx.moveTo(ox - 10, oy + 52); ctx.lineTo(ox + 32, oy + 8); ctx.lineTo(ox - 52, oy + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a1e0a';
    ctx.beginPath(); ctx.moveTo(ox - 10, oy + 52); ctx.lineTo(ox + 3, oy + 8); ctx.lineTo(ox - 23, oy + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1005'; ctx.fillRect(ox - 12, oy + 8, 4, 46);

    ctx.fillStyle = '#3a1a05'; ctx.fillRect(ox + 34, oy - 42, 3, 54);
    ctx.fillStyle = '#ddd0b0';
    ctx.beginPath(); ctx.arc(ox + 35, oy - 47, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(ox + 33, oy - 49, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 37, oy - 49, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox+29, oy-43); ctx.lineTo(ox+41, oy-43); ctx.stroke();

    ctx.fillStyle = '#3a1a05'; ctx.fillRect(ox + 58, oy - 47, 3, 60);
    ctx.fillStyle = '#880000'; ctx.fillRect(ox + 61, oy - 47, 30, 22);
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(ox + 76, oy - 36, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(ox + 74, oy - 38, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 78, oy - 38, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#550000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox+70, oy-32); ctx.lineTo(ox+82, oy-32); ctx.stroke();

    ctx.fillStyle = 'rgba(220,60,60,0.75)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ENEMY CAMP', ox + 10, oy - 60); ctx.textAlign = 'left';
  }

  _drawCastle(ctx) {
    const ex = this.path[this.path.length - 1].x;
    const ey = this.path[this.path.length - 1].y;

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(ex - 58, ey + 18, 116, 12);

    ctx.fillStyle = '#666'; ctx.fillRect(ex - 54, ey - 30, 108, 50);
    ctx.fillStyle = '#888'; ctx.fillRect(ex - 52, ey - 28, 104, 46);
    ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
    for (let row = ey - 22; row < ey + 20; row += 8) {
      ctx.beginPath(); ctx.moveTo(ex - 52, row); ctx.lineTo(ex + 52, row); ctx.stroke();
    }
    for (let col = ex - 46; col < ex + 52; col += 14) {
      ctx.beginPath(); ctx.moveTo(col, ey - 28); ctx.lineTo(col, ey + 20); ctx.stroke();
    }

    ctx.fillStyle = '#636363'; ctx.fillRect(ex - 62, ey - 58, 32, 76);
    ctx.fillStyle = '#878787'; ctx.fillRect(ex - 60, ey - 56, 28, 72);
    ctx.fillStyle = '#636363';
    for (let i = 0; i < 4; i++) ctx.fillRect(ex - 62 + i * 9, ey - 67, 7, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(ex - 56, ey - 44, 5, 9);
    ctx.fillRect(ex - 44, ey - 44, 5, 9);

    ctx.fillStyle = '#636363'; ctx.fillRect(ex + 30, ey - 58, 32, 76);
    ctx.fillStyle = '#878787'; ctx.fillRect(ex + 32, ey - 56, 28, 72);
    ctx.fillStyle = '#636363';
    for (let i = 0; i < 4; i++) ctx.fillRect(ex + 30 + i * 9, ey - 67, 7, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(ex + 42, ey - 44, 5, 9);
    ctx.fillRect(ex + 54, ey - 44, 5, 9);

    ctx.fillStyle = '#636363';
    for (let i = 0; i < 6; i++) ctx.fillRect(ex - 48 + i * 18, ey - 38, 12, 10);

    ctx.fillStyle = '#333';
    ctx.fillRect(ex - 46, ey - 16, 5, 10); ctx.fillRect(ex - 28, ey - 16, 5, 10);
    ctx.fillRect(ex + 23, ey - 16, 5, 10); ctx.fillRect(ex + 41, ey - 16, 5, 10);

    ctx.fillStyle = '#444'; ctx.fillRect(ex - 15, ey - 20, 30, 38);
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(ex, ey - 20, 15, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(ex + i * 6, ey - 30); ctx.lineTo(ex + i * 6, ey + 18); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(ex - 13, ey - 14); ctx.lineTo(ex + 13, ey - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 13, ey - 3);  ctx.lineTo(ex + 13, ey - 3);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 13, ey + 8);  ctx.lineTo(ex + 13, ey + 8);  ctx.stroke();
    ctx.fillStyle = 'rgba(255,160,0,0.5)'; ctx.fillRect(ex - 7, ey - 5, 14, 22);

    ctx.fillStyle = '#5a3010'; ctx.fillRect(ex - 47, ey - 76, 2, 22);
    ctx.fillStyle = '#1a3a9a'; ctx.fillRect(ex - 62, ey - 76, 18, 14);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(ex - 57, ey - 74, 8, 8);

    ctx.fillStyle = '#5a3010'; ctx.fillRect(ex + 45, ey - 76, 2, 22);
    ctx.fillStyle = '#1a3a9a'; ctx.fillRect(ex + 47, ey - 76, 18, 14);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(ex + 52, ey - 74, 8, 8);
  }

  _generateGrass() {
    const count = Math.floor(this.W * this.H / 1500);
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      r: 1.5 + Math.random() * 4.5,
      c: ['#3a6b3e', '#4a7c4e', '#568a5a', '#3d7040', '#2e5c32', '#5e9460'][Math.floor(Math.random() * 6)],
    }));
  }

  _generateRocks() {
    const rocks = [];
    let attempts = 0;
    while (rocks.length < 18 && attempts++ < 2000) {
      const x = 20 + Math.random() * (this.W - 40), y = 20 + Math.random() * (this.H - 40);
      if (!this.isOnPath(x, y))
        rocks.push({
          x, y,
          rx: 5 + Math.random() * 10,
          ry: 3 + Math.random() * 6,
          light: `hsl(0,0%,${48 + Math.random()*18}%)`,
          dark:  `hsl(0,0%,${22 + Math.random()*14}%)`,
        });
    }
    return rocks;
  }

  _generateTrees() {
    const trees = [];
    let attempts = 0;
    while (trees.length < 22 && attempts++ < 4000) {
      const tx = 25 + Math.random() * (this.W - 50), ty = 25 + Math.random() * (this.H - 50);
      if (!this.isOnPath(tx, ty) && trees.every(t => Math.hypot(t.x - tx, t.y - ty) > 35))
        trees.push({ x: tx, y: ty, r: 14 + Math.random() * 10 });
    }
    return trees;
  }
}
