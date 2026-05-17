// DPS = damage / fireRate * 60  (at 60 fps)
// Target: roughly 0.04–0.05 DPS per dollar spent, scaling up with unlock cost
export const TYPES = {
  basic:     { label: '1 Archer $50',      color: '#3bd17a', range: 150, fireRate: 60,  damage: 2.5,  cost: 50  }, // 2.5 DPS
  sniper:    { label: '2 Catapult $70',    color: '#4ab4ff', range: 380, fireRate: 100, damage: 6,    cost: 70  }, // 3.6 DPS, huge range
  rapid:     { label: '3 Crossbow $60',    color: '#ffaa22', range: 110, fireRate: 35,  damage: 1.8,  cost: 60  }, // 3.1 DPS, short range — cheaper now
  slow:      { label: '4 Mage $80',        color: '#cc66ff', range: 150, fireRate: 75,  damage: 1.5,  cost: 80,  slows: true }, // 1.2 DPS + slow
  fire:      { label: 'F Fire $90',        color: '#ff5500', range: 135, fireRate: 48,  damage: 3.5,  cost: 90,  elementalType: 'fire'      }, // 4.4 DPS
  ice:       { label: 'I Ice $85',         color: '#88ddff', range: 200, fireRate: 65,  damage: 2.5,  cost: 85,  elementalType: 'ice'       }, // 2.3 DPS + freeze
  lightning: { label: 'L Lightning $100',  color: '#ffdd00', range: 190, fireRate: 75,  damage: 5.5,  cost: 100, elementalType: 'lightning' }, // 4.4 DPS, chain
  earth:     { label: 'E Earth $120',      color: '#886644', range: 240, fireRate: 130, damage: 10,   cost: 120, elementalType: 'earth'     }, // 4.6 DPS, slow shot
};

// Reward/HP ratio: harder enemies pay out more per HP point
// Castle HP is 10 000; castleDamage controls how many enemies it takes to lose
export const ENEMIES = {
  goblin:      { kind: 'goblin',      name: 'Dark Knight',   color: '#7799bb', speed: 1.0, hp: 8,   size: 10, reward: 4,  castleDamage: 5   },
  runner:      { kind: 'runner',      name: 'Scout',         color: '#c09030', speed: 2.5, hp: 5,   size: 8,  reward: 5,  castleDamage: 4   },
  saboteur:    { kind: 'saboteur',    name: 'Trap Wrecker',  color: '#4a2268', speed: 1.8, hp: 10,  size: 9,  reward: 7,  castleDamage: 8   },
  ogre:        { kind: 'ogre',        name: 'Giant',         color: '#445566', speed: 0.8, hp: 55,  size: 18, reward: 12, castleDamage: 25  },
  dragon:      { kind: 'dragon',      name: 'Forest Dragon', color: '#2ea84a', speed: 1.2, hp: 130, size: 24, reward: 20, castleDamage: 120 },
  dragonRider: { kind: 'dragonRider', name: 'Death Rider',   color: '#8b0000', speed: 0.75, hp: 260, size: 28, reward: 35, castleDamage: 280 },
  titan:       { kind: 'titan',       name: 'Ancient Titan', color: '#1a0a2e', speed: 0.28, hp: 100000, size: 72, reward: 500, castleDamage: 999, isTitan: true },
  elderDragonRider: { kind: 'elderDragonRider', name: 'Elder Dragon Rider', color: '#0a0020', speed: 0.22, hp: 1000000, size: 88, reward: 1000, castleDamage: 999 },
};

