import { distance } from './constants.js?v=47';

// GameMap owns the terrain: path, terrain features, and structures.
// isFinalLevel = true → medieval wasteland theme; false → normal green battlefield.
export class GameMap {
  constructor(path, W, H, isFinalLevel = false, isCloudLevel = false) {
    this.path = path;
    this.W = W;
    this.H = H;
    this.isFinalLevel = isFinalLevel;
    this.isCloudLevel = isCloudLevel;

    // Normal battlefield features
    this.grassTufts = this._generateGrass();
    this.craters    = this._generateCraters();
    this.sandbags   = this._generateSandbags();
    this.fires      = this._generateFires();

    // Wasteland features (used on final level)
    this.deadGrass   = this._generateDeadGrass();
    this.ruins       = this._generateRuins();
    this.rubble      = this._generateRubble();
    this.torches     = this._generateTorches();
    this.mistPatches = this._generateMist();

    // Trees and rocks shared (just look different between themes)
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
    if (this.isCloudLevel) { this._drawCloudLevel(ctx); }
    else if (this.isFinalLevel) { this._drawWasteland(ctx); }
    else { this._drawBattlefield(ctx); }
    this._drawCampStructures(ctx);
    this._drawCastle(ctx);
  }

  // ── Cloud / Dragon Island level ──────────────────────────────────────────────
  _drawCloudLevel(ctx) {
    // Sky blue gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#c0e8ff');
    grad.addColorStop(1, '#e8f4ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    // Fluffy cloud puffs scattered across the map
    const t = Date.now() / 8000;
    const cloudSeeds = [
      [0.1, 0.15, 60], [0.3, 0.08, 45], [0.55, 0.18, 70], [0.75, 0.10, 50],
      [0.9, 0.22, 55], [0.2, 0.82, 65], [0.5, 0.75, 50], [0.8, 0.88, 45],
      [0.15, 0.45, 40], [0.65, 0.55, 60], [0.85, 0.50, 35],
    ];
    for (const [fx, fy, size] of cloudSeeds) {
      const px = this.W * fx + Math.sin(t + fx * 10) * 8;
      const py = this.H * fy;
      if (this.isOnPath(px, py)) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      // Draw multi-circle cloud puff
      for (const [ox, oy, r] of [
        [0, 0, size * 0.7], [-size * 0.55, size * 0.2, size * 0.55],
        [size * 0.55, size * 0.2, size * 0.50], [0, size * 0.18, size * 0.60],
        [-size * 0.28, -size * 0.2, size * 0.42], [size * 0.28, -size * 0.2, size * 0.42],
      ]) {
        ctx.beginPath(); ctx.arc(px + ox, py + oy, r, 0, Math.PI * 2); ctx.fill();
      }
      // Soft shadow underneath
      ctx.fillStyle = 'rgba(100,160,210,0.12)';
      ctx.save(); ctx.translate(px, py + size * 0.4); ctx.scale(1, 0.25);
      ctx.beginPath(); ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Rocks (floating island stones)
    this._drawRocks(ctx);

    // Enemy camp dirt ground
    const sp = this.path[0];
    ctx.fillStyle = '#2d1205'; ctx.fillRect(sp.x, sp.y - 54, 92, 112);
    ctx.fillStyle = '#3a1a08'; ctx.fillRect(sp.x + 5, sp.y - 48, 82, 100);

    // Path — slightly lighter blue-grey to suggest cloud walkway
    this._drawPath(ctx, '#aaccee', '#bbddee', '#cceeff', '#ddeeff');

    // Path ruts (soft blue)
    ctx.strokeStyle = 'rgba(100,150,200,0.18)'; ctx.lineWidth = 1;
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg + 1];
      for (let t2 = 0.04; t2 < 1.0; t2 += 0.10) {
        const px = a.x + (b.x - a.x) * t2, py = a.y + (b.y - a.y) * t2;
        const perp = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
        const len = 7 + Math.sin(t2 * 19 + seg) * 4;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(perp)*len, py + Math.sin(perp)*len);
        ctx.lineTo(px - Math.cos(perp)*len*0.5, py - Math.sin(perp)*len*0.5);
        ctx.stroke();
      }
    }
  }

  // ── Normal green battlefield (levels 1-99) ───────────────────────────────────
  _drawBattlefield(ctx) {
    // Rich sky+ground gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.H);
    bgGrad.addColorStop(0,   '#3a6b3e');
    bgGrad.addColorStop(0.4, '#4a7c4e');
    bgGrad.addColorStop(1,   '#3d6b40');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.W, this.H);

    // Grass variation patches — more colors, more depth
    const patchColors = ['#3d6e42','#336638','#4a7a44','#2f5e35','#527c3e'];
    for (let i = 0; i < 22; i++) {
      const px = (this.W * ((i * 137 + 53) % 100)) / 100;
      const py = (this.H * ((i * 97  + 29) % 100)) / 100;
      ctx.fillStyle = patchColors[i % patchColors.length];
      ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.55);
      ctx.beginPath(); ctx.arc(0, 0, 28 + (i % 4) * 14, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Grass tufts — drawn as tiny strokes for texture
    for (const g of this.grassTufts) {
      ctx.fillStyle = g.c;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
      // Extra tuft strokes
      if (g.r > 3) {
        ctx.strokeStyle = g.c; ctx.lineWidth = 1; ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI - Math.PI * 0.5;
          ctx.beginPath();
          ctx.moveTo(g.x, g.y);
          ctx.lineTo(g.x + Math.cos(a) * g.r * 1.6, g.y + Math.sin(a) * g.r * 1.2 - g.r);
          ctx.stroke();
        }
        ctx.lineCap = 'butt';
      }
    }

    // Rocks
    this._drawRocks(ctx);

    // Craters — bomb holes
    for (const c of this.craters) {
      ctx.fillStyle = '#2a1e0a';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0e0a04';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a10';
      ctx.beginPath(); ctx.arc(c.x - c.r*0.25, c.y - c.r*0.25, c.r*0.55, 0, Math.PI * 2); ctx.fill();
    }

    // Enemy camp dirt ground
    const sp = this.path[0];
    ctx.fillStyle = '#2d1205'; ctx.fillRect(sp.x, sp.y - 54, 92, 112);
    ctx.fillStyle = '#3a1a08'; ctx.fillRect(sp.x + 5, sp.y - 48, 82, 100);

    // Path
    this._drawPath(ctx, '#3a1a06', '#8c5020', '#b47840', '#c8944e');

    // Path ruts
    ctx.strokeStyle = 'rgba(70,35,8,0.22)'; ctx.lineWidth = 1;
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg + 1];
      for (let t = 0.04; t < 1.0; t += 0.10) {
        const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
        const perp = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
        const len = 7 + Math.sin(t * 19 + seg) * 4;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(perp)*len, py + Math.sin(perp)*len);
        ctx.lineTo(px - Math.cos(perp)*len*0.5, py - Math.sin(perp)*len*0.5);
        ctx.stroke();
      }
    }

    // Sandbags
    for (const sb of this.sandbags) {
      ctx.save(); ctx.translate(sb.x, sb.y); ctx.rotate(sb.ang);
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = i === 0 ? '#7a6438' : '#5a4824';
        ctx.save(); ctx.translate(i * 12, 0); ctx.scale(1, 0.55);
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // Green trees — multi-layer canopy with specular highlight
    for (const tr of this.trees) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.save(); ctx.translate(tr.x + tr.r*0.5, tr.y + tr.r*0.38); ctx.scale(1.2, 0.3);
      ctx.beginPath(); ctx.arc(0, 0, tr.r, 0, Math.PI*2); ctx.fill(); ctx.restore();
      // Trunk with gradient
      const trunkG = ctx.createLinearGradient(tr.x-3, tr.y, tr.x+3, tr.y);
      trunkG.addColorStop(0, '#3a2008'); trunkG.addColorStop(0.5, '#6b4020'); trunkG.addColorStop(1, '#3a2008');
      ctx.fillStyle = trunkG; ctx.fillRect(tr.x - 3, tr.y, 6, tr.r * 0.8);
      // Root flares
      ctx.fillStyle = '#4a2c10';
      ctx.fillRect(tr.x - 5, tr.y + tr.r * 0.6, 3, tr.r * 0.18);
      ctx.fillRect(tr.x + 2, tr.y + tr.r * 0.6, 3, tr.r * 0.18);
      // Dark base canopy layer
      ctx.fillStyle = '#1a3c1e';
      ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r * 1.05, 0, Math.PI*2); ctx.fill();
      // Mid canopy
      ctx.fillStyle = '#2a6030';
      ctx.beginPath(); ctx.arc(tr.x - tr.r*0.1, tr.y - tr.r*0.18, tr.r*0.82, 0, Math.PI*2); ctx.fill();
      // Lighter upper canopy
      ctx.fillStyle = '#3a7a3e';
      ctx.beginPath(); ctx.arc(tr.x - tr.r*0.22, tr.y - tr.r*0.34, tr.r*0.62, 0, Math.PI*2); ctx.fill();
      // Upper highlight circle
      ctx.fillStyle = '#4d9450';
      ctx.beginPath(); ctx.arc(tr.x - tr.r*0.30, tr.y - tr.r*0.48, tr.r*0.40, 0, Math.PI*2); ctx.fill();
      // Specular top highlight
      ctx.fillStyle = '#62b060';
      ctx.beginPath(); ctx.arc(tr.x - tr.r*0.38, tr.y - tr.r*0.60, tr.r*0.20, 0, Math.PI*2); ctx.fill();
      // Tiny white glint
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(tr.x - tr.r*0.42, tr.y - tr.r*0.68, tr.r*0.10, 0, Math.PI*2); ctx.fill();
    }

    // Animated fires
    const ft = Date.now() / 120;
    for (const f of this.fires) {
      const flicker = Math.sin(ft + f.x * 0.1) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,80,0,${0.25 * flicker})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.size * 1.8, 0, Math.PI*2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const off = Math.sin(ft * 1.3 + i * 2.1 + f.x) * f.size * 0.4;
        ctx.fillStyle = i === 0 ? '#ff4400' : i === 1 ? '#ff8800' : '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(f.x - f.size*0.5 + off, f.y + f.size*0.3);
        ctx.lineTo(f.x + off, f.y - f.size*(0.8 + i*0.3));
        ctx.lineTo(f.x + f.size*0.5 + off, f.y + f.size*0.3);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath(); ctx.arc(f.x + Math.sin(ft*2+f.x)*f.size*0.3, f.y - f.size*1.1, 2, 0, Math.PI*2); ctx.fill();
    }
  }

  // ── Medieval wasteland (level 100 only) ─────────────────────────────────────
  _drawWasteland(ctx) {
    ctx.fillStyle = '#1e1810';
    ctx.fillRect(0, 0, this.W, this.H);

    // Cracked earth patches
    ctx.fillStyle = '#2a2218';
    for (let i = 0; i < 16; i++) {
      const px = (this.W * ((i * 137 + 53) % 100)) / 100;
      const py = (this.H * ((i * 97  + 29) % 100)) / 100;
      ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.55);
      ctx.beginPath(); ctx.arc(0, 0, 28 + (i % 4) * 14, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Dead grass wisps
    for (const g of this.deadGrass) {
      ctx.fillStyle = g.c;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    }

    // Crack lines in the earth
    ctx.strokeStyle = 'rgba(10,8,4,0.5)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 22; i++) {
      const cx = (this.W * ((i * 173 + 11) % 100)) / 100;
      const cy = (this.H * ((i * 83  + 61) % 100)) / 100;
      if (this.isOnPath(cx, cy)) continue;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(i * 1.3) * 28, cy + Math.sin(i * 1.7) * 18);
      ctx.stroke();
    }

    // Rocks
    this._drawRocks(ctx);

    // Ruins — broken stone blocks / fallen pillars
    for (const ru of this.ruins) {
      ctx.fillStyle = '#2a2520';
      ctx.fillRect(ru.x, ru.y, ru.w, ru.h);
      ctx.fillStyle = '#3a332c';
      ctx.fillRect(ru.x + 2, ru.y + 2, ru.w - 3, ru.h - 3);
      ctx.fillStyle = '#1a1510';
      ctx.fillRect(ru.x, ru.y + ru.h - 2, ru.w, 2);
      // Moss-line crack
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ru.x + ru.w*0.3, ru.y); ctx.lineTo(ru.x + ru.w*0.5, ru.y + ru.h); ctx.stroke();
    }

    // Rubble piles
    for (const rb of this.rubble) {
      for (let k = 0; k < rb.pieces; k++) {
        const ang = (k / rb.pieces) * Math.PI * 2;
        const rr  = rb.r * (0.4 + 0.6 * Math.sin(k * 2.7));
        ctx.fillStyle = k % 2 === 0 ? '#2e2820' : '#3a342a';
        ctx.save(); ctx.translate(rb.x + Math.cos(ang)*rr, rb.y + Math.sin(ang)*rr); ctx.rotate(ang);
        ctx.fillRect(-4, -2, 8, 4); ctx.restore();
      }
    }

    // Enemy camp dark ground — drawn before path
    const sp = this.path[0];
    ctx.fillStyle = '#0e0a08';
    ctx.fillRect(sp.x, sp.y - 54, 92, 112);
    ctx.fillStyle = '#16100c';
    ctx.fillRect(sp.x + 5, sp.y - 48, 82, 100);

    // ── Path — cracked grey cobblestones ─────────────────────────────────────
    this._drawPath(ctx, '#1a1610', '#2e2a26', '#3e3a34', '#4e4a44');

    // Cobblestone joints
    ctx.strokeStyle = 'rgba(15,12,8,0.45)'; ctx.lineWidth = 1.2;
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg + 1];
      for (let t = 0.05; t < 1.0; t += 0.09) {
        const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
        const perp = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
        const len = 6 + Math.sin(t * 17 + seg) * 3;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(perp)*len, py + Math.sin(perp)*len);
        ctx.lineTo(px - Math.cos(perp)*len*0.6, py - Math.sin(perp)*len*0.6);
        ctx.stroke();
      }
    }

    // Mist patches (animated)
    const mt = Date.now() / 3000;
    for (const m of this.mistPatches) {
      const drift = Math.sin(mt + m.phase) * 12;
      const alpha = 0.08 + Math.sin(mt * 0.7 + m.phase) * 0.04;
      ctx.save();
      const mg = ctx.createRadialGradient(m.x + drift, m.y, 0, m.x + drift, m.y, m.r);
      mg.addColorStop(0, `rgba(200,210,220,${alpha})`);
      mg.addColorStop(1, 'rgba(200,210,220,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(m.x + drift, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Dead trees
    for (const tr of this.trees) {
      this._drawDeadTree(ctx, tr.x, tr.y, tr.r);
    }

    // Torches — animated flicker
    const ft = Date.now() / 120;
    for (const f of this.torches) {
      // Stake
      ctx.fillStyle = '#2a1a0e';
      ctx.fillRect(f.x - 2, f.y - 20, 4, 22);
      // Torch head holder
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(f.x - 4, f.y - 22, 8, 5);
      const flicker = Math.sin(ft + f.x * 0.1) * 0.35 + 0.65;
      // Glow
      ctx.fillStyle = `rgba(255,120,0,${0.12 * flicker})`;
      ctx.beginPath(); ctx.arc(f.x, f.y - 24, f.size * 2.5, 0, Math.PI*2); ctx.fill();
      // Flame layers
      for (let i = 0; i < 3; i++) {
        const off = Math.sin(ft * 1.4 + i * 2.0 + f.x) * f.size * 0.35;
        ctx.fillStyle = i === 0 ? '#cc3300' : i === 1 ? '#ff6600' : '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(f.x - f.size*0.45 + off, f.y - 20);
        ctx.lineTo(f.x + off, f.y - 20 - f.size*(0.9 + i*0.35));
        ctx.lineTo(f.x + f.size*0.45 + off, f.y - 20);
        ctx.closePath(); ctx.fill();
      }
    }

  }

  _drawDeadTree(ctx, tx, ty, r) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(tx + r*0.4, ty + r*0.3); ctx.scale(1.1, 0.3);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.restore();
    // Trunk
    ctx.strokeStyle = '#241810'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty + r*0.5); ctx.lineTo(tx, ty - r*1.1); ctx.stroke();
    // Main branches
    ctx.lineWidth = r * 0.14;
    ctx.strokeStyle = '#2e2018';
    const branches = [
      [0, 0.6, -0.9, 0.3], [0, 0.2, 0.8, -0.5], [0, -0.2, -1.0, -0.8],
      [0, -0.5, 0.7, -1.2], [0, -0.8, -0.6, -1.4],
    ];
    for (const [ox, oy, ex2, ey2] of branches) {
      ctx.beginPath();
      ctx.moveTo(tx + ox*r, ty + oy*r);
      ctx.lineTo(tx + ex2*r, ty + ey2*r);
      ctx.stroke();
      // Twig sub-branches
      ctx.lineWidth = r * 0.07;
      ctx.strokeStyle = '#382818';
      const mx = tx + (ox + ex2)*0.5*r, my = ty + (oy + ey2)*0.5*r;
      ctx.beginPath(); ctx.moveTo(mx, my);
      ctx.lineTo(mx + (ex2 - ox)*0.4*r - 0.3*r, my + (ey2 - oy)*0.4*r - 0.2*r); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  _drawCampStructures(ctx) {
    const sp = this.path[0];
    const ox = sp.x + 46, oy = sp.y;

    // Dark fortress gate posts
    ctx.fillStyle = '#1a1210';
    ctx.fillRect(ox - 56, oy - 42, 10, 54);
    ctx.fillRect(ox + 34, oy - 42, 10, 54);
    // Crenellations on gate posts
    ctx.fillStyle = '#120e0c';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(ox - 56 + i*4, oy - 52, 3, 12);
      ctx.fillRect(ox + 34 + i*4, oy - 52, 3, 12);
    }
    // Gate chain / portcullis hint
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2;
    for (let gx = ox - 46; gx < ox + 34; gx += 8) {
      ctx.beginPath(); ctx.moveTo(gx, oy - 42); ctx.lineTo(gx, oy + 12); ctx.stroke();
    }
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.5;
    for (let gy = oy - 38; gy < oy + 12; gy += 8) {
      ctx.beginPath(); ctx.moveTo(ox - 46, gy); ctx.lineTo(ox + 34, gy); ctx.stroke();
    }

    // Dark banner
    ctx.fillStyle = '#2a1005'; ctx.fillRect(ox - 8, oy - 66, 4, 60);
    ctx.fillStyle = '#660000'; ctx.fillRect(ox - 4, oy - 66, 28, 18);
    ctx.fillStyle = '#990000';
    ctx.beginPath(); ctx.arc(ox + 10, oy - 57, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff2200';
    ctx.beginPath(); ctx.arc(ox + 8, oy - 59, 2, 0, Math.PI*2); ctx.fill();

    // Skull on a spike
    ctx.fillStyle = '#2a1005'; ctx.fillRect(ox + 60, oy - 42, 3, 46);
    ctx.fillStyle = '#c8c0a8';
    ctx.beginPath(); ctx.arc(ox + 61, oy - 46, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1010';
    ctx.beginPath(); ctx.arc(ox + 59, oy - 48, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 64, oy - 48, 2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox+57, oy-42); ctx.lineTo(ox+65, oy-42); ctx.stroke();

    ctx.fillStyle = 'rgba(200,40,40,0.8)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ENEMY CAMP', ox + 10, oy - 70); ctx.textAlign = 'left';
  }

  _drawCastle(ctx) {
    const ex = this.path[this.path.length - 1].x;
    const ey = this.path[this.path.length - 1].y;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(ex - 58, ey + 18, 116, 12);

    // Main walls — dark grey stone
    ctx.fillStyle = '#4a4848'; ctx.fillRect(ex - 54, ey - 30, 108, 50);
    ctx.fillStyle = '#686464'; ctx.fillRect(ex - 52, ey - 28, 104, 46);
    // Stone brick lines
    ctx.strokeStyle = '#3a3838'; ctx.lineWidth = 1;
    for (let row = ey - 22; row < ey + 20; row += 8) {
      ctx.beginPath(); ctx.moveTo(ex - 52, row); ctx.lineTo(ex + 52, row); ctx.stroke();
    }
    for (let col = ex - 46; col < ex + 52; col += 14) {
      ctx.beginPath(); ctx.moveTo(col, ey - 28); ctx.lineTo(col, ey + 20); ctx.stroke();
    }

    // Left tower
    ctx.fillStyle = '#424040'; ctx.fillRect(ex - 62, ey - 58, 32, 76);
    ctx.fillStyle = '#686262'; ctx.fillRect(ex - 60, ey - 56, 28, 72);
    // Battlements
    ctx.fillStyle = '#424040';
    for (let i = 0; i < 4; i++) ctx.fillRect(ex - 62 + i * 9, ey - 67, 7, 12);
    // Arrow slits
    ctx.fillStyle = '#1a1818';
    ctx.fillRect(ex - 56, ey - 44, 5, 9); ctx.fillRect(ex - 44, ey - 44, 5, 9);

    // Right tower
    ctx.fillStyle = '#424040'; ctx.fillRect(ex + 30, ey - 58, 32, 76);
    ctx.fillStyle = '#686262'; ctx.fillRect(ex + 32, ey - 56, 28, 72);
    ctx.fillStyle = '#424040';
    for (let i = 0; i < 4; i++) ctx.fillRect(ex + 30 + i * 9, ey - 67, 7, 12);
    ctx.fillStyle = '#1a1818';
    ctx.fillRect(ex + 42, ey - 44, 5, 9); ctx.fillRect(ex + 54, ey - 44, 5, 9);

    // Wall top battlements
    ctx.fillStyle = '#424040';
    for (let i = 0; i < 6; i++) ctx.fillRect(ex - 48 + i * 18, ey - 38, 12, 10);

    // Gate windows
    ctx.fillStyle = '#1a1818';
    ctx.fillRect(ex - 46, ey - 16, 5, 10); ctx.fillRect(ex - 28, ey - 16, 5, 10);
    ctx.fillRect(ex + 23, ey - 16, 5, 10); ctx.fillRect(ex + 41, ey - 16, 5, 10);

    // Gate arch
    ctx.fillStyle = '#2a2828'; ctx.fillRect(ex - 15, ey - 20, 30, 38);
    ctx.fillStyle = '#1a1818';
    ctx.beginPath(); ctx.arc(ex, ey - 20, 15, Math.PI, 0); ctx.fill();
    // Portcullis bars
    ctx.strokeStyle = '#484444'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(ex + i * 6, ey - 30); ctx.lineTo(ex + i * 6, ey + 18); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(ex - 13, ey - 14); ctx.lineTo(ex + 13, ey - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 13, ey - 3);  ctx.lineTo(ex + 13, ey - 3);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 13, ey + 8);  ctx.lineTo(ex + 13, ey + 8);  ctx.stroke();
    // Torch glow inside gate
    ctx.fillStyle = 'rgba(255,140,0,0.4)'; ctx.fillRect(ex - 7, ey - 5, 14, 22);

    // Flag poles
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(ex - 47, ey - 76, 2, 22);
    ctx.fillStyle = '#8b0000'; ctx.fillRect(ex - 62, ey - 76, 18, 14);  // dark red banner
    ctx.fillStyle = '#cc2222'; ctx.fillRect(ex - 57, ey - 74, 8, 8);

    ctx.fillStyle = '#3a2a18'; ctx.fillRect(ex + 45, ey - 76, 2, 22);
    ctx.fillStyle = '#8b0000'; ctx.fillRect(ex + 47, ey - 76, 18, 14);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(ex + 52, ey - 74, 8, 8);
  }

  isOnFeature(x, y) {
    for (const tr of this.trees) {
      if (Math.hypot(tr.x - x, tr.y - y) < tr.r + 18) return true;
    }
    for (const r of this.rocks) {
      if (Math.abs(r.x - x) < r.rx + 12 && Math.abs(r.y - y) < r.ry + 12) return true;
    }
    return false;
  }

  _generateDeadGrass() {
    const count = Math.floor(this.W * this.H / 1800);
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      r: 1.5 + Math.random() * 3.5,
      c: ['#3a2a14','#2e2210','#4a3820','#2a1e0c','#5a4428'][Math.floor(Math.random() * 5)],
    }));
  }

  _generateTrees() {
    const trees = [];
    let attempts = 0;
    while (trees.length < 18 && attempts++ < 4000) {
      const tx = 25 + Math.random() * (this.W - 50), ty = 25 + Math.random() * (this.H - 50);
      if (!this.isOnPath(tx, ty) && trees.every(t => Math.hypot(t.x - tx, t.y - ty) > 38))
        trees.push({ x: tx, y: ty, r: 16 + Math.random() * 10 });
    }
    return trees;
  }

  _generateRocks() {
    const rocks = [];
    let attempts = 0;
    while (rocks.length < 20 && attempts++ < 2000) {
      const x = 20 + Math.random() * (this.W - 40), y = 20 + Math.random() * (this.H - 40);
      if (!this.isOnPath(x, y))
        rocks.push({
          x, y,
          rx: 5 + Math.random() * 10,
          ry: 3 + Math.random() * 6,
          light: `hsl(30,8%,${32 + Math.random()*14}%)`,
          dark:  `hsl(30,8%,${14 + Math.random()*12}%)`,
        });
    }
    return rocks;
  }

  _generateRuins() {
    const ruins = [];
    let attempts = 0;
    while (ruins.length < 12 && attempts++ < 3000) {
      const x = 30 + Math.random() * (this.W - 60);
      const y = 30 + Math.random() * (this.H - 60);
      if (!this.isOnPath(x, y) && ruins.every(r => Math.hypot(r.x-x, r.y-y) > 30))
        ruins.push({ x, y, w: 10 + Math.random() * 30, h: 8 + Math.random() * 20 });
    }
    return ruins;
  }

  _generateRubble() {
    const rubble = [];
    let attempts = 0;
    while (rubble.length < 16 && attempts++ < 3000) {
      const x = 20 + Math.random() * (this.W - 40);
      const y = 20 + Math.random() * (this.H - 40);
      if (!this.isOnPath(x, y))
        rubble.push({ x, y, r: 8 + Math.random() * 10, pieces: 5 + Math.floor(Math.random() * 4) });
    }
    return rubble;
  }

  _generateTorches() {
    const torches = [];
    let attempts = 0;
    const count = 10 + Math.floor(Math.random() * 5);
    while (torches.length < count && attempts++ < 2000) {
      const x = 20 + Math.random() * (this.W - 40);
      const y = 20 + Math.random() * (this.H - 40);
      if (!this.isOnPath(x, y))
        torches.push({ x, y, size: 6 + Math.random() * 5 });
    }
    return torches;
  }

  _generateMist() {
    const mist = [];
    for (let i = 0; i < 14; i++) {
      mist.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: 60 + Math.random() * 100,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return mist;
  }

  // Normal battlefield generation methods
  _generateGrass() {
    const count = Math.floor(this.W * this.H / 1500);
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      r: 1.5 + Math.random() * 4.5,
      c: ['#3a6632','#2e5828','#4a7a3a','#527c3e','#3d6834'][Math.floor(Math.random() * 5)],
    }));
  }

  _generateFires() {
    const fires = [];
    let attempts = 0;
    while (fires.length < 18 && attempts++ < 3000) {
      const x = 20 + Math.random() * (this.W - 40);
      const y = 20 + Math.random() * (this.H - 40);
      if (!this.isOnPath(x, y)) fires.push({ x, y, size: 8 + Math.random() * 8 });
    }
    return fires;
  }

  _generateCraters() {
    const craters = [];
    let attempts = 0;
    while (craters.length < 14 && attempts++ < 3000) {
      const x = 30 + Math.random() * (this.W - 60);
      const y = 30 + Math.random() * (this.H - 60);
      if (!this.isOnPath(x, y) && craters.every(c => Math.hypot(c.x-x, c.y-y) > 28))
        craters.push({ x, y, r: 10 + Math.random() * 16 });
    }
    return craters;
  }

  _generateSandbags() {
    const bags = [];
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg+1];
      const len = Math.hypot(b.x-a.x, b.y-a.y);
      const ang = Math.atan2(b.y-a.y, b.x-a.x);
      const perp = ang + Math.PI/2;
      const steps = Math.floor(len / 70);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const mx = a.x + (b.x-a.x)*t, my = a.y + (b.y-a.y)*t;
        const side = (i % 2 === 0) ? 1 : -1;
        bags.push({ x: mx + Math.cos(perp)*36*side, y: my + Math.sin(perp)*36*side, ang });
      }
    }
    return bags;
  }

  // Shared helpers used by both themes
  _drawRocks(ctx) {
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
  }

  _drawPath(ctx, shadow, dark, mid, light) {
    const drawLine = (color, width) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
      ctx.stroke();
    };
    // Base path layers (shadow, dark border, mid, light center)
    drawLine(shadow, 52); drawLine(dark, 44); drawLine(mid, 30); drawLine(light, 16);

    // Cobblestone texture — draw stone blocks along path segments
    const stoneW = 16, stoneH = 10;
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1;
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const steps = Math.floor(len / stoneW);
      for (let st = 0; st < steps; st++) {
        const t = (st + 0.5) / steps;
        const cx = a.x + (b.x - a.x) * t;
        const cy = a.y + (b.y - a.y) * t;
        // Draw a rotated rectangle (stone block)
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(ang);
        // Alternate offset for brick pattern
        const yOff = (st % 2 === 0) ? -stoneH * 0.5 : 0;
        ctx.strokeRect(-stoneW * 0.5, yOff - stoneH * 0.5, stoneW * 0.92, stoneH * 0.85);
        // Stone highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(-stoneW * 0.45, yOff - stoneH * 0.42);
        ctx.lineTo(stoneW * 0.42, yOff - stoneH * 0.42);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.restore();
      }
    }
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  }
}
