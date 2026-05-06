import { PATH, distance } from './constants.js';

// GameMap owns the terrain: the path, grass tufts, and trees.
// It knows where the path is so towers can't be placed on it.
export class GameMap {
  constructor() {
    this.path = PATH;
    this.grassTufts = this._generateGrass();
    this.trees = this._generateTrees();
  }

  // Returns true if (x, y) is too close to the path for tower placement.
  // Uses point-to-line-segment projection math to check each segment.
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
    // Grass tufts
    for (const g of this.grassTufts) {
      ctx.fillStyle = g.c;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    }

    // Path — 3 layers to look like a dirt road
    const drawLine = (color, width) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
      ctx.stroke();
    };
    drawLine('#6b3f1e', 46);
    drawLine('#9e6030', 38);
    drawLine('#c4885a', 22);
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';

    // Trees (drawn before towers so towers appear on top)
    for (const tr of this.trees) {
      ctx.fillStyle = '#1e4220';
      ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d6b32';
      ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.2, tr.y - tr.r * 0.25, tr.r * 0.72, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a8040';
      ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.3, tr.y - tr.r * 0.4, tr.r * 0.45, 0, Math.PI * 2); ctx.fill();
    }

    // Spawn portal at path start
    const sp = this.path[0];
    ctx.strokeStyle = '#ff2222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,30,30,0.18)';
    ctx.beginPath(); ctx.arc(sp.x, sp.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SPAWN', sp.x, sp.y + 4); ctx.textAlign = 'left';

    // Castle at path end
    const [cx, cy] = [this.path[this.path.length - 1].x, this.path[this.path.length - 1].y];
    ctx.fillStyle = '#777'; ctx.fillRect(cx - 34, cy - 30, 68, 40);
    ctx.fillStyle = '#888'; ctx.fillRect(cx - 34, cy - 44, 20, 18);
    ctx.fillStyle = '#888'; ctx.fillRect(cx + 14, cy - 44, 20, 18);
    ctx.fillStyle = '#555'; ctx.fillRect(cx - 10, cy - 8, 20, 18);
    ctx.fillStyle = 'rgba(255,160,0,0.55)'; ctx.fillRect(cx - 6, cy - 4, 12, 10);
  }

  // Private helpers — called once in the constructor to build fixed decorations
  _generateGrass() {
    return Array.from({ length: 200 }, () => ({
      x: Math.random() * 800, y: Math.random() * 500,
      r: 2 + Math.random() * 5,
      c: ['#3a6b3e', '#4a7c4e', '#568a5a', '#3d7040'][Math.floor(Math.random() * 4)],
    }));
  }

  _generateTrees() {
    const trees = [];
    let attempts = 0;
    while (trees.length < 14 && attempts++ < 2000) {
      const tx = 25 + Math.random() * 750, ty = 25 + Math.random() * 450;
      if (!this.isOnPath(tx, ty) && trees.every(t => Math.hypot(t.x - tx, t.y - ty) > 35))
        trees.push({ x: tx, y: ty, r: 14 + Math.random() * 10 });
    }
    return trees;
  }
}