// 8 distinct path shapes. All start at x=0, end at x=W.
export function makePath(W, H, variant = 0) {
  const pt = (x, y) => ({ x: Math.round(W * x), y: Math.round(H * y) });
  const paths = [
    // 0: Classic S-snake
    [pt(0,.22), pt(.30,.22), pt(.30,.78), pt(.65,.78), pt(.65,.22), pt(1,.22)],
    // 1: Wide U at bottom
    [pt(0,.22), pt(.18,.22), pt(.18,.82), pt(.82,.82), pt(.82,.22), pt(1,.22)],
    // 2: Triple-band winding
    [pt(0,.15), pt(.22,.15), pt(.22,.50), pt(.45,.50), pt(.45,.85), pt(.70,.85), pt(.70,.50), pt(.85,.50), pt(.85,.15), pt(1,.15)],
    // 3: S from bottom
    [pt(0,.78), pt(.30,.78), pt(.30,.22), pt(.65,.22), pt(.65,.78), pt(1,.78)],
    // 4: Back-and-forth comb
    [pt(0,.22), pt(.70,.22), pt(.70,.55), pt(.38,.55), pt(.38,.85), pt(.82,.85), pt(.82,.55), pt(1,.55)],
    // 5: Long winding (high entry, low exit)
    [pt(0,.18), pt(.20,.18), pt(.20,.82), pt(.50,.82), pt(.50,.18), pt(.80,.18), pt(.80,.82), pt(1,.82)],
    // 6: Short S (quick path)
    [pt(0,.35), pt(.40,.35), pt(.40,.70), pt(.75,.70), pt(.75,.35), pt(1,.35)],
    // 7: Reversed wide U (enters/exits at bottom)
    [pt(0,.78), pt(.18,.78), pt(.18,.18), pt(.82,.18), pt(.82,.78), pt(1,.78)],
  ];
  return paths[variant % 8];
}

export const TRAPS = {
  spike:     { label: '5 Spikes $30',     color: '#7a8a9a', cost: 30, damage: 6,  radius: 20, cooldown: 90, onPath: true,  hp: 25,  maxHp: 25  },
  tar:       { label: '6 Tar $25',        color: '#3a4a22', cost: 25,             radius: 24, cooldown: 0,  onPath: true,  hp: 18,  maxHp: 18, slows: true },
  barricade: { label: '7 Barricade $35',  color: '#8b6030', cost: 35,             radius: 26, onPath: true,  hp: 80,  maxHp: 80  },
  wall:      { label: '8 Wall $45',       color: '#7a5a30', cost: 45,             radius: 45, onPath: false, hp: 60,  maxHp: 60  },
};

export const MINE = { label: '9 Mine $80', color: '#a07830', cost: 80, income: 2, period: 240 };
export const GUARD_CONFIG = { label: '0 Guard $60', color: '#4488cc', cost: 60 };
export const CAMP = { label: 'C Camp $120', color: '#7a6030', cost: 120 };

// ── Tower upgrades ─────────────────────────────────────────────────────────────
// UPGRADE_COST: how much it costs to upgrade (multiplied by the tower's original cost)
export const UPGRADE_COST = { 2: 0.6, 3: 1.0 };
// UPGRADE_MULT: how much each stat is multiplied when upgrading
export const UPGRADE_MULT = {
  2: { damage: 1.4, range: 1.15, fireRate: 0.85 },  // level 2: stronger, faster
  3: { damage: 2.0, range: 1.3,  fireRate: 0.7  },  // level 3: max power!
};

// ── Multiple camp types ────────────────────────────────────────────────────────
// Each camp type spawns different kinds of soldiers
export const CAMP_TYPES = {
  basic:  { label: 'Basic Camp $120',  color: '#7a6030', cost: 120, soldierHp: 10,  soldierDmg: 1,  spawnRate: 420 },
  archer: { label: 'Archer Camp $150', color: '#3a6a20', cost: 150, soldierHp: 7,   soldierDmg: 2,  spawnRate: 380, ranged: true },
  knight: { label: 'Knight Camp $180', color: '#3355aa', cost: 180, soldierHp: 18,  soldierDmg: 2,  spawnRate: 480 },
  mage:   { label: 'Mage Camp $200',   color: '#883399', cost: 200, soldierHp: 8,   soldierDmg: 3,  spawnRate: 500, magic: true },
  siege:  { label: 'Siege Camp $240',  color: '#885522', cost: 240, soldierHp: 15,  soldierDmg: 5,  spawnRate: 600, aoe: true },
};

// ── Gem Shop items ─────────────────────────────────────────────────────────────
// permanent: true  → buy once, keep forever (classic gem upgrades)
// permanent: false → buy to queue for the NEXT level (consumables / level upgrades)

// ── Procedural 100-level generation ─────────────────────────────────────────

const ALL_TOWERS  = ['basic', 'sniper', 'rapid', 'slow', 'fire', 'ice', 'lightning', 'earth'];
const TOWER_AT    = [1, 2, 3, 4, 8, 15, 25, 40];   // unlock levels
const ALL_TRAPS   = ['spike', 'tar', 'barricade', 'wall'];
const TRAP_AT     = [1, 2, 3, 4];
const ALL_ENEMIES = ['goblin', 'runner', 'saboteur', 'ogre', 'dragon', 'dragonRider'];
const ENEMY_AT    = [1, 1, 5, 10, 18, 30];
// Camps unlock gradually — you need to prove yourself before you can raise an army
const ALL_CAMPS   = ['basic', 'archer', 'knight', 'mage', 'siege'];
const CAMP_AT     = [3, 8, 16, 26, 42];  // unlock levels

