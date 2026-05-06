// All the data that defines towers, enemies, and the map layout.
// Change numbers here to tweak game balance!

export const TYPES = {
  basic:  { label: '1 achers tower $50',  color: '#3bd17a', range: 150, fireRate: 60,  damage: 2.5, cost: 50 },
  sniper: { label: '2 Sniper $120',        color: '#4ab4ff', range: 380, fireRate: 120, damage: 6,   cost: 70 },
  rapid:  { label: '3 rapid $75',          color: '#ffaa22', range: 100, fireRate: 40,  damage: 1,   cost: 75 },
  slow:   { label: '4 mage tower $75',     color: '#cc66ff', range: 140, fireRate: 80,  damage: 0.5, cost: 80, slows: true },
};

export const ENEMIES = {
  goblin:      { kind: 'goblin',      color: '#e84040', speed: 1,   hp: 8,   size: 10, reward: 10,  castleDamage: 1  },
  runner:      { kind: 'runner',      color: '#ff9900', speed: 2.5, hp: 4,   size: 8,  reward: 15,  castleDamage: 1  },
  ogre:        { kind: 'ogre',        color: '#7b1010', speed: 0.9, hp: 50,  size: 18, reward: 30,  castleDamage: 5  },
  dragon:      { kind: 'dragon',      color: '#2ea84a', speed: 1.5, hp: 150, size: 24, reward: 75,  castleDamage: 15 },
  dragonRider: { kind: 'dragonRider', color: '#8b0000', speed: 1.0, hp: 300, size: 28, reward: 150, castleDamage: 30 },
};

// Waypoints enemies walk along — {x, y} corner turns
export const PATH = [
  { x: 0,   y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 400 },
  { x: 800, y: 400 },
];

export const MAX_MONEY = 500;

// Reusable helper — straight-line distance between two {x,y} points
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
