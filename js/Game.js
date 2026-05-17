import { TYPES, TRAPS, MINE, CAMP, CAMP_TYPES, LEVELS, ENEMIES, ACHIEVEMENTS, GEM_SHOP_ITEMS, UPGRADE_COST, UPGRADE_MULT, makePath, MAX_MONEY, distance } from './constants.js?v=40';
import { GameMap }     from './Map.js?v=40';
import { Tower }       from './Tower.js?v=40';
import { Enemy }       from './Enemy.js?v=40';
import { Projectile }  from './Projectile.js?v=40';
import { Trap }        from './Trap.js?v=40';
import { Mine }        from './Mine.js?v=40';
import { WaveManager } from './WaveManager.js?v=40';

// ── Button icon renderer ─────────────────────────────────────────────────────
// Draws the actual in-game unit/tower at small scale onto a canvas context.
function _drawBtnIcon(ctx, key, w, h) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2 + 6;

  // ── Shared: grey stone tower base ────────────────────────────────────────
  function towerBase(bcy) {
    const by = bcy ?? cy + 8;
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(cx, by, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(cx - 2, by - 2, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#444';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 12, by + Math.sin(a) * 12, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Stone brick texture
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 7, by - 5); ctx.lineTo(cx + 7, by - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 9, by + 1); ctx.lineTo(cx + 9, by + 1); ctx.stroke();
  }

  if (key === 'basic') {
    // Archer — green tunic, bow raised
    const cx2 = w/2, cy2 = h*0.52;
    // Legs
    ctx.fillStyle = '#4a3010'; ctx.fillRect(cx2-5,cy2+8,4,10); ctx.fillRect(cx2+1,cy2+8,4,10);
    // Boots
    ctx.fillStyle = '#2a1a08'; ctx.fillRect(cx2-6,cy2+16,6,4); ctx.fillRect(cx2,cy2+16,6,4);
    // Torso — green tunic
    ctx.fillStyle = '#2a6020'; ctx.fillRect(cx2-7,cy2-6,14,14);
    // Belt
    ctx.fillStyle = '#5a3010'; ctx.fillRect(cx2-7,cy2+6,14,3);
    // Neck
    ctx.fillStyle = '#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    // Head
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Hood
    ctx.fillStyle = '#1a4a14'; ctx.beginPath(); ctx.arc(cx2,cy2-13,5,Math.PI,Math.PI*2); ctx.fill();
    ctx.fillRect(cx2-5,cy2-18,10,6);
    // Left arm — holds bow
    ctx.fillStyle = '#2a6020'; ctx.fillRect(cx2-12,cy2-4,6,3);
    // Bow arc
    ctx.strokeStyle = '#884400'; ctx.lineWidth=2.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(cx2-18,cy2-2,8,-1.1,1.1); ctx.stroke();
    // Bowstring
    ctx.strokeStyle='#ddd'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx2-18,cy2-9); ctx.lineTo(cx2-10,cy2-2); ctx.lineTo(cx2-18,cy2+5); ctx.stroke();
    // Arrow nocked
    ctx.strokeStyle='#aa6600'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx2-22,cy2-2); ctx.lineTo(cx2-10,cy2-2); ctx.stroke();
    ctx.fillStyle='#999'; ctx.beginPath(); ctx.moveTo(cx2-10,cy2-4); ctx.lineTo(cx2-7,cy2-2); ctx.lineTo(cx2-10,cy2); ctx.fill();
    // Right arm extended
    ctx.fillStyle='#2a6020'; ctx.fillRect(cx2+6,cy2-4,6,3);
    ctx.lineCap='butt';

  } else if (key === 'sniper') {
    // Catapult operator — brown leather, cranking handle
    const cx2=w/2, cy2=h*0.55;
    // Legs
    ctx.fillStyle='#5a3a18'; ctx.fillRect(cx2-5,cy2+6,4,10); ctx.fillRect(cx2+1,cy2+6,4,10);
    ctx.fillStyle='#2a1808'; ctx.fillRect(cx2-6,cy2+14,6,4); ctx.fillRect(cx2,cy2+14,6,4);
    // Torso — brown leather
    ctx.fillStyle='#7a4a18'; ctx.fillRect(cx2-7,cy2-8,14,14);
    // Shoulder pads
    ctx.fillStyle='#5a3010'; ctx.fillRect(cx2-9,cy2-8,4,5); ctx.fillRect(cx2+5,cy2-8,4,5);
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-11,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-15,5,0,Math.PI*2); ctx.fill();
    // Helmet — brown leather cap
    ctx.fillStyle='#5a3010'; ctx.beginPath(); ctx.arc(cx2,cy2-15,5,-Math.PI,0); ctx.fill();
    ctx.fillRect(cx2-6,cy2-20,12,6);
    // Left arm holding crank
    ctx.fillStyle='#7a4a18'; ctx.fillRect(cx2-12,cy2-5,6,3);
    // Crank handle (T-shape)
    ctx.fillStyle='#8b4c12';
    ctx.fillRect(cx2-18,cy2-8,4,12);   // vertical bar
    ctx.fillRect(cx2-21,cy2-9,10,3);   // horizontal bar top
    // Right arm with firing cord
    ctx.fillStyle='#7a4a18'; ctx.fillRect(cx2+6,cy2-5,7,3);
    ctx.strokeStyle='#cc9900'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx2+13,cy2-3); ctx.lineTo(cx2+16,cy2-12); ctx.stroke();
    // Boulder dangling at cord end
    ctx.fillStyle='#666'; ctx.beginPath(); ctx.arc(cx2+16,cy2-14,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#888'; ctx.beginPath(); ctx.arc(cx2+15,cy2-15,3,0,Math.PI*2); ctx.fill();

  } else if (key === 'rapid') {
    // Crossbow soldier — dark leather, crossbow aimed forward
    const cx2=w/2, cy2=h*0.52;
    // Legs
    ctx.fillStyle='#3a2a10'; ctx.fillRect(cx2-5,cy2+8,4,10); ctx.fillRect(cx2+1,cy2+8,4,10);
    ctx.fillStyle='#1a1008'; ctx.fillRect(cx2-6,cy2+16,6,4); ctx.fillRect(cx2,cy2+16,6,4);
    // Torso — dark leather
    ctx.fillStyle='#4a3018'; ctx.fillRect(cx2-7,cy2-6,14,14);
    // Chest strap
    ctx.strokeStyle='#2a1808'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx2-7,cy2-2); ctx.lineTo(cx2+7,cy2+4); ctx.stroke();
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Helmet — steel cap
    ctx.fillStyle='#7a8a9a'; ctx.beginPath(); ctx.arc(cx2,cy2-13,5,-Math.PI,0); ctx.fill();
    ctx.fillRect(cx2-6,cy2-18,12,6);
    // Crossbow body — horizontal, both arms extended
    ctx.fillStyle='#5a3010'; ctx.fillRect(cx2-18,cy2-5,22,4);
    // Crossbow stock
    ctx.fillRect(cx2-4,cy2-5,8,8);
    // Crossbow limbs (wings)
    ctx.fillStyle='#888'; ctx.fillRect(cx2-18,cy2-9,3,8); ctx.fillRect(cx2+1,cy2-9,3,8);
    // String
    ctx.strokeStyle='#ccc'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx2-18,cy2-9); ctx.lineTo(cx2-7,cy2-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2+4,cy2-9); ctx.lineTo(cx2-7,cy2-5); ctx.stroke();
    // Bolt
    ctx.strokeStyle='#cc8800'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx2-16,cy2-3); ctx.lineTo(cx2+5,cy2-3); ctx.stroke();
    ctx.fillStyle='#aaa'; ctx.beginPath(); ctx.moveTo(cx2+5,cy2-5); ctx.lineTo(cx2+9,cy2-3); ctx.lineTo(cx2+5,cy2-1); ctx.fill();
    // Arms holding crossbow
    ctx.fillStyle='#4a3018'; ctx.fillRect(cx2-12,cy2-3,6,3); ctx.fillRect(cx2+5,cy2-3,5,3);

  } else if (key === 'slow') {
    // Mage — purple robes, glowing staff raised high
    const cx2=w/2, cy2=h*0.52;
    // Robe bottom (long flowing)
    ctx.fillStyle='#6a1a8a'; ctx.beginPath(); ctx.moveTo(cx2-8,cy2+8); ctx.lineTo(cx2-10,cy2+20); ctx.lineTo(cx2+10,cy2+20); ctx.lineTo(cx2+8,cy2+8); ctx.closePath(); ctx.fill();
    // Torso — purple robe
    ctx.fillStyle='#7a2a9a'; ctx.fillRect(cx2-7,cy2-6,14,14);
    // Robe trim
    ctx.strokeStyle='#cc88ff'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx2-7,cy2-6); ctx.lineTo(cx2,cy2+8); ctx.lineTo(cx2+7,cy2-6); ctx.stroke();
    // Left arm — holds staff upright
    ctx.fillStyle='#7a2a9a'; ctx.fillRect(cx2-12,cy2-5,6,4);
    // Staff — tall brown pole with glowing orb
    ctx.fillStyle='#6a3a0a'; ctx.fillRect(cx2-16,cy2-22,3,26);
    // Glowing orb on staff top
    ctx.shadowColor='#cc44ff'; ctx.shadowBlur=10;
    ctx.fillStyle='#aa33ee';
    ctx.beginPath(); ctx.arc(cx2-14,cy2-24,6,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#dd99ff'; ctx.beginPath(); ctx.arc(cx2-14,cy2-24,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx2-16,cy2-26,2,0,Math.PI*2); ctx.fill();
    // Right arm extended with sparks
    ctx.fillStyle='#7a2a9a'; ctx.fillRect(cx2+6,cy2-5,6,4);
    ctx.fillStyle='#dd99ff';
    for (let i=0;i<4;i++) { const a=i/4*Math.PI*2; ctx.beginPath(); ctx.arc(cx2+14+Math.cos(a)*3,cy2-3+Math.sin(a)*3,1.5,0,Math.PI*2); ctx.fill(); }
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Wizard hat
    ctx.fillStyle='#4a0a6a';
    ctx.beginPath(); ctx.moveTo(cx2-6,cy2-16); ctx.lineTo(cx2,cy2-26); ctx.lineTo(cx2+6,cy2-16); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#6a2a8a'; ctx.fillRect(cx2-7,cy2-18,14,3);

  } else if (key === 'fire') {
    // Fire warrior — red armour, flaming sword held high
    const cx2=w/2, cy2=h*0.52;
    // Legs — red armour
    ctx.fillStyle='#8a1a00'; ctx.fillRect(cx2-5,cy2+8,4,10); ctx.fillRect(cx2+1,cy2+8,4,10);
    ctx.fillStyle='#5a1000'; ctx.fillRect(cx2-6,cy2+16,6,4); ctx.fillRect(cx2,cy2+16,6,4);
    // Torso — crimson plate
    ctx.fillStyle='#aa2200'; ctx.fillRect(cx2-7,cy2-6,14,14);
    ctx.strokeStyle='#ff4400'; ctx.lineWidth=1.2;
    ctx.strokeRect(cx2-7,cy2-6,14,14);
    // Shoulder spikes
    ctx.fillStyle='#cc3300'; ctx.fillRect(cx2-9,cy2-7,4,4); ctx.fillRect(cx2+5,cy2-7,4,4);
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Red battle helm
    ctx.fillStyle='#aa2200'; ctx.beginPath(); ctx.arc(cx2,cy2-13,5,-Math.PI,0); ctx.fill();
    ctx.fillRect(cx2-6,cy2-18,12,6);
    ctx.fillStyle='#ff4400'; ctx.fillRect(cx2-1,cy2-24,2,8); // crest
    // Left arm — shield
    ctx.fillStyle='#8a1a00'; ctx.fillRect(cx2-14,cy2-5,6,4);
    ctx.fillStyle='#aa2200'; ctx.fillRect(cx2-18,cy2-9,6,12);
    ctx.strokeStyle='#ff4400'; ctx.lineWidth=1; ctx.strokeRect(cx2-18,cy2-9,6,12);
    // Right arm — flaming sword raised
    ctx.fillStyle='#8a1a00'; ctx.fillRect(cx2+6,cy2-5,5,4);
    // Sword blade
    ctx.fillStyle='#ffaa44'; ctx.fillRect(cx2+11,cy2-20,4,18);
    ctx.fillStyle='#ff6600'; ctx.fillRect(cx2+12,cy2-20,2,18);
    ctx.fillStyle='#884400'; ctx.fillRect(cx2+9,cy2-4,8,3); // crossguard
    // Flames on blade
    ctx.fillStyle='rgba(255,100,0,0.8)';
    ctx.beginPath(); ctx.moveTo(cx2+11,cy2-20); ctx.bezierCurveTo(cx2+8,cy2-26,cx2+14,cy2-28,cx2+13,cy2-24); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,200,0,0.7)';
    ctx.beginPath(); ctx.moveTo(cx2+12,cy2-20); ctx.bezierCurveTo(cx2+10,cy2-25,cx2+15,cy2-26,cx2+13,cy2-22); ctx.closePath(); ctx.fill();

  } else if (key === 'ice') {
    // Ice soldier — silver-blue plate, holding ice lance
    const cx2=w/2, cy2=h*0.52;
    // Legs
    ctx.fillStyle='#4a6a8a'; ctx.fillRect(cx2-5,cy2+8,4,10); ctx.fillRect(cx2+1,cy2+8,4,10);
    ctx.fillStyle='#2a4a6a'; ctx.fillRect(cx2-6,cy2+16,6,4); ctx.fillRect(cx2,cy2+16,6,4);
    // Torso — ice-blue plate
    ctx.fillStyle='#5a8aaa'; ctx.fillRect(cx2-7,cy2-6,14,14);
    ctx.strokeStyle='#aaddff'; ctx.lineWidth=1;
    ctx.strokeRect(cx2-7,cy2-6,14,14);
    // Ice crystal on chest
    ctx.fillStyle='#aaddff'; ctx.beginPath(); ctx.moveTo(cx2,cy2-2); ctx.lineTo(cx2+3,cy2+2); ctx.lineTo(cx2,cy2+6); ctx.lineTo(cx2-3,cy2+2); ctx.closePath(); ctx.fill();
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Ice helm — silver with blue visor
    ctx.fillStyle='#7aaacc'; ctx.beginPath(); ctx.arc(cx2,cy2-13,5,-Math.PI,0); ctx.fill();
    ctx.fillRect(cx2-6,cy2-18,12,6);
    ctx.fillStyle='#aaddff'; ctx.fillRect(cx2-4,cy2-15,8,4); // visor
    // Left arm holding ice lance horizontally
    ctx.fillStyle='#5a8aaa'; ctx.fillRect(cx2-14,cy2-4,8,3);
    // Ice lance — long spear with crystal tip
    ctx.shadowColor='#88ddff'; ctx.shadowBlur=6;
    ctx.fillStyle='#7ab8cc'; ctx.fillRect(cx2-22,cy2-5,22,3); // shaft
    ctx.shadowBlur=0;
    // Crystal spearhead
    ctx.fillStyle='#cceeff';
    ctx.beginPath(); ctx.moveTo(cx2-22,cy2-3); ctx.lineTo(cx2-28,cy2-3.5); ctx.lineTo(cx2-22,cy2-7); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(180,230,255,0.7)';
    ctx.beginPath(); ctx.moveTo(cx2-22,cy2-4); ctx.lineTo(cx2-26,cy2-4); ctx.lineTo(cx2-22,cy2-6); ctx.closePath(); ctx.fill();
    // Snowflake crossguard
    ctx.strokeStyle='#aaddff'; ctx.lineWidth=1.5; ctx.lineCap='round';
    for (let i=0;i<4;i++){const a=i/4*Math.PI; ctx.beginPath(); ctx.moveTo(cx2-6,cy2-3.5); ctx.lineTo(cx2-6+Math.cos(a)*5,cy2-3.5+Math.sin(a)*5); ctx.stroke();}
    ctx.lineCap='butt';
    // Right arm extended
    ctx.fillStyle='#5a8aaa'; ctx.fillRect(cx2+6,cy2-4,6,3);

  } else if (key === 'lightning') {
    // Lightning crossbowman — yellow-green armor, lightning crossbow cracking with sparks
    const cx2=w/2, cy2=h*0.52;
    // Legs
    ctx.fillStyle='#3a4a10'; ctx.fillRect(cx2-5,cy2+8,4,10); ctx.fillRect(cx2+1,cy2+8,4,10);
    ctx.fillStyle='#1a2208'; ctx.fillRect(cx2-6,cy2+16,6,4); ctx.fillRect(cx2,cy2+16,6,4);
    // Torso — dark green with yellow trim
    ctx.fillStyle='#3a5010'; ctx.fillRect(cx2-7,cy2-6,14,14);
    ctx.strokeStyle='#aacc00'; ctx.lineWidth=1.5;
    ctx.strokeRect(cx2-7,cy2-6,14,14);
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Helmet with lightning bolt emblem
    ctx.fillStyle='#4a6018'; ctx.beginPath(); ctx.arc(cx2,cy2-13,5,-Math.PI,0); ctx.fill();
    ctx.fillRect(cx2-6,cy2-18,12,6);
    ctx.fillStyle='#ffff44';
    ctx.beginPath(); ctx.moveTo(cx2+2,cy2-18); ctx.lineTo(cx2-1,cy2-13); ctx.lineTo(cx2+2,cy2-13); ctx.lineTo(cx2-1,cy2-10); ctx.lineTo(cx2+3,cy2-10); ctx.lineTo(cx2+0,cy2-13); ctx.lineTo(cx2+3,cy2-13); ctx.closePath(); ctx.fill();
    // Lightning crossbow — glowing electric coils on it
    ctx.fillStyle='#3a5010'; ctx.fillRect(cx2-18,cy2-5,22,4); // stock
    ctx.fillRect(cx2-4,cy2-5,8,8); // grip
    // Metal limbs
    ctx.fillStyle='#aabb44'; ctx.fillRect(cx2-18,cy2-10,3,10); ctx.fillRect(cx2+1,cy2-10,3,10);
    // String — crackling electric
    ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.strokeStyle='#ffff44'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx2-18,cy2-10); ctx.lineTo(cx2-8,cy2-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2+4,cy2-10); ctx.lineTo(cx2-8,cy2-5); ctx.stroke();
    ctx.shadowBlur=0;
    // Electric bolt loaded
    ctx.strokeStyle='#ffff00'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx2-15,cy2-3); ctx.lineTo(cx2+4,cy2-3); ctx.stroke();
    // Sparks around the crossbow
    ctx.fillStyle='#ffff66';
    for (let i=0;i<6;i++){const a=i/6*Math.PI*2; ctx.beginPath(); ctx.arc(cx2-7+Math.cos(a)*8,cy2-7+Math.sin(a)*8,1.5,0,Math.PI*2); ctx.fill();}
    // Arms
    ctx.fillStyle='#3a5010'; ctx.fillRect(cx2-12,cy2-3,6,3); ctx.fillRect(cx2+5,cy2-3,5,3);

  } else if (key === 'earth') {
    // Earth warrior — stone-brown heavy armour, massive stone maul
    const cx2=w/2, cy2=h*0.52;
    // Legs — thick stone greaves
    ctx.fillStyle='#5a4a30'; ctx.fillRect(cx2-6,cy2+8,5,10); ctx.fillRect(cx2+1,cy2+8,5,10);
    ctx.fillStyle='#3a2a18'; ctx.fillRect(cx2-7,cy2+16,7,4); ctx.fillRect(cx2,cy2+16,7,4);
    // Torso — heavy stone plate
    ctx.fillStyle='#6a5a3a'; ctx.fillRect(cx2-8,cy2-6,16,14);
    // Stone texture lines
    ctx.strokeStyle='#4a3a22'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx2-8,cy2+2); ctx.lineTo(cx2+8,cy2+2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2,cy2-6); ctx.lineTo(cx2,cy2+8); ctx.stroke();
    // Shoulder boulders
    ctx.fillStyle='#7a6a48'; ctx.beginPath(); ctx.arc(cx2-9,cy2-5,5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx2+9,cy2-5,5,0,Math.PI*2); ctx.fill();
    // Neck + Head
    ctx.fillStyle='#e8b890'; ctx.fillRect(cx2-2,cy2-9,4,4);
    ctx.beginPath(); ctx.arc(cx2,cy2-13,5,0,Math.PI*2); ctx.fill();
    // Stone helm — blocky
    ctx.fillStyle='#6a5a3a';
    ctx.fillRect(cx2-6,cy2-18,12,6); // top
    ctx.fillRect(cx2-7,cy2-12,14,4); // brow ridge
    ctx.fillStyle='#3a2a18'; ctx.fillRect(cx2-4,cy2-12,8,3); // visor slit
    // Left arm — braced
    ctx.fillStyle='#6a5a3a'; ctx.fillRect(cx2-14,cy2-4,7,4);
    // Right arm — raising maul
    ctx.fillStyle='#6a5a3a'; ctx.fillRect(cx2+7,cy2-8,4,8);
    // STONE MAUL — handle then massive boulder head
    ctx.fillStyle='#5a3a10'; ctx.fillRect(cx2+10,cy2-20,3,24); // handle
    ctx.fillStyle='#776655'; // boulder head
    ctx.beginPath(); ctx.arc(cx2+14,cy2-21,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#998877'; ctx.beginPath(); ctx.arc(cx2+12,cy2-23,7,0,Math.PI*2); ctx.fill();
    // Cracks on boulder
    ctx.strokeStyle='#4a3a28'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx2+10,cy2-24); ctx.lineTo(cx2+14,cy2-18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2+16,cy2-23); ctx.lineTo(cx2+12,cy2-20); ctx.stroke();

  // ── Traps ─────────────────────────────────────────────────────────────────
  } else if (key === 'spike') {
    ctx.fillStyle = '#5a3a18'; ctx.fillRect(4, h - 16, w - 8, 12); // dirt base
    ctx.fillStyle = '#999';
    for (const sx of [cx - 13, cx - 5, cx + 3, cx + 11]) {
      ctx.beginPath(); ctx.moveTo(sx, h - 16); ctx.lineTo(sx + 4, h - 34); ctx.lineTo(sx + 8, h - 16); ctx.fill();
      ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.arc(sx + 4, h - 34, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#999';
    }

  } else if (key === 'tar') {
    ctx.fillStyle = '#1a1a0a';
    ctx.save(); ctx.translate(cx, cy + 8); ctx.scale(1.4, 0.52);
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2e2c12';
    ctx.save(); ctx.translate(cx, cy + 8); ctx.scale(1.1, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Glossy bubble
    ctx.fillStyle = 'rgba(80,80,30,0.4)';
    ctx.save(); ctx.translate(cx - 4, cy + 4); ctx.scale(0.5, 0.3);
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Skull symbol
    ctx.fillStyle = '#553'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('☠', cx, cy - 2); ctx.textAlign = 'left';

  } else if (key === 'barricade') {
    ctx.strokeStyle = '#8b6030'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(8, 6); ctx.lineTo(w - 8, h - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, h - 9); ctx.lineTo(w - 8, 6); ctx.stroke();
    ctx.strokeStyle = '#6a4820'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(8, 6); ctx.lineTo(w - 8, h - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, h - 9); ctx.lineTo(w - 8, 6); ctx.stroke();
    // Bolts at corners
    ctx.fillStyle = '#ccc';
    for (const [bx, by] of [[8,6],[w-8,6],[8,h-9],[w-8,h-9]]) {
      ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.lineCap = 'butt';

  } else if (key === 'wall') {
    const wy = cy - 14;
    ctx.fillStyle = '#5a5550'; ctx.fillRect(5, wy, w - 10, 28);
    ctx.fillStyle = '#6a6560'; ctx.fillRect(7, wy + 2, w - 14, 24);
    ctx.strokeStyle = '#3a3530'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(5, wy + 14); ctx.lineTo(w - 5, wy + 14); ctx.stroke();
    for (let bx = 5; bx < w - 7; bx += 13) {
      ctx.beginPath(); ctx.moveTo(bx, wy + 2); ctx.lineTo(bx, wy + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 6, wy + 14); ctx.lineTo(bx + 6, wy + 26); ctx.stroke();
    }
    ctx.fillStyle = '#5a5550';
    for (let bx = 5; bx < w - 9; bx += 9) ctx.fillRect(bx, wy - 8, 6, 9);

  // ── Camps — draw the SOLDIER that spawns, not a tent ───────────────────────
  } else if (key === 'camp_basic') {
    // Fighter: brown leather, sword
    const s = 0.85, ox = cx, oy = cy + 4;
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(ox-4*s, oy+2*s, 3.5*s, 5*s); ctx.fillRect(ox+0.5*s, oy+2*s, 3.5*s, 5*s);
    ctx.fillStyle = '#7a4a1a'; ctx.fillRect(ox-4.5*s, oy-7*s, 9*s, 9*s);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(ox-1*s, oy-10*s, 2.5*s, 3.5*s);
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(ox, oy-13.5*s, 4.5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7a4a1a'; ctx.beginPath(); ctx.arc(ox, oy-13.5*s, 4.5*s, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ccc'; ctx.save(); ctx.translate(ox+7*s, oy-4*s);
    ctx.fillRect(-1*s,-12*s,2*s,13*s); ctx.fillStyle='#884400'; ctx.fillRect(-3*s,-1.5*s,6*s,2.5*s); ctx.restore();

  } else if (key === 'camp_archer') {
    // Archer: green tunic, bow
    const s = 0.85, ox = cx, oy = cy + 4;
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(ox-4*s, oy+2*s, 3.5*s, 5*s); ctx.fillRect(ox+0.5*s, oy+2*s, 3.5*s, 5*s);
    ctx.fillStyle = '#2a6020'; ctx.fillRect(ox-4.5*s, oy-7*s, 9*s, 9*s);
    ctx.fillStyle = '#1a4a14'; ctx.beginPath(); ctx.arc(ox, oy-13*s, 5.5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(ox, oy-13*s, 3.5*s, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#884400'; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.arc(ox-9*s, oy-7*s, 9*s, -0.9, 0.9); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1*s;
    ctx.beginPath(); ctx.moveTo(ox-9*s, oy-15.5*s); ctx.lineTo(ox-1.5*s, oy-7*s); ctx.lineTo(ox-9*s, oy+1.5*s); ctx.stroke();

  } else if (key === 'camp_knight') {
    // Knight: silver armour, shield, sword
    const s = 0.85, ox = cx, oy = cy + 4;
    ctx.fillStyle = '#778899'; ctx.fillRect(ox-5*s, oy+2*s, 4*s, 6*s); ctx.fillRect(ox+1*s, oy+2*s, 4*s, 6*s);
    ctx.fillStyle = '#8899aa'; ctx.fillRect(ox-5.5*s, oy-8*s, 11*s, 10*s);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(ox-1*s, oy-11*s, 2.5*s, 3.5*s);
    ctx.fillStyle = '#aabbcc'; ctx.beginPath(); ctx.arc(ox, oy-14.5*s, 5.5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#334455'; ctx.fillRect(ox-3.5*s, oy-15.5*s, 7*s, 2.5*s);
    ctx.fillStyle = '#cc8822'; ctx.fillRect(ox-14*s, oy-11*s, 6*s, 16*s);
    ctx.strokeStyle = '#886600'; ctx.lineWidth = 1;
    ctx.strokeRect(ox-14*s, oy-11*s, 6*s, 16*s);
    ctx.fillStyle = '#ffdd44'; ctx.font = `bold ${7*s}px sans-serif`; ctx.textAlign='center';
    ctx.fillText('✦', ox-11*s, oy-3*s); ctx.textAlign='left';
    ctx.fillStyle = '#ddd'; ctx.save(); ctx.translate(ox+8*s, oy-5*s);
    ctx.fillRect(-1.5*s,-15*s,2.5*s,16*s); ctx.fillStyle='#aa6600'; ctx.fillRect(-4*s,-2*s,8*s,2.5*s); ctx.restore();

  } else if (key === 'camp_mage') {
    // Mage: purple robes, glowing staff, wizard hat
    const s = 0.85, ox = cx, oy = cy + 4;
    ctx.fillStyle = '#7733bb'; ctx.beginPath();
    ctx.moveTo(ox-6.5*s, oy+8*s); ctx.lineTo(ox+6.5*s, oy+8*s); ctx.lineTo(ox+8*s, oy+13*s); ctx.lineTo(ox-8*s, oy+13*s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a2299'; ctx.fillRect(ox-4.5*s, oy-1*s, 9*s, 9*s);
    ctx.fillStyle = '#6622aa'; ctx.fillRect(ox-4.5*s, oy-9*s, 9*s, 8*s);
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(ox, oy-13*s, 4.5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3a0066';
    ctx.beginPath(); ctx.moveTo(ox-6.5*s, oy-11*s); ctx.lineTo(ox, oy-24*s); ctx.lineTo(ox+6.5*s, oy-11*s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#aa44ff'; ctx.beginPath(); ctx.arc(ox, oy-11*s, 6.5*s, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#884400'; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.moveTo(ox+9*s, oy+7*s); ctx.lineTo(ox+9*s, oy-18*s); ctx.stroke();
    ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 7;
    ctx.fillStyle = '#bb55ff'; ctx.beginPath(); ctx.arc(ox+9*s, oy-20*s, 4.5*s, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (key === 'camp_siege') {
    // Siege warrior: dark heavy armour, battle axe, horns
    const s = 0.85, ox = cx, oy = cy + 4;
    ctx.fillStyle = '#443322'; ctx.fillRect(ox-6*s, oy+1*s, 4.5*s, 7*s); ctx.fillRect(ox+1.5*s, oy+1*s, 4.5*s, 7*s);
    ctx.fillStyle = '#554433'; ctx.fillRect(ox-6.5*s, oy-9*s, 13*s, 10*s);
    ctx.fillStyle = '#665544'; ctx.fillRect(ox-9.5*s, oy-9*s, 4.5*s, 4.5*s); ctx.fillRect(ox+5*s, oy-9*s, 4.5*s, 4.5*s);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(ox-1*s, oy-11*s, 2.5*s, 2.5*s);
    ctx.fillStyle = '#776655'; ctx.beginPath(); ctx.arc(ox, oy-15*s, 6.5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#887766';
    ctx.beginPath(); ctx.moveTo(ox-4.5*s, oy-20.5*s); ctx.lineTo(ox-8.5*s, oy-28.5*s); ctx.lineTo(ox-1.5*s, oy-20.5*s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox+4.5*s, oy-20.5*s); ctx.lineTo(ox+8.5*s, oy-28.5*s); ctx.lineTo(ox+1.5*s, oy-20.5*s); ctx.fill();
    ctx.save(); ctx.translate(ox+10*s, oy-7*s);
    ctx.fillStyle = '#888'; ctx.fillRect(-1.5*s,-17*s,2.5*s,20*s);
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.moveTo(0,-17*s); ctx.lineTo(7*s,-13*s); ctx.lineTo(7*s,-5*s); ctx.lineTo(0,-4*s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.moveTo(0,-17*s); ctx.lineTo(-4.5*s,-13*s); ctx.lineTo(-3.5*s,-8*s); ctx.lineTo(0,-7*s); ctx.closePath(); ctx.fill();
    ctx.restore();

  // ── Worker ────────────────────────────────────────────────────────────────
  } else if (key === 'worker') {
    const ox = cx - 4, oy = cy + 4;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(ox+2, oy+10); ctx.scale(1,0.3);
    ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Legs
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(ox-4, oy+3, 3.5, 7); ctx.fillRect(ox+0.5, oy+3, 3.5, 7);
    // Body
    ctx.fillStyle = '#7a4a1a'; ctx.fillRect(ox-5, oy-6, 10, 9);
    // Arms
    ctx.fillRect(ox-10, oy-5, 6, 5); ctx.fillRect(ox+4, oy-5, 6, 5);
    // Neck
    ctx.fillStyle = '#e8b890'; ctx.fillRect(ox-1.5, oy-9, 3, 4);
    // Head
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(ox, oy-13, 5, 0, Math.PI*2); ctx.fill();
    // Hat
    ctx.fillStyle = '#7a4a1a'; ctx.beginPath(); ctx.arc(ox, oy-13, 5, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillRect(ox-6, oy-14, 12, 2);
    // Pickaxe
    ctx.strokeStyle = '#8b5e20'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ox+4, oy-10); ctx.lineTo(ox+14, oy-3); ctx.stroke();
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.moveTo(ox+14, oy+2); ctx.lineTo(ox+18, oy-6); ctx.lineTo(ox+12, oy-7); ctx.closePath(); ctx.fill();
    ctx.lineCap = 'butt';
  }
}

// Builds a "WANTED poster" style button with canvas icon + name + cost.
function _makeTileBtn(id, key, name, cost) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.className = 'btn';

  // "WANTED" header strip
  const header = document.createElement('div');
  header.textContent = 'WANTED FOR ARMY';
  header.style.cssText = 'font-size:8px;font-weight:900;letter-spacing:1px;color:#8b0000;background:rgba(0,0,0,0.12);padding:2px 0;width:100%;text-align:center;border-bottom:1px solid #a07830;';
  btn.appendChild(header);

  // Canvas icon
  const cv = document.createElement('canvas');
  cv.width = 60; cv.height = 52;
  cv.style.cssText = 'display:block;width:100%;pointer-events:none;';
  _drawBtnIcon(cv.getContext('2d'), key, 60, 52);
  btn.appendChild(cv);

  // Ornament divider
  const div1 = document.createElement('div');
  div1.textContent = '─────';
  div1.style.cssText = 'font-size:7px;color:#a07030;text-align:center;line-height:1;';
  btn.appendChild(div1);

  // Unit name
  const nameEl = document.createElement('div');
  nameEl.textContent = name;
  nameEl.style.cssText = 'font-size:9px;font-weight:bold;color:#2a1208;white-space:nowrap;padding:1px 3px;text-align:center;pointer-events:none;';
  btn.appendChild(nameEl);

  // Cost as "PAY: $XX"
  const costEl = document.createElement('div');
  costEl.textContent = `PAYMENT: ${cost}`;
  costEl.style.cssText = 'font-size:9px;font-weight:bold;color:#8b0000;padding:2px 0 3px;text-align:center;border-top:1px solid #a07830;width:100%;pointer-events:none;';
  btn.appendChild(costEl);

  return btn;
}

// A worker that walks to mines and carries gold back to a home base
class Worker {
  constructor(homeX, homeY, mines) {
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX;
    this.y = homeY;
    this.mines = mines;
    this.target = null;
    this.carrying = false;
    this.gold = 0;
    this.speed = 0.35;
    this.flashTimer = 0;
  }

  update() {
    if (this.flashTimer > 0) this.flashTimer--;
    const activeMines = this.mines.filter(m => !m.isDead?.());

    if (!this.carrying) {
      // Find nearest mine with gold ready
      if (!this.target || !activeMines.includes(this.target)) {
        this.target = activeMines.sort((a, b) =>
          Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y)
        )[0] || null;
      }
      if (this.target) {
        const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (d < 10) {
          // Collect gold from mine
          this.carrying = true;
          this.gold = MINE.income;
          this.target = null;
          this.flashTimer = 20;
        } else {
          this.x += ((this.target.x - this.x) / d) * this.speed;
          this.y += ((this.target.y - this.y) / d) * this.speed;
        }
      } else {
        // Wander near home
        const d = Math.hypot(this.homeX - this.x, this.homeY - this.y);
        if (d > 5) {
          this.x += ((this.homeX - this.x) / d) * this.speed;
          this.y += ((this.homeY - this.y) / d) * this.speed;
        }
      }
    } else {
      // Return home with gold
      const d = Math.hypot(this.homeX - this.x, this.homeY - this.y);
      if (d < 10) {
        this.carrying = false;
        return this.gold; // delivered!
      }
      this.x += ((this.homeX - this.x) / d) * this.speed;
      this.y += ((this.homeY - this.y) / d) * this.speed;
    }
    return 0;
  }

  draw(ctx) {
    const carrying = this.carrying;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(this.x+2, this.y+8); ctx.scale(1,0.3);
    ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Body
    ctx.fillStyle = carrying ? '#cc8820' : '#7a4a1a';
    ctx.fillRect(this.x-4, this.y-4, 8, 8);
    // Neck
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(this.x-1.5, this.y-7, 3, 4);
    // Head
    ctx.fillStyle = '#e8b890';
    ctx.beginPath(); ctx.arc(this.x, this.y-10, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7a4a1a'; // hat
    ctx.beginPath(); ctx.arc(this.x, this.y-10, 4, Math.PI, Math.PI*2); ctx.fill();
    // Gold bag when carrying
    if (carrying) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(this.x+5, this.y-2, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#cc9900'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('$', this.x+5, this.y); ctx.textAlign = 'left';
    }
    // Gold delivery flash
    if (this.flashTimer > 0) {
      const p = this.flashTimer / 20;
      ctx.fillStyle = `rgba(255,215,0,${p * 0.8})`;
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('+$' + this.gold, this.x, this.y - 20 - (1-p)*10);
      ctx.textAlign = 'left';
    }
  }
}

// Camp now supports multiple camp types — basic, archer, knight, mage, siege
class Camp {
  constructor(x, y, campTypeName = 'basic') {
    this.x = x; this.y = y;
    this.campType = CAMP_TYPES[campTypeName] || CAMP_TYPES.basic; // store the type config
    this.typeName = campTypeName;
    this.hp = 100; this.maxHp = 100;
    this.spawnTimer = 0;
    this.spawnRate = this.campType.spawnRate; // different types spawn at different rates
  }
  takeDamage(amt) { this.hp -= amt; }
  isDead() { return this.hp <= 0; }
  draw(ctx) {
    const hf = this.hp / this.maxHp;
    const c = this.campType.color; // each camp type has its own color
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(this.x+4, this.y+22); ctx.scale(1, 0.3);
    ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Tent body (use camp's color)
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(this.x-28,this.y+18); ctx.lineTo(this.x,this.y-26); ctx.lineTo(this.x+28,this.y+18); ctx.closePath(); ctx.fill();
    // Lighter highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.moveTo(this.x-22,this.y+18); ctx.lineTo(this.x-2,this.y-22); ctx.lineTo(this.x+2,this.y-22); ctx.lineTo(this.x+22,this.y+18); ctx.closePath(); ctx.fill();
    // Door
    ctx.fillStyle = '#2a1408'; ctx.fillRect(this.x-7, this.y+2, 14, 16);
    // Flag pole + flag (color matches camp type)
    ctx.fillStyle = '#3a1a05'; ctx.fillRect(this.x-1, this.y-42, 2, 20);
    ctx.fillStyle = c; ctx.fillRect(this.x+1, this.y-42, 14, 9);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', this.x+8, this.y-35); ctx.textAlign = 'left';
    // Type label
    const shortNames = { basic:'CAMP', archer:'ARCHER', knight:'KNIGHT', mage:'MAGE', siege:'SIEGE' };
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(shortNames[this.typeName] || 'CAMP', this.x, this.y+36); ctx.textAlign = 'left';
    // HP bar
    ctx.fillStyle = '#111'; ctx.fillRect(this.x-22, this.y+40, 44, 5);
    ctx.fillStyle = hf > 0.5 ? '#0f0' : '#f80';
    ctx.fillRect(this.x-22, this.y+40, 44*hf, 5);
  }
}

// Soldier — each camp type spawns soldiers that look and fight differently
// Teaching concept: one class, many behaviors — controlled by typeName flags
class Soldier {
  constructor(x, y, campType = null, typeName = 'basic') {
    this.x = x; this.y = y;
    this.typeName = typeName; // 'basic' | 'archer' | 'knight' | 'mage' | 'siege'

    // Stats from camp config
    const hp  = campType ? campType.soldierHp  : 50;
    const dmg = campType ? campType.soldierDmg : 8;
    this.hp = hp; this.maxHp = hp;
    this.speed = 1.0;
    this.damage = dmg;

    // Each type has different attack range and rate:
    // archer = long range, slow fire  |  mage = very long range, aoe, very slow
    // siege = wide melee aoe          |  knight/basic = normal melee
    this.ranged = campType?.ranged || false;  // archer: don't close to melee
    this.magic  = campType?.magic  || false;  // mage: aoe blast
    this.aoe    = campType?.aoe    || false;  // siege: melee hits all nearby
    this.range      = this.magic ? 140 : this.ranged ? 110 : 58;
    this.attackRate = this.magic ? 110 : this.ranged ? 80  : 45;

    this.waypoint = 0;
    this.attackTimer = 0;
    this.target = null;
    this.blocking = false;
    this.blockTimer = 0;
    this.jumpHeight = 0;
    this.jumpVel = 0;
    this.swingTimer = 0;
    this.hitTimer = 0;
    this.stunTimer = 0;   // knocked back/stunned by titan scythe
    this.pushVx = 0;      // knockback velocity X
    this.pushVy = 0;      // knockback velocity Y
    this._3dx = null; this._3dy = null; this._3dr = 0;
  }

  update(enemies, path, projectiles = []) {
    if (this.hitTimer > 0) this.hitTimer--;
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.swingTimer > 0) this.swingTimer--;
    if (this.blockTimer > 0) { this.blockTimer--; if (this.blockTimer <= 0) this.blocking = false; }

    // Titan knockback — soldier tumbles away and can't fight while stunned
    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.x += this.pushVx;
      this.y += this.pushVy;
      this.pushVx *= 0.82;  // friction slows the tumble
      this.pushVy *= 0.82;
      return;               // can't move or attack while airborne
    }
    // Jump physics
    if (this.jumpVel !== 0 || this.jumpHeight > 0) {
      this.jumpHeight += this.jumpVel;
      this.jumpVel -= 0.5;
      if (this.jumpHeight <= 0) { this.jumpHeight = 0; this.jumpVel = 0; }
    }

    // Find nearest enemy in range
    this.target = enemies
      .filter(e => Math.hypot(e.x-this.x, e.y-this.y) < this.range)
      .sort((a,b) => Math.hypot(a.x-this.x,a.y-this.y) - Math.hypot(b.x-this.x,b.y-this.y))[0] || null;

    if (this.target) {
      if (this.attackTimer <= 0) {
        if (this.magic) {
          // Mage: fires a visible explosive magic orb that splashes on impact
          const dx = this.target.x - this.x, dy = this.target.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          projectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: (dx / dist) * 5, vy: (dy / dist) * 5,
            damage: this.damage,
            magicOrb: true, splash: true, splashRadius: 55,
            manual: true,  // so it only hits enemies (not towers)
          }));
          // No instant damage — the projectile handles it on arrival
        } else if (this.aoe) {
          // Siege: hits every enemy within melee reach
          for (const e of enemies) {
            if (Math.hypot(e.x-this.x, e.y-this.y) < 62)
              e.takeDamage(this.damage);
          }
        } else {
          // archer / basic / knight: single target
          this.target.takeDamage(this.damage);
        }
        this.attackTimer = this.attackRate;
        this.swingTimer  = 14;
        // Knight: randomly start blocking after an attack
        if (this.typeName === 'knight' && Math.random() < 0.3) {
          this.blocking = true; this.blockTimer = 40;
        }
      }
      // Ranged/magic soldiers hold their position; melee soldiers step in closer
      if (!this.ranged && !this.magic) {
        const dest = this.target;
        const d = Math.hypot(dest.x-this.x, dest.y-this.y);
        if (d > 30) { this.x += ((dest.x-this.x)/d)*this.speed; this.y += ((dest.y-this.y)/d)*this.speed; }
      }
    } else {
      // No enemies in range — walk toward the front (decreasing waypoint toward 0)
      const dest = path[Math.max(0, this.waypoint - 1)];
      const d = Math.hypot(dest.x - this.x, dest.y - this.y);
      if (d < this.speed) { if (this.waypoint > 0) this.waypoint--; }
      else { this.x += ((dest.x-this.x)/d)*this.speed; this.y += ((dest.y-this.y)/d)*this.speed; }
    }
  }

  takeDamage(amt) {
    this.hp -= this.blocking ? amt * 0.3 : amt;
    this.hitTimer = 10;
  }
  isDead() { return this.hp <= 0; }
  jump() { if (this.jumpHeight === 0) this.jumpVel = 6; }

  draw(ctx) {
    const hit = this.hitTimer > 0;
    const jy = this.jumpHeight * 0.4;
    // Shadow (same for all types)
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.save(); ctx.translate(this.x+2,this.y+9); ctx.scale(1,0.3);
    ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill(); ctx.restore();

    // Dispatch to type-specific drawing
    switch (this.typeName) {
      case 'archer': this._drawArcher(ctx, hit, jy); break;
      case 'knight': this._drawKnight(ctx, hit, jy); break;
      case 'mage':   this._drawMage(ctx, hit, jy);   break;
      case 'siege':  this._drawSiege(ctx, hit, jy);  break;
      default:       this._drawBasic(ctx, hit, jy);  break;
    }

    // HP bar (same for all)
    const bw = 20;
    ctx.fillStyle = '#111'; ctx.fillRect(this.x-bw/2, this.y-26-jy, bw, 3);
    const hf = this.hp / this.maxHp;
    ctx.fillStyle = hf > 0.5 ? '#2f8' : hf > 0.25 ? '#fa0' : '#f44';
    ctx.fillRect(this.x-bw/2, this.y-26-jy, bw*hf, 3);

    // Titan stun — spinning stars above head
    if (this.stunTimer > 0) {
      const t = Date.now() / 180;
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const a = t + (i * Math.PI * 2 / 3);
        const sx2 = this.x + Math.cos(a) * 9;
        const sy2 = this.y - 30 - jy + Math.sin(a) * 4;
        ctx.fillStyle = i === 0 ? '#ffee00' : i === 1 ? '#ff8800' : '#ff4488';
        ctx.beginPath();
        ctx.arc(sx2, sy2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── BASIC SOLDIER (blue armour, sword) ───────────────────────────────────────
  _drawBasic(ctx, hit, jy) {
    ctx.fillStyle = hit ? '#fff' : '#334488';
    ctx.fillRect(this.x-5, this.y+2-jy, 4, 6); ctx.fillRect(this.x+1, this.y+2-jy, 4, 6);
    ctx.fillStyle = hit ? '#fff' : '#2255aa';
    ctx.fillRect(this.x-5, this.y-8-jy, 10, 10);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(this.x-1.5, this.y-11-jy, 3, 4);
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 5.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(this.x-7, this.y-16-jy, 14, 3);
    const sw = this.swingTimer > 0 ? Math.sin(this.swingTimer/14*Math.PI)*10 : 0;
    ctx.fillStyle = '#ccc';
    ctx.save(); ctx.translate(this.x+8, this.y-5-jy-sw);
    ctx.fillRect(-1,-13,2,14); ctx.fillStyle='#884400'; ctx.fillRect(-3,-1,7,2); ctx.restore();
  }

  // ── ARCHER (green cloak, bow) ─────────────────────────────────────────────────
  _drawArcher(ctx, hit, jy) {
    // Legs (brown leather)
    ctx.fillStyle = hit ? '#fff' : '#5a3a1a';
    ctx.fillRect(this.x-5, this.y+2-jy, 4, 6); ctx.fillRect(this.x+1, this.y+2-jy, 4, 6);
    // Body (dark green tunic)
    ctx.fillStyle = hit ? '#fff' : '#2a6020';
    ctx.fillRect(this.x-5, this.y-8-jy, 10, 10);
    // Hood
    ctx.fillStyle = hit ? '#fff' : '#1a4a14';
    ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8b890'; // face
    ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 4, 0, Math.PI*2); ctx.fill();
    // Bow (curved arc on left side)
    const bowDraw = this.swingTimer > 0 ? 4 : 0; // pull back when attacking
    ctx.strokeStyle = '#884400'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x - 10 - bowDraw, this.y - 8 - jy, 10, -0.9, 0.9);
    ctx.stroke();
    // Bowstring
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x - 10 - bowDraw, this.y - 17 - jy);
    ctx.lineTo(this.x - 2 + bowDraw, this.y - 8 - jy); // pulled back when attacking
    ctx.lineTo(this.x - 10 - bowDraw, this.y + 1 - jy);
    ctx.stroke();
    // Arrow on the string (only when not attacking)
    if (this.swingTimer === 0) {
      ctx.strokeStyle = '#cc8800'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(this.x-12-jy, this.y-8-jy); ctx.lineTo(this.x+4, this.y-8-jy); ctx.stroke();
    }
  }

  // ── KNIGHT (silver plate armour, tower shield, big sword) ─────────────────────
  _drawKnight(ctx, hit, jy) {
    // Greaves (silver)
    ctx.fillStyle = hit ? '#fff' : '#778899';
    ctx.fillRect(this.x-6, this.y+2-jy, 5, 7); ctx.fillRect(this.x+1, this.y+2-jy, 5, 7);
    // Plate body (slightly larger)
    ctx.fillStyle = hit ? '#fff' : '#8899aa';
    ctx.fillRect(this.x-6, this.y-9-jy, 12, 11);
    // Neck
    ctx.fillStyle = '#e8b890'; ctx.fillRect(this.x-1.5, this.y-12-jy, 3, 4);
    // Great helm (full face)
    ctx.fillStyle = hit ? '#fff' : '#aabbcc';
    ctx.beginPath(); ctx.arc(this.x, this.y-15-jy, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#334455'; // visor slit
    ctx.fillRect(this.x-4, this.y-16-jy, 8, 3);
    // Tower shield (large, gold trimmed)
    ctx.fillStyle = hit ? '#fff' : '#cc8822';
    ctx.fillRect(this.x-16, this.y-12-jy, 7, 18);
    ctx.strokeStyle = '#886600'; ctx.lineWidth = 1;
    ctx.strokeRect(this.x-16, this.y-12-jy, 7, 18);
    ctx.fillStyle = '#ffdd44'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✦', this.x-12, this.y-4-jy); ctx.textAlign = 'left';
    // Great sword
    const sw = this.swingTimer > 0 ? Math.sin(this.swingTimer/14*Math.PI)*12 : 0;
    ctx.fillStyle = '#ddd';
    ctx.save(); ctx.translate(this.x+9, this.y-6-jy-sw);
    ctx.fillRect(-1.5,-16,3,18); ctx.fillStyle='#aa6600'; ctx.fillRect(-4,-2,9,3); ctx.restore();
    // Block flash on shield
    if (this.blocking) {
      ctx.fillStyle='rgba(200,230,255,0.45)'; ctx.fillRect(this.x-16, this.y-12-jy, 7, 18);
    }
  }

  // ── MAGE (purple robes, glowing staff) ───────────────────────────────────────
  _drawMage(ctx, hit, jy) {
    // Robe (long, covers legs)
    ctx.fillStyle = hit ? '#fff' : '#5a2299';
    ctx.fillRect(this.x-5, this.y-2-jy, 10, 12);
    // Robe bottom flare
    ctx.fillStyle = hit ? '#fff' : '#7733bb';
    ctx.beginPath(); ctx.moveTo(this.x-7, this.y+9-jy); ctx.lineTo(this.x+7, this.y+9-jy);
    ctx.lineTo(this.x+9, this.y+14-jy); ctx.lineTo(this.x-9, this.y+14-jy); ctx.closePath(); ctx.fill();
    // Body
    ctx.fillStyle = hit ? '#fff' : '#6622aa';
    ctx.fillRect(this.x-5, this.y-10-jy, 10, 8);
    // Head + hat
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(this.x, this.y-14-jy, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hit ? '#ddd' : '#3a0066';
    ctx.beginPath(); ctx.moveTo(this.x-7, this.y-12-jy); ctx.lineTo(this.x, this.y-26-jy); ctx.lineTo(this.x+7, this.y-12-jy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#aa44ff'; ctx.beginPath(); ctx.arc(this.x, this.y-12-jy, 7, Math.PI, 0); ctx.fill(); // hat brim
    // Glowing staff
    const glow = this.swingTimer > 0 ? 1 : 0.4 + 0.3 * Math.sin(Date.now() / 300);
    ctx.strokeStyle = '#884400'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.x+10, this.y+8-jy); ctx.lineTo(this.x+10, this.y-20-jy); ctx.stroke();
    ctx.fillStyle = `rgba(170,80,255,${glow})`;
    ctx.beginPath(); ctx.arc(this.x+10, this.y-22-jy, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgba(220,150,255,${glow * 0.6})`;
    ctx.beginPath(); ctx.arc(this.x+10, this.y-22-jy, 9, 0, Math.PI*2); ctx.fill();
    // Magic AOE ring when attacking
    if (this.swingTimer > 0 && this.target) {
      const p = this.swingTimer / 14;
      ctx.strokeStyle = `rgba(170,80,255,${p * 0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.target.x, this.target.y, 55 * (1-p) + 5, 0, Math.PI*2); ctx.stroke();
    }
  }

  // ── SIEGE WARRIOR (dark heavy armour, battle axe) ────────────────────────────
  _drawSiege(ctx, hit, jy) {
    // Heavy boots
    ctx.fillStyle = hit ? '#fff' : '#443322';
    ctx.fillRect(this.x-7, this.y+1-jy, 5, 8); ctx.fillRect(this.x+2, this.y+1-jy, 5, 8);
    // Large armoured body
    ctx.fillStyle = hit ? '#fff' : '#554433';
    ctx.fillRect(this.x-7, this.y-10-jy, 14, 12);
    // Shoulder pads
    ctx.fillStyle = hit ? '#fff' : '#665544';
    ctx.fillRect(this.x-10, this.y-10-jy, 5, 5); ctx.fillRect(this.x+5, this.y-10-jy, 5, 5);
    // Neck
    ctx.fillStyle = '#e8b890'; ctx.fillRect(this.x-1.5, this.y-12-jy, 3, 3);
    // Horned helmet
    ctx.fillStyle = hit ? '#fff' : '#776655';
    ctx.beginPath(); ctx.arc(this.x, this.y-16-jy, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hit ? '#fff' : '#887766'; // horns
    ctx.beginPath(); ctx.moveTo(this.x-5, this.y-22-jy); ctx.lineTo(this.x-9, this.y-30-jy); ctx.lineTo(this.x-2, this.y-22-jy); ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.x+5, this.y-22-jy); ctx.lineTo(this.x+9, this.y-30-jy); ctx.lineTo(this.x+2, this.y-22-jy); ctx.fill();
    // Battle axe (big swing)
    const sw = this.swingTimer > 0 ? Math.sin(this.swingTimer/14*Math.PI)*14 : 0;
    ctx.save(); ctx.translate(this.x+11, this.y-8-jy-sw);
    ctx.fillStyle = '#888'; ctx.fillRect(-1.5, -18, 3, 22); // haft
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(8,-14); ctx.lineTo(8,-6); ctx.lineTo(0,-5); ctx.closePath(); ctx.fill(); // axe head
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(-5,-14); ctx.lineTo(-4,-9); ctx.lineTo(0,-8); ctx.closePath(); ctx.fill(); // back spike
    ctx.restore();
    // AOE ground ring when attacking
    if (this.swingTimer > 0) {
      const p = this.swingTimer / 14;
      ctx.strokeStyle = `rgba(200,120,50,${p * 0.7})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(this.x, this.y, 62 * (1-p) + 10, 0, Math.PI*2); ctx.stroke();
    }
  }
}

// Returns a dramatic one-liner for the wave announcement banner
// Returns true only for milestone waves that deserve a dramatic announcement
function _isMilestoneWave(wave, levelDef) {
  if (!levelDef) return wave === 1;
  if (wave === 1) return true;                          // always announce wave 1
  if (wave === levelDef.waves) return true;             // always announce the final wave
  const en = levelDef.enemies;
  if (en.includes('runner')      && wave === 2)  return true;   // scouts first appear
  if (en.includes('saboteur')    && wave === 4)  return true;   // trap wreckers arrive
  if (en.includes('ogre')        && wave === 5)  return true;   // giants crash through
  if (en.includes('dragon')      && wave === 7)  return true;   // dragons take the sky
  if (en.includes('dragonRider') && wave === 10) return true;   // death riders lead
  return false;
}

function _getWaveMsg(wave, levelId) {
  // ── Level 100 (Final Stand) — every wave gets its own narrative line ────────
  if (levelId === 100) {
    const msgs = [
      'THE FINAL STAND BEGINS',        // 1
      'THE WORLD TREMBLES',            // 2
      'DARKNESS DESCENDS',             // 3
      'NO RETREAT. NO SURRENDER.',     // 4
      'THE ANCIENT EVIL MARCHES',      // 5
      'HOLD THE LINE!',                // 6
      'THE TITAN STIRS BENEATH...',    // 7
      'THE DARK KNIGHTS SWARM',        // 8
      'DEATH RIDERS LEAD THE CHARGE',  // 9
      'THE GROUND SPLITS OPEN',        // 10
      'ALL HOPE RESTS ON YOU',         // 11
      'THE SKY BURNS RED',             // 12
      'NOTHING WILL STOP THEM',        // 13
      'FIGHT TO THE LAST BREATH',      // 14
      'DESTROY THE CAMP — NOW!',       // 15
      'YOUR WALLS MUST HOLD',          // 16
      'THE DARKNESS BREAKS THROUGH',   // 17
      'STAND FIRM, SOLDIER',           // 18
      'GIANTS SHAKE THE EARTH',        // 19
      'THE FINAL WAVE APPROACHES',     // 20
      'EVERY TOWER COUNTS',            // 21
      'THERE IS NO MERCY HERE',        // 22
      'THE TITAN AWAKENS!',            // 23
      'UNLEASH EVERYTHING YOU HAVE',   // 24
      'THIS IS IT.',                   // 25
      'THE LAST STAND IS NOW',         // 26
      'WIN OR THE WORLD PERISHES',     // 27
      'ONE LAST PUSH — HOLD ON!',      // 28
      'DO NOT LET A SINGLE ONE PAST',  // 29
      'THIS IS WHERE IT ENDS.',        // 30
    ];
    return msgs[Math.min(wave - 1, msgs.length - 1)];
  }

  // ── Level 30+ — Dragon Rider era ─────────────────────────────────────────
  if (levelId >= 30) {
    const pool = [
      'DEATH RIDERS DESCEND',    'ARMORED DRAGONS IN THE SKY',
      'NOTHING SURVIVES THEIR CHARGE', 'THE CRIMSON WINGS SPREAD',
      'THEY BREATHE FIRE AND DEATH',   'HOLD YOUR TOWERS!',
      'THE RIDERS CIRCLE ABOVE',       'CHAIN LIGHTNING — NOW!',
      'THE ANCIENT WAR RAGES ON',      'SEND THEM BACK TO DUST',
      'BRACE FOR THE DRAGON CHARGE',   'ALL TOWERS FIRE AT ONCE',
    ];
    return pool[(wave - 1) % pool.length];
  }

  // ── Levels 18-29 — Dragon era ────────────────────────────────────────────
  if (levelId >= 18) {
    const pool = [
      'A DRAGON APPEARS',           'THE SKY DARKENS WITH WINGS',
      'TOWERS BURN BELOW THEM',     'ICE IS YOUR ONLY HOPE',
      'THE DRAGONS CIRCLE CLOSER',  'ALL ARCHERS — AIM HIGH!',
      'WINGS OF FIRE APPROACH',     'THE FOREST BURNS',
      'HOLD THE WALLS!',            'DRAGON BREATH ON THE RAMPARTS',
      'THEY FLY TOO FAST TO DODGE', 'FREEZE THEM BEFORE THEY LAND',
    ];
    return pool[(wave - 1) % pool.length];
  }

  // ── Levels 10-17 — Giant era ─────────────────────────────────────────────
  if (levelId >= 10) {
    const pool = [
      'GIANTS EMERGE FROM THE CAVES', 'THEY SHRUG OFF YOUR ARROWS',
      'THE EARTH SHAKES UNDERFOOT',   'WALLS CRACK UNDER IRON FISTS',
      'FIRE MELTS THROUGH THEIR ARMOR','THE GIANTS ARE TOO LARGE TO STOP',
      'THE GIANT WARLORD LEADS THEM', 'BOULDERS ROLL TOWARDS THE GATE',
      'HOLD THE LINE — GIANTS INBOUND','NOT EVEN WALLS CAN STOP THEM',
      'SEND THE MAGES FORWARD',       'EVERY GIANT YOU KILL IS A VICTORY',
    ];
    return pool[(wave - 1) % pool.length];
  }

  // ── Levels 5-9 — Scout / Trap Wrecker era ────────────────────────────────
  if (levelId >= 5) {
    const pool = [
      'SCOUTS RUSH THE FRONT LINE',    'THEY SPRINT PAST YOUR DEFENSES',
      'TRAP WRECKERS IN THE RANKS',    'THEY ARE COMING FOR YOUR TRAPS',
      'FAST AND DEADLY — FIRE NOW',    'THE SHADOW ARMY GATHERS',
      'YOUR TRAPS ARE UNDER ATTACK',   'OUTRUN THEM WITH CROSSBOWS',
      'THE ASSASSINS MOVE AT NIGHT',   'HOLD — MORE SCOUTS INCOMING',
    ];
    return pool[(wave - 1) % pool.length];
  }

  // ── Levels 1-4 — Dark Knight / opening raids ─────────────────────────────
  const pool = [
    'FIRST BLOOD',                  'THE RAID BEGINS',
    'DARK KNIGHTS CHARGE',          'MORE POUR THROUGH THE WOODS',
    'THE DARK KNIGHTS PRESS HARDER','HOLD THE OUTER WALL!',
    'THEY SMELL VICTORY',           'BRACE THE GATE',
    'THE HORDE GROWS BOLDER',       'NO MERCY — FIRE!',
  ];
  return pool[(wave - 1) % pool.length];
}

// Returns a dramatic one-liner keyed to which milestone wave this is
function _getMilestoneMsg(wave, levelDef) {
  const en = levelDef?.enemies ?? [];
  const total = levelDef?.waves ?? 99;
  if (wave === 1)                                 return 'WAVE 1 — THE DARK KNIGHTS CHARGE!';
  if (en.includes('runner')      && wave === 2)   return 'WAVE 2 — SCOUTS INBOUND! TOO FAST TO STOP!';
  if (en.includes('saboteur')    && wave === 4)   return 'WAVE 4 — TRAP WRECKERS TEAR THROUGH YOUR LINES!';
  if (en.includes('ogre')        && wave === 5)   return 'WAVE 5 — GIANTS EMERGE FROM THE CAVES!';
  if (en.includes('dragon')      && wave === 7)   return 'WAVE 7 — FOREST DRAGONS TAKE THE SKY!';
  if (en.includes('dragonRider') && wave === 10)  return 'WAVE 10 — DEATH RIDERS ON CRIMSON DRAGONS!';
  if (wave === total)                             return `WAVE ${total} — FINAL WAVE! HOLD EVERYTHING!`;
  return _getWaveMsg(wave, levelDef?.id ?? 1);
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    canvas.width  = window.innerWidth;
    canvas.height = Math.max(420, window.innerHeight - 88);

    this.path = makePath(canvas.width, canvas.height, 0);
    this.map  = new GameMap(this.path, canvas.width, canvas.height, false);
    this.waveManager = new WaveManager();

    this.towers      = [];
    this.enemies     = [];
    this.projectiles = [];
    this.traps       = [];
    this.mines       = [];
    this.guards      = [];
    this.camps       = [];
    this.soldiers    = [];
    this.workerUnits = []; // animated worker characters

    this.castleHp    = 10000;
    this.castleMaxHp = 10000;
    this.money    = 100;
    this.score    = 0;
    this.gameOver = false;
    this.levelComplete = false;
    this.currentLevel  = null;

    this.workers     = 0;
    this.workerTimer = 0;

    const pathEnd = this.path[this.path.length - 1];
    this.castleArcher = {
      x: pathEnd.x - 42,
      y: pathEnd.y - 38,
      cooldown: 0, fireTimer: 0, angle: Math.PI,
    };

    this.selectedTower = null;
    this.viewMode  = 'flat';  // 'flat' or '3d'
    this.viewTower = null;
    this.flashMsg  = '';
    this.flashTimer = 0;
    this.mouse     = { x: 0, y: 0 };
    // Camera yaw offset for 3D views — dragging left/right rotates the view
    this.camYaw = 0;
    this._3dDragging  = false;
    this._3dDragLastX = 0;
    this.selectedType = 'basic';
    this.typeKeys  = Object.keys(TYPES);
    this.trapKeys  = Object.keys(TRAPS);

    // ── Loadout state ─────────────────────────────────────────────────────────
    this.pendingConsumables = []; // item IDs queued from gem shop for next level
    this._pendingTriggers   = []; // damage items waiting for first wave enemies
    this.activeLoadout      = [];   // consumables ready to USE during the current level

    // ── Daily Wheel state ──────────────────────────────────────────────────────
    this.wheelOpen     = false;  // is the wheel overlay showing?
    this.wheelAngle    = 0;      // current rotation of the wheel (radians)
    this.wheelSpinning = false;  // is the wheel currently spinning?
    this.wheelResult   = null;   // the prize we landed on
    this.wheelSpeed    = 0;      // current spin speed (radians per frame)
    this.pendingWheelReward = null; // reward waiting to be applied when level starts

    // ── Gameplay tracking for achievements ─────────────────────────────────────
    this.totalKills    = 0;    // total enemies killed across all play (for kill achievements)
    this.towerPlaceCount = 0;  // towers placed in this game (for 'builder' achievement)

    // ── Active power-up timers ──────────────────────────────────────────────────
    this.rageTimer    = 0;   // Tower Rage: all towers fire 2x faster
    this.shieldTimer  = 0;   // Castle Shield: castle can't take damage
    this.timeSlowTimer= 0;   // Time Slow: enemies move at half speed
    this.poisonTimer  = 0;   // Poison Cloud: enemies take damage over time
    this.berserkTimer = 0;   // Berserk: enemies deal friendly-fire damage
    this.goldBonus      = 1.0;  // +30% Gold upgrade multiplier
    this.armorActive    = false; // Tower Armor: towers take half damage
    this.regenActive    = false; // HP Regen: towers slowly heal
    this.multiShotActive = false; // Multishot: towers fire 2 projectiles
    this.bounceActive   = false; // Bouncing Arrows: arrows bounce to a second target

    this.enemyCampHp    = 50000;
    this.enemyCampMaxHp = 50000;
    this.titanSpawned   = false;
    this.cutsceneTimer  = 0;
    this.cutscenePhase  = 0;
    this._cutsceneActors = [];  // visual-only soldiers flung by the titan

    // Story banner shown at level start
    this.storyBannerTimer = 0;   // counts down from 360 (6 seconds)
    this.storyBannerTitle = '';
    this.storyBannerText  = '';
    // Wave announcement banner
    this.waveBannerTimer  = 0;   // counts down from 150 (2.5 seconds)
    this.waveBannerText   = '';
    this._lastAnnouncedWave = 0; // so we only announce each wave once

    this.paused         = false;
    this.helpOpen       = false;
    this.titleActive    = true;
    this.selectedLevelId = 1;
    this.campLimit = 5; // raised to 10 by gem_camps upgrade
    this.gemFastFire = false; this.gemHeadStart = false;
    this.gemMinerDouble = false; this.gemSoldierDmg = false;

    // ── Gem currency ───────────────────────────────────────────────────────────
    // Gems are rare — earned from level completions, achievements, and daily wheel
    this.gems = parseInt(localStorage.getItem('td_gems') || '0');

    this._buildTitleScreen();
    this._setupInput();
    document.getElementById('title-screen').style.display = 'flex';
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update() {
    // Tick the wheel spin animation even on title screen
    if (this.wheelSpinning) {
      this.wheelAngle += this.wheelSpeed;
      this.wheelSpeed *= 0.985; // gradually slow down
      if (this.wheelSpeed < 0.005) {
        // Wheel has stopped! Figure out the prize
        this.wheelSpinning = false;
        this._resolveWheelPrize();
      }
    }

    if (this.titleActive || this.gameOver || this.levelComplete) return;
    if (this.paused) return;
    if (this.flashTimer      > 0) this.flashTimer--;
    if (this.storyBannerTimer > 0) this.storyBannerTimer--;
    if (this.waveBannerTimer  > 0) this.waveBannerTimer--;

    // Tick down power-up timers
    if (this.rageTimer     > 0) this.rageTimer--;
    if (this.shieldTimer   > 0) this.shieldTimer--;
    if (this.timeSlowTimer > 0) this.timeSlowTimer--;
    if (this.poisonTimer   > 0) {
      this.poisonTimer--;
      // Poison does a tiny bit of damage to every enemy each frame
      for (const e of this.enemies) e.takeDamage(0.1);
    }
    // Berserk mode — enemies take random friendly-fire damage while active
    if (this.berserkTimer > 0) {
      this.berserkTimer--;
      if (this.berserkTimer % 30 === 0) { // every 0.5s
        for (const e of this.enemies) {
          if (Math.random() < 0.4) e.takeDamage(3 + Math.random() * 5);
        }
      }
    }

    // HP Regen — towers slowly heal over time if the upgrade is active
    if (this.regenActive) {
      for (const t of this.towers) {
        if (t.hp < t.maxHp) t.hp = Math.min(t.hp + 0.005, t.maxHp);
      }
    }

    // Once the titan spawns it's the ONLY thing left — no more waves
    const waveResult = this.titanSpawned ? null : this.waveManager.update(this.enemies.length);
    if (typeof waveResult === 'string') {
      const diff = this.currentLevel ? this.currentLevel.difficulty : 1;
      // Fire pending trigger items on the very first enemy of wave 1
      if (this.enemies.length === 0 && this._pendingTriggers.length > 0) {
        for (const tid of this._pendingTriggers) this._fireTrigger(tid);
        this._pendingTriggers = [];
      }
      // Apply Time Slow if active — enemies spawn slower
      // Only announce milestone waves — not every single wave
      const curWave = this.waveManager.wave;
      if (curWave !== this._lastAnnouncedWave && _isMilestoneWave(curWave, this.currentLevel)) {
        this._lastAnnouncedWave = curWave;
        this.waveBannerTimer = 200; // slightly longer for milestone moments
        this.waveBannerText  = _getMilestoneMsg(curWave, this.currentLevel);
      } else if (curWave !== this._lastAnnouncedWave) {
        this._lastAnnouncedWave = curWave; // track it but don't show banner
      }
      const e = new Enemy(waveResult, this.path[0].x - 40, this.path[0].y, diff);
      if (this.timeSlowTimer > 0) e.speed *= 0.5;
      if (this.currentLevel?.enemySlow && this.currentLevel.enemySlow !== 1) e.speed *= this.currentLevel.enemySlow;
      this.enemies.push(e);
    } else if (waveResult?.levelComplete) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      this._onLevelComplete();
    } else if (waveResult?.waveCleared) {
      this.money = Math.min(this.money + waveResult.bonus, MAX_MONEY);
      // Wave 5 achievement
      if (this.waveManager.wave >= 5) this._grantAchievement('wave5');
      this._updateButtons();
    }

    // Mine passive income
    for (const mine of this.mines) {
      const gold = mine.update();
      if (gold > 0) { this.money = Math.min(this.money + gold, MAX_MONEY); this._updateButtons(); }
    }

    // Animated workers walk to mines and bring back gold
    for (const w of this.workerUnits) {
      const delivered = w.update();
      if (delivered > 0) {
        // Gem upgrade: Expert Miners doubles worker gold income
        const amount = (this.gemMinerDouble ? delivered * 2 : delivered);
        this.money = Math.min(this.money + amount, MAX_MONEY);
        this._updateButtons();
      }
    }

    // Achievement checks
    if (this.mines.length >= 3) this._grantAchievement('miner');
    if (this.traps.length >= 5) this._grantAchievement('fortified');

    if (this.waveManager.inBreak) return;

    for (const e of this.enemies) e.update(this.path, this.towers, this.projectiles, this.traps, this.soldiers);

    for (const e of this.enemies) {
      if (!e.atGate && e.hasReachedEnd(this.path)) {
        e.atGate = true;
        e.x = Math.min(e.x, this.canvas.width - 28);
        e.gateAttackTimer = 10 + Math.floor(Math.random() * 20);
      }
    }
    for (const e of this.enemies) {
      if (e.atGate) {
        // Castle Shield blocks all damage!
        if (this.shieldTimer <= 0) {
          this.castleHp -= e.castleDamage / 60;
          if (this.castleHp <= 0) { this.castleHp = 0; this.gameOver = true; }
        }
      }
    }

    for (const t of this.towers) {
      // In 3D view the viewTower handles its own cooldown but still auto-fires other towers
      if (t === this.selectedTower || t === this.viewTower) { if (t.manualCooldown > 0) t.manualCooldown--; continue; }
      // Tower Rage: temporarily halve fire rate (fires 2x as fast)
      if (this.rageTimer > 0) {
        const savedRate = t._savedFireRate || t.fireRate;
        t._savedFireRate = savedRate;
        t.fireRate = Math.max(1, Math.floor(savedRate / 2));
      } else if (t._savedFireRate) {
        t.fireRate = t._savedFireRate; // restore original fire rate when rage ends
        t._savedFireRate = null;
      }
      t.update(this.enemies, this.projectiles);
    }

    // Castle archer
    if (this.castleArcher.cooldown > 0) this.castleArcher.cooldown--;
    if (this.castleArcher.fireTimer  > 0) this.castleArcher.fireTimer--;
    const ca = this.castleArcher;
    const archerTarget = this.enemies
      .filter(e => distance({ x: ca.x, y: ca.y }, e) < 220)
      .sort((a, b) => (b.atGate ? 999 : b.waypoint) - (a.atGate ? 999 : a.waypoint))[0];
    if (archerTarget && ca.cooldown <= 0) {
      const dx = archerTarget.x - ca.x, dy = archerTarget.y - ca.y, d = Math.hypot(dx, dy);
      ca.angle = Math.atan2(dy, dx);
      this.projectiles.push(new Projectile({ x: ca.x, y: ca.y, vx: (dx/d)*8, vy: (dy/d)*8, damage: 2, arrow: true, manual: true }));
      ca.cooldown = 50; ca.fireTimer = 10;
    }

    for (const p of this.projectiles) p.update(this.enemies, this.towers);
    this.projectiles = this.projectiles.filter(p => !p.isDead());

    for (const trap of this.traps) trap.update(this.enemies);

    // Camps spawn soldiers — each camp type spawns soldiers with different stats
    for (const camp of this.camps) {
      // Rapid Training upgrade makes camps spawn 2x faster
      const effectiveRate = this.rapidSpawnActive ? Math.floor(camp.spawnRate / 2) : camp.spawnRate;
      camp.spawnTimer++;
      if (camp.spawnTimer >= effectiveRate) {
        camp.spawnTimer = 0;
        if (true) { // unlimited soldiers on all levels
          const pathEnd = this.path[this.path.length - 1];
          // Pass the camp's config AND its name so the soldier looks right
          const sol = new Soldier(
            pathEnd.x - 30 + Math.random()*20,
            pathEnd.y - 10 + Math.random()*20,
            camp.campType,  // stats (hp, dmg, ranged, magic, aoe flags)
            camp.typeName   // name so draw() knows which style to use
          );
          // Level 100: Final Stand soldiers are elite warriors (strong but not godlike)
          if (this.currentLevel?.id === 100) {
            sol.hp     *= 8;
            sol.maxHp  *= 8;
            sol.damage *= 7;
            sol.speed  *= 1.5;
          }
          // Swift Soldiers upgrade
          if (this.swiftSoldiers) sol.speed *= 1.5;
          // Gem upgrade: Elite Army — soldiers deal 2x damage
          if (this.gemSoldierDmg) sol.damage *= 2;
          sol.waypoint = this.path.length - 1;
          this.soldiers.push(sol);
        }
      }
    }
    // Soldiers fight
    for (const s of this.soldiers) s.update(this.enemies, this.path, this.projectiles);
    this.soldiers = this.soldiers.filter(s => !s.isDead());

    // Final level only: soldiers at waypoint 0 attack the enemy camp → titan boss
    if (this.currentLevel?.id === 100 && !this.titanSpawned) {
      for (const s of this.soldiers) {
        if (s.waypoint === 0 && s.attackTimer === 0 && this.enemyCampHp > 1) {
          this.enemyCampHp -= s.damage;
          s.attackTimer = s.attackRate;
          s.swingTimer = 14;
        }
      }
      if (this.enemyCampHp < 1) this.enemyCampHp = 1;

      // Camp HP hit 1 → trigger cutscene
      if (this.enemyCampHp <= 1 && this.cutscenePhase === 0) {
        this.cutscenePhase = 1;
        this.cutsceneTimer = 240;
        this.paused = true;
      }
    }
    // Cutscene countdown (final level only)
    if (this.currentLevel?.id === 100 && this.cutscenePhase > 0) {
      this.cutsceneTimer--;
      // Init actors when phase 2 first starts
      if (this.cutscenePhase === 1 && this.cutsceneTimer === 120 && this._cutsceneActors.length === 0) {
        const W = this.canvas.width, H = this.canvas.height;
        const cx = W / 2, cy = H * 0.65;
        // Spawn 10 soldiers near the titan's torso area
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const dist  = 60 + Math.random() * 40;
          this._cutsceneActors.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist * 0.4,
            vx: Math.cos(angle) * (3 + Math.random() * 4) * (Math.random() < 0.5 ? 1.5 : 1),
            vy: -4 - Math.random() * 5,
            kind: i < 4 ? 'weak' : 'strong',   // weak ones die, strong ones survive hurt
            alpha: 1,
            dead: false,
            bounced: false,
            hp: i < 4 ? 1 : 3,
          });
        }
      }
      // Tick actor physics
      for (const a of this._cutsceneActors) {
        if (a.dead) continue;
        a.x  += a.vx;
        a.y  += a.vy;
        a.vy += 0.35;  // gravity
        a.vx *= 0.98;  // air drag
        const floorY = this.canvas.height * 0.88;
        if (a.y >= floorY && !a.bounced) {
          a.bounced = true;
          if (a.kind === 'weak') {
            a.dead = true; // weak ones die on impact
          } else {
            a.vy = -a.vy * 0.3; // strong ones bounce a little
            a.hp--;
            if (a.hp <= 0) a.dead = true;
          }
        }
        if (a.kind === 'weak') a.alpha -= 0.015;
        if (a.alpha <= 0) a.dead = true;
      }
      if (this.cutscenePhase === 1 && this.cutsceneTimer <= 120) this.cutscenePhase = 2;
      if (this.cutscenePhase === 2 && this.cutsceneTimer <= 0) {
        this.cutscenePhase = 3;
        this.titanSpawned = true;
        this.paused = false;
        const diff = this.currentLevel.difficulty;
        const titan = new Enemy('titan', this.path[0].x - 40, this.path[0].y, diff);
        titan.isTitan = true;
        this.enemies.push(titan);
        this.flash('⚡ THE TITAN HAS AWAKENED! ⚡');
        this.cutscenePhase = 0;
      }
    }

    // Check soldier count achievements
    if (this.soldiers.length >= 5)  this._grantAchievement('soldier5');
    if (this.soldiers.length >= 15) this._grantAchievement('soldier15');
    // Check camp count achievement
    if (this.camps.length >= 5) this._grantAchievement('camp5');

    for (const t of this.towers) {
      for (const e of this.enemies) {
        if (distance(t, e) < 55) {
          let dmg = e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.015;
          // Tower Armor upgrade: towers take 50% less damage
          if (this.armorActive) dmg *= 0.5;
          t.takeDamage(dmg);
          e.triggerAttack(t.x, t.y);
        }
      }
    }
    this.towers = this.towers.filter(t => {
      if (t.isDead()) { if (t === this.selectedTower) this.selectedTower = null; return false; }
      return true;
    });

    for (const trap of this.traps) {
      if (trap.typeKey === 'wall' || trap.typeKey === 'barricade') {
        for (const e of this.enemies) {
          const hitDist = trap.typeKey === 'barricade' ? 28 : 50;
          if (distance(trap, e) < hitDist) {
            trap.takeDamage(e.kind === 'dragonRider' ? 0.08 : e.kind === 'dragon' ? 0.05 : 0.02);
            e.triggerAttack(trap.x, trap.y);
          }
        }
      }
    }
    this.traps = this.traps.filter(t => !t.isDead());

    // Apply time slow to all enemies that are currently on the field
    if (this.timeSlowTimer > 0) {
      for (const e of this.enemies) {
        if (!e._slowApplied) { e.speed *= 0.5; e._slowApplied = true; }
      }
    } else {
      // Time slow expired — restore speeds
      for (const e of this.enemies) {
        if (e._slowApplied) { e.speed /= 0.5; e._slowApplied = false; }
      }
    }

    const before = this.enemies.length;
    let titanKilled = false;
    this.enemies = this.enemies.filter(e => {
      if (e.isDead()) {
        if (e.kind === 'dragon' || e.kind === 'dragonRider') this._grantAchievement('dragon_slayer');
        if (e.isTitan) titanKilled = true;
        this.score++;
        this.totalKills++;
        const goldEarned = Math.ceil(e.reward * this.goldBonus);
        this.money = Math.min(this.money + goldEarned, MAX_MONEY);
        return false;
      }
      return true;
    });
    // Titan defeated → YOU WIN — the ultimate victory
    if (titanKilled) {
      this.flash('⚡ THE TITAN IS DEFEATED! VICTORY! ⚡');
      setTimeout(() => this._onLevelComplete(), 1200);
    }
    if (this.enemies.length < before) this._updateButtons();

    // Kill count achievements
    if (this.totalKills >= 100) this._grantAchievement('kill100');
    if (this.totalKills >= 500) this._grantAchievement('kill500');
    // Rich achievement
    if (this.money >= 500) this._grantAchievement('rich');
    // All towers achievement — check if all 8 tower types are placed
    const placedTypes = new Set(this.towers.map(t => t.typeKey));
    if (placedTypes.size >= 8) this._grantAchievement('all_towers');
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw() {
    // Special case: wheel open from title screen
    if (this.wheelOpen && !this.currentLevel && !this.gameOver) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this._drawWheel();
      return;
    }
    if (this.titleActive) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.viewMode === '3d') { this._draw3D(); return; }
    if (this.viewMode === '3d-soldier') { this._draw3DSoldier(); return; }

    this.map.draw(this.ctx);
    if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      if (TRAPS[key].onPath !== false) this._drawPathHighlight();
    }
    for (const mine  of this.mines)       mine.draw(this.ctx);
    for (const trap  of this.traps)       trap.draw(this.ctx);
    for (const camp  of this.camps)       camp.draw(this.ctx);
    for (const sol   of this.soldiers)    sol.draw(this.ctx);
    for (const w     of this.workerUnits) w.draw(this.ctx);
    for (const t     of this.towers)      t.draw(this.ctx, t === this.selectedTower, this.mouse);
    this._drawAimLine();
    this._drawCastleArcher();
    for (const e     of this.enemies)     e.draw(this.ctx, this.path);
    for (const p     of this.projectiles) p.draw(this.ctx);

    this._drawCampHpBar();
    this._drawCutscene();
    this._drawHUD();
    this._drawBreakOverlay();
    this._drawStoryBanner();   // cinematic level-start overlay
    this._drawWaveBanner();    // dramatic wave announcement
    this._drawTitanBossBar();  // boss HP bar while Titan is alive
    this._drawFlash();
    this._drawHint();
    this._drawGameOver();
    this._drawLevelComplete();
    // Draw pause overlay
    if (this.paused) this._drawPauseOverlay();
    // Draw help overlay
    if (this.helpOpen) this._drawHelpOverlay();
    // Draw wheel on top if it's open
    if (this.wheelOpen) this._drawWheel();
  }

  // ── Public actions ───────────────────────────────────────────────────────────

  tryPlaceTower(x, y) {
    if (this.towers.length >= 30) { this.flash('Tower limit reached! (30 max)'); return false; }
    if (this.map.isOnPath(x, y))  { this.flash("Can't build on the path!"); return false; }
    if (this.map.isOnFeature(x, y)) { this.flash("Can't place on a tree or rock!"); return false; }
    const type = TYPES[this.selectedType];
    if (this.money < type.cost) { this.flash(`Need $${type.cost} — you have $${this.money}!`); return false; }
    const newTower = new Tower(x, y, this.selectedType);
    // Gem upgrade: Head Start — all placed towers begin at Level 2
    if (this.gemHeadStart && newTower.level < 2) {
      const m2 = UPGRADE_MULT[2];
      newTower.damage   *= m2.damage;
      newTower.range    *= m2.range;
      newTower.fireRate  = Math.floor(newTower.fireRate * m2.fireRate);
      newTower.hp = newTower.maxHp;
      newTower.level = 2;
    }
    // Gem upgrade: Rapid Reload — towers fire 30% faster
    if (this.gemFastFire) newTower.fireRate = Math.floor(newTower.fireRate * 0.7);
    this.towers.push(newTower);
    this.money -= type.cost;
    this.towerPlaceCount++;
    // Tower count achievement
    if (this.towerPlaceCount >= 10) this._grantAchievement('tower10');
    this._updateButtons();
    return true;
  }

  tryPlaceTrap(x, y) {
    if (this.traps.length >= 10) { this.flash('Trap limit reached! (10 max)'); return false; }
    const key = this.selectedType.replace('trap_', '');
    const cfg = TRAPS[key];
    const needsPath = cfg.onPath !== false;
    if (needsPath  && !this.map.isOnPath(x, y)) { this.flash('Traps go on the road!'); return false; }
    if (!needsPath &&  this.map.isOnPath(x, y)) { this.flash("Can't place walls on the path!"); return false; }
    if (!needsPath && this.map.isOnFeature(x, y)) { this.flash("Can't place on a tree or rock!"); return false; }
    if (this.money < cfg.cost) { this.flash(`Need $${cfg.cost} — you have $${this.money}!`); return false; }
    if (this.traps.some(t => Math.hypot(t.x - x, t.y - y) < 24)) { this.flash('Too close to another trap!'); return false; }
    this.traps.push(new Trap(x, y, key));
    this.money -= cfg.cost;
    this._updateButtons();
    return true;
  }

  tryPlaceMine(x, y) {
    if (this.mines.length >= 5)  { this.flash('Mine limit reached! (5 max)'); return; }
    if (this.map.isOnPath(x, y)) { this.flash("Can't place mines on the path!"); return; }
    if (this.map.isOnFeature(x, y)) { this.flash("Can't place on a tree or rock!"); return; }
    if (this.money < MINE.cost)  { this.flash(`Need $${MINE.cost} — you have $${this.money}!`); return; }
    if (this.mines.some(m => Math.hypot(m.x - x, m.y - y) < 28)) { this.flash('Too close to another mine!'); return; }
    this.mines.push(new Mine(x, y));
    this.money -= MINE.cost;
    // Assign idle workers to this new mine
    this._assignWorkers();
    this._updateButtons();
  }

  tryPlaceCamp(x, y) {
    // Enforce camp limit — level 100 gets 20 max, others use campLimit
    const effectiveCampLimit = this.currentLevel?.id === 100 ? 20 : this.campLimit;
    if (this.camps.length >= effectiveCampLimit) {
      this.flash(`Camp limit reached! (${effectiveCampLimit} max)`); return;
    }
    if (this.map.isOnPath(x, y)) { this.flash("Can't place camp on the path!"); return; }
    if (this.map.isOnFeature(x, y)) { this.flash("Too close to a tree or rock!"); return; }

    // Figure out which camp type is selected (selectedType = 'camp_basic', 'camp_archer', etc.)
    const typeName = this.selectedType.replace('camp_', '');
    const campCfg  = CAMP_TYPES[typeName] || CAMP_TYPES.basic;

    if (this.money < campCfg.cost) { this.flash(`Need $${campCfg.cost} for ${campCfg.label}`); return; }
    this.money -= campCfg.cost;
    this.camps.push(new Camp(x, y, typeName));
    this._updateButtons();
    this.flash(`${campCfg.label.replace(/ \$\d+/, '')} placed! Soldiers will spawn!`);
  }

  hireWorker() {
    if (this.workers >= 5)  { this.flash('Max 5 workers already hired!'); return; }
    if (this.money < 35)    { this.flash('Need $35 to hire a worker!'); return; }
    this.workers++;
    this.money -= 35;
    // Spawn animated worker near castle
    const pathEnd = this.path[this.path.length - 1];
    const w = new Worker(pathEnd.x - 60, pathEnd.y + 10, this.mines);
    w.x = pathEnd.x - 60 + (Math.random() - 0.5) * 20;
    w.y = pathEnd.y + 10 + (Math.random() - 0.5) * 20;
    this.workerUnits.push(w);
    this.flash(`Worker hired! (${this.workers}/5) — walks to mines for gold!`);
    this._updateButtons();
  }

  _assignWorkers() {
    // Update all workers' mine lists so they can target new mines
    for (const w of this.workerUnits) {
      w.mines = this.mines;
    }
  }

  trySelectTower(x, y) {
    const clicked = this.towers.find(t => distance(t, { x, y }) < 20);
    if (!clicked) return false;
    if (this.selectedTower === clicked) {
      // Second click on the same tower → enter first-person 3D view
      this._enter3D(clicked);
    } else {
      // First click → select it (shows upgrade panel at bottom, aim line, range ring)
      this.selectedTower = clicked;
      this._updateButtons();
      this.flash('Tower selected! Click again for 3D view • Space=Sell');
    }
    return true;
  }

  // ── 3D view ──────────────────────────────────────────────────────────────────

  _enter3D(tower) {
    this.viewMode  = '3d';
    this.viewTower = tower;
    this.camYaw    = 0;
    this.selectedTower = null;
    this.flash('Click enemies to shoot! Drag to look around. ESC=Exit');
  }

  _exit3D() {
    this.viewMode  = 'flat';
    this.viewTower = null;
    this.camYaw    = 0;
    this._3dDragging = false;
  }

  _enter3DSoldier(soldier) {
    this.viewMode    = '3d-soldier';
    this.viewSoldier = soldier;
    this.camYaw      = 0;
    this.flash('Click=Attack  Right-click=Block  Space=Jump  Drag=Look  ESC=Exit');
  }

  _exit3DSoldier() {
    this.viewMode    = 'flat';
    this.viewSoldier = null;
    this.camYaw      = 0;
    this._3dDragging = false;
  }

  _attack3DSoldier(mx, my) {
    const sol = this.viewSoldier;
    if (sol.attackTimer > 0) { this.flash('Still swinging!'); return; }
    let best = null, bestD = 70;
    for (const e of this.enemies) {
      if (e._3dx == null) continue;
      const d = Math.hypot(mx - e._3dx, my - e._3dy);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      best.takeDamage(sol.damage * 2);
      sol.swingTimer = 14;
      this.flash(best.isDead() ? `KILL! +$${best.reward}` : `HIT! −${sol.damage*2} dmg`);
    } else {
      sol.swingTimer = 14;
      this.flash('Missed!');
    }
    sol.attackTimer = 45;
  }

  _toggleBlock3DSoldier() {
    const sol = this.viewSoldier;
    sol.blocking = !sol.blocking;
    if (sol.blocking) { sol.blockTimer = 300; this.flash('Blocking! Damage reduced 70%'); }
    else { sol.blockTimer = 0; this.flash('Block dropped'); }
  }

  _draw3DSoldier() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const sol = this.viewSoldier;
    // Camera at soldier position, looking toward enemies
    const cx = sol.x, cy = sol.y;
    const jumpCameraY = sol.jumpHeight * 0.5; // camera rises during jump

    const camAng = Math.atan2(this.path[0].y - cy, this.path[0].x - cx) + this.camYaw;
    const cosA = Math.cos(camAng), sinA = Math.sin(camAng);
    const eyeH = 55 + jumpCameraY;
    const horizon = H * 0.42 - jumpCameraY * 0.5;
    const focal = (W / 2) / Math.tan(0.58);

    const proj = (wx, wy, wh = 0) => {
      const dx = wx - cx, dy = wy - cy;
      const fwd = dx * cosA + dy * sinA;
      const side = -dx * sinA + dy * cosA;
      if (fwd < 2) return null;
      return { x: W/2 + (side/fwd)*focal, y: horizon + ((eyeH-wh)/fwd)*focal, fwd, sc: focal/fwd };
    };

    // SKY
    const sg = ctx.createLinearGradient(0, 0, 0, horizon);
    sg.addColorStop(0, '#0d1a2a'); sg.addColorStop(0.5, '#1a3a5a'); sg.addColorStop(1, '#3a4a3a');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon);
    // Distant tree line
    ctx.fillStyle = '#182e12';
    ctx.beginPath(); ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, horizon - 20 + Math.sin(x*0.022)*18 + Math.sin(x*0.058)*9);
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();

    // GROUND
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0, '#4a3018'); gg.addColorStop(0.4, '#3a2410'); gg.addColorStop(1, '#2a1808');
    ctx.fillStyle = gg; ctx.fillRect(0, horizon, W, H - horizon);
    // Ground grid
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (let z = 40; z <= 600; z += 40) {
      const lp = proj(cx+cosA*z-sinA*500, cy+sinA*z+cosA*500);
      const rp = proj(cx+cosA*z+sinA*500, cy+sinA*z-cosA*500);
      if (!lp || !rp) continue;
      ctx.beginPath(); ctx.moveTo(lp.x,lp.y); ctx.lineTo(rp.x,rp.y); ctx.stroke();
    }

    // PATH
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg+1];
      const ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
      const pw = 28, px = Math.cos(ang)*pw, py = Math.sin(ang)*pw;
      for (let t = 0; t < 10; t++) {
        const t0=t/10, t1=(t+1)/10;
        const x0=a.x+(b.x-a.x)*t0, y0=a.y+(b.y-a.y)*t0;
        const x1=a.x+(b.x-a.x)*t1, y1=a.y+(b.y-a.y)*t1;
        const c = [proj(x0-px,y0-py),proj(x0+px,y0+py),proj(x1+px,y1+py),proj(x1-px,y1-py)];
        if (c.some(p=>!p)) continue;
        ctx.fillStyle = (seg+t)%2===0 ? '#7a5520':'#6a4818';
        ctx.beginPath(); ctx.moveTo(c[0].x,c[0].y); ctx.lineTo(c[1].x,c[1].y);
        ctx.lineTo(c[2].x,c[2].y); ctx.lineTo(c[3].x,c[3].y); ctx.closePath(); ctx.fill();
      }
    }

    // FIRES (projected)
    const ft = Date.now()/120;
    for (const f of (this.map.fires || [])) {
      const p = proj(f.x, f.y);
      if (!p || p.x < -50 || p.x > W+50) continue;
      const sz = f.size * p.sc * 2.5;
      if (sz < 1) continue;
      const fl = Math.sin(ft + f.x*0.1)*0.3+0.7;
      ctx.fillStyle = `rgba(255,80,0,${0.4*fl})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, sz*1.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.moveTo(p.x-sz*0.5, p.y); ctx.lineTo(p.x, p.y-sz*1.5); ctx.lineTo(p.x+sz*0.5, p.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.moveTo(p.x-sz*0.25, p.y); ctx.lineTo(p.x, p.y-sz); ctx.lineTo(p.x+sz*0.25, p.y); ctx.closePath(); ctx.fill();
    }

    // OBJECTS: trees, other soldiers, enemies (far to near)
    const objs = [];
    const openB = H * 0.73;
    for (const tr of this.map.trees) {
      const p = proj(tr.x, tr.y);
      if (p && p.x > -100 && p.x < W+100) objs.push({ kind:'tree', p, tr });
    }
    for (const s2 of this.soldiers) {
      if (s2 === sol) continue;
      const p = proj(s2.x, s2.y);
      if (p) objs.push({ kind:'ally', p, s2 });
    }
    for (const e of this.enemies) {
      e._3dx = null;
      const p = proj(e.x, e.y);
      if (p) objs.push({ kind:'enemy', p, e });
    }
    objs.sort((a,b) => b.p.fwd - a.p.fwd);

    for (const obj of objs) {
      const { p } = obj;
      if (obj.kind === 'tree') {
        const sz = obj.tr.r * p.sc;
        const gy = Math.min(p.y, openB);
        ctx.fillStyle = '#2a1a06'; ctx.fillRect(p.x-sz*0.22, gy-sz*2.2, sz*0.44, sz*2.2);
        ctx.fillStyle = '#1e3d18'; ctx.beginPath(); ctx.arc(p.x, gy-sz*2.2, sz, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2e5a24'; ctx.beginPath(); ctx.arc(p.x-sz*0.15, gy-sz*2.5, sz*0.72, 0, Math.PI*2); ctx.fill();
      } else if (obj.kind === 'ally') {
        const { s2 } = obj;
        const sz = 8 * p.sc;
        if (sz < 1) continue;
        const gy = Math.min(p.y, openB);
        const bh = sz * 3;
        ctx.fillStyle = '#334488'; ctx.fillRect(p.x-sz*0.7, gy-bh, sz*1.4, bh);
        ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(p.x, gy-bh-sz*0.7, sz*0.7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(p.x, gy-bh-sz*0.7, sz*0.75, Math.PI, 0); ctx.fill();
        // Ally HP bar
        const bw = Math.max(sz*2,14);
        ctx.fillStyle='#111'; ctx.fillRect(p.x-bw/2, gy-bh-sz*2, bw, 4);
        ctx.fillStyle='#2f8'; ctx.fillRect(p.x-bw/2, gy-bh-sz*2, bw*(s2.hp/s2.maxHp), 4);
      } else if (obj.kind === 'enemy') {
        const { e } = obj;
        const sz = e.size * p.sc * 1.8;
        if (sz < 2) continue;
        const gy = Math.min(p.y, openB);
        const bh = sz * 2.2;
        ctx.fillStyle='rgba(0,0,0,0.3)';
        ctx.save(); ctx.translate(p.x+sz*0.3,gy); ctx.scale(1.1,0.25);
        ctx.beginPath(); ctx.arc(0,0,sz*1.1,0,Math.PI*2); ctx.fill(); ctx.restore();
        ctx.fillStyle='#2a2a2a'; ctx.fillRect(p.x-sz*0.5,gy-bh*0.5,sz*0.38,bh*0.52); ctx.fillRect(p.x+sz*0.12,gy-bh*0.5,sz*0.38,bh*0.52);
        ctx.fillStyle=e.color; ctx.fillRect(p.x-sz*0.72,gy-bh,sz*1.44,bh*0.65);
        ctx.beginPath(); ctx.arc(p.x,gy-bh-sz*0.6,sz*0.65,0,Math.PI*2); ctx.fill();
        const bw=Math.max(sz*2.5,22);
        ctx.fillStyle='#111'; ctx.fillRect(p.x-bw/2-1,gy-bh-sz*1.9-1,bw+2,7);
        ctx.fillStyle=e.hp/e.maxHp>0.5?'#2f2':'#f82';
        ctx.fillRect(p.x-bw/2,gy-bh-sz*1.9,bw*(e.hp/e.maxHp),5);
        e._3dx=p.x; e._3dy=gy-bh/2; e._3dr=Math.max(sz*1.3,20);
      }
    }

    // STONE BATTLEMENT FRAME (same as tower view)
    const openL = W*0.14, openR = W*0.86;
    const drawStone = (x1, x2) => {
      ctx.fillStyle='#4e4e4e'; ctx.fillRect(x1,0,x2-x1,H);
      ctx.fillStyle='#5c5c5c'; ctx.fillRect(x1,0,x2-x1,H);
      ctx.strokeStyle='#383838'; ctx.lineWidth=1;
      for (let row=0; row<H; row+=14) {
        const off=(Math.floor(row/14)%2)*22;
        for (let col=x1-22+off; col<x2+22; col+=44) ctx.strokeRect(col,row,42,13);
      }
    };
    drawStone(0, openL); drawStone(openR, W);
    ctx.fillStyle='#4e4e4e'; ctx.fillRect(0,openB,W,H-openB);
    ctx.fillStyle='#5c5c5c'; ctx.fillRect(0,openB,W,10);
    for (let y=10; y<H*0.55; y+=56) {
      ctx.fillStyle='#4e4e4e';
      ctx.fillRect(openL-14,y,20,32); ctx.fillRect(openR-6,y,20,32);
    }

    // FIRST-PERSON ARMS
    const armY = H * 0.78;
    // Right arm + sword
    const swingAmt = sol.swingTimer > 0 ? Math.sin(sol.swingTimer/14*Math.PI)*40 : 0;
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(W*0.6, armY - 40 - swingAmt, 50, 40); // forearm
    ctx.fillStyle = '#e8b890'; ctx.fillRect(W*0.64, armY - 55 - swingAmt, 28, 18); // hand
    ctx.fillStyle = '#ccc'; ctx.fillRect(W*0.72, armY - 100 - swingAmt, 8, 50); // blade
    ctx.fillStyle = '#884400'; ctx.fillRect(W*0.66, armY - 58 - swingAmt, 24, 6); // guard
    // Left arm + shield (if blocking)
    if (sol.blocking) {
      ctx.fillStyle = '#2255aa'; ctx.fillRect(W*0.32, armY - 50, 50, 50);
      ctx.fillStyle = '#cc8822'; ctx.fillRect(W*0.22, armY - 80, 40, 60);
      ctx.strokeStyle = '#885500'; ctx.lineWidth = 2; ctx.strokeRect(W*0.22, armY - 80, 40, 60);
      ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(W*0.24+20, armY-50, 8, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = '#2255aa'; ctx.fillRect(W*0.32, armY - 40, 50, 40);
      ctx.fillStyle = '#e8b890'; ctx.fillRect(W*0.34, armY - 55, 28, 18);
    }

    // HUD
    const mx2 = W/2, my2 = (horizon+openB)/2;
    ctx.strokeStyle='rgba(255,230,80,0.88)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(mx2-20,my2); ctx.lineTo(mx2-7,my2);
    ctx.moveTo(mx2+7,my2);  ctx.lineTo(mx2+20,my2);
    ctx.moveTo(mx2,my2-20); ctx.lineTo(mx2,my2-7);
    ctx.moveTo(mx2,my2+7);  ctx.lineTo(mx2,my2+20);
    ctx.stroke();
    ctx.strokeStyle='rgba(255,230,80,0.35)';
    ctx.beginPath(); ctx.arc(mx2,my2,14,0,Math.PI*2); ctx.stroke();

    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(openL+6,6,220,68);
    ctx.fillStyle='#2255aa'; ctx.font='bold 14px sans-serif'; ctx.fillText('⚔ SOLDIER', openL+14, 26);
    ctx.fillStyle='#aaa'; ctx.font='11px sans-serif'; ctx.fillText('Click=Attack  Drag=Look  RClick=Block  Space=Jump', openL+14, 44);
    // HP bar
    ctx.fillStyle='#111'; ctx.fillRect(openL+14, 52, 180, 8);
    ctx.fillStyle = sol.hp/sol.maxHp > 0.5 ? '#2f8' : '#f82';
    ctx.fillRect(openL+14, 52, 180*(sol.hp/sol.maxHp), 8);
    ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.fillText(`HP: ${Math.ceil(sol.hp)}/${sol.maxHp}${sol.blocking?' 🛡 BLOCKING':''}`, openL+14, 68);

    // Exit button
    ctx.fillStyle='#8a0000'; ctx.fillRect(openR-90,6,84,30);
    ctx.fillStyle='#cc2222'; ctx.fillRect(openR-90,6,84,3);
    ctx.fillStyle='#fff'; ctx.font='bold 14px sans-serif'; ctx.fillText('✕  EXIT', openR-76, 26);

    // Enemies/wave
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(openL+6,openB-26,200,22);
    ctx.fillStyle='#fff'; ctx.font='12px sans-serif';
    ctx.fillText(`Enemies: ${this.enemies.length}   Wave: ${this.waveManager.wave}/${this.waveManager.levelDef?.waves ?? '?'}`, openL+12, openB-10);

    // Flash
    if (this.flashTimer > 0) {
      const fp = this.flashTimer/90;
      ctx.fillStyle=`rgba(0,0,0,${fp*0.55})`; ctx.fillRect(W/2-140,openB-54,280,26);
      ctx.fillStyle=`rgba(255,240,80,${fp})`; ctx.font='bold 15px sans-serif'; ctx.textAlign='center';
      ctx.fillText(this.flashMsg, W/2, openB-36); ctx.textAlign='left';
    }
  }

  _shoot3D(mx, my) {
    const tower = this.viewTower;
    if (tower.manualCooldown > 0) { this.flash('Still reloading!'); return; }
    // Find enemy closest to click in screen space (uses coords stored by _draw3D)
    let best = null, bestD = 60;
    for (const e of this.enemies) {
      if (e._3dx == null) continue;
      const d = Math.hypot(mx - e._3dx, my - e._3dy);
      if (d < bestD) { bestD = d; best = e; }
    }
    const dmg = tower.damage * 4;
    if (best) {
      // Apply the tower's elemental effect — same behaviour as auto-fire in Tower.js
      if (tower.typeKey === 'fire') {
        // 🔥 Fire: burn + splash damage to nearby enemies
        best.takeDamage(dmg);
        best.burnTimer = 180;
        for (const e of this.enemies)
          if (Math.hypot(e.x - best.x, e.y - best.y) < 45) e.takeDamage(dmg * 0.5);
        this.flash(best.isDead() ? `KILL! 🔥 +$${best.reward}` : `HIT! 🔥 BURNING!`);
      } else if (tower.typeKey === 'ice') {
        // ❄️ Ice: freeze the enemy in place for ~2.5 seconds
        best.takeDamage(dmg);
        best.slowTimer = 150;
        this.flash(best.isDead() ? `KILL! ❄️ +$${best.reward}` : `HIT! ❄️ FROZEN!`);
      } else if (tower.typeKey === 'lightning') {
        // ⚡ Lightning: shock + chain to 2 nearest other enemies
        best.takeDamage(dmg);
        best.shockTimer = 40;
        const others = this.enemies
          .filter(e => e !== best)
          .sort((a, b) => Math.hypot(a.x - best.x, a.y - best.y) - Math.hypot(b.x - best.x, b.y - best.y))
          .slice(0, 2);
        for (const e of others) {
          if (Math.hypot(e.x - best.x, e.y - best.y) < 120) {
            e.takeDamage(dmg * 0.5);
            e.shockTimer = 40;
          }
        }
        this.flash(best.isDead() ? `KILL! ⚡ +$${best.reward}` : `HIT! ⚡ CHAINED!`);
      } else if (tower.typeKey === 'earth') {
        // 🪨 Earth: stun the enemy for ~1.7 seconds
        best.takeDamage(dmg);
        best.stunTimer = 100;
        this.flash(best.isDead() ? `KILL! 🪨 +$${best.reward}` : `HIT! 🪨 STUNNED!`);
      } else if (tower.typeKey === 'rapid') {
        // 🏹 Crossbow burst: hit the 3 closest enemies with 1 arrow each
        // (don't pre-hit best — let the loop handle all targets including best)
        const targets = [best, ...this.enemies
          .filter(e => e !== best && e._3dx != null)
          .sort((a, b) => Math.hypot(a._3dx - mx, a._3dy - my) - Math.hypot(b._3dx - mx, b._3dy - my))
          .slice(0, 2)];
        let kills = 0;
        for (const t of targets) { t.takeDamage(dmg); if (t.isDead()) kills++; }
        const n = targets.length;
        this.flash(kills > 0 ? `BURST! 🏹 ${kills} KILL${kills>1?'S':''}!` : `BURST! 🏹 ${n} ARROW${n>1?'S':''}!`);
      } else {
        best.takeDamage(dmg);
        this.flash(best.isDead() ? `KILL! +$${best.reward}` : `HIT! −${dmg} dmg`);
      }
    } else {
      this.flash('Missed!');
    }
    tower.manualCooldown = tower.fireRate * 2;
  }

  _draw3D() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const tower = this.viewTower;
    const cx = tower.x, cy = tower.y;

    // Camera: faces the enemy spawn side, offset by player drag yaw
    const camAng = Math.atan2(this.path[0].y - cy, this.path[0].x - cx) + this.camYaw;
    const cosA = Math.cos(camAng), sinA = Math.sin(camAng);
    const eyeH = 85, horizon = H * 0.38;
    const focal = (W / 2) / Math.tan(0.58); // ~66° FoV

    // Project ground point (wx,wy) → screen {x,y,fwd,sc}
    const proj = (wx, wy) => {
      const dx = wx - cx, dy = wy - cy;
      const fwd  = dx * cosA + dy * sinA;
      const side = -dx * sinA + dy * cosA;
      if (fwd < 2) return null;
      return { x: W/2 + (side/fwd)*focal, y: horizon + (eyeH/fwd)*focal, fwd, sc: focal/fwd };
    };

    // ── PRECOMPUTE grass tufts lazily ──
    if (!this._grassTufts) {
      this._grassTufts = [];
      const rng = (seed) => { let x = Math.sin(seed) * 43758.5453; return x - Math.floor(x); };
      for (let i = 0; i < 260; i++) {
        this._grassTufts.push({
          wx: cx + (rng(i*3.1)-0.5)*700,
          wy: cy + (rng(i*3.7)-0.5)*700,
          s:  0.6 + rng(i*1.3)*0.8,
        });
      }
    }
    if (!this._dustParticles) {
      this._dustParticles = [];
      const rng2 = (s) => { let x = Math.sin(s*7.3+1.9)*99871.23; return x - Math.floor(x); };
      for (let i = 0; i < 40; i++) {
        this._dustParticles.push({
          wx: cx + (rng2(i*2.1)-0.5)*500,
          wy: cy + (rng2(i*2.9)-0.5)*500,
          r:  1 + rng2(i)*2,
          sp: 0.3 + rng2(i*1.7)*0.7,
          ph: rng2(i*3.3)*Math.PI*2,
        });
      }
    }

    const now = Date.now();

    // ── SKY — rich deep gradient ──
    const sg = ctx.createLinearGradient(0, 0, 0, horizon);
    sg.addColorStop(0,   '#06101e');
    sg.addColorStop(0.3, '#0d2240');
    sg.addColorStop(0.7, '#1a4a7a');
    sg.addColorStop(0.9, '#2e6a9e');
    sg.addColorStop(1,   '#7ab8d8');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon);

    // ── SUN ──
    const sunX = W * 0.5 + Math.sin(this.camYaw) * W * 0.42;
    const sunY = horizon * 0.28;
    if (sunX > -120 && sunX < W + 120) {
      ctx.save();
      // Outer soft glow
      const sunOuter = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 110);
      sunOuter.addColorStop(0,   'rgba(255,240,160,0.55)');
      sunOuter.addColorStop(0.4, 'rgba(255,200,80,0.18)');
      sunOuter.addColorStop(1,   'rgba(255,200,80,0)');
      ctx.fillStyle = sunOuter;
      ctx.beginPath(); ctx.arc(sunX, sunY, 110, 0, Math.PI*2); ctx.fill();
      // Inner corona
      const sunInner = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 26);
      sunInner.addColorStop(0,   '#ffffff');
      sunInner.addColorStop(0.5, '#fffde0');
      sunInner.addColorStop(1,   '#ffe066');
      ctx.fillStyle = sunInner;
      ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, Math.PI*2); ctx.fill();
      // God rays — 12 semi-transparent lines
      for (let r = 0; r < 12; r++) {
        const ang = (r / 12) * Math.PI * 2 + now * 0.00004;
        const len = 180 + Math.sin(now*0.0002 + r) * 40;
        const op  = 0.04 + 0.06 * Math.sin(now*0.0003 + r*0.9);
        ctx.strokeStyle = `rgba(255,245,200,${op})`;
        ctx.lineWidth = 18 + r * 3;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(ang)*len, sunY + Math.sin(ang)*len);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── CLOUDS — 7 procedural overlapping ellipse clusters ──
    const cloudOff = (now / 40000) % 1;
    const cloudDefs = [
      { bx:0.08, by:0.18, blobs:[{dx:0,dy:0,rx:80,ry:22},{dx:55,dy:8,rx:60,ry:18},{dx:-40,dy:12,rx:50,ry:16}] },
      { bx:0.26, by:0.10, blobs:[{dx:0,dy:0,rx:70,ry:20},{dx:45,dy:6,rx:55,ry:17},{dx:-35,dy:9,rx:48,ry:15}] },
      { bx:0.44, by:0.22, blobs:[{dx:0,dy:0,rx:90,ry:25},{dx:60,dy:10,rx:65,ry:19},{dx:-50,dy:14,rx:55,ry:17}] },
      { bx:0.60, by:0.12, blobs:[{dx:0,dy:0,rx:75,ry:21},{dx:50,dy:7,rx:58,ry:16}] },
      { bx:0.74, by:0.20, blobs:[{dx:0,dy:0,rx:85,ry:23},{dx:55,dy:11,rx:62,ry:18},{dx:-42,dy:13,rx:52,ry:16}] },
      { bx:0.88, by:0.14, blobs:[{dx:0,dy:0,rx:68,ry:19},{dx:44,dy:8,rx:50,ry:15}] },
      { bx:0.16, by:0.32, blobs:[{dx:0,dy:0,rx:100,ry:28},{dx:70,dy:12,rx:72,ry:22},{dx:-55,dy:15,rx:60,ry:19}] },
    ];
    for (const cd of cloudDefs) {
      const bx = ((cd.bx + cloudOff) % 1) * W;
      const by = cd.by * horizon;
      for (const bl of cd.blobs) {
        const cx2 = bx + bl.dx, cy2 = by + bl.dy;
        const cg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, bl.rx);
        cg.addColorStop(0,   'rgba(255,255,255,0.78)');
        cg.addColorStop(0.5, 'rgba(235,245,255,0.38)');
        cg.addColorStop(1,   'rgba(220,235,255,0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(cx2, cy2, bl.rx, bl.ry, 0, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // ── HORIZON HAZE ──
    const hazeG = ctx.createLinearGradient(0, horizon - 22, 0, horizon + 8);
    hazeG.addColorStop(0,   'rgba(255,160,80,0)');
    hazeG.addColorStop(0.4, 'rgba(255,140,60,0.22)');
    hazeG.addColorStop(1,   'rgba(200,100,40,0)');
    ctx.fillStyle = hazeG;
    ctx.fillRect(0, horizon - 22, W, 30);

    // ── TREE-LINE SILHOUETTE ──
    ctx.save();
    ctx.fillStyle = '#1a3a12';
    ctx.beginPath(); ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 10)
      ctx.lineTo(x, horizon - 28 + Math.sin(x*0.021)*22 + Math.sin(x*0.057)*11 + Math.sin(x*0.133)*6);
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();
    ctx.restore();

    // ── GROUND base gradient — matches 2D grass color (#4a7c4e) ──
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0,    '#3a6030');
    gg.addColorStop(0.10, '#426836');
    gg.addColorStop(0.35, '#4a7c4e');
    gg.addColorStop(0.65, '#437040');
    gg.addColorStop(1,    '#365a30');
    ctx.fillStyle = gg; ctx.fillRect(0, horizon, W, H - horizon);

    // ── GRASS TUFTS — slightly darker than ground for contrast ──
    for (const gt of this._grassTufts) {
      const gp = proj(gt.wx, gt.wy);
      if (!gp || gp.x < -10 || gp.x > W+10) continue;
      const gs = gt.s * gp.sc * 1.4;
      if (gs < 0.5) continue;
      ctx.fillStyle = 'rgba(25,55,15,0.55)';
      ctx.beginPath();
      ctx.ellipse(gp.x, gp.y, gs*1.8, gs*0.55, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // ── DUST PARTICLES ──
    for (const dp of this._dustParticles) {
      const t2 = now * 0.0002 * dp.sp + dp.ph;
      const wxd = dp.wx + Math.cos(t2)*18;
      const wyd = dp.wy + Math.sin(t2*0.7)*12;
      const pp = proj(wxd, wyd);
      if (!pp || pp.x < 0 || pp.x > W) continue;
      const ds = dp.r * pp.sc * 2;
      if (ds < 0.3) continue;
      ctx.fillStyle = `rgba(255,255,240,${0.15 + 0.12*Math.sin(t2)})`;
      ctx.beginPath(); ctx.arc(pp.x, pp.y, ds, 0, Math.PI*2); ctx.fill();
    }

    // ── CRATERS ──
    for (const cr of (this.map.craters || [])) {
      const p = proj(cr.x, cr.y);
      if (!p || p.fwd < 5 || p.x < -80 || p.x > W+80) continue;
      const rw = cr.r * p.sc * 2.5, rh = rw * 0.35;
      const crG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rw);
      crG.addColorStop(0,   'rgba(8,4,0,0.7)');
      crG.addColorStop(0.6, 'rgba(15,8,0,0.45)');
      crG.addColorStop(1,   'rgba(15,8,0,0)');
      ctx.fillStyle = crG;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rw, rh, 0, 0, Math.PI*2); ctx.fill();
    }

    // ── PATH — multi-stop gradient quads with ruts ──
    for (let seg = 0; seg < this.path.length - 1; seg++) {
      const a = this.path[seg], b = this.path[seg+1];
      const ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
      const pw = 28, ppx = Math.cos(ang)*pw, ppy = Math.sin(ang)*pw;
      for (let t = 0; t < 10; t++) {
        const t0=t/10, t1=(t+1)/10;
        const x0=a.x+(b.x-a.x)*t0, y0=a.y+(b.y-a.y)*t0;
        const x1=a.x+(b.x-a.x)*t1, y1=a.y+(b.y-a.y)*t1;
        const c = [proj(x0-ppx,y0-ppy), proj(x0+ppx,y0+ppy), proj(x1+ppx,y1+ppy), proj(x1-ppx,y1-ppy)];
        if (c.some(pp => !pp)) continue;
        // Path gradient: lighter center, darker worn edges
        const midX = (c[0].x+c[1].x+c[2].x+c[3].x)/4;
        const midY = (c[0].y+c[1].y+c[2].y+c[3].y)/4;
        const pathG = ctx.createLinearGradient(c[0].x, midY, c[1].x, midY);
        pathG.addColorStop(0,   '#4a2e0a');
        pathG.addColorStop(0.2, '#7a5520');
        pathG.addColorStop(0.5, '#9a6c2a');
        pathG.addColorStop(0.8, '#7a5520');
        pathG.addColorStop(1,   '#4a2e0a');
        ctx.fillStyle = pathG;
        ctx.beginPath();
        ctx.moveTo(c[0].x,c[0].y); ctx.lineTo(c[1].x,c[1].y);
        ctx.lineTo(c[2].x,c[2].y); ctx.lineTo(c[3].x,c[3].y);
        ctx.closePath(); ctx.fill();
        // AO edge: dark seam where path meets grass
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c[0].x,c[0].y); ctx.lineTo(c[3].x,c[3].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c[1].x,c[1].y); ctx.lineTo(c[2].x,c[2].y); ctx.stroke();
      }
      // Rut grooves along path center
      for (let t = 0; t < 20; t++) {
        const tf = t/20, tf1=(t+1)/20;
        const rx0=a.x+(b.x-a.x)*tf, ry0=a.y+(b.y-a.y)*tf;
        const rx1=a.x+(b.x-a.x)*tf1, ry1=a.y+(b.y-a.y)*tf1;
        const off = 8;
        for (const side of [-1, 1]) {
          const pr0 = proj(rx0+Math.cos(ang)*off*side, ry0+Math.sin(ang)*off*side);
          const pr1 = proj(rx1+Math.cos(ang)*off*side, ry1+Math.sin(ang)*off*side);
          if (!pr0 || !pr1) continue;
          ctx.strokeStyle = 'rgba(30,12,0,0.18)'; ctx.lineWidth = Math.max(1, pr0.sc*3);
          ctx.beginPath(); ctx.moveTo(pr0.x, pr0.y); ctx.lineTo(pr1.x, pr1.y); ctx.stroke();
        }
      }
    }

    // ── TREES + ENEMIES (sorted far→near) ──
    const objs = [];
    for (const tr of this.map.trees) {
      const p = proj(tr.x, tr.y);
      if (p && p.x > -100 && p.x < W+100) objs.push({ kind:'tree', p, tr });
    }
    for (const e of this.enemies) {
      e._3dx = null; // reset each frame
      const p = proj(e.x, e.y);
      if (p) objs.push({ kind:'enemy', p, e });
    }
    // Also add fire positions to the sort list
    for (const f of (this.map.fires || [])) {
      const p = proj(f.x, f.y);
      if (p && p.x > -50 && p.x < W+50) objs.push({ kind:'fire', p, f });
    }
    objs.sort((a,b) => b.p.fwd - a.p.fwd);

    const openB = H * 0.73; // bottom of viewport opening
    const ft3d = Date.now() / 120; // time variable for fire flicker animation
    for (const obj of objs) {
      const { p } = obj;
      if (obj.kind === 'tree') {
        const sz = obj.tr.r * p.sc;
        const gy = Math.min(p.y, openB);
        // Trunk gradient
        const trunkG = ctx.createLinearGradient(p.x-sz*0.22, 0, p.x+sz*0.22, 0);
        trunkG.addColorStop(0, '#1a0e04');
        trunkG.addColorStop(0.4, '#3a2a0e');
        trunkG.addColorStop(1, '#140a02');
        ctx.fillStyle = trunkG;
        ctx.fillRect(p.x - sz*0.22, gy - sz*2.2, sz*0.44, sz*2.2);
        // Lower foliage (darker)
        const fg1 = ctx.createRadialGradient(p.x-sz*0.2, gy-sz*2.4, 0, p.x, gy-sz*2.2, sz);
        fg1.addColorStop(0, '#3a6a28'); fg1.addColorStop(1, '#152010');
        ctx.fillStyle = fg1;
        ctx.beginPath(); ctx.arc(p.x, gy - sz*2.2, sz, 0, Math.PI*2); ctx.fill();
        // Upper foliage (lighter sun-hit)
        const fg2 = ctx.createRadialGradient(p.x-sz*0.2, gy-sz*2.7, 0, p.x-sz*0.15, gy-sz*2.5, sz*0.72);
        fg2.addColorStop(0, '#5a9040'); fg2.addColorStop(1, '#1e3812');
        ctx.fillStyle = fg2;
        ctx.beginPath(); ctx.arc(p.x - sz*0.15, gy - sz*2.5, sz*0.72, 0, Math.PI*2); ctx.fill();
        // Exponential fog
        if (p.fwd > 60) {
          const fogA = Math.min(0.75, 1 - Math.exp(-p.fwd / 300));
          ctx.fillStyle = `rgba(78,95,72,${fogA})`;
          const gy2 = Math.min(p.y, openB);
          ctx.beginPath(); ctx.arc(p.x, gy2 - sz*2.2, sz * 1.1, 0, Math.PI*2); ctx.fill();
        }
      } else if (obj.kind === 'fire') {
        // Fire particles — flickering orange triangles
        const { f } = obj;
        const sz = f.size * p.sc * 2.5;
        if (sz < 1) continue;
        const fl = Math.sin(ft3d + f.x*0.1) * 0.3 + 0.7;
        // Glow halo
        ctx.fillStyle = `rgba(255,80,0,${0.35*fl})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, sz*1.8, 0, Math.PI*2); ctx.fill();
        // Bright orange triangle (main flame)
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(p.x - sz*0.5, p.y);
        ctx.lineTo(p.x, p.y - sz*(1.5 + fl*0.5));
        ctx.lineTo(p.x + sz*0.5, p.y);
        ctx.closePath(); ctx.fill();
        // Yellow inner flame
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(p.x - sz*0.25, p.y);
        ctx.lineTo(p.x, p.y - sz*(1.0 + fl*0.3));
        ctx.lineTo(p.x + sz*0.25, p.y);
        ctx.closePath(); ctx.fill();
      } else {
        const { e } = obj;
        // Scale: ogre and dragon are bigger
        const sizeScale = e.kind === 'ogre' ? 1.7
                        : (e.kind === 'dragon' || e.kind === 'dragonRider') ? 1.3
                        : 1.0;
        const sz = e.size * p.sc * 1.4 * sizeScale;
        if (sz < 2) continue;
        const gy = Math.min(p.y, openB);
        const bh = sz * 2.2; // used for fog rect + click hitbox

        // ── Cast shadow ────────────────────────────────────────────────────
        ctx.save();
        const shadowScale = Math.max(0.6, Math.min(2.2, 200 / p.fwd));
        const shadowG = ctx.createRadialGradient(p.x+sz*0.4, gy, 0, p.x+sz*0.4, gy, sz*1.5*shadowScale);
        shadowG.addColorStop(0,   'rgba(0,0,0,0.45)');
        shadowG.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = shadowG;
        ctx.save(); ctx.translate(p.x + sz*0.4, gy); ctx.scale(1.4*shadowScale, 0.25*shadowScale);
        ctx.beginPath(); ctx.arc(0, 0, sz*1.3, 0, Math.PI*2); ctx.fill(); ctx.restore();
        // AO circle at feet
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.ellipse(p.x, gy, sz*0.7, sz*0.18, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // ── Billboard: render 2D Enemy.draw() at 3D screen-space coords ──────
        // This gives the 3D view the same character art as 2D mode.
        // We temporarily override e.x/y/size to screen coords, call e.draw(),
        // then restore — a classic billboard sprite trick.
        {

        // Save real world coords
        const savedX3d = e.x, savedY3d = e.y, savedSz3d = e.size;

        // Set screen-space coords so the 2D draw lands at the right 3D position.
        // Each type has a different "feet offset" — how far below e.y the feet land.
        //   Knight types (goblin/runner/ogre/basic):  cy + 2.12*s  (from _drawKnight math)
        //   Saboteur:                                 cy + 1.91*s  (from _drawSaboteur math)
        //   Dragon:                                   cy + 1.48*s  (legs bottom: s*0.5+s*0.5+s*0.36+s*0.12)
        const isDrag = e.kind === 'dragon' || e.kind === 'dragonRider';
        const isSab  = e.kind === 'saboteur';
        const feetF  = isDrag ? 1.48 : isSab ? 1.91 : 2.12;

        e.size = sz;
        e.x    = p.x;
        e.y    = gy - feetF * sz;   // feet land at gy

        // Fake path so enemy faces right — gives a natural walking pose
        const fpLen3d = Math.max(2, (e.waypoint ?? 1) + 2);
        const fp3d = [];
        for (let fi = 0; fi < fpLen3d; fi++) fp3d.push({ x: e.x + 1000, y: e.y });

        e.draw(ctx, fp3d);   // ← draws body + status effects + HP bar, all in screen space

        // Restore world coords
        e.x = savedX3d; e.y = savedY3d; e.size = savedSz3d;
        } // end billboard block

        // Store for _shoot3D click detection (no fog on sprite — let the 2D art show clearly)
        e._3dx = p.x; e._3dy = gy - bh/2; e._3dr = Math.max(sz*1.3, 20);
      }
    }

    // ── CASTLE WALL (projected 3D wall at path end) ──
    const pathEnd = this.path[this.path.length - 1];
    const wallP = proj(pathEnd.x, pathEnd.y);
    if (wallP && wallP.x > -200 && wallP.x < W + 200) {
      const wallW = 80 * wallP.sc, wallH = 120 * wallP.sc;
      const wx = wallP.x - wallW / 2, wy = wallP.y - wallH;

      // Top-face trapezoid for 3D depth
      ctx.save();
      const topFaceG = ctx.createLinearGradient(wx, wy-wallH*0.12, wx, wy);
      topFaceG.addColorStop(0, '#9a9590');
      topFaceG.addColorStop(1, '#6a6560');
      ctx.fillStyle = topFaceG;
      ctx.beginPath();
      ctx.moveTo(wx - wallW*0.06, wy);
      ctx.lineTo(wx + wallW*1.06, wy);
      ctx.lineTo(wx + wallW*0.96, wy - wallH*0.12);
      ctx.lineTo(wx + wallW*0.04, wy - wallH*0.12);
      ctx.closePath(); ctx.fill();
      ctx.restore();

      // Front face gradient (top light → bottom dark)
      const wallFG = ctx.createLinearGradient(wx, wy, wx, wy+wallH);
      wallFG.addColorStop(0,   '#7a7570');
      wallFG.addColorStop(0.3, '#606060');
      wallFG.addColorStop(1,   '#3a3535');
      ctx.fillStyle = wallFG;
      ctx.fillRect(wx, wy, wallW, wallH);

      // Stone block mortar lines
      const brickH = wallH / 7, brickW = wallW / 4;
      for (let row = 0; row < 8; row++) {
        const ry = wy + row * brickH;
        // Horizontal mortar
        ctx.strokeStyle = 'rgba(20,18,16,0.5)'; ctx.lineWidth = Math.max(1, wallP.sc*1.5);
        ctx.beginPath(); ctx.moveTo(wx, ry); ctx.lineTo(wx+wallW, ry); ctx.stroke();
        // Vertical mortar (offset every other row)
        const off = (row % 2) * brickW * 0.5;
        for (let col = off; col < wallW + brickW; col += brickW) {
          ctx.beginPath(); ctx.moveTo(wx+col, ry); ctx.lineTo(wx+col, ry+brickH); ctx.stroke();
        }
        // Per-block color variation
        for (let col2 = 0; col2 < 4; col2++) {
          const varyOff = (row % 2)*0.5;
          const bx = wx + (col2 + varyOff) * brickW;
          const vary = (Math.sin(row*7.3 + col2*3.1) * 0.5 + 0.5) * 0.08;
          ctx.fillStyle = `rgba(${vary>0.04?'255,255,255':'0,0,0'},${Math.abs(vary-0.04)*1.5})`;
          ctx.fillRect(bx+1, ry+1, brickW-2, brickH-2);
        }
      }

      // Battlements with beveled edges
      const mw = wallW / 5;
      for (let m = 0; m < 5; m += 2) {
        const mx2 = wx + m * mw;
        const mTop = wy - mw*0.85;
        // Battlement face
        const mG = ctx.createLinearGradient(mx2, mTop, mx2, wy);
        mG.addColorStop(0, '#8a8580');
        mG.addColorStop(1, '#4a4540');
        ctx.fillStyle = mG;
        ctx.fillRect(mx2, mTop, mw*0.88, mw*0.85);
        // Top face (sunlight)
        ctx.fillStyle = '#aaa59a';
        ctx.fillRect(mx2, mTop, mw*0.88, mw*0.10);
        // Left bevel highlight
        ctx.fillStyle = 'rgba(255,255,240,0.18)';
        ctx.fillRect(mx2, mTop, 2, mw*0.85);
        // Right bevel shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(mx2+mw*0.88-2, mTop, 2, mw*0.85);
      }

      // Gate arch (portcullis)
      const gateX = wallP.x, gateW = wallW * 0.40, gateH = wallH * 0.52;
      const gateTop = wy + wallH * 0.48;
      ctx.save();
      // Gate darkness
      ctx.fillStyle = '#0c0810';
      ctx.beginPath();
      ctx.arc(gateX, gateTop, gateW*0.5, Math.PI, Math.PI*2);
      ctx.rect(gateX - gateW*0.5, gateTop, gateW, wallH - (gateTop-wy));
      ctx.fill();
      // Portcullis bars
      const barCount = 5, barSpacing = gateW / (barCount + 1);
      ctx.strokeStyle = 'rgba(60,50,40,0.88)'; ctx.lineWidth = Math.max(1.5, wallP.sc*2.5);
      for (let b = 1; b <= barCount; b++) {
        const bx2 = gateX - gateW*0.5 + b*barSpacing;
        ctx.beginPath(); ctx.moveTo(bx2, gateTop); ctx.lineTo(bx2, wy+wallH); ctx.stroke();
      }
      const crossCount = 3;
      for (let c = 0; c < crossCount; c++) {
        const cy2 = gateTop + (c+1) * (wallH - (gateTop-wy)) / (crossCount+1);
        ctx.beginPath();
        ctx.moveTo(gateX - gateW*0.5 + barSpacing, cy2);
        ctx.lineTo(gateX + gateW*0.5 - barSpacing, cy2);
        ctx.stroke();
      }
      ctx.restore();

      // Ivy/moss patches (lower wall)
      ctx.save();
      ctx.fillStyle = 'rgba(30,65,20,0.65)';
      for (let iv = 0; iv < 4; iv++) {
        const ivx = wx + wallW*(0.05 + iv*0.22), ivy2 = wy + wallH*0.6;
        ctx.beginPath();
        ctx.bezierCurveTo(ivx-wallW*0.05, ivy2-wallH*0.12, ivx+wallW*0.08, ivy2-wallH*0.08, ivx+wallW*0.06, ivy2+wallH*0.22);
        ctx.bezierCurveTo(ivx+wallW*0.04, ivy2+wallH*0.28, ivx-wallW*0.04, ivy2+wallH*0.25, ivx-wallW*0.06, ivy2+wallH*0.20);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      // Torch flames at gate sides
      const torchFlame = (tx, ty) => {
        const tf2 = now / 90;
        const fl2 = 0.7 + 0.3*Math.sin(tf2 + tx*0.1);
        ctx.save();
        // Torch glow pool
        const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, wallW*0.18);
        tg.addColorStop(0, `rgba(255,140,30,${0.35*fl2})`);
        tg.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(tx, ty, wallW*0.18, 0, Math.PI*2); ctx.fill();
        // Flame
        ctx.fillStyle = `rgba(255,80,0,${0.85*fl2})`;
        ctx.beginPath(); ctx.moveTo(tx-wallW*0.04, ty); ctx.lineTo(tx, ty-wallW*(0.10+fl2*0.06)); ctx.lineTo(tx+wallW*0.04, ty); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,220,40,${0.7*fl2})`;
        ctx.beginPath(); ctx.moveTo(tx-wallW*0.025, ty); ctx.lineTo(tx, ty-wallW*(0.065+fl2*0.04)); ctx.lineTo(tx+wallW*0.025, ty); ctx.closePath(); ctx.fill();
        ctx.restore();
      };
      torchFlame(gateX - gateW*0.62, gateTop + wallH*0.04);
      torchFlame(gateX + gateW*0.62, gateTop + wallH*0.04);
    }

    // ── STONE BATTLEMENT FRAME ──
    const openL = W * 0.14, openR = W * 0.86;
    const drawStone = (x1, x2, lightBias) => {
      // Base stone gradient (lighter top → darker bottom)
      const sg2 = ctx.createLinearGradient(x1, 0, x2, H);
      if (lightBias > 0) {
        sg2.addColorStop(0,   '#6e6a65');
        sg2.addColorStop(0.4, '#585450');
        sg2.addColorStop(1,   '#3e3a38');
      } else {
        sg2.addColorStop(0,   '#5a5652');
        sg2.addColorStop(0.4, '#484440');
        sg2.addColorStop(1,   '#302e2c');
      }
      ctx.fillStyle = sg2; ctx.fillRect(x1, 0, x2-x1, H);

      // Brick rows with bevel
      ctx.strokeStyle = 'rgba(18,16,14,0.55)'; ctx.lineWidth = 1.2;
      for (let row = 0; row < H; row += 16) {
        const off = (Math.floor(row/16)%2)*24;
        for (let col = x1-24+off; col < x2+24; col += 48) {
          const bx = col, by = row;
          // Brick fill variation
          const vary = Math.sin(bx*0.17 + by*0.31) * 0.06;
          ctx.fillStyle = `rgba(${lightBias>0?'255,255,250':'0,0,0'},${Math.abs(vary)})`;
          ctx.fillRect(bx+1, by+1, 46, 14);
          // Mortar outline
          ctx.strokeRect(bx, by, 46, 14);
          // Top bevel (bright) and bottom bevel (dark)
          ctx.strokeStyle = 'rgba(255,255,240,0.12)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(bx+1, by+1); ctx.lineTo(bx+45, by+1); ctx.stroke();
          ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(bx+1, by+13); ctx.lineTo(bx+45, by+13); ctx.stroke();
          ctx.strokeStyle = 'rgba(18,16,14,0.55)'; ctx.lineWidth = 1.2;
        }
      }

      // Crack lines (weathering)
      ctx.strokeStyle = 'rgba(10,8,6,0.35)'; ctx.lineWidth = 1;
      const crackSeeds = [0.15, 0.48, 0.72, 0.91];
      for (const cs of crackSeeds) {
        const cx3 = x1 + (x2-x1)*cs, cy3 = H*(0.1 + cs*0.6);
        ctx.beginPath();
        ctx.moveTo(cx3, cy3);
        ctx.lineTo(cx3 + (lightBias>0?6:-6)*Math.sin(cs*7), cy3+30);
        ctx.lineTo(cx3 + (lightBias>0?3:-3)*Math.sin(cs*13), cy3+52);
        ctx.stroke();
      }

      // Torch sconce
      const tscX = lightBias > 0 ? x2 - (x2-x1)*0.35 : x1 + (x2-x1)*0.35;
      const tscY = H * 0.32;
      // Orange light pool on stone
      const tscG = ctx.createRadialGradient(tscX, tscY, 0, tscX, tscY, (x2-x1)*0.7);
      tscG.addColorStop(0,   `rgba(255,130,30,0.28)`);
      tscG.addColorStop(0.5, `rgba(255,90,10,0.10)`);
      tscG.addColorStop(1,   `rgba(255,60,0,0)`);
      ctx.fillStyle = tscG; ctx.fillRect(x1, 0, x2-x1, H);
      // Flame animation
      const tscFl = 0.75 + 0.25*Math.sin(now/80 + tscX);
      ctx.save();
      ctx.fillStyle = `rgba(255,80,0,${0.9*tscFl})`;
      ctx.beginPath(); ctx.moveTo(tscX-5, tscY); ctx.lineTo(tscX, tscY-14*tscFl); ctx.lineTo(tscX+5, tscY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,220,40,${0.8*tscFl})`;
      ctx.beginPath(); ctx.moveTo(tscX-3, tscY); ctx.lineTo(tscX, tscY-8*tscFl); ctx.lineTo(tscX+3, tscY); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Vines (thin bezier with leaf ovals)
      ctx.save();
      ctx.strokeStyle = 'rgba(25,65,15,0.55)'; ctx.lineWidth = 1.5;
      const vx = lightBias > 0 ? x2-8 : x1+8;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.bezierCurveTo(vx-lightBias*12, H*0.25, vx+lightBias*8, H*0.55, vx-lightBias*6, H*0.85);
      ctx.stroke();
      // Leaf ovals along vine
      ctx.fillStyle = 'rgba(30,75,18,0.55)';
      for (let lf = 0; lf < 5; lf++) {
        const lt = lf / 4;
        const lx2 = vx + (lightBias>0?-1:1)*Math.sin(lt*Math.PI*2)*10;
        const ly2 = lt * H * 0.85;
        ctx.save();
        ctx.translate(lx2, ly2); ctx.rotate(lt*1.2);
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };
    drawStone(0, openL, 1); drawStone(openR, W, -1);

    // Side vignette
    const vigL = ctx.createLinearGradient(openL, 0, openL + 70, 0);
    vigL.addColorStop(0, 'rgba(0,0,0,0.55)'); vigL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vigL; ctx.fillRect(openL, 0, 70, H);
    const vigR = ctx.createLinearGradient(openR - 70, 0, openR, 0);
    vigR.addColorStop(0, 'rgba(0,0,0,0)'); vigR.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vigR; ctx.fillRect(openR - 70, 0, 70, H);

    // Merlons on inner edge of walls
    ctx.fillStyle = '#525050';
    for (let y = 8; y < H*0.55; y += 58) {
      ctx.fillRect(openL-16, y, 22, 34); ctx.fillRect(openR-6, y, 22, 34);
    }
    // Bottom stone sill
    const sillG = ctx.createLinearGradient(0, openB, 0, H);
    sillG.addColorStop(0,   '#5a5650');
    sillG.addColorStop(0.08,'#4e4a45');
    sillG.addColorStop(1,   '#2a2826');
    ctx.fillStyle = sillG; ctx.fillRect(0, openB, W, H-openB);
    ctx.fillStyle = '#6a6660'; ctx.fillRect(0, openB, W, 12);
    ctx.strokeStyle = '#2a2826'; ctx.lineWidth = 1;
    for (let col = 0; col < W; col += 52) ctx.strokeRect(col, openB+1, 50, H-openB-2);
    ctx.strokeStyle = 'rgba(255,255,240,0.10)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, openB); ctx.lineTo(W, openB); ctx.stroke();

    // ── POST-PROCESSING ──
    // Vignette (black radial from corners)
    const vigFull = ctx.createRadialGradient(W/2, H/2, H*0.28, W/2, H/2, H*0.82);
    vigFull.addColorStop(0, 'rgba(0,0,0,0)');
    vigFull.addColorStop(0.6, 'rgba(0,0,0,0.10)');
    vigFull.addColorStop(1,   'rgba(0,0,0,0.52)');
    ctx.fillStyle = vigFull; ctx.fillRect(openL, 0, openR-openL, H);
    // Warm sepia top half
    ctx.fillStyle = 'rgba(255,200,100,0.04)'; ctx.fillRect(openL, 0, openR-openL, H/2);
    // Cool blue bottom half
    ctx.fillStyle = 'rgba(0,50,100,0.04)';    ctx.fillRect(openL, H/2, openR-openL, H/2);

    // ── CROSSHAIR (follows mouse, snaps red to nearby enemy) ──
    const rawMx = this.mouse.x, rawMy = this.mouse.y;
    let mx2 = Math.max(openL + 10, Math.min(openR - 10, rawMx));
    let my2 = Math.max(horizon + 10, Math.min(openB - 10, rawMy));
    let snapEnemy = null, snapDist = 60;
    for (const e of this.enemies) {
      if (e._3dx == null) continue;
      const d = Math.hypot(rawMx - e._3dx, rawMy - e._3dy);
      if (d < snapDist) { snapDist = d; snapEnemy = e; }
    }
    if (snapEnemy) { mx2 = snapEnemy._3dx; my2 = snapEnemy._3dy; }
    const chColor = snapEnemy ? 'rgba(255,80,0,0.95)' : 'rgba(255,230,80,0.88)';
    const chRingColor = snapEnemy ? 'rgba(255,60,0,0.6)' : 'rgba(255,230,80,0.35)';
    ctx.strokeStyle = chColor; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx2-20, my2); ctx.lineTo(mx2-7, my2);
    ctx.moveTo(mx2+7, my2);  ctx.lineTo(mx2+20, my2);
    ctx.moveTo(mx2, my2-20); ctx.lineTo(mx2, my2-7);
    ctx.moveTo(mx2, my2+7);  ctx.lineTo(mx2, my2+20);
    ctx.stroke();
    ctx.strokeStyle = chRingColor;
    ctx.beginPath(); ctx.arc(mx2, my2, 14, 0, Math.PI*2); ctx.stroke();

    // ── COMPASS (top-center) ──
    const compassCx = W/2, compassCy = 28, compassR = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.arc(compassCx, compassCy, compassR + 4, 0, Math.PI*2); ctx.fill();
    // Draw N/S/E/W markers rotating with camera yaw
    const dirs = [['N', 0], ['E', Math.PI/2], ['S', Math.PI], ['W', -Math.PI/2]];
    for (const [label, baseAngle] of dirs) {
      const angle = baseAngle - this.camYaw - Math.PI/2;
      const lx = compassCx + Math.cos(angle) * compassR;
      const ly = compassCy + Math.sin(angle) * compassR;
      ctx.fillStyle = label === 'N' ? '#ff4444' : '#aaaaaa';
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, lx, ly + 3);
    }
    ctx.textAlign = 'left';

    // ── HUD ──
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(openL+6, 6, 210, 60);
    ctx.fillStyle = tower.color; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`⚔ ${tower.typeKey.toUpperCase()} TOWER`, openL+14, 26);
    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif';
    ctx.fillText('Click=Shoot  •  Drag=Look  •  ESC=Exit', openL+14, 44);
    // Reload bar
    const maxCD = tower.fireRate * 2;
    const pct = tower.manualCooldown > 0 ? 1 - tower.manualCooldown/maxCD : 1;
    ctx.fillStyle = '#222'; ctx.fillRect(openL+14, 52, 180, 8);
    ctx.fillStyle = pct < 1 ? '#f84' : '#2d8'; ctx.fillRect(openL+14, 52, 180*pct, 8);

    // Exit button
    ctx.fillStyle = '#8a0000'; ctx.fillRect(openR-90, 6, 84, 30);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(openR-90, 6, 84, 3);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('✕  EXIT', openR-76, 26);

    // Enemy count
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(openL+6, openB-26, 180, 22);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
    ctx.fillText(`Enemies: ${this.enemies.length}   Wave: ${this.waveManager.wave}/${this.waveManager.levelDef?.waves ?? '?'}`, openL+12, openB-10);

    // Flash message
    if (this.flashTimer > 0) {
      const p = this.flashTimer / 90;
      ctx.fillStyle = `rgba(0,0,0,${p*0.55})`;
      ctx.fillRect(W/2-140, openB-54, 280, 26);
      ctx.fillStyle = `rgba(255,240,80,${p})`;
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(this.flashMsg, W/2, openB-36);
      ctx.textAlign = 'left';
    }
  }

  tryFireManual(x, y) {
    if (!this.selectedTower) return;
    if (this.selectedTower.manualCooldown > 0) { this.flash('Still reloading!'); return; }
    const dx = x - this.selectedTower.x, dy = y - this.selectedTower.y;
    const d = Math.hypot(dx, dy);
    this.projectiles.push(new Projectile({
      x: this.selectedTower.x, y: this.selectedTower.y,
      vx: (dx/d)*12, vy: (dy/d)*12,
      damage: this.selectedTower.damage * 4,
      slows: this.selectedTower.slows,
      manual: true,
    }));
    this.selectedTower.manualCooldown = this.selectedTower.fireRate * 2;
  }

  sellTower(tower) {
    const refund = Math.floor(tower.cost / 2);
    this.money = Math.min(this.money + refund, MAX_MONEY);
    this.towers = this.towers.filter(t => t !== tower);
    if (this.selectedTower === tower) this.selectedTower = null;
    this.flash(`Sold for $${refund}!`);
    this._updateButtons();
  }

  sellTrap(trap) {
    const refund = Math.floor(trap.cost / 2);
    this.money = Math.min(this.money + refund, MAX_MONEY);
    this.traps = this.traps.filter(t => t !== trap);
    this.flash(`Sold for $${refund}!`);
    this._updateButtons();
  }

  // Upgrade a tower from level 1→2 or level 2→3
  tryUpgradeTower(tower) {
    if (tower.level >= 3) { this.flash('Already at MAX LEVEL!'); return; }
    const nextLevel = tower.level + 1;
    const cost = Math.floor(tower.cost * UPGRADE_COST[nextLevel]);
    if (this.money < cost) { this.flash(`Need $${cost} to upgrade!`); return; }
    const mult = UPGRADE_MULT[nextLevel];
    // Apply the upgrade multipliers to the tower's stats
    tower.damage   *= mult.damage;
    tower.range    *= mult.range;
    tower.fireRate  = Math.max(1, Math.floor(tower.fireRate * mult.fireRate));
    tower.level     = nextLevel;
    tower.hp = tower.maxHp; // heal to full on upgrade (nice reward!)
    this.money -= cost;
    this.flash(`Tower upgraded to Level ${nextLevel}! 💪`);
    if (nextLevel === 3) this._grantAchievement('upgrade_max');
    this._updateButtons();
  }

  flash(msg) { this.flashMsg = msg; this.flashTimer = 120; }

  _showLevelIntro(levelDef) {
    // Hide the title screen
    this.titleActive = false;
    document.getElementById('title-screen').style.display = 'none';

    const isFinal = levelDef.id === 100;

    // Work out which towers / traps / camps are NEW this level vs. the previous one
    const prev       = levelDef.id > 1 ? LEVELS[levelDef.id - 2] : null;
    const prevTowers = prev ? prev.towers : [];
    const prevTraps  = prev ? prev.traps  : [];
    const prevCamps  = prev ? (prev.camps || []) : [];
    const newTowers  = levelDef.towers.filter(t => !prevTowers.includes(t));
    const newTraps   = levelDef.traps.filter(t => !prevTraps.includes(t));
    const newCamps   = (levelDef.camps || []).filter(c => !prevCamps.includes(c));

    // Ability descriptions shown on the intro card
    const TOWER_INFO = {
      basic:     { icon: '🏹', name: 'Archer Tower',    desc: 'Steady arrows, medium range. Cheap and reliable — your backbone.' },
      sniper:    { icon: '🪨', name: 'Catapult',        desc: 'Hurls boulders at extreme range. Great for sniping tough enemies early.' },
      rapid:     { icon: '🎯', name: 'Crossbow',        desc: 'Fires 3 bolts per second. Shreds fast runners before they slip through.' },
      slow:      { icon: '🔮', name: 'Mage Tower',      desc: 'Magic orbs slow every enemy hit. Pairs perfectly with damage towers.' },
      fire:      { icon: '🔥', name: 'Fire Tower',      desc: 'Fireballs leave burning damage over time. Melts ogres and dragons fast.' },
      ice:       { icon: '❄️', name: 'Ice Tower',       desc: 'Freezes enemies solid. Frozen foes take bonus damage from all sources.' },
      lightning: { icon: '⚡', name: 'Lightning Tower', desc: 'Chain lightning jumps to 3 nearby enemies at once. Wrecks groups.' },
      earth:     { icon: '🪨', name: 'Earth Tower',     desc: 'Giant boulders with wide splash. Stuns everything in a huge area.' },
    };
    const TRAP_INFO = {
      spike:     { icon: '🗡️', name: 'Spike Trap',  desc: 'Damages every enemy that steps over it. Stack on tight bends.' },
      tar:       { icon: '🕳️', name: 'Tar Pit',     desc: 'Slows enemies to a crawl, giving towers extra firing time.' },
      barricade: { icon: '🚧', name: 'Barricade',   desc: 'Blocks enemies and deals damage. Forces them to break through.' },
      wall:      { icon: '🧱', name: 'Stone Wall',  desc: 'Heavy off-path barrier that soaks enormous amounts of damage.' },
    };

    const ENEMY_ICONS = { goblin:'👺', runner:'💨', saboteur:'🗡️', ogre:'👹', dragon:'🐲', dragonRider:'🐉', titan:'⚡' };

    const CAMP_INFO = {
      basic:  { icon: '⚔️',  name: 'Basic Camp',  desc: 'Spawns sword-fighters that attack enemies on the road.' },
      archer: { icon: '🏹',  name: 'Archer Camp', desc: 'Ranged archers shoot enemies from a distance.' },
      knight: { icon: '🛡️', name: 'Knight Camp',  desc: 'Heavy knights with shields — very hard to kill.' },
      mage:   { icon: '🔮',  name: 'Mage Camp',   desc: 'Magic soldiers that deal high damage and slow enemies.' },
      siege:  { icon: '💥',  name: 'Siege Camp',  desc: 'Siege warriors deal area damage — great against groups.' },
    };

    // Build "new unlocks" cards HTML
    let unlocksHtml = '';
    const allNew = [
      ...newTowers.map(t => ({ ...TOWER_INFO[t], border: 'rgba(255,215,0,0.45)' })),
      ...newTraps.map(t => ({ ...TRAP_INFO[t],   border: 'rgba(255,140,0,0.45)' })),
      ...newCamps.map(c => ({ ...CAMP_INFO[c],   border: 'rgba(255,200,0,0.45)' })),
    ];
    if (allNew.length) {
      unlocksHtml = `
        <div style="margin-top:18px">
          <div class="ts-section-title">🆕 New Unlocks This Level</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px">
            ${allNew.map(u => `
              <div style="background:rgba(255,255,255,0.05);border:1.5px solid ${u.border};border-radius:10px;padding:10px 14px;max-width:200px;text-align:left">
                <div style="font-size:16px;margin-bottom:4px">${u.icon} <strong style="color:#ffd700">${u.name}</strong></div>
                <div style="font-size:11px;color:rgba(200,220,255,0.72);line-height:1.45">${u.desc}</div>
              </div>`).join('')}
          </div>
        </div>`;
    }

    // Final-level warning banner
    const finalBanner = isFinal ? `
      <div style="margin-top:16px;padding:12px 16px;background:rgba(180,0,0,0.18);border:1.5px solid rgba(255,40,0,0.4);border-radius:10px;color:#ff9977;font-size:13px;line-height:1.7">
        ⚠️ <strong>THE FINAL STAND</strong> — The world is on the edge of destruction.<br>
        The map transforms into a cursed wasteland. Unlimited camps &amp; soldiers available.<br>
        Destroy the <strong>Enemy Camp</strong> to awaken the <strong>TITAN</strong> — defeat it to win forever.
      </div>` : '';

    const btnStyle = isFinal
      ? 'background:#cc1100;color:#fff;box-shadow:0 0 28px rgba(200,0,0,0.6)'
      : 'background:#3bd17a;color:#000;box-shadow:0 0 20px rgba(59,209,122,0.4)';
    const btnText  = isFinal ? '⚔ ENTER THE FINAL STAND ⚔' : `▶ START LEVEL ${levelDef.id}`;
    const bgGrad   = isFinal
      ? 'linear-gradient(160deg,#0d0005 0%,#1a0010 40%,#2d0020 100%)'
      : 'linear-gradient(160deg,#0d1b2a 0%,#1b2838 40%,#1a2d1a 100%)';
    const titleClr = isFinal ? '#ff4422' : '#ffd700';
    const titleShd = isFinal ? '0 0 36px rgba(255,40,0,0.7)' : '0 0 28px rgba(255,215,0,0.5)';

    // Build or reuse the overlay div
    let panel = document.getElementById('level-intro');
    if (!panel) { panel = document.createElement('div'); panel.id = 'level-intro'; document.body.appendChild(panel); }
    panel.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:${bgGrad};display:flex;align-items:center;justify-content:center;z-index:200;overflow-y:auto;font-family:sans-serif;color:#fff`;
    panel.innerHTML = `
      <div style="text-align:center;max-width:740px;padding:32px 20px;width:100%">
        <div style="font-size:11px;font-weight:bold;letter-spacing:4px;color:rgba(255,255,255,0.38);text-transform:uppercase;margin-bottom:6px">Level ${levelDef.id}</div>
        <div style="font-size:${isFinal ? 38 : 30}px;font-weight:900;color:${titleClr};letter-spacing:3px;text-shadow:${titleShd};margin-bottom:8px">${levelDef.name.toUpperCase()}</div>
        <div style="color:rgba(255,255,255,0.55);font-size:14px;margin-bottom:20px;max-width:560px;margin-inline:auto">${levelDef.desc}</div>

        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:18px">
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 20px">
            <div style="font-size:24px;font-weight:bold">${levelDef.waves}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">Waves</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 20px">
            <div style="font-size:24px;font-weight:bold">${Math.round(levelDef.difficulty * 100)}%</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">Difficulty</div>
          </div>
        </div>

        <div class="ts-section-title">Enemies</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:6px">
          ${levelDef.enemies.map(e => `<span style="padding:4px 12px;background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);border-radius:20px;font-size:12px">${ENEMY_ICONS[e]||'👾'} ${ENEMIES[e]?.name || e}</span>`).join('')}
        </div>

        ${unlocksHtml}
        ${finalBanner}

        <button id="li-start" style="margin-top:22px;padding:14px 48px;font-size:18px;font-weight:bold;${btnStyle};border:none;border-radius:8px;cursor:pointer;letter-spacing:2px;transition:all 0.15s">
          ${btnText}
        </button>
      </div>`;

    document.getElementById('li-start').onclick = () => {
      panel.style.display = 'none';
      this.startLevel(levelDef);
    };
  }

  startLevel(levelDef) {
    this.currentLevel = levelDef;
    const variant = levelDef.mapVariant || 0;
    this.path = makePath(this.canvas.width, this.canvas.height, variant);
    const isFinalLevel = levelDef.id === 100;
    this.map  = new GameMap(this.path, this.canvas.width, this.canvas.height, isFinalLevel);
    const pathEnd = this.path[this.path.length - 1];
    this.castleArcher.x = pathEnd.x - 42;
    this.castleArcher.y = pathEnd.y - 38;
    this.castleArcher.angle = Math.PI;

    this.towers = []; this.enemies = []; this.projectiles = [];
    this.traps = []; this.mines = []; this.guards = []; this.camps = []; this.soldiers = []; this.workerUnits = [];
    this.viewMode = 'flat'; this.viewTower = null;

    // Pre-place 3 mines at the start of each level — try candidate spots until 3 land off-path
    const W = this.canvas.width, H = this.canvas.height;
    const candidates = [
      [0.15, 0.50], [0.45, 0.50], [0.75, 0.50],
      [0.25, 0.35], [0.55, 0.35], [0.85, 0.35],
      [0.25, 0.65], [0.55, 0.65], [0.85, 0.65],
      [0.10, 0.80], [0.50, 0.80], [0.90, 0.80],
    ];
    let placed = 0;
    for (const [fx, fy] of candidates) {
      if (placed >= 3) break;
      const mx = Math.round(W * fx), my = Math.round(H * fy);
      if (!this.map.isOnPath(mx, my)) {
        this.mines.push(new Mine(mx, my));
        placed++;
      }
    }
    this.castleHp = 10000; this.money = 100; this.score = 0;
    this.gameOver = false; this.levelComplete = false;
    this.paused = false; this.helpOpen = false;
    this.flashMsg = ''; this.flashTimer = 0;
    this.selectedTower = null;
    this.workers = 0; this.workerTimer = 0;
    this.towerPlaceCount = 0; // reset tower count for this game
    this.enemyCampHp    = 50000;
    this.enemyCampMaxHp = 50000;
    this.titanSpawned   = false;
    this.cutsceneTimer  = 0;
    this.cutscenePhase  = 0;
    this._cutsceneActors = [];

    // Reset power-up state for new level
    this.rageTimer = 0; this.shieldTimer = 0; this.timeSlowTimer = 0; this.poisonTimer = 0; this.berserkTimer = 0;
    this.goldBonus = 1.0; this.armorActive = false; this.regenActive = false;
    this.multiShotActive = false; this.bounceActive = false;
    this.swiftSoldiers = false; this.rapidSpawnActive = false;
    // Reset gem upgrade flags (re-applied by _applyGemUpgrades below)
    this.gemFastFire = false; this.gemHeadStart = false;
    this.gemMinerDouble = false; this.gemSoldierDmg = false;
    this.campLimit = 5; // default camp limit
    // Reset tower _savedFireRate flags
    for (const t of this.towers) t._savedFireRate = null;

    // Kick off the opening story banner
    this.storyBannerTimer = 360;  // 6 seconds
    this.storyBannerTitle = levelDef.name.toUpperCase();
    this.storyBannerText  = levelDef.desc;
    this.waveBannerTimer  = 0;
    this._lastAnnouncedWave = 0;

    this.waveManager.setLevel(levelDef);
    this.selectedType = 'camp_basic'; // default to camp tab for clarity
    // Actually default to first tower type
    this.selectedType = levelDef.towers[0];

    // Apply gem shop permanent upgrades (happens before wheel reward so both stack)
    this._applyGemUpgrades();

    // Apply consumable loadout queued from the gem shop
    this._pendingTriggers = [];
    this.activeLoadout = [];
    this._applyConsumables();

    // Apply pending wheel reward (from daily spin)
    if (this.pendingWheelReward) {
      this._applyWheelReward(this.pendingWheelReward);
      this.pendingWheelReward = null;
    }

    this._rebuildUI();
    document.getElementById('title-screen').style.display = 'none';
    this.titleActive = false;
  }

  showTitle() {
    this.titleActive = true;
    this._buildTitleScreen();
    document.getElementById('title-screen').style.display = 'flex';
  }

  restart() {
    if (this.levelComplete || this.gameOver) {
      this.showTitle();
    } else if (this.currentLevel) {
      this.startLevel(this.currentLevel);
    } else {
      this.showTitle();
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _onLevelComplete() {
    this.levelComplete = true;
    const id = this.currentLevel.id;
    const nextId = id + 1;
    const saved  = parseInt(localStorage.getItem('td_maxLevel') || '1');
    if (nextId <= LEVELS.length && nextId > saved)
      localStorage.setItem('td_maxLevel', String(nextId));
    const achMap = { 1:'first_win', 2:'soldier', 3:'warrior', 4:'champion', 5:'legend', 10:'veteran', 20:'endure', 25:'master', 50:'unstoppable', 100:'ancient' };
    if (achMap[id]) this._grantAchievement(achMap[id]);
    // Perfect — no castle damage taken!
    if (this.castleHp >= this.castleMaxHp) this._grantAchievement('no_damage');

    // Gem reward for completing a level — higher levels = more gems!
    // Levels 1-5: 1 gem  |  6-20: 2 gems  |  21-50: 3 gems  |  51+: 5 gems
    const gemAmt = id >= 51 ? 5 : id >= 21 ? 3 : id >= 6 ? 2 : 1;
    this._grantGems(gemAmt);
    this.flash(`Level complete! 💎 +${gemAmt} gem${gemAmt > 1 ? 's' : ''}!`);

    this._updateButtons();
  }

  _grantAchievement(id) {
    const ach = JSON.parse(localStorage.getItem('td_achievements') || '[]');
    if (!ach.includes(id)) {
      ach.push(id);
      localStorage.setItem('td_achievements', JSON.stringify(ach));
      // Every new achievement earns 1 gem — gems are rare, celebrate!
      this._grantGems(1);
      this.flash('🏆 Achievement + 💎 1 Gem!');
    }
  }

  // Add gems to the player's balance and save to localStorage
  _grantGems(n) {
    this.gems += n;
    localStorage.setItem('td_gems', String(this.gems));
  }

  // ── UI building ─────────────────────────────────────────────────────────────

  _buildTitleScreen() {
    const maxUnlocked = parseInt(localStorage.getItem('td_maxLevel') || '1');
    const achUnlocked = JSON.parse(localStorage.getItem('td_achievements') || '[]');
    // Version badge — helps confirm the right code is loaded
    document.querySelector('.ts-subtitle').textContent = 'Build towers, place mines, hire workers and defend your castle!  •  v40';

    // Draw map background
    this._drawTitleBg();

    const levelsDiv = document.getElementById('ts-levels');
    levelsDiv.innerHTML = '';
    for (const lvl of LEVELS) {
      const locked = lvl.id > maxUnlocked;
      const theme = lvl.theme;
      const btn = document.createElement('button');
      btn.className = 'ts-lvl-btn' + (locked ? ' locked' : ' unlocked') +
                      (this.selectedLevelId === lvl.id && !locked ? ' selected' : '');
      btn.dataset.lvlId = lvl.id;
      btn.title = `${lvl.name}: ${lvl.desc} (${lvl.waves} waves)`;

      const glowStyle = !locked ? `box-shadow: 0 0 8px ${theme.glow}, inset 0 0 12px rgba(0,0,0,0.4);` : '';
      const borderClr = locked ? '#333' : theme.border;
      const bgStyle   = locked ? 'background:#111' : `background:${theme.bg}`;

      btn.style.cssText = `${bgStyle};border:2px solid ${borderClr};border-radius:6px;padding:0;margin:2px;cursor:${locked ? 'default' : 'pointer'};width:72px;height:76px;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.15s;overflow:hidden;${glowStyle}`;

      if (locked) {
        btn.innerHTML = `
          <div style="font-size:9px;color:#555;letter-spacing:1px;text-transform:uppercase">LV${lvl.id}</div>
          <div style="font-size:18px;opacity:0.3">🔒</div>
          <div style="font-size:8px;color:#333;letter-spacing:1px">LOCKED</div>`;
      } else {
        const isSelected = this.selectedLevelId === lvl.id;
        const numClr = lvl.id === 100 ? '#ffaa00' : '#fff';
        btn.innerHTML = `
          <div style="font-size:8px;color:rgba(255,255,255,0.38);letter-spacing:1.5px">LV</div>
          <div style="font-size:${lvl.id >= 100 ? 18 : lvl.id >= 10 ? 20 : 22}px;font-weight:900;color:${numClr};text-shadow:0 0 8px ${theme.glow};line-height:1">${lvl.id}</div>
          <div style="font-size:16px;line-height:1;margin:1px 0">${theme.icon}</div>
          <div style="font-size:6px;font-weight:bold;color:${theme.border};letter-spacing:1px;text-transform:uppercase;text-align:center;padding:0 2px;line-height:1.2;max-width:68px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${theme.word}</div>`;
        btn.onmouseenter = () => {
          if (!isSelected) btn.style.transform = 'scale(1.1)';
        };
        btn.onmouseleave = () => { btn.style.transform = ''; };
        btn.onclick = () => {
          this.selectedLevelId = lvl.id;
          document.querySelectorAll('.ts-lvl-btn').forEach(b => {
            b.classList.toggle('selected', parseInt(b.dataset.lvlId) === lvl.id);
            b.style.transform = '';
          });
          document.getElementById('ts-play-btn').textContent = `▶ PLAY LEVEL ${lvl.id}`;
        };
      }
      levelsDiv.appendChild(btn);
    }

    // ── Advancement list — vertical rows grouped by category ──────────────
    const achDiv = document.getElementById('ts-achievements');
    achDiv.innerHTML = '';
    achDiv.style.cssText = 'width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:0';

    const groups = [
      { label: '⚔ Progression',  ids: ['first_win','soldier','warrior','champion','legend','veteran','endure','master','unstoppable','mythic','ancient'] },
      { label: '💀 Combat',       ids: ['dragon_slayer','wave5','kill100','kill500','no_damage','nuke','freeze'] },
      { label: '🏗 Builder',      ids: ['fortified','tower10','miner','camp5','all_towers','soldier5','soldier15'] },
      { label: '✨ Special',      ids: ['rich','upgrade_max','shop_buyer','daily_spin','general'] },
    ];

    for (const group of groups) {
      const groupAchs = ACHIEVEMENTS.filter(a => group.ids.includes(a.id));
      if (!groupAchs.length) continue;
      const unlockedCount = groupAchs.filter(a => achUnlocked.includes(a.id)).length;

      // Group header
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 10px 4px;margin-top:10px;border-bottom:1px solid rgba(255,255,255,0.1)';
      header.innerHTML = `
        <span style="font-size:11px;font-weight:bold;letter-spacing:2px;color:rgba(255,255,255,0.45);text-transform:uppercase">${group.label}</span>
        <span style="font-size:10px;color:rgba(255,215,0,0.55)">${unlockedCount}/${groupAchs.length}</span>`;
      achDiv.appendChild(header);

      for (const ach of groupAchs) {
        const done = achUnlocked.includes(ach.id);
        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:10px;padding:7px 10px;
          border-bottom:1px solid rgba(255,255,255,0.04);
          background:${done ? 'rgba(255,215,0,0.05)' : 'transparent'};
          opacity:${done ? '1' : '0.38'};
          transition:opacity 0.2s`;
        row.innerHTML = `
          <span style="font-size:18px;width:24px;text-align:center">${ach.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:bold;color:${done ? '#ffd700' : '#bbb'};white-space:nowrap">${ach.name}</div>
            <div style="font-size:10px;color:rgba(200,200,200,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ach.desc}</div>
          </div>
          <span style="font-size:14px;flex-shrink:0">${done ? '✅' : '🔒'}</span>`;
        achDiv.appendChild(row);
      }
    }

    const playBtn = document.getElementById('ts-play-btn');
    playBtn.textContent = `▶ PLAY LEVEL ${this.selectedLevelId}`;
    playBtn.onclick = () => {
      const lvl = LEVELS.find(l => l.id === this.selectedLevelId);
      if (lvl) this._showLevelIntro(lvl);
    };

    // Show gem balance and legend title
    const gemBal = document.getElementById('gem-balance');
    if (gemBal) gemBal.textContent = `💎 ${this.gems} Gem${this.gems !== 1 ? 's' : ''}`;

    // Show ✦LEGEND✦ badge if purchased
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    let legendEl = document.getElementById('ts-legend-badge');
    if (purchases.includes('gem_legend')) {
      if (!legendEl) {
        legendEl = document.createElement('div');
        legendEl.id = 'ts-legend-badge';
        legendEl.style.cssText = 'font-size:14px;font-weight:bold;color:#ffd700;letter-spacing:2px;margin-bottom:6px;text-shadow:0 0 10px rgba(255,215,0,0.7);';
        legendEl.textContent = '✦ LEGEND ✦';
        document.querySelector('.ts-title').after(legendEl);
      }
    }

    // Gem shop button toggle
    const gemBtn = document.getElementById('ts-gem-btn');
    if (gemBtn) {
      gemBtn.onclick = () => {
        const panel = document.getElementById('gem-shop-panel');
        if (!panel) return;
        const showing = panel.style.display !== 'none';
        panel.style.display = showing ? 'none' : 'block';
        gemBtn.textContent = showing ? '💎 GEM SHOP' : '💎 GEM SHOP ▲';
        if (!showing) this._buildGemShop();
      };
    }

    // Add or update the daily wheel button
    let wheelBtn = document.getElementById('ts-wheel-btn');
    if (!wheelBtn) {
      wheelBtn = document.createElement('button');
      wheelBtn.id = 'ts-wheel-btn';
      wheelBtn.style.cssText = 'margin-top:10px;padding:10px 28px;font-size:16px;font-weight:bold;background:#334488;color:#fff;border:2px solid #6688ff;border-radius:8px;cursor:pointer;letter-spacing:1px;';
      wheelBtn.onclick = () => {
        document.getElementById('title-screen').style.display = 'none';
        this.titleActive = false;
        this.wheelOpen = true;
      };
      playBtn.parentNode.insertBefore(wheelBtn, playBtn.nextSibling);
    }
    // Always refresh text so "done" state is current (even after returning from a spin)
    const alreadySpun = localStorage.getItem('td_last_spin') === new Date().toDateString();
    wheelBtn.textContent = alreadySpun ? '🎡 Daily Spin (done today)' : '🎡 DAILY SPIN';
    wheelBtn.style.opacity = alreadySpun ? '0.5' : '1';
  }

  _drawTitleBg() {
    const bgCanvas = document.getElementById('title-bg');
    if (!bgCanvas) return;
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const ctx = bgCanvas.getContext('2d');
    const W = bgCanvas.width, H = bgCanvas.height;
    const path = makePath(W, H, 0);

    ctx.fillStyle = '#1a3810'; ctx.fillRect(0, 0, W, H);

    // Grass variation
    const seed = 42;
    for (let i = 0; i < 300; i++) {
      const xi = ((seed * i * 1234567 + 891011) % 100000) / 100000;
      const yi = ((seed * i * 9876543 + 112233) % 100000) / 100000;
      ctx.fillStyle = i % 3 === 0 ? '#2a5820' : i % 3 === 1 ? '#1e4a18' : '#356628';
      ctx.beginPath(); ctx.arc(xi * W, yi * H, 3 + (i % 5) * 4, 0, Math.PI*2); ctx.fill();
    }

    // Path shadow
    ctx.strokeStyle = '#1a0a05'; ctx.lineWidth = 56; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.strokeStyle = '#6a3810'; ctx.lineWidth = 44;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.strokeStyle = '#a06030'; ctx.lineWidth = 30;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';

    // Trees (deterministic positions)
    for (let i = 0; i < 28; i++) {
      const xi = ((seed * i * 777777 + 333333) % 100000) / 100000;
      const yi = ((seed * i * 888888 + 444444) % 100000) / 100000;
      const tx = xi * W, ty = yi * H;
      const r = 14 + (i % 4) * 5;
      let onPath = false;
      for (let j = 0; j < path.length - 1 && !onPath; j++) {
        const a = path[j], b = path[j+1];
        const dx = b.x-a.x, dy = b.y-a.y, len2 = dx*dx+dy*dy;
        const t = Math.max(0, Math.min(1, ((tx-a.x)*dx+(ty-a.y)*dy)/len2));
        if (Math.hypot(tx-(a.x+t*dx), ty-(a.y+t*dy)) < 50) onPath = true;
      }
      if (!onPath) {
        ctx.fillStyle = '#0e2a10';
        ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a4018';
        ctx.beginPath(); ctx.arc(tx-r*0.15, ty-r*0.2, r*0.75, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2a6028';
        ctx.beginPath(); ctx.arc(tx-r*0.25, ty-r*0.38, r*0.45, 0, Math.PI*2); ctx.fill();
      }
    }

    // Dark vignette overlay
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H);
  }

  _rebuildUI() {
    const ui = document.getElementById('ui');
    ui.innerHTML = '';
    const allowedTowers = this.currentLevel ? this.currentLevel.towers : this.typeKeys;
    const allowedTraps  = this.currentLevel ? this.currentLevel.traps  : this.trapKeys;

    this.typeKeys.forEach(key => {
      if (!allowedTowers.includes(key)) return;
      // Parse e.g. '1 Archer $50' → name='Archer', cost='$50'
      const rawLabel = TYPES[key].label;
      const costMatch = rawLabel.match(/\$\d+/);
      const cost = costMatch ? costMatch[0] : '';
      const name = rawLabel.replace(/^[\w]\s+/, '').replace(/\$\d+.*$/, '').trim();
      const btn = _makeTileBtn('btn-' + key, key, name, cost);
      btn.className = 'btn' + (key === this.selectedType ? ' selected' : '');
      btn.onclick = () => this._selectType(key);
      ui.appendChild(btn);
    });

    this.trapKeys.forEach(key => {
      if (!allowedTraps.includes(key)) return;
      const rawLabel = TRAPS[key].label;
      const costMatch = rawLabel.match(/\$\d+/);
      const cost = costMatch ? costMatch[0] : '';
      const name = rawLabel.replace(/^[\w]\s+/, '').replace(/\$\d+.*$/, '').trim();
      const btn = _makeTileBtn('btn-trap_' + key, key, name, cost);
      btn.className = 'btn' + ('trap_' + key === this.selectedType ? ' selected' : '');
      btn.style.outline = '2px solid #ff8800';
      btn.onclick = () => this._selectType('trap_' + key);
      ui.appendChild(btn);
    });

    // No mine button — mines are pre-placed only (players can't buy them)

    // Camp buttons — only show camps unlocked for this level
    const allowedCamps = this.currentLevel ? this.currentLevel.camps : Object.keys(CAMP_TYPES);
    for (const [typeName, cfg] of Object.entries(CAMP_TYPES)) {
      if (!allowedCamps.includes(typeName)) continue; // not unlocked yet
      const rawLabel = cfg.label;
      const costMatch = rawLabel.match(/\$\d+/);
      const cost = costMatch ? costMatch[0] : '';
      const name = rawLabel.replace(/\$\d+.*$/, '').trim();
      const btn = _makeTileBtn('btn-camp_' + typeName, 'camp_' + typeName, name, cost);
      btn.className = 'btn' + (this.selectedType === 'camp_' + typeName ? ' selected' : '');
      btn.style.outline = '2px solid #ffd700';
      btn.onclick = () => this._selectType('camp_' + typeName);
      ui.appendChild(btn);
    }

    const wBtn = _makeTileBtn('btn-worker', 'worker', 'Worker', '$35');
    wBtn.onclick = () => this.hireWorker();
    ui.appendChild(wBtn);

    // Pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'btn-pause';
    pauseBtn.className = 'btn';
    pauseBtn.style.background = '#000';
    pauseBtn.style.color = '#fff';
    pauseBtn.style.fontWeight = 'bold';
    pauseBtn.textContent = '⏸';
    pauseBtn.title = 'Pause (Space)';
    pauseBtn.onclick = () => {
      this.paused = !this.paused;
      pauseBtn.textContent = this.paused ? '▶' : '⏸';
    };
    ui.appendChild(pauseBtn);

    // Help button
    const helpBtn = document.createElement('button');
    helpBtn.id = 'btn-help';
    helpBtn.className = 'btn';
    helpBtn.style.background = '#224';
    helpBtn.style.color = '#fff';
    helpBtn.style.fontWeight = 'bold';
    helpBtn.textContent = '?';
    helpBtn.title = 'Help (H)';
    helpBtn.onclick = () => { this.helpOpen = !this.helpOpen; };
    ui.appendChild(helpBtn);

    // Sell button — only visible when a tower is selected
    const sellBtn = document.createElement('button');
    sellBtn.id = 'btn-sell';
    sellBtn.className = 'btn';
    sellBtn.style.background = '#8b1a1a';
    sellBtn.style.color = '#ffd700';
    sellBtn.style.display = 'none';
    sellBtn.title = 'Sell selected tower (Space)';
    sellBtn.onclick = () => { if (this.selectedTower && !this.paused) this.sellTower(this.selectedTower); };
    ui.appendChild(sellBtn);

    this._updateButtons();
  }

  _selectType(key) {
    if (this.viewMode === '3d-soldier') this._exit3DSoldier();
    this.selectedTower = null; // exit manual-shot mode when switching tool
    this.selectedType = key;
    // Build the list of all button IDs to update
    const campKeys = Object.keys(CAMP_TYPES).map(n => 'camp_' + n);
    const allKeys = [...this.typeKeys, ...this.trapKeys.map(k => 'trap_' + k), ...campKeys];
    for (const k of allKeys) {
      const btn = document.getElementById('btn-' + k);
      if (btn) btn.className = 'btn' + (k === key ? ' selected' : '');
    }
  }

  _updateButtons() {
    for (const k of this.typeKeys) {
      const btn = document.getElementById('btn-' + k);
      if (btn) btn.style.opacity = this.money >= TYPES[k].cost ? '0.9' : '0.35';
    }
    for (const k of this.trapKeys) {
      const btn = document.getElementById('btn-trap_' + k);
      if (btn) btn.style.opacity = this.money >= TRAPS[k].cost ? '0.9' : '0.35';
    }
    // Update all 5 camp type buttons — show current/max so the limit is visible
    for (const [typeName, cfg] of Object.entries(CAMP_TYPES)) {
      const btn = document.getElementById('btn-camp_' + typeName);
      if (!btn) continue;
      const atLimit = this.camps.length >= this.campLimit;
      btn.style.opacity = (this.money >= cfg.cost && !atLimit) ? '0.9' : '0.35';
      btn.textContent = `${cfg.label} (${this.camps.length})`;
    }
    const wBtn = document.getElementById('btn-worker');
    if (wBtn) {
      wBtn.style.opacity = this.money >= 35 && this.workers < 5 ? '0.9' : '0.35';
      wBtn.textContent = `W Worker $35 (${this.workers}/5)`;
    }
    // Sell button — show only when a tower is selected
    const sellBtn = document.getElementById('btn-sell');
    if (sellBtn) {
      if (this.selectedTower) {
        const refund = Math.floor(this.selectedTower.cost / 2);
        sellBtn.textContent = `💰 SELL ($${refund})`;
        sellBtn.style.display = '';
      } else {
        sellBtn.style.display = 'none';
      }
    }
  }

  _setupInput() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      this.mouse.x = mx;
      this.mouse.y = e.clientY - rect.top;

      // Camera drag rotation — only active while dragging in a 3D view
      if (this._3dDragging && (this.viewMode === '3d' || this.viewMode === '3d-soldier')) {
        const delta = mx - this._3dDragLastX;
        this._3dDragLastX = mx;
        this.camYaw += delta * 0.005; // 0.005 rad per pixel — tweak for feel
      }
    });

    this.canvas.addEventListener('mousedown', e => {
      if (this.viewMode === '3d' || this.viewMode === '3d-soldier') {
        const rect = this.canvas.getBoundingClientRect();
        this._3dDragging    = true;
        this._3dDragLastX   = e.clientX - rect.left;
        this._3dDragStartX  = e.clientX - rect.left; // track total drag distance
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this._3dDragging = false;
    });

    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;

      // Handle wheel clicks even from title screen
      if (this.wheelOpen) { this._handleWheelClick(x, y); return; }

      if (this.gameOver || this.levelComplete || this.titleActive) return;
      if (this.paused) return; // can't place or select anything while paused

      // Check loadout USE button clicks
      if (this._loadoutBtnBounds) {
        for (const b of this._loadoutBtnBounds) {
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            const idx = this.activeLoadout.indexOf(b.id);
            if (idx !== -1) {
              this._fireTrigger(b.id);
              this.activeLoadout.splice(idx, 1);
              this.flash(`${b.id.replace('pow_','').replace('sp_','').toUpperCase()} activated!`);
            }
            return;
          }
        }
      }

      // 3D view: exit button or shoot — but suppress if user was rotating camera
      if (this.viewMode === '3d') {
        const openR = this.canvas.width * 0.86;
        if (x > openR - 94 && x < openR + 2 && y > 6 && y < 36) { this._exit3D(); return; }
        // Ignore click if it was a drag rotation (moved > 6px horizontally)
        if (Math.abs(x - (this._3dDragStartX ?? x)) > 6) return;
        this._shoot3D(x, y);
        return;
      }
      // 3D soldier view: exit button or attack
      if (this.viewMode === '3d-soldier') {
        const W = this.canvas.width, openR = W * 0.86;
        if (x > openR - 94 && y < 42) { this._exit3DSoldier(); return; }
        if (Math.abs(x - (this._3dDragStartX ?? x)) > 6) return;
        this._attack3DSoldier(x, y);
        return;
      }
      // Click on soldier → enter 3D soldier view
      const clickedSoldier = this.soldiers.find(s => Math.hypot(s.x-x, s.y-y) < 16);
      if (clickedSoldier) { this._enter3DSoldier(clickedSoldier); return; }

      // Click on tower → second click same tower enters 3D, otherwise fire manual
      if (this.selectedTower) {
        // Second click on the same selected tower → enter 3D view
        if (this.trySelectTower(x, y)) return;
        // Clicked elsewhere — check upgrade panel, then fire manual shot
        if (this._checkUpgradeClick(x, y)) return;
        this.tryFireManual(x, y); return;
      }
      if (this.trySelectTower(x, y)) return;
      if (this.selectedType === 'mine')  { this.tryPlaceMine(x, y); return; }
      // Camp types are named 'camp_basic', 'camp_archer', etc.
      if (this.selectedType.startsWith('camp_')) { this.tryPlaceCamp(x, y); return; }
      if (this.selectedType.startsWith('trap_')) { this.tryPlaceTrap(x, y); }
      else { this.tryPlaceTower(x, y); }
    });

    // Double-click exits whichever 3D control mode is active
    this.canvas.addEventListener('dblclick', () => {
      if (this.viewMode === '3d')         { this._exit3D();         return; }
      if (this.viewMode === '3d-soldier') { this._exit3DSoldier();  return; }
    });

    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.gameOver || this.levelComplete || this.titleActive) return;
      if (this.paused) return; // can't sell while paused
      if (this.viewMode === '3d-soldier') { this._toggleBlock3DSoldier(); return; }
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const tower = this.towers.find(t => distance(t, { x, y }) < 20);
      if (tower) { this.sellTower(tower); return; }
      const trap = this.traps.find(t => Math.hypot(t.x-x, t.y-y) < 22);
      if (trap) { this.sellTrap(trap); return; }
      const camp = this.camps.find(c => Math.hypot(c.x-x, c.y-y) < 30);
      if (camp) {
        const refund = Math.floor(camp.campType.cost / 2);
        this.money = Math.min(this.money + refund, MAX_MONEY);
        this.camps = this.camps.filter(c2 => c2 !== camp);
        this.flash(`Camp sold for $${refund}`);
        this._updateButtons();
        return;
      }
      const mine = this.mines.find(m => Math.hypot(m.x-x, m.y-y) < 22);
      if (mine) {
        const refund = Math.floor(MINE.cost / 2);
        this.money = Math.min(this.money + refund, MAX_MONEY);
        this.mines = this.mines.filter(m2 => m2 !== mine);
        this._assignWorkers();
        this.flash(`Mine sold for $${refund}`);
        this._updateButtons();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'r' || e.key === 'R') { this.restart(); return; }
      if (e.key === 'Escape') {
        if (this.wheelOpen) {
          this.wheelOpen = false;
          if (!this.currentLevel) {
            this.titleActive = true;
            document.getElementById('title-screen').style.display = 'flex';
          }
          return;
        }
        if (this.viewMode === '3d-soldier') { this._exit3DSoldier(); return; }
        if (this.viewMode === '3d') { this._exit3D(); return; }
        this.selectedTower = null; this._updateButtons(); return;
      }
      if (e.code === 'Space' && this.viewMode === '3d-soldier') { e.preventDefault(); this.viewSoldier?.jump(); return; }
      // Space sells the selected tower (if one is selected); otherwise toggles pause
      if (e.code === 'Space' && !this.titleActive && !this.gameOver && !this.levelComplete && this.viewMode !== '3d' && this.viewMode !== '3d-soldier') {
        e.preventDefault();
        if (this.selectedTower && !this.paused) {
          this.sellTower(this.selectedTower);
        } else {
          this.paused = !this.paused;
          const btn = document.getElementById('btn-pause');
          if (btn) btn.textContent = this.paused ? '▶' : '⏸';
        }
        return;
      }
      if ((e.key === 'h' || e.key === 'H') && !this.titleActive) { this.helpOpen = !this.helpOpen; return; }
      if (e.key === 'Escape' && this.helpOpen) { this.helpOpen = false; return; }
      if (this.wheelOpen) return; // don't handle hotkeys while wheel overlay is open
      const allowedTowers = this.currentLevel ? this.currentLevel.towers : this.typeKeys;
      const allowedTraps  = this.currentLevel ? this.currentLevel.traps  : this.trapKeys;
      const i = parseInt(e.key) - 1;
      if (i >= 0 && i < allowedTowers.length) {
        this._selectType(allowedTowers[i]);
      } else {
        const ti = i - allowedTowers.length;
        if (ti >= 0 && ti < allowedTraps.length) this._selectType('trap_' + allowedTraps[ti]);
      }
    });
  }

  // ── Draw helpers ─────────────────────────────────────────────────────────────

  _drawCastleArcher() {
    const ca = this.castleArcher, ctx = this.ctx;
    const hcy = ca.y - 3;
    ctx.fillStyle = '#888'; ctx.fillRect(ca.x-5, hcy+4, 10, 10);
    ctx.fillStyle = '#e8b890'; ctx.fillRect(ca.x-2, hcy-2, 4, 5);
    ctx.beginPath(); ctx.arc(ca.x, hcy-6, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#666';
    ctx.beginPath(); ctx.arc(ca.x, hcy-6, 4, Math.PI, Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(ca.x, hcy-4); ctx.rotate(ca.angle);
    ctx.strokeStyle = '#7a3d0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(2,-7); ctx.quadraticCurveTo(16,0,2,7); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(2,-7); ctx.lineTo(2,7); ctx.stroke();
    if (ca.fireTimer > 0) {
      ctx.strokeStyle = '#c8b860'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(18,0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(18,2); ctx.lineTo(22,0); ctx.closePath(); ctx.fill();
    }
    ctx.lineCap = 'butt'; ctx.restore();
  }

  _drawPathHighlight() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,220,50,0.22)';
    ctx.lineWidth = 48; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
    ctx.stroke();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  }

  _drawAimLine() {
    if (!this.selectedTower) return;
    const reloading = this.selectedTower.manualCooldown > 0;
    if (reloading) {
      const progress = 1 - this.selectedTower.manualCooldown / (this.selectedTower.fireRate * 2);
      this.ctx.strokeStyle = '#f84'; this.ctx.lineWidth = 4; this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.arc(this.selectedTower.x, this.selectedTower.y, 24, -Math.PI/2, -Math.PI/2 + Math.PI*2*progress);
      this.ctx.stroke(); this.ctx.lineCap = 'butt';
    }
    this.ctx.strokeStyle = reloading ? 'rgba(255,100,50,0.5)' : 'rgba(255,255,255,0.6)';
    this.ctx.lineWidth = 1; this.ctx.setLineDash([6,4]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.selectedTower.x, this.selectedTower.y);
    this.ctx.lineTo(this.mouse.x, this.mouse.y);
    this.ctx.stroke(); this.ctx.setLineDash([]);
  }

  _drawCampHpBar() {
    if (this.currentLevel?.id !== 100) return; // only on the final level
    if (this.titanSpawned && this.cutscenePhase === 0) return; // titan already out, hide bar
    const sp = this.path[0];
    const barW = 100, barH = 8;
    const bx = sp.x - 5, by = sp.y - 80;
    const pct = Math.max(0, this.enemyCampHp / this.enemyCampMaxHp);
    // Background
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
    // Health fill — green → yellow → red
    const hue = Math.floor(pct * 120);
    this.ctx.fillStyle = `hsl(${hue},90%,45%)`;
    this.ctx.fillRect(bx, by, barW * pct, barH);
    // Label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 9px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`CAMP  ${Math.ceil(this.enemyCampHp).toLocaleString()} / ${this.enemyCampMaxHp.toLocaleString()}`, bx + barW/2, by - 4);
    this.ctx.textAlign = 'left';
  }

  _drawCutscene() {
    if (this.currentLevel?.id !== 100 || this.cutscenePhase === 0) return;
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const p = this.cutscenePhase === 1 ? 1 - this.cutsceneTimer / 240 : 1;
    const t = Date.now() / 1000;

    // Dark overlay
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.88, p * 1.4)})`;
    ctx.fillRect(0, 0, W, H);

    // Screen shake in phase 2
    const shake = this.cutscenePhase >= 2 ? Math.sin(t * 20) * (this.cutscenePhase === 2 ? 7 : 3) : 0;
    if (shake) { ctx.save(); ctx.translate(shake, shake * 0.4); }

    const titanAlpha = this.cutscenePhase === 1 ? p : 1;
    // Titan rises up from below in phase 1
    const riseOffset = this.cutscenePhase === 1 ? H * 0.22 * (1 - p) : 0;

    ctx.save();
    ctx.globalAlpha = titanAlpha;
    ctx.translate(0, riseOffset);

    const tx = W / 2, ty = H * 0.78;
    const sc = Math.min(W, H) * 0.0028;

    // ── Draw the Titan ─────────────────────────────────────────────────────
    const self = this;
    function drawTitanBody(ctx, tx, ty, s, t) {
      // Ground shockwave / impact glow
      const impactGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, s * 85);
      impactGrad.addColorStop(0,   `rgba(150,0,0,${0.5 + 0.15*Math.sin(t*3)})`);
      impactGrad.addColorStop(0.5, 'rgba(60,0,30,0.2)');
      impactGrad.addColorStop(1,   'transparent');
      ctx.fillStyle = impactGrad;
      ctx.beginPath(); ctx.ellipse(tx, ty, s*90, s*20, 0, 0, Math.PI*2); ctx.fill();

      // Ground cracks
      for (let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2;
        const len = s*(30 + Math.sin(t*1.5+i)*8);
        ctx.strokeStyle = `rgba(180,40,0,${0.4+0.2*Math.sin(t*2+i)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx + Math.cos(a)*s*6, ty + Math.sin(a)*s*3);
        ctx.lineTo(tx + Math.cos(a)*len, ty + Math.sin(a)*len*0.4);
        ctx.stroke();
      }

      // LEGS
      const legW = s*20, legH = s*85;
      const legY = ty - legH;
      for (const [lx, flip] of [[tx - s*16, 1],[tx + s*6, -1]]) {
        const lg = ctx.createLinearGradient(lx, 0, lx+legW, 0);
        lg.addColorStop(0, flip>0?'#0a0a14':'#18152e');
        lg.addColorStop(0.5, '#1e1a30');
        lg.addColorStop(1, flip>0?'#18152e':'#0a0a14');
        ctx.fillStyle = lg;
        ctx.fillRect(lx, legY, legW, legH);
        // Crack glow
        ctx.strokeStyle = `rgba(150,0,255,${0.35+0.2*Math.sin(t*2.5+flip)})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(lx+legW*(flip>0?0.3:0.6),legY+legH*0.1); ctx.lineTo(lx+legW*(flip>0?0.5:0.4),legY+legH*0.5); ctx.lineTo(lx+legW*(flip>0?0.25:0.65),legY+legH*0.75); ctx.stroke();
      }

      // TORSO
      const torsoW = s*70, torsoH = s*95;
      const torsoX = tx - torsoW/2, torsoY = legY - torsoH;
      const tg = ctx.createLinearGradient(torsoX, 0, torsoX+torsoW, 0);
      tg.addColorStop(0,'#06050f'); tg.addColorStop(0.25,'#12102a');
      tg.addColorStop(0.5,'#1a1535'); tg.addColorStop(0.75,'#12102a'); tg.addColorStop(1,'#06050f');
      ctx.fillStyle = tg; ctx.fillRect(torsoX, torsoY, torsoW, torsoH);
      ctx.strokeStyle='rgba(80,40,180,0.25)'; ctx.lineWidth=2; ctx.strokeRect(torsoX,torsoY,torsoW,torsoH);
      // Chest cracks glowing
      ctx.strokeStyle=`rgba(160,40,255,${0.5+0.3*Math.sin(t*2.5)})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(tx-s*4,torsoY+torsoH*0.2); ctx.lineTo(tx+s*7,torsoY+torsoH*0.45); ctx.lineTo(tx-s*2,torsoY+torsoH*0.65); ctx.lineTo(tx+s*10,torsoY+torsoH*0.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx-s*18,torsoY+torsoH*0.3); ctx.lineTo(tx-s*7,torsoY+torsoH*0.55); ctx.stroke();

      // SHOULDERS & SPIKES
      const shW = s*26, shH = s*20;
      for (const [shX,flip] of [[torsoX-shW*0.55,1],[torsoX+torsoW-shW*0.45,-1]]) {
        const sg = ctx.createLinearGradient(shX,0,shX+shW,0);
        sg.addColorStop(0,flip>0?'#08060e':'#141230'); sg.addColorStop(1,flip>0?'#141230':'#08060e');
        ctx.fillStyle=sg;
        ctx.beginPath(); ctx.roundRect(shX,torsoY+s*4,shW,shH,s*3); ctx.fill();
        ctx.strokeStyle='rgba(80,40,180,0.3)'; ctx.lineWidth=1.5; ctx.stroke();
        for (let sp=0;sp<3;sp++){
          const sx=shX+(sp+0.5)*shW/3;
          ctx.fillStyle='#0c0a18';
          ctx.beginPath(); ctx.moveTo(sx-s*2.5,torsoY+s*4); ctx.lineTo(sx,torsoY-s*5); ctx.lineTo(sx+s*2.5,torsoY+s*4); ctx.closePath(); ctx.fill();
          ctx.strokeStyle=`rgba(100,0,255,0.3)`; ctx.lineWidth=0.8; ctx.stroke();
        }
      }

      // ARMS — one raised for swatting (phase 2), one at side
      const armW = s*15, armH = s*80;
      for (const [axPos, side] of [[torsoX-shW*0.4, 'left'],[torsoX+torsoW-s*15+shW*0.05,'right']]) {
        const isSwatArm = side === 'right';
        const swatLift  = isSwatArm && self.cutscenePhase >= 2 ? Math.sin(t*3)*s*25 : 0;
        const ag = ctx.createLinearGradient(axPos,0,axPos+armW,0);
        ag.addColorStop(0,side==='left'?'#080610':'#141030'); ag.addColorStop(1,side==='left'?'#141030':'#080610');
        ctx.fillStyle=ag;
        ctx.beginPath(); ctx.roundRect(axPos, torsoY+s*20-swatLift, armW, armH, s*3); ctx.fill();
        // Glow veins
        ctx.strokeStyle=`rgba(180,0,255,${0.25+0.15*Math.sin(t*2+(side==='left'?0:1))})`; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(axPos+armW*0.5,torsoY+s*25-swatLift); ctx.bezierCurveTo(axPos+armW*0.3,torsoY+s*55-swatLift,axPos+armW*0.6,torsoY+s*70-swatLift,axPos+armW*0.5,torsoY+s*95-swatLift); ctx.stroke();
        // Claws
        const clawY = torsoY+s*20-swatLift+armH;
        for (let c=0;c<4;c++){
          const cx2=axPos+(c+0.5)*armW/4;
          ctx.fillStyle='#0a0814';
          ctx.beginPath(); ctx.moveTo(cx2-s*2,clawY); ctx.lineTo(cx2+(c%2===0?-s*4:s*3),clawY+s*12); ctx.lineTo(cx2+s*2,clawY); ctx.closePath(); ctx.fill();
        }
        // SWAT IMPACT FLASH on phase 2
        if (isSwatArm && self.cutscenePhase === 2) {
          const impactAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
          ctx.fillStyle = `rgba(255,80,0,${impactAlpha * 0.4})`;
          ctx.beginPath(); ctx.ellipse(axPos+armW/2, clawY, s*25, s*10, 0, 0, Math.PI*2); ctx.fill();
        }
      }

      // NECK
      ctx.fillStyle='#0f0d1e'; ctx.fillRect(tx-s*8,torsoY-s*18,s*16,s*20);

      // ── ROUND HEAD — movie titan style ──────────────────────────────────
      const headR = s * 30;   // radius of the round skull
      const headCX = tx;
      const headCY = torsoY - s*18 - headR * 0.82;

      // Head glow aura
      const headAura = ctx.createRadialGradient(headCX, headCY, headR*0.5, headCX, headCY, headR*2.2);
      headAura.addColorStop(0, 'transparent');
      headAura.addColorStop(0.6, `rgba(60,0,120,${0.15+0.08*Math.sin(t*2)})`);
      headAura.addColorStop(1, 'transparent');
      ctx.fillStyle = headAura;
      ctx.beginPath(); ctx.arc(headCX, headCY, headR*2.2, 0, Math.PI*2); ctx.fill();

      // Skull — round, slightly squashed
      const headGrad = ctx.createRadialGradient(headCX-headR*0.3, headCY-headR*0.3, headR*0.1, headCX, headCY, headR);
      headGrad.addColorStop(0, '#1e1835');
      headGrad.addColorStop(0.5, '#14102a');
      headGrad.addColorStop(1, '#06050f');
      ctx.fillStyle = headGrad;
      ctx.beginPath(); ctx.ellipse(headCX, headCY, headR, headR*0.92, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(80,30,160,0.35)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(headCX, headCY, headR, headR*0.92, 0, 0, Math.PI*2); ctx.stroke();

      // Crown spikes — 5 irregular spikes
      const spikeAngles = [-0.55,-0.28,0,0.28,0.55]; // radians from top
      for (const sa of spikeAngles) {
        const baseA = -Math.PI/2 + sa;
        const spH = headR * (0.55 + Math.abs(sa) * 0.1);
        const bx1 = headCX + Math.cos(baseA - 0.12) * headR * 0.88;
        const by1 = headCY + Math.sin(baseA - 0.12) * headR * 0.88;
        const bx2 = headCX + Math.cos(baseA + 0.12) * headR * 0.88;
        const by2 = headCY + Math.sin(baseA + 0.12) * headR * 0.88;
        const tipX = headCX + Math.cos(baseA) * (headR + spH);
        const tipY = headCY + Math.sin(baseA) * (headR + spH);
        ctx.fillStyle = '#0a0818';
        ctx.beginPath(); ctx.moveTo(bx1,by1); ctx.lineTo(tipX,tipY); ctx.lineTo(bx2,by2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle=`rgba(90,0,200,${0.35+0.15*Math.sin(t*2+sa*3)})`; ctx.lineWidth=1; ctx.stroke();
      }

      // Brow ridge — heavy
      ctx.fillStyle='#0a0818';
      ctx.beginPath(); ctx.ellipse(headCX, headCY-headR*0.2, headR*0.85, headR*0.28, 0, Math.PI, Math.PI*2); ctx.fill();

      // EYES — glowing crimson, large and slightly down-turned
      for (const [ex, ey] of [[headCX-headR*0.38, headCY-headR*0.1],[headCX+headR*0.38, headCY-headR*0.1]]) {
        // Socket
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(ex, ey, headR*0.22, headR*0.16, 0, 0, Math.PI*2); ctx.fill();
        // Glow corona
        const eyeG = ctx.createRadialGradient(ex, ey, 0, ex, ey, headR*0.35);
        eyeG.addColorStop(0, `rgba(255,30,0,${0.8+0.2*Math.sin(t*4)})`);
        eyeG.addColorStop(0.5, `rgba(200,0,40,${0.4+0.15*Math.sin(t*4)})`);
        eyeG.addColorStop(1, 'transparent');
        ctx.fillStyle=eyeG;
        ctx.beginPath(); ctx.ellipse(ex, ey, headR*0.35, headR*0.28, 0, 0, Math.PI*2); ctx.fill();
        // Iris
        ctx.fillStyle=`rgb(${200+Math.floor(55*Math.sin(t*5))},0,0)`;
        ctx.beginPath(); ctx.ellipse(ex, ey, headR*0.18, headR*0.14, 0, 0, Math.PI*2); ctx.fill();
        // Vertical slit pupil
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(ex, ey, headR*0.04, headR*0.12, 0, 0, Math.PI*2); ctx.fill();
      }

      // NOSE — two nostrils, low on the round face
      ctx.fillStyle='rgba(0,0,0,0.8)';
      ctx.beginPath(); ctx.ellipse(headCX-headR*0.12, headCY+headR*0.22, headR*0.08, headR*0.06, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(headCX+headR*0.12, headCY+headR*0.22, headR*0.08, headR*0.06, 0.3, 0, Math.PI*2); ctx.fill();

      // MOUTH — wide grin with rows of teeth
      const mouthY = headCY + headR * 0.55;
      const mouthW = headR * 0.78;
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.ellipse(headCX, mouthY, mouthW, headR*0.2, 0, 0, Math.PI); ctx.fill();
      // Bottom teeth (jagged)
      for (let i=-4;i<=4;i++){
        const tx2 = headCX + i * mouthW/4.5;
        ctx.fillStyle = i%2===0?'#ccccaa':'#bbbb99';
        ctx.beginPath(); ctx.moveTo(tx2-mouthW/10,mouthY); ctx.lineTo(tx2,mouthY+headR*0.16); ctx.lineTo(tx2+mouthW/10,mouthY); ctx.closePath(); ctx.fill();
      }
      // Top teeth (smaller)
      for (let i=-3;i<=3;i++){
        const tx2 = headCX + i * mouthW/3.5;
        ctx.fillStyle='#ccccaa';
        ctx.beginPath(); ctx.moveTo(tx2-mouthW/12,mouthY); ctx.lineTo(tx2,mouthY-headR*0.12); ctx.lineTo(tx2+mouthW/12,mouthY); ctx.closePath(); ctx.fill();
      }

      // Dark energy aura around whole titan
      const aura = ctx.createRadialGradient(tx, torsoY+torsoH*0.4, s*15, tx, torsoY+torsoH*0.4, s*110);
      aura.addColorStop(0,'transparent');
      aura.addColorStop(0.55,`rgba(50,0,100,${0.12+0.07*Math.sin(t*2)})`);
      aura.addColorStop(1,'transparent');
      ctx.fillStyle=aura;
      ctx.beginPath(); ctx.ellipse(tx,torsoY+torsoH*0.4,s*110,s*150,0,0,Math.PI*2); ctx.fill();

      // Rising dark particles
      for (let pi=0;pi<12;pi++){
        const pt2=(t*0.7+pi*0.22)%1;
        const px2=tx+Math.sin(pi*2.1+t)*s*35;
        const py2=(torsoY+torsoH)-pt2*s*180;
        const pa=pt2<0.2?pt2/0.2:pt2>0.8?(1-pt2)/0.2:1;
        ctx.fillStyle=`rgba(${pi%2===0?160:90},0,${pi%2===0?40:180},${pa*0.55})`;
        ctx.beginPath(); ctx.arc(px2,py2,s*(1.3+Math.sin(pi+t*2)*0.8),0,Math.PI*2); ctx.fill();
      }
    }

    drawTitanBody(ctx, tx, ty, sc, t);
    ctx.restore(); // restore globalAlpha / riseOffset

    // ── Draw flung soldiers ─────────────────────────────────────────────────
    if (this.cutscenePhase >= 2) {
      for (const a of this._cutsceneActors) {
        if (a.dead && a.kind !== 'strong') continue;
        ctx.save();
        ctx.globalAlpha = a.alpha;
        if (a.kind === 'weak') {
          // Small circle with blood-red flash
          ctx.fillStyle = a.bounced ? 'rgba(180,0,0,0.4)' : '#c09030';
          ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, Math.PI*2); ctx.fill();
        } else {
          // Armored soldier silhouette — simple stick figure
          const hit = a.hp < 3;
          ctx.fillStyle = hit ? '#ff4444' : '#8899aa';
          ctx.fillRect(a.x-4, a.y-8, 8, 10); // torso
          ctx.beginPath(); ctx.arc(a.x, a.y-12, 5, 0, Math.PI*2); ctx.fill(); // head
          ctx.strokeStyle = hit ? '#ff6666' : '#667788'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(a.x-8,a.y-4); ctx.lineTo(a.x+8,a.y-4); ctx.stroke(); // arms
          ctx.beginPath(); ctx.moveTo(a.x,a.y+2); ctx.lineTo(a.x-5,a.y+14); ctx.stroke(); // left leg
          ctx.beginPath(); ctx.moveTo(a.x,a.y+2); ctx.lineTo(a.x+5,a.y+14); ctx.stroke(); // right leg
          if (hit) {
            // Damage flash
            ctx.fillStyle='rgba(255,0,0,0.4)';
            ctx.beginPath(); ctx.arc(a.x, a.y-6, 8, 0, Math.PI*2); ctx.fill();
          }
        }
        // Speed trail
        if (!a.dead && (Math.abs(a.vx) > 1 || Math.abs(a.vy) > 1)) {
          ctx.strokeStyle = `rgba(255,120,0,${a.alpha * 0.4})`;
          ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.vx*4, a.y - a.vy*4); ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ── Cinematic text ──────────────────────────────────────────────────────
    ctx.save();
    ctx.textAlign = 'center';

    if (this.cutscenePhase === 1) {
      ctx.shadowColor='#ff0000'; ctx.shadowBlur=50;
      ctx.fillStyle=`rgba(255,30,0,${p})`;
      ctx.font=`bold ${Math.floor(W*0.058)}px sans-serif`;
      ctx.fillText('THE CAMP FALLS!', W/2, H*0.10);
      ctx.shadowColor='#ffaa00'; ctx.shadowBlur=18;
      ctx.fillStyle=`rgba(255,200,50,${p})`;
      ctx.font=`bold ${Math.floor(W*0.026)}px sans-serif`;
      ctx.fillText('Something stirs beneath the ruins...', W/2, H*0.17);
    }

    if (this.cutscenePhase === 2) {
      ctx.shadowColor='#cc00ff'; ctx.shadowBlur=55;
      const pulse = 0.88 + 0.12*Math.sin(t*6);
      ctx.fillStyle=`rgb(${200+Math.floor(55*Math.sin(t*5))},0,${200+Math.floor(55*Math.sin(t*4))})`;
      ctx.font=`bold ${Math.floor(W*0.056*pulse)}px sans-serif`;
      ctx.fillText('⚡ THE TITAN AWAKENS! ⚡', W/2, H*0.09);
      ctx.shadowColor='#ff2200'; ctx.shadowBlur=25;
      ctx.fillStyle='#ffcc44';
      ctx.font=`bold ${Math.floor(W*0.022)}px sans-serif`;
      ctx.fillText('Soldiers are crushed like insects.', W/2, H*0.17);
      ctx.fillStyle='rgba(255,80,80,0.85)';
      ctx.fillText('Destroy it — or the world falls.', W/2, H*0.215);
    }

    ctx.shadowBlur=0; ctx.restore();
    if (shake) ctx.restore();
  }

  _drawHUD() {
    const ctx = this.ctx;
    const hpFrac = this.castleHp / this.castleMaxHp;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(9, 5, 182, 16);
    ctx.fillStyle = hpFrac > 0.5 ? '#2288ff' : hpFrac > 0.25 ? '#ff9900' : '#ff3333';
    ctx.fillRect(10, 6, 180 * hpFrac, 14);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(10, 6, 180, 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`Castle  ${Math.ceil(this.castleHp)} / ${this.castleMaxHp}`, 14, 16);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fff';    ctx.fillText(`Kills: ${this.score}`, 200, 22);
    ctx.fillStyle = '#ffd700'; ctx.fillText(`$${this.money}`, 305, 22);
    ctx.fillStyle = '#7df';    ctx.fillText(`Wave: ${this.waveManager.wave}${this.currentLevel ? '/'+this.currentLevel.waves : ''}`, 375, 22);
    ctx.fillStyle = 'rgba(255,215,0,0.85)';
    ctx.fillText(`Mines:${this.mines.length}  Workers:${this.workers}/5`, 490, 22);
    if (this.currentLevel) {
      ctx.fillStyle = 'rgba(180,180,255,0.8)';
      ctx.fillText(`LV${this.currentLevel.id} ${this.currentLevel.name}`, this.canvas.width - 180, 22);
    }

    // Active power-up indicators
    let px = 700;
    ctx.font = 'bold 12px sans-serif';
    if (this.rageTimer     > 0) { ctx.fillStyle='#ff6600'; ctx.fillText(`🔥RAGE ${Math.ceil(this.rageTimer/60)}s`, px, 22); px += 90; }
    if (this.shieldTimer   > 0) { ctx.fillStyle='#88aaff'; ctx.fillText(`🛡 ${Math.ceil(this.shieldTimer/60)}s`, px, 22); px += 60; }
    if (this.timeSlowTimer > 0) { ctx.fillStyle='#aabbff'; ctx.fillText(`⏳SLOW ${Math.ceil(this.timeSlowTimer/60)}s`, px, 22); px += 90; }
    if (this.poisonTimer   > 0) { ctx.fillStyle='#88ff44'; ctx.fillText(`☠POISON ${Math.ceil(this.poisonTimer/60)}s`, px, 22); }

    // Gem balance shown in-game so players know what they've earned
    ctx.fillStyle = '#88eeff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`💎 ${this.gems}`, this.canvas.width - 80, 38);

    // ── Upgrade panel (shown when a tower is selected) ──────────────────────
    if (this.selectedTower) {
      const t = this.selectedTower;
      const W = this.canvas.width;
      const panelW = 220, panelH = 40, panelX = W/2 - panelW/2, panelY = this.canvas.height - 56;

      // Remember the upgrade panel bounds so click handler can check them
      this._upgradePanelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(panelX - 4, panelY - 4, panelW + 8, panelH + 8);

      if (t.level >= 3) {
        // Already max level
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ MAX LEVEL ⭐', W/2, panelY + 26);
        ctx.textAlign = 'left';
      } else {
        const nextLevel = t.level + 1;
        const cost = Math.floor(t.cost * UPGRADE_COST[nextLevel]);
        const canAfford = this.money >= cost;
        // Draw the upgrade button
        ctx.fillStyle = canAfford ? '#224422' : '#442222';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = canAfford ? '#44ff44' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        ctx.fillStyle = canAfford ? '#aaffaa' : '#ffaaaa';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⬆ UPGRADE to Lv${nextLevel}: $${cost}`, W/2, panelY + 25);
        ctx.textAlign = 'left';
      }
    } else {
      this._upgradePanelBounds = null;
    }

    // Active loadout items — USE buttons shown during gameplay
    if (this.activeLoadout.length > 0) {
      const ITEM_ICONS = {
        pow_airstrike:'✈️', pow_meteor:'☄️', pow_freeze:'❄️',
        pow_lightning:'⚡', pow_poison:'☠️', sp_nuke:'💣', sp_berserk:'😤'
      };
      const ITEM_NAMES = {
        pow_airstrike:'AIRSTRIKE', pow_meteor:'METEOR', pow_freeze:'FREEZE',
        pow_lightning:'LIGHTNING', pow_poison:'POISON', sp_nuke:'NUKE', sp_berserk:'BERSERK'
      };
      this._loadoutBtnBounds = [];
      const btnW = 68, btnH = 36, gap = 6;
      const totalW = this.activeLoadout.length * (btnW + gap) - gap;
      let bx = this.canvas.width / 2 - totalW / 2;
      const by = this.canvas.height - 58;
      for (let i = 0; i < this.activeLoadout.length; i++) {
        const id = this.activeLoadout[i];
        // Button background
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(bx, by, btnW, btnH, 6); ctx.fill(); ctx.stroke();
        // Icon + label
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(ITEM_ICONS[id] || '⚡', bx + 18, by + 24);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(ITEM_NAMES[id] || id.toUpperCase(), bx + btnW*0.62, by + 15);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '8px sans-serif';
        ctx.fillText('CLICK TO USE', bx + btnW*0.62, by + 27);
        ctx.textAlign = 'left';
        // Store bounds for click detection
        this._loadoutBtnBounds.push({ id, x: bx, y: by, w: btnW, h: btnH });
        bx += btnW + gap;
      }
    } else {
      this._loadoutBtnBounds = [];
    }
  }

  // Check if a click lands on the upgrade button panel
  _checkUpgradeClick(x, y) {
    const b = this._upgradePanelBounds;
    if (!b) return false;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (this.selectedTower) this.tryUpgradeTower(this.selectedTower);
      return true;
    }
    return false;
  }

  _drawBreakOverlay() {
    if (!this.waveManager.inBreak || this.gameOver || this.levelComplete) return;
    const ctx = this.ctx;
    const sec  = Math.ceil(this.waveManager.breakTimer / 60);
    const wave = this.waveManager.wave;
    const maxW = this.currentLevel ? this.currentLevel.waves : '?';
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7df'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText(wave === 0 ? 'Place your towers and camps!' : `Wave ${wave}/${maxW} cleared!`, this.canvas.width/2, this.canvas.height/2-20);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Wave ${wave+1} starts in ${sec}...`, this.canvas.width/2, this.canvas.height/2+20);
    ctx.fillStyle = 'rgba(255,215,0,0.6)'; ctx.font = '14px sans-serif';
    ctx.fillText('Tip: Place Camps to spawn soldiers! Press P to open the Shop for power-ups!', this.canvas.width/2, this.canvas.height/2+55);
    ctx.textAlign = 'left';
  }

  _drawFlash() {
    if (this.flashTimer <= 0) return;
    this.ctx.fillStyle = `rgba(255,80,80,${this.flashTimer/120})`;
    this.ctx.font = 'bold 22px sans-serif'; this.ctx.textAlign = 'center';
    this.ctx.fillText(this.flashMsg, this.canvas.width/2, this.canvas.height/2);
    this.ctx.textAlign = 'left';
  }

  // ── Opening story banner — cinematic text overlay at level start ──────────
  _drawStoryBanner() {
    if (this.storyBannerTimer <= 0) return;
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const total = 360;
    const t = this.storyBannerTimer;
    // Fade in during first 60 frames, hold, fade out during last 80 frames
    const alpha = t > total - 60  ? (total - t) / 60       // fade in
                : t < 80          ? t / 80                  // fade out
                : 1;                                        // hold

    // Cinematic letterbox bars top + bottom
    const barH = H * 0.16;
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.92})`;
    ctx.fillRect(0, 0, W, barH);
    ctx.fillRect(0, H - barH, W, barH);

    // Semi-dark strip behind title text
    const stripH = 90;
    const stripY = H * 0.40;
    const stripGrad = ctx.createLinearGradient(0, stripY, 0, stripY + stripH);
    stripGrad.addColorStop(0, `rgba(0,0,0,0)`);
    stripGrad.addColorStop(0.3, `rgba(0,0,0,${alpha * 0.72})`);
    stripGrad.addColorStop(0.7, `rgba(0,0,0,${alpha * 0.72})`);
    stripGrad.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = stripGrad;
    ctx.fillRect(0, stripY, W, stripH);

    ctx.save();
    ctx.textAlign = 'center';

    // Level number — small letterspaced label
    ctx.fillStyle = `rgba(200,180,100,${alpha * 0.6})`;
    ctx.font = `bold ${Math.floor(W * 0.016)}px sans-serif`;
    ctx.letterSpacing = '4px';
    ctx.fillText(`— LEVEL ${this.currentLevel?.id ?? ''} —`, W / 2, H * 0.42);
    ctx.letterSpacing = '0px';

    // Level name — large dramatic title
    const isFinal = this.currentLevel?.id === 100;
    ctx.shadowColor = isFinal ? '#ff2200' : '#ffcc44';
    ctx.shadowBlur  = 28 * alpha;
    ctx.fillStyle   = `rgba(${isFinal ? '255,80,40' : '255,215,80'},${alpha})`;
    ctx.font = `900 ${Math.floor(W * 0.048)}px sans-serif`;
    ctx.fillText(this.storyBannerTitle, W / 2, H * 0.485);
    ctx.shadowBlur = 0;

    // Description text — wrap into two lines if needed
    ctx.fillStyle = `rgba(210,210,230,${alpha * 0.82})`;
    ctx.font = `${Math.floor(W * 0.020)}px sans-serif`;
    const words = this.storyBannerText.split(' ');
    let line1 = '', line2 = '';
    // Simple split: first ~half the words on line 1
    const half = Math.ceil(words.length / 2);
    // But break at punctuation/em-dash if possible
    let splitAt = half;
    for (let i = 2; i < words.length - 1; i++) {
      if (words[i].endsWith('.') || words[i].endsWith('—') || words[i].endsWith(',')) { splitAt = i + 1; break; }
    }
    line1 = words.slice(0, splitAt).join(' ');
    line2 = words.slice(splitAt).join(' ');
    ctx.fillText(line1, W / 2, H * 0.535);
    if (line2) ctx.fillText(line2, W / 2, H * 0.562);

    ctx.restore();
  }

  // ── Wave announcement banner — dramatic text when each wave begins ─────────
  _drawWaveBanner() {
    if (this.waveBannerTimer <= 0) return;
    const ctx = this.ctx, W = this.canvas.width;
    const total = 150;
    const t = this.waveBannerTimer;
    const alpha = t > total - 30 ? (total - t) / 30
                : t < 40         ? t / 40
                : 1;
    const wave = this._lastAnnouncedWave;
    const isFinal = this.currentLevel?.id === 100;
    const color = isFinal ? `rgba(255,60,40,${alpha})` : `rgba(255,220,60,${alpha})`;
    const glowColor = isFinal ? '#ff2200' : '#ffaa00';

    ctx.save();
    ctx.textAlign = 'center';

    // Wave number — small label
    ctx.fillStyle = `rgba(200,200,200,${alpha * 0.55})`;
    ctx.font = `bold ${Math.floor(W * 0.018)}px sans-serif`;
    ctx.fillText(`WAVE  ${wave}`, W / 2, 58);

    // Dramatic message — punchy line
    ctx.shadowColor = glowColor; ctx.shadowBlur = 18 * alpha;
    ctx.fillStyle = color;
    ctx.font = `900 ${Math.floor(W * 0.038)}px sans-serif`;
    ctx.fillText(this.waveBannerText, W / 2, 92);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ── Cinematic boss health bar — shown while the Titan is alive ───────────
  _drawTitanBossBar() {
    if (!this.titanSpawned) return;
    const titan = this.enemies.find(e => e.isTitan);
    if (!titan) return;

    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const barW = Math.min(W * 0.6, 480);
    const barH = 22;
    const bx   = (W - barW) / 2;
    const by   = H - 52;
    const pct  = Math.max(0, titan.hp / titan.maxHp);

    ctx.save();
    ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 22;
    ctx.fillStyle   = 'rgba(0,0,0,0.75)';
    ctx.beginPath(); ctx.roundRect(bx - 12, by - 26, barW + 24, barH + 44, 10); ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.textAlign = 'center';
    ctx.font      = `bold ${Math.floor(W * 0.022)}px sans-serif`;
    const pulse   = 0.78 + 0.22 * Math.sin(Date.now() / 300);
    ctx.fillStyle = `rgba(255,${Math.floor(80 * pulse)},40,${pulse})`;
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12 * pulse;
    ctx.fillText('⚡  ANCIENT TITAN  ⚡', W / 2, by - 6);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = 'rgba(60,0,0,0.9)';
    ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 5); ctx.fill();

    if (pct > 0) {
      const grad = ctx.createLinearGradient(bx, 0, bx + barW * pct, 0);
      grad.addColorStop(0, '#cc0000'); grad.addColorStop(0.5, '#ee3300'); grad.addColorStop(1, '#7700cc');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(bx, by, barW * pct, barH, 5); ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.roundRect(bx, by, barW * pct, barH * 0.45, 4); ctx.fill();

    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(W * 0.016)}px sans-serif`;
    ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    ctx.fillText(`${Math.ceil(titan.hp).toLocaleString()}  /  ${titan.maxHp.toLocaleString()}`, W / 2, by + barH - 4);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawHint() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.35)'; this.ctx.font = '13px sans-serif';
    let hint;
    if (this.selectedTower) {
      hint = 'Click to shoot · Esc to release · right-click to sell';
    } else if (this.selectedType === 'mine') {
      hint = 'Click grass to place mine · hire Workers to collect gold automatically';
    } else if (this.selectedType.startsWith('trap_')) {
      const key = this.selectedType.replace('trap_', '');
      hint = TRAPS[key].onPath === false
        ? 'Click off road to place wall · right-click to sell'
        : 'Click glowing road to place trap · right-click to sell';
    } else if (this.selectedType.startsWith('camp_')) {
      hint = 'Click off road to place camp · right-click to sell';
    } else {
      hint = '1-8 towers · traps · W worker · right-click sell · R = menu';
    }
    this.ctx.fillText(hint, this.canvas.width/2-320, 22);
  }

  _drawPauseOverlay() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('⏸ PAUSED', W/2, H/2 - 20);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '22px sans-serif';
    ctx.fillText('Press SPACE to resume', W/2, H/2 + 30);
    ctx.textAlign = 'left';
  }

  _drawHelpOverlay() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const pw = Math.min(700, W - 40), ph = Math.min(540, H - 40);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    // Background panel
    ctx.fillStyle = 'rgba(10,10,30,0.93)';
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 12); ctx.fill();
    ctx.strokeStyle = '#446'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 12); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText('HOW TO PLAY', W/2, py + 38);

    ctx.textAlign = 'left';
    const col1 = px + 28, col2 = px + pw/2 + 14;
    let y = py + 70;

    ctx.fillStyle = '#88ccff'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText('CONTROLS', col1, y);
    ctx.fillStyle = '#ddd'; ctx.font = '13px sans-serif';
    const controls = [
      'Click map = place selected tower/trap',
      'Right-click tower = sell it',
      'Click tower twice = enter 3D view',
      'Drag in 3D view = look around',
      'Click in 3D view = shoot enemy',
      'SPACE = pause / resume',
      'H = open/close this help screen',
      'ESC = exit 3D / deselect',
      'R = return to main menu',
    ];
    for (const line of controls) { y += 18; ctx.fillText('• ' + line, col1, y); }

    y = py + 70;
    ctx.fillStyle = '#88ccff'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText('TOWERS', col2, y);
    ctx.fillStyle = '#ddd'; ctx.font = '13px sans-serif';
    const towers = [
      'Basic — cheap balanced starter',
      'Sniper — long range, high damage',
      'Rapid — fast fire, lower damage',
      'Fire — burns enemies over time',
      'Ice — slows enemies down',
      'Lightning — chains to nearby foes',
      'Earth — stuns enemies briefly',
    ];
    for (const line of towers) { y += 18; ctx.fillText('• ' + line, col2, y); }

    y += 30;
    ctx.fillStyle = '#ffaa44'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ENEMIES', col2, y);
    ctx.fillStyle = '#ddd'; ctx.font = '13px sans-serif';
    const enemies = [
      'Goblin — small, weak, fast swarms',
      'Runner — quick, shoots back at towers',
      'Saboteur — seeks and destroys traps',
      'Ogre — slow but very tanky',
      'Dragon — large, breathes fire',
      'DragonRider — boss, combo attacks',
    ];
    for (const line of enemies) { y += 18; ctx.fillText('• ' + line, col2, y); }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '13px sans-serif';
    ctx.fillText('Press H or ESC to close', W/2, py + ph - 14);
    ctx.textAlign = 'left';
  }

  _drawGameOver() {
    if (!this.gameOver) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 64px sans-serif';
    ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2-30);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText(`Survived ${this.waveManager.wave} waves  •  ${this.score} kills`, this.canvas.width/2, this.canvas.height/2+20);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '18px sans-serif';
    ctx.fillText('Press R to return to the menu', this.canvas.width/2, this.canvas.height/2+60);
    ctx.textAlign = 'left';
  }

  _drawLevelComplete() {
    if (!this.levelComplete) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 58px sans-serif';
    ctx.fillText('LEVEL COMPLETE!', this.canvas.width/2, this.canvas.height/2-40);
    ctx.fillStyle = '#7df'; ctx.font = '26px sans-serif';
    ctx.fillText(`${this.currentLevel.name} cleared  •  ${this.score} kills`, this.canvas.width/2, this.canvas.height/2+10);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '18px sans-serif';
    const nxt = LEVELS.find(l => l.id === this.currentLevel.id + 1);
    ctx.fillText(nxt ? `Level ${nxt.id} — "${nxt.name}" unlocked!` : 'You beat all 100 levels! Legendary!', this.canvas.width/2, this.canvas.height/2+48);
    ctx.fillText('Press R to return to the menu', this.canvas.width/2, this.canvas.height/2+82);
    ctx.textAlign = 'left';
  }

  // ── Loadout — apply consumables queued from the gem shop ─────────────────────
  // Called at the start of each level. Immediate items apply now; trigger items
  // wait in _pendingTriggers until the first wave enemy spawns.
  _applyConsumables() {
    for (const id of this.pendingConsumables) {
      switch (id) {
        // ── Allies (spawn immediately) ────────────────────────────────────────
        case 'ally_dragon': {
          const pe = this.path[this.path.length - 1];
          const s = new Soldier(pe.x - 30, pe.y - 20, { soldierHp: 200, soldierDmg: 30 }, 'basic');
          s.waypoint = this.path.length - 1; s.speed = 1.8;
          this.soldiers.push(s); break;
        }
        case 'ally_knight': {
          const pe = this.path[this.path.length - 1];
          for (let i = 0; i < 3; i++) {
            const s = new Soldier(pe.x - 20 + i * 15, pe.y - 15, { soldierHp: 100, soldierDmg: 15 }, 'knight');
            s.waypoint = this.path.length - 1;
            this.soldiers.push(s);
          } break;
        }
        case 'ally_wizard': {
          const pe = this.path[this.path.length - 1];
          const s = new Soldier(pe.x - 30, pe.y - 20, { soldierHp: 60, soldierDmg: 25, magic: true }, 'mage');
          s.waypoint = this.path.length - 1; s.speed = 1.2;
          this.soldiers.push(s); break;
        }
        case 'ally_golem': {
          const pe = this.path[this.path.length - 1];
          const s = new Soldier(pe.x - 30, pe.y - 20, { soldierHp: 300, soldierDmg: 10 }, 'siege');
          s.waypoint = this.path.length - 1; s.speed = 0.5;
          this.soldiers.push(s); break;
        }
        // ── Immediate buffs ──────────────────────────────────────────────────
        case 'pow_heal': {
          const h = Math.floor(this.castleMaxHp * 0.2);
          this.castleHp = Math.min(this.castleHp + h, this.castleMaxHp); break;
        }
        case 'pow_rage':   this.rageTimer    = 30 * 60; break;
        case 'pow_shield': this.shieldTimer  = 10 * 60; break;
        case 'pow_time':   this.timeSlowTimer = 20 * 60; break;
        case 'sp_angel':   this.shieldTimer  = 60 * 60; break;
        // ── Level-long upgrades ──────────────────────────────────────────────
        case 'upg_dmg':    for (const t of this.towers) t.damage  *= 1.25; break;
        case 'upg_range':  for (const t of this.towers) t.range   *= 1.2;  break;
        case 'upg_gold':   this.goldBonus *= 1.3; break;
        case 'upg_castle': {
          const old = this.castleMaxHp;
          this.castleMaxHp = Math.floor(old * 1.5);
          this.castleHp += this.castleMaxHp - old; break;
        }
        case 'upg_speed':  this.swiftSoldiers = true;  for (const s of this.soldiers) s.speed *= 1.5; break;
        case 'upg_spawn':  this.rapidSpawnActive = true; break;
        case 'upg_armor':  this.armorActive = true; break;
        case 'upg_bounce': this.bounceActive = true; for (const t of this.towers) t.bounceShot = true; break;
        case 'upg_multi':  this.multiShotActive = true; for (const t of this.towers) t.multiShot = true; break;
        case 'upg_regen':  this.regenActive = true; break;
        // ── First-wave triggers (queue until wave 1 enemies appear) ──────────
        case 'pow_airstrike':
        case 'pow_meteor':
        case 'pow_freeze':
        case 'pow_lightning':
        case 'pow_poison':
        case 'sp_nuke':
        case 'sp_berserk':
          this.activeLoadout.push(id); break;   // player clicks USE button during gameplay
        // ── Clone: duplicate first tower ─────────────────────────────────────
        case 'sp_clone': {
          const src = this.towers[0];
          if (src) {
            const angle = Math.random() * Math.PI * 2;
            const clone = new Tower(src.x + Math.cos(angle) * 55, src.y + Math.sin(angle) * 55, src.typeKey);
            clone.damage = src.damage; clone.range = src.range;
            clone.fireRate = src.fireRate; clone.level = src.level;
            this.towers.push(clone);
          } break;
        }
      }
    }
    this.pendingConsumables = []; // clear after applying
  }

  // Fire a single trigger item when the first wave enemy appears
  _fireTrigger(id) {
    switch (id) {
      case 'pow_airstrike': for (const e of this.enemies) e.takeDamage(30);  break;
      case 'pow_meteor':    for (const e of this.enemies) e.takeDamage(999); break;
      case 'pow_freeze':    this.timeSlowTimer = 300; this._grantAchievement('freeze'); break;
      case 'pow_lightning': {
        const targets = [...this.enemies].sort(() => Math.random() - 0.5).slice(0, 10);
        for (const e of targets) e.takeDamage(20); break;
      }
      case 'pow_poison':  this.poisonTimer  = 5 * 60;  break;
      case 'sp_nuke':     for (const e of this.enemies) e.takeDamage(99999); this._grantAchievement('nuke'); break;
      case 'sp_berserk':  this.berserkTimer = 15 * 60; break;
    }
  }

  // ── Daily Wheel ───────────────────────────────────────────────────────────────
  // Prize list for the spinning wheel
  _getWheelPrizes() {
    return [
      { label:'+200g',    icon:'💰', color:'#ffd700' },
      { label:'+100g',    icon:'💵', color:'#ffaa00' },
      { label:'+50g',     icon:'🪙', color:'#cc8800' },
      { label:'Airstrike',icon:'✈️', color:'#4488ff' },
      { label:'Freeze',   icon:'❄️', color:'#88ddff' },
      { label:'+1 Life',  icon:'❤️', color:'#ff4444' },
      { label:'+3 Lives', icon:'💖', color:'#ff88aa' },
      { label:'Nothing',  icon:'😢', color:'#666666' },
      { label:'+500g',    icon:'🤑', color:'#ffff00' },
      { label:'Dragon!',  icon:'🐉', color:'#44cc44' },
      // Rare gem prizes — only 2 slots out of 12 so they're hard to land on!
      { label:'+1 Gem',   icon:'💎', color:'#2288cc' },
      { label:'+3 Gems',  icon:'💎', color:'#0044aa' },
    ];
  }

  // Draw the spinning wheel overlay
  _drawWheel() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const prizes = this._getWheelPrizes();
    const sliceAngle = (Math.PI * 2) / prizes.length;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎡 DAILY SPIN', W/2, H/2 - 200);

    const cx = W/2, cy = H/2 - 30, radius = 160;

    // Draw each pie slice
    for (let i = 0; i < prizes.length; i++) {
      const startA = this.wheelAngle + i * sliceAngle;
      const endA   = startA + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = prizes[i].color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label in the slice
      const midA = startA + sliceAngle / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(midA) * radius * 0.65, cy + Math.sin(midA) * radius * 0.65);
      ctx.rotate(midA + Math.PI/2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(prizes[i].label, 0, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2);
    ctx.fillStyle = '#333'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();

    // Pointer arrow (at the top of the wheel)
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 10);
    ctx.lineTo(cx - 12, cy - radius + 14);
    ctx.lineTo(cx + 12, cy - radius + 14);
    ctx.closePath(); ctx.fill();

    // Spin button or result
    if (this.wheelResult) {
      // Show the result
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`You won: ${this.wheelResult.icon} ${this.wheelResult.label}!`, W/2, H/2 + 170);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px sans-serif';
      ctx.fillText('Reward will apply when you start the next level!', W/2, H/2 + 200);
      // Close button
      ctx.fillStyle = '#224422';
      ctx.fillRect(W/2 - 60, H/2 + 210, 120, 36);
      ctx.strokeStyle = '#44ff44'; ctx.lineWidth = 2;
      ctx.strokeRect(W/2 - 60, H/2 + 210, 120, 36);
      ctx.fillStyle = '#aaffaa'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('CLOSE', W/2, H/2 + 234);
      this._wheelCloseBounds = { x: W/2 - 60, y: H/2 + 210, w: 120, h: 36 };
    } else if (this.wheelSpinning) {
      ctx.fillStyle = 'rgba(200,200,200,0.5)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Spinning...', W/2, H/2 + 155);
      this._wheelSpinBounds = null;
    } else {
      // Spin button
      const alreadySpun = localStorage.getItem('td_last_spin') === new Date().toDateString();
      ctx.fillStyle = alreadySpun ? '#443333' : '#224422';
      ctx.fillRect(W/2 - 80, H/2 + 145, 160, 40);
      ctx.strokeStyle = alreadySpun ? '#ff4444' : '#44ff44';
      ctx.lineWidth = 2; ctx.strokeRect(W/2 - 80, H/2 + 145, 160, 40);
      ctx.fillStyle = alreadySpun ? '#ff8888' : '#aaffaa';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(alreadySpun ? 'Already spun today!' : '🎡 SPIN!', W/2, H/2 + 172);
      this._wheelSpinBounds = alreadySpun ? null : { x: W/2 - 80, y: H/2 + 145, w: 160, h: 40 };
    }

    // ESC to close hint
    ctx.fillStyle = 'rgba(180,180,180,0.5)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Press ESC to close', W/2, H - 30);
    ctx.textAlign = 'left';
  }

  // Handle clicks in the wheel overlay
  _handleWheelClick(x, y) {
    // Spin button
    if (this._wheelSpinBounds) {
      const b = this._wheelSpinBounds;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        // Start spinning!
        this.wheelSpinning = true;
        this.wheelResult   = null;
        this.wheelSpeed    = 0.18 + Math.random() * 0.12; // random starting speed
        localStorage.setItem('td_last_spin', new Date().toDateString());
        this._grantAchievement('daily_spin');
      }
    }
    // Close button (shown after result)
    if (this._wheelCloseBounds) {
      const b = this._wheelCloseBounds;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.wheelOpen = false;
        // If we came from title screen, go back to it
        if (!this.currentLevel) {
          this.titleActive = true;
          document.getElementById('title-screen').style.display = 'flex';
          this._buildTitleScreen(); // refresh to show "done" on the button
        }
      }
    }
  }

  // Called when the wheel stops — pick the prize based on final angle
  _resolveWheelPrize() {
    const prizes = this._getWheelPrizes();
    const sliceAngle = (Math.PI * 2) / prizes.length;
    // The pointer is at the TOP of the wheel (angle = -PI/2)
    // Figure out which slice is at the top
    const normalised = (((-Math.PI/2) - this.wheelAngle) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
    const idx = Math.floor(normalised / sliceAngle) % prizes.length;
    this.wheelResult = prizes[idx];
    this.pendingWheelReward = prizes[idx]; // will be applied when level starts
  }

  // Apply a wheel reward to the current game state
  _applyWheelReward(reward) {
    switch (reward.label) {
      case '+500g': this.money = Math.min(this.money + 500, MAX_MONEY); this.flash('🎡 Wheel: +500 Gold!'); break;
      case '+200g': this.money = Math.min(this.money + 200, MAX_MONEY); this.flash('🎡 Wheel: +200 Gold!'); break;
      case '+100g': this.money = Math.min(this.money + 100, MAX_MONEY); this.flash('🎡 Wheel: +100 Gold!'); break;
      case '+50g':  this.money = Math.min(this.money + 50,  MAX_MONEY); this.flash('🎡 Wheel: +50 Gold!');  break;
      case '+1 Life':
      case '+3 Lives': {
        const amt = reward.label === '+3 Lives' ? 3 : 1;
        this.castleHp = Math.min(this.castleHp + amt * 500, this.castleMaxHp);
        this.flash(`🎡 Wheel: Castle healed!`); break;
      }
      case 'Airstrike':
        for (const e of this.enemies) e.takeDamage(30);
        this.flash('🎡 Wheel: Free Airstrike!'); break;
      case 'Freeze':
        this.timeSlowTimer = 300;
        this.flash('🎡 Wheel: Free Freeze!'); break;
      case 'Dragon!': {
        const pathEnd = this.path[this.path.length - 1];
        const s = new Soldier(pathEnd.x - 30, pathEnd.y - 20, { soldierHp: 300, soldierDmg: 40 });
        s.waypoint = this.path.length - 1; s.speed = 2.0;
        this.soldiers.push(s);
        this.flash('🎡 Wheel: Dragon Ally spawned!'); break;
      }
      case '+1 Gem':
        this._grantGems(1);
        this.flash('🎡 Wheel: 💎 +1 Gem! So rare!'); break;
      case '+3 Gems':
        this._grantGems(3);
        this.flash('🎡 Wheel: 💎💎💎 +3 Gems! Amazing!'); break;
      default: this.flash('🎡 Wheel: Better luck next time!');
    }
    this._updateButtons();
  }

  // ── Gem Shop ─────────────────────────────────────────────────────────────────

  // Build the HTML gem shop items inside #gem-shop-items, split into two sections
  _buildGemShop() {
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    const container = document.getElementById('gem-shop-items');
    if (!container) return;
    container.innerHTML = '';

    // Section header helper
    const addSection = (title) => {
      const h = document.createElement('div');
      h.style.cssText = 'width:100%;text-align:center;font-size:11px;font-weight:bold;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin:8px 0 4px;';
      h.textContent = title;
      container.appendChild(h);
    };

    addSection('⭐ Permanent Upgrades — buy once, keep forever');
    for (const item of GEM_SHOP_ITEMS.filter(i => i.permanent)) {
      const owned = purchases.includes(item.id);
      const canAfford = this.gems >= item.cost;
      const div = document.createElement('div');
      div.className = 'gem-item' + (owned ? ' owned' : canAfford ? '' : ' cant-afford');
      div.innerHTML = `<div class="gi-icon">${item.icon}</div><div class="gi-name">${item.name}</div><div class="gi-cost">${owned ? '✓ OWNED' : '💎 ' + item.cost}</div><div class="gi-desc">${item.desc}</div>`;
      div.title = item.desc;
      if (!owned) div.onclick = () => this._buyGemItem(item);
      container.appendChild(div);
    }

    addSection('📦 Level Loadout — buy to use next level (stackable)');
    for (const item of GEM_SHOP_ITEMS.filter(i => !i.permanent)) {
      const count = this.pendingConsumables.filter(id => id === item.id).length;
      const canAfford = this.gems >= item.cost;
      const div = document.createElement('div');
      div.className = 'gem-item' + (canAfford ? '' : ' cant-afford');
      if (count > 0) div.style.borderColor = '#ffd700';
      div.innerHTML = `<div class="gi-icon">${item.icon}${count > 0 ? `<span style="font-size:10px;color:#ffd700;font-weight:bold"> ×${count}</span>` : ''}</div><div class="gi-name">${item.name}</div><div class="gi-cost">💎 ${item.cost}</div><div class="gi-desc">${item.desc}</div>`;
      div.title = item.desc;
      div.onclick = () => this._buyGemItem(item);
      container.appendChild(div);
    }

    // Update gem balance display
    const bal = document.getElementById('gem-balance');
    if (bal) bal.textContent = `💎 ${this.gems} Gem${this.gems !== 1 ? 's' : ''}`;
  }

  // Buy a gem shop item — handles both permanent and consumable items
  _buyGemItem(item) {
    if (this.gems < item.cost) { this.flash(`Need 💎 ${item.cost} gems!`); return; }

    if (item.permanent) {
      // One-time purchase saved to localStorage
      const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
      if (purchases.includes(item.id)) return; // already owned
      this.gems -= item.cost;
      localStorage.setItem('td_gems', String(this.gems));
      purchases.push(item.id);
      localStorage.setItem('td_gem_purchases', JSON.stringify(purchases));
    } else {
      // Consumable: queue for next level (can buy multiple copies)
      this.gems -= item.cost;
      localStorage.setItem('td_gems', String(this.gems));
      this.pendingConsumables.push(item.id);
    }

    this._buildGemShop(); // refresh UI
    const bal = document.getElementById('gem-balance');
    if (bal) bal.textContent = `💎 ${this.gems} Gem${this.gems !== 1 ? 's' : ''}`;
  }

  // Apply all active gem purchases at the start of a level.
  // This is called right after startLevel() resets everything.
  _applyGemUpgrades() {
    const purchases = JSON.parse(localStorage.getItem('td_gem_purchases') || '[]');
    if (purchases.length === 0) return;

    if (purchases.includes('gem_gold')) {
      // Start with extra gold
      this.money = Math.min(this.money + 150, MAX_MONEY);
    }
    if (purchases.includes('gem_castle')) {
      // Double the castle HP
      this.castleMaxHp *= 2;
      this.castleHp = this.castleMaxHp;
    }
    if (purchases.includes('gem_goldbonus')) {
      // +50% gold from kills — stacks with in-game shop bonus
      this.goldBonus *= 1.5;
    }
    if (purchases.includes('gem_fastfire')) {
      // Towers placed during this level will fire 30% faster (applied in tryPlaceTower)
      this.gemFastFire = true;
    }
    if (purchases.includes('gem_headstart')) {
      // New towers placed start at Level 2 (applied in tryPlaceTower)
      this.gemHeadStart = true;
    }
    if (purchases.includes('gem_miners')) {
      // Mine income doubled (applied in Worker.update via flag)
      this.gemMinerDouble = true;
    }
    if (purchases.includes('gem_soldiers')) {
      // Soldiers deal 2x damage (applied at soldier spawn time)
      this.gemSoldierDmg = true;
    }
    if (purchases.includes('gem_camps')) {
      // Raise the camp limit from 5 to 10
      this.campLimit = 10;
    }
    if (purchases.includes('gem_dragon')) {
      // Spawn a dragon ally at the start of the level
      const pathEnd = this.path[this.path.length - 1];
      const s = new Soldier(pathEnd.x - 30, pathEnd.y - 20, { soldierHp: 300, soldierDmg: 40 });
      s.waypoint = this.path.length - 1; s.speed = 2.0;
      this.soldiers.push(s);
    }
    // gem_legend is purely cosmetic — handled in _buildTitleScreen
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────
const game = new Game(document.getElementById('game'));
function loop() {
  game.update();
  game.draw();
  requestAnimationFrame(loop);
}
loop();