function _levelName(id) {
  if (id === 100) return 'The Final Stand';
  const special = { 1:'Beginner', 2:'Soldier', 3:'Warrior', 4:'Champion', 5:'Legend' };
  if (special[id]) return special[id];
  const tiers  = ['Veteran','Expert','Master','Grandmaster','Mythic','Godlike','Eternal','Legendary','Infernal','Ancient'];
  const tier   = Math.min(Math.floor((id - 1) / 10), 9);
  return `${tiers[tier]} ${id}`;
}

function _levelDesc(id) {
  if (id === 100) return 'The ancient evil has reached its peak. Destroy the enemy camp to awaken the TITAN — and end this once and for all.';
  if (id === 1)  return 'Goblin scouts have breached the outer woods. Build your first defenses — the war has begun.';
  if (id === 2)  return 'The goblins brought catapults. Strike them from range before they reach the walls.';
  if (id === 3)  return 'Fast raiders slip past slow fire — crossbows were forged for exactly this.';
  if (id === 4)  return 'Enemy sorcerers enchant the horde. Your mage towers must counter their dark magic.';
  if (id === 5)  return 'A goblin warlord rides a dragon at the front lines. All towers must hold.';
  if (id === 6)  return 'The horde regroups after their defeat. Shadow runners now lead the charge.';
  if (id === 7)  return 'Assassins cloak themselves in purple smoke — they are coming for your traps.';
  if (id === 8)  return 'Reinforcements pour through the mountain pass. The raids grow relentless.';
  if (id === 9)  return 'The enemy general has been spotted. Darkness gathers on the horizon.';
  if (id === 10) return 'Stone Ogres emerge from the caverns. They shrug off arrows like raindrops.';
  if (id <= 14)  return 'The Ogre warlords press deeper. The walls crack under their iron fists.';
  if (id <= 17)  return 'Fire towers now burn through ogre armor. But the skies are darkening...';
  if (id === 18) return 'The first dragon sighting. Towers everywhere burn to the ground.';
  if (id <= 24)  return 'Dragon flights circle the battlements. The sky itself is your enemy now.';
  if (id <= 29)  return 'Every wave brings more dragons. Ice is the only thing that slows them.';
  if (id === 30) return 'Death Riders appear — armored soldiers mounted on blood-red dragons. Nothing survives their charge.';
  if (id <= 39)  return 'The Death Riders lead every assault. Lightning is the only force that pierces their scales.';
  if (id <= 49)  return 'The ancient war machine mobilizes. Earth-shattering boulders are your last hope.';
  if (id <= 59)  return 'Dragon armies blacken the horizon. The kingdom fights for its life.';
  if (id <= 69)  return 'Ancient powers stir beneath the ruins. The enemy grows bold.';
  if (id <= 79)  return 'The world bleeds. Only your towers stand between civilization and oblivion.';
  if (id <= 89)  return 'The final army marches. Each wave is worse than anything before.';
  return 'The darkness closes in. The TITAN stirs below the earth. Make your stand.';
}

function _levelTheme(id) {
  if (id === 100) return { bg: 'linear-gradient(135deg,#0d0005,#1a0010)', border: '#8b0000', icon: '⚡', word: 'FINAL STAND', glow: 'rgba(200,0,0,0.6)' };
  if (id >= 80)   return { bg: 'linear-gradient(135deg,#120010,#1e0018)', border: '#aa0055', icon: '🌑', word: 'OBLIVION', glow: 'rgba(150,0,80,0.5)' };
  if (id >= 60)   return { bg: 'linear-gradient(135deg,#0a0010,#150020)', border: '#6600cc', icon: '🐉', word: 'ANCIENT WAR', glow: 'rgba(100,0,200,0.4)' };
  if (id >= 40)   return { bg: 'linear-gradient(135deg,#1a0505,#2a0a0a)', border: '#880000', icon: '🐲', word: 'DRAGON LORDS', glow: 'rgba(180,0,0,0.4)' };
  if (id >= 30)   return { bg: 'linear-gradient(135deg,#1a0808,#240a0a)', border: '#aa3300', icon: '🔥', word: 'DEATH RIDERS', glow: 'rgba(200,50,0,0.4)' };
  if (id >= 18)   return { bg: 'linear-gradient(135deg,#0a1a05,#0f2208)', border: '#226600', icon: '🐲', word: 'DRAGON WARS', glow: 'rgba(30,150,0,0.4)' };
  if (id >= 10)   return { bg: 'linear-gradient(135deg,#150f0a,#20140a)', border: '#6b3a10', icon: '💀', word: 'SIEGE', glow: 'rgba(100,50,0,0.4)' };
  if (id >= 5)    return { bg: 'linear-gradient(135deg,#1a1028,#221535)', border: '#6a22bb', icon: '🗡️', word: 'SHADOW WAR', glow: 'rgba(100,0,200,0.4)' };
  return               { bg: 'linear-gradient(135deg,#0a1a0a,#0f2010)', border: '#2a6a2a', icon: '⚔️', word: 'THE RAID', glow: 'rgba(0,100,0,0.4)' };
}

