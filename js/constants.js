export const TYPES = {
  basic:     { label: '1 Archer $50',      color: '#3bd17a', range: 150, fireRate: 60,  damage: 2.5,  cost: 50  },
  sniper:    { label: '2 Catapult $70',    color: '#4ab4ff', range: 380, fireRate: 120, damage: 6,    cost: 70  },
  rapid:     { label: '3 Crossbow $75',    color: '#ffaa22', range: 100, fireRate: 40,  damage: 1,    cost: 75  },
  slow:      { label: '4 Mage $80',        color: '#cc66ff', range: 140, fireRate: 80,  damage: 0.5,  cost: 80, slows: true },
  fire:      { label: 'F Fire $90',        color: '#ff5500', range: 130, fireRate: 50,  damage: 3,    cost: 90  },
  ice:       { label: 'I Ice $85',         color: '#88ddff', range: 200, fireRate: 70,  damage: 1.5,  cost: 85  },
  lightning: { label: 'L Lightning $110',  color: '#ffdd00', range: 180, fireRate: 80,  damage: 5,    cost: 110 },
  earth:     { label: 'E Earth $95',       color: '#886644', range: 240, fireRate: 150, damage: 15,   cost: 95  },
};

export const ENEMIES = {
  goblin:      { kind: 'goblin',      color: '#7799bb', speed: 1,   hp: 8,   size: 10, reward: 3,  castleDamage: 4   },
  runner:      { kind: 'runner',      color: '#c09030', speed: 2.5, hp: 4,   size: 8,  reward: 3,  castleDamage: 3   },
  saboteur:    { kind: 'saboteur',    color: '#4a2268', speed: 2.0, hp: 15,  size: 9,  reward: 5,  castleDamage: 6   },
  ogre:        { kind: 'ogre',        color: '#445566', speed: 0.9, hp: 50,  size: 18, reward: 8,  castleDamage: 20  },
  dragon:      { kind: 'dragon',      color: '#2ea84a', speed: 1.5, hp: 150, size: 24, reward: 15, castleDamage: 100 },
  dragonRider: { kind: 'dragonRider', color: '#8b0000', speed: 1.0, hp: 300, size: 28, reward: 25, castleDamage: 240 },
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
  spike:     { label: '5 Spikes $30',     color: '#7a8a9a', cost: 30, damage: 6,  radius: 20, cooldown: 90, onPath: true  },
  tar:       { label: '6 Tar $25',        color: '#3a4a22', cost: 25,             radius: 24, cooldown: 0,  onPath: true, slows: true },
  barricade: { label: '7 Barricade $35',  color: '#8b6030', cost: 35, hp: 30, maxHp: 30, radius: 26, onPath: true  },
  wall:      { label: '8 Wall $45',       color: '#7a5a30', cost: 45, hp: 25, maxHp: 25, radius: 45, onPath: false },
};

export const MINE = { label: '9 Mine $80', color: '#a07830', cost: 80, income: 2, period: 240 };
export const GUARD_CONFIG = { label: '0 Guard $60', color: '#4488cc', cost: 60 };

// ── Procedural 100-level generation ─────────────────────────────────────────

const ALL_TOWERS  = ['basic', 'sniper', 'rapid', 'slow', 'fire', 'ice', 'lightning', 'earth'];
const TOWER_AT    = [1, 2, 3, 4, 8, 15, 25, 40];   // unlock levels
const ALL_TRAPS   = ['spike', 'tar', 'barricade', 'wall'];
const TRAP_AT     = [1, 2, 3, 4];
const ALL_ENEMIES = ['goblin', 'runner', 'saboteur', 'ogre', 'dragon', 'dragonRider'];
const ENEMY_AT    = [1, 1, 5, 10, 18, 30];

function _levelName(id) {
  const special = { 1:'Beginner', 2:'Soldier', 3:'Warrior', 4:'Champion', 5:'Legend' };
  if (special[id]) return special[id];
  const tiers  = ['Veteran','Expert','Master','Grandmaster','Mythic','Godlike','Eternal','Legendary','Infernal','Ancient'];
  const tier   = Math.min(Math.floor((id - 1) / 10), 9);
  return `${tiers[tier]} ${id}`;
}

function _levelDesc(id) {
  if (id === 1) return 'Archers & Spikes only';
  if (id === 2) return 'Catapults & Tar unlocked';
  if (id === 3) return 'Crossbow & Barricades unlocked';
  if (id === 4) return 'Mage & Walls unlocked';
  if (id === 5) return 'All towers — Dragon Riders!';
  if (id <= 7)  return 'Fire towers available';
  if (id <= 14) return 'Fire & Ice towers';
  if (id <= 24) return 'Lightning strikes!';
  if (id <= 39) return 'Earth-shattering power';
  if (id <= 60) return 'Dragon Rider hordes';
  return 'Ancient evil awakens!';
}

function _waveCount(id) {
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
      waves:      _waveCount(id),
      towers:     ALL_TOWERS.filter((_, i) => TOWER_AT[i] <= id),
      traps:      ALL_TRAPS.filter((_,  i) => TRAP_AT[i]  <= id),
      enemies:    ALL_ENEMIES.filter((_,i) => ENEMY_AT[i] <= id),
      mapVariant: (id - 1) % 8,
      difficulty: 1 + (id - 1) * 0.06,   // +6% per level; level 100 ≈ 7×
    });
  }
  return levels;
}

export const LEVELS = generateLevels();

export const ACHIEVEMENTS = [
  { id: 'first_win',     name: 'First Victory',  desc: 'Complete level 1',           icon: '🏆' },
  { id: 'soldier',       name: 'Soldier',         desc: 'Complete level 2',           icon: '⚔️' },
  { id: 'warrior',       name: 'Warrior',         desc: 'Complete level 3',           icon: '🛡️' },
  { id: 'champion',      name: 'Champion',        desc: 'Complete level 4',           icon: '👑' },
  { id: 'legend',        name: 'Legend',          desc: 'Complete all 5 levels',      icon: '🐉' },
  { id: 'veteran',       name: 'Veteran',         desc: 'Complete level 10',          icon: '🗡️' },
  { id: 'master',        name: 'Master',          desc: 'Complete level 25',          icon: '⚡' },
  { id: 'mythic',        name: 'Mythic',          desc: 'Complete level 50',          icon: '🔥' },
  { id: 'ancient',       name: 'Ancient',         desc: 'Complete level 100',         icon: '🌟' },
  { id: 'dragon_slayer', name: 'Dragon Slayer',   desc: 'Kill your first dragon',     icon: '🗡️' },
  { id: 'miner',         name: 'Mine Baron',      desc: 'Place 3 mines in one game',  icon: '⛏️' },
  { id: 'fortified',     name: 'Fortified',       desc: 'Place 5 traps in one game',  icon: '🏰' },
];

export const MAX_MONEY = 500;

export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
