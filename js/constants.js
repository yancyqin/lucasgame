// All the data that defines towers, enemies, and the map layout.
// Change numbers here to tweak game balance!

export const TYPES = {
  basic:  { label: '1 Archer $50',    color: '#3bd17a', range: 150, fireRate: 60,  damage: 2.5, cost: 50 },
  sniper: { label: '2 Catapult $70',  color: '#4ab4ff', range: 380, fireRate: 120, damage: 6,   cost: 70 },
  rapid:  { label: '3 Crossbow $75',  color: '#ffaa22', range: 100, fireRate: 40,  damage: 1,   cost: 75 },
  slow:   { label: '4 Mage $80',      color: '#cc66ff', range: 140, fireRate: 80,  damage: 0.5, cost: 80, slows: true },
};

export const ENEMIES = {
  goblin:      { kind: 'goblin',      color: '#7799bb', speed: 1,   hp: 8,   size: 10, reward: 3,  castleDamage: 4   },
  runner:      { kind: 'runner',      color: '#c09030', speed: 2.5, hp: 4,   size: 8,  reward: 3,  castleDamage: 3   },
  saboteur:    { kind: 'saboteur',    color: '#4a2268', speed: 2.0, hp: 15,  size: 9,  reward: 5,  castleDamage: 6   },
  ogre:        { kind: 'ogre',        color: '#445566', speed: 0.9, hp: 50,  size: 18, reward: 8,  castleDamage: 20  },
  dragon:      { kind: 'dragon',      color: '#2ea84a', speed: 1.5, hp: 150, size: 24, reward: 15, castleDamage: 100 },
  dragonRider: { kind: 'dragonRider', color: '#8b0000', speed: 1.0, hp: 300, size: 28, reward: 25, castleDamage: 240 },
};

// Waypoints enemies walk along — 6-point snake using the full canvas.
// Call this with the real canvas W/H to get a path that fills the screen.
export function makePath(W, H) {
  return [
    { x: 0,              y: Math.round(H * 0.22) },
    { x: Math.round(W * 0.30), y: Math.round(H * 0.22) },
    { x: Math.round(W * 0.30), y: Math.round(H * 0.78) },
    { x: Math.round(W * 0.65), y: Math.round(H * 0.78) },
    { x: Math.round(W * 0.65), y: Math.round(H * 0.22) },
    { x: W,              y: Math.round(H * 0.22) },
  ];
}

export const TRAPS = {
  spike:     { label: '5 Spikes $30',     color: '#7a8a9a', cost: 30, damage: 6,  radius: 20, cooldown: 90, onPath: true  },
  tar:       { label: '6 Tar $25',        color: '#3a4a22', cost: 25,             radius: 24, cooldown: 0,  onPath: true, slows: true },
  barricade: { label: '7 Barricade $35',  color: '#8b6030', cost: 35, hp: 30, maxHp: 30, radius: 26, onPath: true  },
  wall:      { label: '8 Wall $45',       color: '#7a5a30', cost: 45, hp: 25, maxHp: 25, radius: 45, onPath: false },
};

export const MINE = { label: '9 Mine $80', color: '#a07830', cost: 80, income: 2, period: 240 };
export const GUARD_CONFIG = { label: '0 Guard $60', color: '#4488cc', cost: 60 };

export const LEVELS = [
  { id: 1, name: 'Beginner',  desc: 'Archers & Spikes only',          waves: 5,  towers: ['basic'],                               traps: ['spike'],                              enemies: ['goblin', 'runner'] },
  { id: 2, name: 'Soldier',   desc: 'Catapults & Tar unlocked',        waves: 6,  towers: ['basic', 'sniper'],                     traps: ['spike', 'tar'],                       enemies: ['goblin', 'runner', 'saboteur'] },
  { id: 3, name: 'Warrior',   desc: 'Crossbow & Barricades unlocked',  waves: 7,  towers: ['basic', 'sniper', 'rapid'],            traps: ['spike', 'tar', 'barricade'],          enemies: ['goblin', 'runner', 'saboteur', 'ogre'] },
  { id: 4, name: 'Champion',  desc: 'Mage & Walls unlocked',           waves: 8,  towers: ['basic', 'sniper', 'rapid', 'slow'],   traps: ['spike', 'tar', 'barricade', 'wall'],  enemies: ['goblin', 'runner', 'saboteur', 'ogre', 'dragon'] },
  { id: 5, name: 'Legend',    desc: 'All towers — Dragon Riders!',     waves: 10, towers: ['basic', 'sniper', 'rapid', 'slow'],   traps: ['spike', 'tar', 'barricade', 'wall'],  enemies: ['goblin', 'runner', 'saboteur', 'ogre', 'dragon', 'dragonRider'] },
];

export const ACHIEVEMENTS = [
  { id: 'first_win',     name: 'First Victory',  desc: 'Complete level 1',           icon: '🏆' },
  { id: 'soldier',       name: 'Soldier',         desc: 'Complete level 2',           icon: '⚔️' },
  { id: 'warrior',       name: 'Warrior',         desc: 'Complete level 3',           icon: '🛡️' },
  { id: 'champion',      name: 'Champion',        desc: 'Complete level 4',           icon: '👑' },
  { id: 'legend',        name: 'Legend',          desc: 'Complete all 5 levels',      icon: '🐉' },
  { id: 'dragon_slayer', name: 'Dragon Slayer',   desc: 'Kill your first dragon',     icon: '🗡️' },
  { id: 'miner',         name: 'Mine Baron',      desc: 'Place 3 mines in one game',  icon: '⛏️' },
  { id: 'fortified',     name: 'Fortified',       desc: 'Place 5 traps in one game',  icon: '🏰' },
];

export const MAX_MONEY = 500;

// Reusable helper — straight-line distance between two {x,y} points
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