function _waveCount(id) {
  if (id === 100) return 30; // extra long final battle
  if (id <=  5) return [5,6,7,8,9][id-1] || 9;
  if (id <= 10) return 10;
  if (id <= 20) return 12;
  if (id <= 40) return 15;
  if (id <= 70) return 18;
  return 22;
}

export function generateLevels(count = 100) {
  const levels = [];
  for (let id = 1; id <= count; id++) {
    levels.push({
      id,
      name:       _levelName(id),
      desc:       _levelDesc(id),
      theme:      _levelTheme(id),
      waves:      _waveCount(id),
      towers:     ALL_TOWERS.filter((_, i) => TOWER_AT[i] <= id),
      traps:      ALL_TRAPS.filter((_,  i) => TRAP_AT[i]  <= id),
      enemies:    ALL_ENEMIES.filter((_,i) => ENEMY_AT[i] <= id),
      camps:      id === 100 ? ALL_CAMPS : ALL_CAMPS.filter((_,i) => CAMP_AT[i] <= id),
      mapVariant: (id - 1) % 8,
      difficulty: id === 100 ? 12 : 1 + (id - 1) * 0.06,   // Final Stand is 12× hardness
      enemySlow: id === 100 ? 0.6 : 1,
    });
  }
  levels.push({
    id: 101,
    secret: true,
    name: 'Dragon Island',
    desc: 'A forgotten island in the clouds. The Elder Dragon Rider sleeps here — wake it at your peril.',
    theme: { bg: 'linear-gradient(135deg,#e8f4ff,#c0e8ff)', border: '#4488cc', icon: '🐲', word: 'SECRET', glow: 'rgba(0,150,255,0.5)' },
    waves: 15,
    towers: ALL_TOWERS,
    traps: ALL_TRAPS,
    enemies: ['dragon', 'dragonRider', 'dragon', 'dragonRider', 'dragon'],
    camps: ALL_CAMPS,
    mapVariant: 2,
    difficulty: 8,
    enemySlow: 0.8,
    breakTimer: 600,
  });
  return levels;
}

export const LEVELS = generateLevels();

