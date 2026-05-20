import { distance } from './constants.js?v=48';

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
    const t  = Date.now() / 1000;

    // ── Palisade wall (dark wooden stakes) ───────────────────────────────
    const pStakes = [-58,-50,-42,-34,-26,-18,20,28,36,44];
    for (const px2 of pStakes) {
      const stakeG = ctx.createLinearGradient(ox+px2, oy-52, ox+px2+7, oy-52);
      stakeG.addColorStop(0, '#1a0e08'); stakeG.addColorStop(0.4,'#3a2010'); stakeG.addColorStop(1,'#1a0e08');
      ctx.fillStyle = stakeG;
      ctx.fillRect(ox + px2, oy - 52, 7, 60);
      // Pointed top
      ctx.fillStyle = '#1a0e08';
      ctx.beginPath();
      ctx.moveTo(ox + px2, oy - 52);
      ctx.lineTo(ox + px2 + 3.5, oy - 62);
      ctx.lineTo(ox + px2 + 7, oy - 52);
      ctx.closePath(); ctx.fill();
    }
    // Horizontal brace
    const braceG = ctx.createLinearGradient(0, oy - 34, 0, oy - 28);
    braceG.addColorStop(0,'#2a1808'); braceG.addColorStop(1,'#1a1008');
    ctx.fillStyle = braceG; ctx.fillRect(ox - 58, oy - 34, 80, 6);

    // ── Gate opening ─────────────────────────────────────────────────────
    ctx.fillStyle = '#080504'; ctx.fillRect(ox - 18, oy - 52, 36, 60);
    // Iron portcullis
    ctx.strokeStyle = '#3a3030'; ctx.lineWidth = 2;
    for (let gi = -2; gi <= 2; gi++) {
      ctx.beginPath(); ctx.moveTo(ox + gi * 7, oy - 52); ctx.lineTo(ox + gi * 7, oy + 8); ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    for (const gy of [oy - 42, oy - 28, oy - 14]) {
      ctx.beginPath(); ctx.moveTo(ox - 15, gy); ctx.lineTo(ox + 15, gy); ctx.stroke();
    }
    // Glowing red eyes in the darkness
    const eyePulse = 0.6 + 0.4 * Math.sin(t * 2.2);
    ctx.fillStyle = `rgba(200,0,0,${eyePulse})`;
    ctx.beginPath(); ctx.arc(ox - 6, oy - 22, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 6, oy - 22, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,80,0,${eyePulse * 0.7})`;
    ctx.beginPath(); ctx.arc(ox - 6, oy - 22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 6, oy - 22, 5, 0, Math.PI * 2); ctx.fill();

    // ── Animated evil banner ──────────────────────────────────────────────
    ctx.fillStyle = '#2a1005'; ctx.fillRect(ox - 8, oy - 74, 3, 68);
    const bw1 = Math.sin(t * 2.8) * 2.5, bw2 = Math.sin(t * 2.8 + 1.0) * 3.5;
    ctx.fillStyle = '#7a0000';
    ctx.beginPath();
    ctx.moveTo(ox - 5, oy - 74);
    ctx.quadraticCurveTo(ox + 7 + bw1, oy - 68, ox + 22 + bw2, oy - 72);
    ctx.lineTo(ox + 22 + bw2, oy - 56);
    ctx.quadraticCurveTo(ox + 7 + bw1, oy - 52, ox - 5, oy - 56);
    ctx.closePath(); ctx.fill();
    // Skull emblem on banner
    ctx.fillStyle = '#ffeecc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('☠', ox + 8, oy - 61); ctx.textAlign = 'left';

    // ── 3 skulls on spikes ────────────────────────────────────────────────
    for (const [sx, off] of [[ox + 56, 0],[ox + 70, 4],[ox + 84, -3]]) {
      ctx.fillStyle = '#2a1005'; ctx.fillRect(sx, oy - 40 + off, 3, 44 - off);
      // Skull
      const skullG = ctx.createRadialGradient(sx+1, oy-46+off, 1, sx+1, oy-46+off, 8);
      skullG.addColorStop(0, '#e8e0c8'); skullG.addColorStop(1, '#a09880');
      ctx.fillStyle = skullG;
      ctx.beginPath(); ctx.arc(sx + 1, oy - 46 + off, 8, 0, Math.PI * 2); ctx.fill();
      // Eye sockets
      ctx.fillStyle = '#1a1010';
      ctx.beginPath(); ctx.arc(sx - 2, oy - 47 + off, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 4, oy - 47 + off, 2.5, 0, Math.PI * 2); ctx.fill();
      // Jaw
      ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx - 5, oy - 40 + off); ctx.lineTo(sx + 7, oy - 40 + off); ctx.stroke();
      for (let tooth = 0; tooth < 3; tooth++) {
        ctx.beginPath(); ctx.moveTo(sx - 3 + tooth * 4, oy - 40 + off); ctx.lineTo(sx - 3 + tooth * 4, oy - 37 + off); ctx.stroke();
      }
    }

    // ── Campfire glow ─────────────────────────────────────────────────────
    const cfx = ox + 30, cfy = oy + 8;
    const cfp = 0.7 + 0.3 * Math.sin(t * 7);
    const cfG = ctx.createRadialGradient(cfx, cfy, 0, cfx, cfy, 18);
    cfG.addColorStop(0, `rgba(255,180,0,${cfp * 0.5})`);
    cfG.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = cfG; ctx.beginPath(); ctx.arc(cfx, cfy, 18, 0, Math.PI * 2); ctx.fill();
    // Flame
    ctx.fillStyle = `rgba(255,60,0,${cfp * 0.9})`;
    ctx.beginPath(); ctx.moveTo(cfx - 5, cfy); ctx.quadraticCurveTo(cfx, cfy - 14 * cfp, cfx + 5, cfy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.moveTo(cfx - 3, cfy); ctx.quadraticCurveTo(cfx, cfy - 8 * cfp, cfx + 3, cfy); ctx.closePath(); ctx.fill();

    // ── Label ─────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(220,40,40,0.9)';
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ENEMY CAMP', ox + 10, oy - 78); ctx.textAlign = 'left';
  }

  _drawCastle(ctx) {
    const ex = this.path[this.path.length - 1].x;
    const ey = this.path[this.path.length - 1].y;
    const t  = Date.now() / 1000;

    // ── Helper: draw a stone rectangle with gradient shading + brick grid ──
    const stoneRect = (x, y, w, h, lightColor, darkColor) => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h * 0.5);
      g.addColorStop(0,   darkColor);
      g.addColorStop(0.3, lightColor);
      g.addColorStop(0.7, lightColor);
      g.addColorStop(1,   darkColor);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      // mortar horizontal
      ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 1;
      for (let row = y + 9; row < y + h; row += 9) {
        ctx.beginPath(); ctx.moveTo(x + 1, row); ctx.lineTo(x + w - 1, row); ctx.stroke();
      }
      // mortar vertical (offset per row)
      for (let row = 0; row * 9 < h; row++) {
        const ry = y + row * 9;
        const off = row % 2 === 0 ? 0 : 8;
        for (let cx2 = x + off; cx2 < x + w; cx2 += 14) {
          ctx.beginPath(); ctx.moveTo(cx2, ry); ctx.lineTo(cx2, Math.min(ry + 9, y + h)); ctx.stroke();
        }
      }
      // top-edge highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + w - 1, y + 1); ctx.stroke();
    };

    // ── Ground shadow ──────────────────────────────────────────────────────
    const shadowG = ctx.createRadialGradient(ex, ey + 22, 0, ex, ey + 22, 70);
    shadowG.addColorStop(0, 'rgba(0,0,0,0.35)');
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.save(); ctx.translate(ex, ey + 22); ctx.scale(1.6, 0.3);
    ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── Main curtain wall ─────────────────────────────────────────────────
    stoneRect(ex - 54, ey - 32, 108, 52, '#747070', '#3e3c3c');
    // Wall battlements
    for (let i = 0; i < 7; i++) {
      stoneRect(ex - 48 + i * 17, ey - 42, 11, 12, '#686464', '#3a3838');
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(ex - 42 + i * 17, ey - 40, 5, 4);
    }

    // ── Left tower ────────────────────────────────────────────────────────
    stoneRect(ex - 64, ey - 62, 34, 80, '#6e6a6a', '#404040');
    // Left tower battlements (5 merlons)
    for (let i = 0; i < 4; i++) {
      stoneRect(ex - 64 + i * 9, ey - 72, 7, 12, '#686464', '#3a3838');
    }
    // Arrow slits left
    for (const [sx, sy] of [[ex-56, ey-48],[ex-46, ey-48],[ex-56, ey-30],[ex-46, ey-30]]) {
      ctx.fillStyle = '#0e0c0c'; ctx.fillRect(sx, sy, 5, 10);
      ctx.fillStyle = 'rgba(255,160,60,0.12)'; ctx.fillRect(sx, sy, 5, 10);
    }
    // Left tower door
    ctx.fillStyle = '#1a1818'; ctx.fillRect(ex - 54, ey - 10, 14, 26);
    ctx.beginPath(); ctx.arc(ex - 47, ey - 10, 7, Math.PI, 0); ctx.fill();

    // ── Right tower ───────────────────────────────────────────────────────
    stoneRect(ex + 30, ey - 62, 34, 80, '#6e6a6a', '#404040');
    for (let i = 0; i < 4; i++) {
      stoneRect(ex + 30 + i * 9, ey - 72, 7, 12, '#686464', '#3a3838');
    }
    for (const [sx, sy] of [[ex+41, ey-48],[ex+51, ey-48],[ex+41, ey-30],[ex+51, ey-30]]) {
      ctx.fillStyle = '#0e0c0c'; ctx.fillRect(sx, sy, 5, 10);
      ctx.fillStyle = 'rgba(255,160,60,0.12)'; ctx.fillRect(sx, sy, 5, 10);
    }
    ctx.fillStyle = '#1a1818'; ctx.fillRect(ex + 40, ey - 10, 14, 26);
    ctx.beginPath(); ctx.arc(ex + 47, ey - 10, 7, Math.PI, 0); ctx.fill();

    // ── Gate archway ─────────────────────────────────────────────────────
    stoneRect(ex - 17, ey - 30, 34, 48, '#666262', '#3c3838');
    // Arch keystone
    ctx.fillStyle = '#1c1a1a';
    ctx.beginPath(); ctx.arc(ex, ey - 28, 17, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(ex, ey - 28, 17, Math.PI, 0); ctx.stroke();
    // Portcullis
    ctx.strokeStyle = '#5a5050'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let gi = -2; gi <= 2; gi++) {
      ctx.beginPath(); ctx.moveTo(ex + gi * 7, ey - 40); ctx.lineTo(ex + gi * 7, ey + 18); ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    for (const gy of [ey - 28, ey - 14, ey]) {
      ctx.beginPath(); ctx.moveTo(ex - 14, gy); ctx.lineTo(ex + 14, gy); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // Torch glow inside gate
    const torchPulse = 0.30 + 0.12 * Math.sin(t * 4.5);
    const torchG = ctx.createRadialGradient(ex, ey, 0, ex, ey, 22);
    torchG.addColorStop(0, `rgba(255,170,50,${torchPulse})`);
    torchG.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = torchG; ctx.fillRect(ex - 18, ey - 30, 36, 50);

    // ── Torches on towers ─────────────────────────────────────────────────
    for (const [tx2, ty2] of [[ex - 58, ey - 30], [ex + 58, ey - 30]]) {
      const tp = 0.6 + 0.4 * Math.sin(t * 5 + tx2);
      ctx.fillStyle = `rgba(255,140,30,${tp * 0.55})`;
      ctx.beginPath(); ctx.arc(tx2, ty2 - 6, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3010'; ctx.fillRect(tx2 - 1, ty2 - 4, 3, 8);
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.moveTo(tx2 - 3, ty2 - 4); ctx.lineTo(tx2 + 1, ty2 - 4 - 9 * tp); ctx.lineTo(tx2 + 4, ty2 - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.moveTo(tx2 - 1, ty2 - 4); ctx.lineTo(tx2 + 1, ty2 - 4 - 5 * tp); ctx.lineTo(tx2 + 2, ty2 - 4); ctx.closePath(); ctx.fill();
    }

    // ── Animated flags (wave with sin) ────────────────────────────────────
    for (const [px2, py2, flip] of [[ex - 47, ey - 78, 1], [ex + 49, ey - 78, -1]]) {
      ctx.fillStyle = '#4a3010'; ctx.fillRect(px2 - 1, py2, 3, 24);
      // Wave shape using 3 points
      const w1 = Math.sin(t * 3.0 + px2 * 0.05) * 3 * flip;
      const w2 = Math.sin(t * 3.0 + 1.2 + px2 * 0.05) * 4 * flip;
      const bx2 = px2 + flip * 2;
      ctx.fillStyle = '#c01020';
      ctx.beginPath();
      ctx.moveTo(bx2, py2 + 2);
      ctx.quadraticCurveTo(bx2 + flip * 9 + w1, py2 + 5, bx2 + flip * 18 + w2, py2 + 2);
      ctx.lineTo(bx2 + flip * 18 + w2, py2 + 13);
      ctx.quadraticCurveTo(bx2 + flip * 9 + w1, py2 + 16, bx2, py2 + 13);
      ctx.closePath(); ctx.fill();
      // Lion/crown emblem
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('✦', bx2 + flip * 9, py2 + 11);
    }
    ctx.textAlign = 'left';

    // ── "YOUR CASTLE" label ───────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,220,100,0.85)';
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('YOUR CASTLE', ex, ey - 80);
    ctx.textAlign = 'left';
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
    // Base path: shadow border, dark road bed, mid layer, light center
    drawLine(shadow, 58); drawLine(dark, 48); drawLine(mid, 36); drawLine(light, 22);

    // Ambient occlusion — soft dark edge along path sides
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
    // just a second wide stroke for AO
    ctx.lineWidth = 48; ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.stroke();

    // ── Cobblestones — each stone is individually shaded ──────────────────
    const SW = 15, SH = 10; // stone width/height (path-local coords)
    // We draw 3 rows across the path width
    for (let row = -1; row <= 1; row++) {
      for (let seg = 0; seg < this.path.length - 1; seg++) {
        const a = this.path[seg], b = this.path[seg + 1];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        const ang    = Math.atan2(b.y - a.y, b.x - a.x);
        const perp   = ang + Math.PI / 2;
        const steps  = Math.ceil(segLen / SW);
        for (let st = 0; st < steps; st++) {
          const frac = (st + 0.5) / steps;
          // Alternate brick offset per row
          const brickOff = ((st + row) % 2 === 0) ? SW * 0.5 : 0;
          const cx = a.x + (b.x - a.x) * frac + Math.cos(perp) * row * (SH + 2);
          const cy = a.y + (b.y - a.y) * frac + Math.sin(perp) * row * (SH + 2);

          ctx.save();
          ctx.translate(cx + Math.cos(ang) * brickOff * 0.5, cy + Math.sin(ang) * brickOff * 0.5);
          ctx.rotate(ang);

          // Each stone gets its own radial gradient for a 3-D rounded look
          const sx = -SW * 0.46, sy = -SH * 0.42;
          const sg = ctx.createRadialGradient(sx + SW * 0.3, sy + SH * 0.25, 0, sx + SW * 0.46, sy + SH * 0.5, SW * 0.7);
          // Base color slightly varied per stone (deterministic noise)
          const vary = ((seg * 31 + st * 17 + row * 7) % 18) - 9;
          const base = parseInt(light.slice(1, 3), 16) + vary;
          sg.addColorStop(0,   `rgba(${Math.min(base+30,255)},${Math.min(base+20,220)},${Math.min(base+5,170)},1)`);
          sg.addColorStop(0.55,`rgba(${base},${Math.max(base-10,100)},${Math.max(base-25,80)},1)`);
          sg.addColorStop(1,   `rgba(${Math.max(base-25,60)},${Math.max(base-30,55)},${Math.max(base-40,50)},1)`);
          ctx.fillStyle = sg;
          ctx.fillRect(sx, sy, SW * 0.92, SH * 0.84);

          // Top-left bevel highlight
          ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx + 1, sy + SH * 0.80);
          ctx.lineTo(sx + 1, sy + 1);
          ctx.lineTo(sx + SW * 0.88, sy + 1);
          ctx.stroke();
          // Bottom-right shadow edge
          ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx + SW * 0.92, sy + 1);
          ctx.lineTo(sx + SW * 0.92, sy + SH * 0.84);
          ctx.lineTo(sx + 1, sy + SH * 0.84);
          ctx.stroke();

          ctx.restore();
        }
      }
    }
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  }
}