export const ACHIEVEMENTS = [
  { id: 'first_win',     name: 'First Victory',  desc: 'Complete level 1',                       icon: '🏆'  },
  { id: 'soldier',       name: 'Soldier',         desc: 'Complete level 2',                       icon: '⚔️'  },
  { id: 'warrior',       name: 'Warrior',         desc: 'Complete level 3',                       icon: '🛡️'  },
  { id: 'champion',      name: 'Champion',        desc: 'Complete level 4',                       icon: '👑'  },
  { id: 'legend',        name: 'Legend',          desc: 'Complete all 5 levels',                  icon: '🐉'  },
  { id: 'veteran',       name: 'Veteran',         desc: 'Complete level 10',                      icon: '🗡️'  },
  { id: 'master',        name: 'Master',          desc: 'Complete level 25',                      icon: '⚡'  },
  { id: 'mythic',        name: 'Mythic',          desc: 'Complete level 50',                      icon: '🔥'  },
  { id: 'ancient',       name: 'Ancient',         desc: 'Complete level 100',                     icon: '🌟'  },
  { id: 'dragon_slayer', name: 'Dragon Slayer',   desc: 'Kill your first dragon',                 icon: '🗡️'  },
  { id: 'miner',         name: 'Mine Baron',      desc: 'Place 3 mines in one game',              icon: '⛏️'  },
  { id: 'fortified',     name: 'Fortified',       desc: 'Place 5 traps in one game',              icon: '🏰'  },
  // New achievements!
  { id: 'wave5',         name: 'Survivor',        desc: 'Survive 5 waves in a row',               icon: '🌊'  },
  { id: 'tower10',       name: 'Builder',         desc: 'Place 10 towers in one game',            icon: '🏗️'  },
  { id: 'kill100',       name: 'Centurion',       desc: 'Kill 100 enemies total',                 icon: '💀'  },
  { id: 'kill500',       name: 'Terminator',      desc: 'Kill 500 enemies total',                 icon: '☠️'  },
  { id: 'no_damage',     name: 'Perfect',         desc: 'Complete a level with no castle damage', icon: '✨'  },
  { id: 'shop_buyer',    name: 'Shopaholic',      desc: 'Buy 5 items from the shop',              icon: '🛒'  },
  { id: 'upgrade_max',   name: 'Maxed Out',       desc: 'Upgrade a tower to Lv3',                 icon: '⬆️'  },
  { id: 'soldier5',      name: 'Small Army',      desc: 'Have 5 soldiers at once',                icon: '⚔️'  },
  { id: 'soldier15',     name: 'General',         desc: 'Have 15 soldiers at once',               icon: '🎖️'  },
  { id: 'daily_spin',    name: 'Daily Player',    desc: 'Use the daily wheel',                    icon: '🎡'  },
  { id: 'camp5',         name: 'Field Commander', desc: 'Place 5 camps',                          icon: '⛺'  },
  { id: 'all_towers',    name: 'Arsenal',         desc: 'Have all 8 tower types placed',          icon: '🏰'  },
  { id: 'rich',          name: 'Loaded',          desc: 'Reach $500 gold at once',                icon: '💵'  },
  { id: 'endure',        name: 'Endurance',       desc: 'Complete level 20',                      icon: '🛡️'  },
  { id: 'unstoppable',   name: 'Unstoppable',     desc: 'Complete level 50',                      icon: '🌟'  },
  { id: 'nuke',          name: 'Overkill',        desc: 'Use the Nuclear Option',                 icon: '💣'  },
  { id: 'freeze',        name: 'Ice Age',         desc: 'Freeze all enemies',                     icon: '🧊'  },
];

export const MAX_MONEY = 500;

export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

export const GEM_SHOP_ITEMS = [
  // ── Permanent upgrades — buy once, keep forever ───────────────────────────────
  { id:'gem_gold',      name:'Gold Stash',     icon:'💰', cost:3,  permanent:true, desc:'Start each level with +150 extra gold'             },
  { id:'gem_castle',    name:'Iron Fortress',  icon:'🏰', cost:5,  permanent:true, desc:'Castle starts with double HP every level'          },
  { id:'gem_miners',    name:'Expert Miners',  icon:'⛏️', cost:4,  permanent:true, desc:'Workers collect 2× gold from mines'               },
  { id:'gem_soldiers',  name:'Elite Army',     icon:'⚔️', cost:6,  permanent:true, desc:'All soldiers deal 2× damage permanently'          },
  { id:'gem_headstart', name:'Head Start',     icon:'⬆️', cost:10, permanent:true, desc:'Towers you place start at Level 2 automatically'  },
  { id:'gem_fastfire',  name:'Rapid Reload',   icon:'⚡', cost:7,  permanent:true, desc:'All towers fire 30% faster every level'           },
  { id:'gem_dragon',    name:'Dragon Bond',    icon:'🐉', cost:15, permanent:true, desc:'A dragon ally joins you at the start of each level'},
  { id:'gem_goldbonus', name:'Merchant Guild', icon:'🪙', cost:8,  permanent:true, desc:'+50% gold earned from every enemy kill'           },
  { id:'gem_camps',     name:'Camp Mastery',   icon:'⛺', cost:6,  permanent:true, desc:'Camp limit raised from 10 to 15'                  },
  { id:'gem_legend',    name:'Legend Title',   icon:'🌟', cost:20, permanent:true, desc:'Unlocks the ✦LEGEND✦ badge on the title screen'   },
  // ── Level loadout — buy to queue for next level (consumable, stackable) ───────
  // Allies
  { id:'ally_dragon',   name:'Dragon Ally',    icon:'🐉', cost:6,  permanent:false, desc:'Spawn a powerful dragon ally this level'          },
  { id:'ally_knight',   name:'War Knights',    icon:'⚔️', cost:2,  permanent:false, desc:'Spawn 3 powerful knights this level'              },
  { id:'ally_wizard',   name:'Court Wizard',   icon:'🧙', cost:3,  permanent:false, desc:'Spawn a ranged magic ally this level'             },
  { id:'ally_golem',    name:'Stone Golem',    icon:'🗿', cost:3,  permanent:false, desc:'Spawn a slow but very tanky golem this level'     },
  // Power-ups
  { id:'pow_airstrike', name:'Airstrike',      icon:'✈️', cost:1,  permanent:false, desc:'Auto-bombs all enemies when wave 1 starts'        },
  { id:'pow_meteor',    name:'Meteor Strike',  icon:'☄️', cost:2,  permanent:false, desc:'Auto-nukes enemies when wave 1 starts (huge dmg)' },
  { id:'pow_freeze',    name:'Freeze Bomb',    icon:'❄️', cost:1,  permanent:false, desc:'Auto-freezes all enemies when wave 1 starts'      },
  { id:'pow_heal',      name:'Repair Castle',  icon:'🏰', cost:1,  permanent:false, desc:'Restore 20% castle HP at level start'             },
  { id:'pow_rage',      name:'Tower Rage',     icon:'🔥', cost:1,  permanent:false, desc:'All towers 2× fire speed for 30s this level'      },
  { id:'pow_shield',    name:'Castle Shield',  icon:'🛡️', cost:2,  permanent:false, desc:'Castle invincible for 10s this level'             },
  { id:'pow_lightning', name:'Chain Lightning',icon:'⚡', cost:1,  permanent:false, desc:'Auto-strikes 10 enemies when wave 1 starts'       },
  { id:'pow_poison',    name:'Poison Cloud',   icon:'☠️', cost:1,  permanent:false, desc:'Auto-poisons all enemies when wave 1 starts'      },
  { id:'pow_time',      name:'Time Slow',      icon:'⏳', cost:2,  permanent:false, desc:'Half enemy speed for 20s this level'              },
  // Level upgrades
  { id:'upg_dmg',       name:'+25% Damage',    icon:'💥', cost:2,  permanent:false, desc:'All towers +25% damage this level'                },
  { id:'upg_range',     name:'+20% Range',     icon:'🎯', cost:1,  permanent:false, desc:'All towers +20% range this level'                 },
  { id:'upg_gold',      name:'+30% Gold',      icon:'🪙', cost:2,  permanent:false, desc:'Earn 30% more gold per kill this level'           },
  { id:'upg_castle',    name:'Reinforce Castle',icon:'🏯',cost:2,  permanent:false, desc:'Castle max HP +50% this level'                    },
  { id:'upg_speed',     name:'Swift Soldiers', icon:'👟', cost:1,  permanent:false, desc:'Soldiers move 50% faster this level'              },
  { id:'upg_spawn',     name:'Rapid Training', icon:'⏱️', cost:1,  permanent:false, desc:'Camps spawn 2× faster this level'                 },
  { id:'upg_armor',     name:'Tower Armor',    icon:'🛡', cost:2,  permanent:false, desc:'Towers take 50% less damage this level'           },
  { id:'upg_bounce',    name:'Bouncing Arrows',icon:'🏹', cost:1,  permanent:false, desc:'Arrows bounce to 2nd target this level'           },
  { id:'upg_multi',     name:'Multishot',      icon:'🌟', cost:3,  permanent:false, desc:'Towers fire 2 projectiles this level'             },
  { id:'upg_regen',     name:'HP Regen',       icon:'💚', cost:2,  permanent:false, desc:'Towers slowly regenerate HP this level'           },
  // Special
  { id:'sp_nuke',       name:'Nuclear Option', icon:'💣', cost:8,  permanent:false, desc:'Auto-destroys ALL enemies when wave 1 starts'     },
  { id:'sp_angel',      name:'Angel Guard',    icon:'👼', cost:5,  permanent:false, desc:'Castle invincible for 60s this level'             },
  { id:'sp_clone',      name:'Tower Clone',    icon:'🔮', cost:3,  permanent:false, desc:'Duplicate your first tower at level start'        },
  { id:'sp_berserk',    name:'Berserker Mode', icon:'😤', cost:3,  permanent:false, desc:'Auto-triggers enemies fight each other when wave 1 starts' },
];
