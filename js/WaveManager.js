// WaveManager handles the wave cycle: countdown between waves, spawning, detecting clears.
// Single responsibility: it knows WHEN to spawn and WHAT to spawn — nothing else.
export class WaveManager {
  constructor() {
    this.wave = 0;
    this.inBreak = true;
    this.breakTimer = 180; // ~3 s before wave 1
    this.spawnQueue = [];
    this.spawnDelay = 0;
  }

  // Call every frame. Returns one of:
  //   a string (enemy kind)              → Game should spawn that enemy
  //   { waveCleared: true, bonus: N }    → wave just ended, award N gold
  //   null                               → nothing to do this frame
  update(enemyCount) {
    if (this.inBreak) {
      this.breakTimer--;
      if (this.breakTimer <= 0) this._startWave();
      return null;
    }

    if (this.spawnDelay > 0) { this.spawnDelay--; return null; }

    if (this.spawnQueue.length > 0) {
      this.spawnDelay = 60; // one second between spawns
      return this.spawnQueue.shift();
    }

    if (enemyCount === 0) {
      // All enemies defeated — start a break
      this.inBreak = true;
      this.breakTimer = 300;
      const bonus = 20 * this.wave;
      return { waveCleared: true, bonus };
    }

    return null;
  }

  reset() {
    this.wave = 0;
    this.inBreak = true;
    this.breakTimer = 180;
    this.spawnQueue = [];
    this.spawnDelay = 0;
  }

  _startWave() {
    this.wave++;
    this.spawnQueue = this._buildWave(this.wave);
    this.spawnDelay = 0;
    this.inBreak = false;
  }

  // Returns a list of enemy kind strings for wave n.
  // Add more conditions here to change when each enemy type appears!
  _buildWave(n) {
    const queue = [];
    const count = n * 3 + 2;
    for (let i = 0; i < count; i++) {
      if (n >= 10 && i % 12 === 11)   queue.push('dragonRider');
      else if (n >= 7 && i % 8 === 7) queue.push('dragon');
      else if (n >= 5 && i % 6 === 5) queue.push('ogre');
      else if (n >= 2 && i % 3 === 2) queue.push('runner');
      else                             queue.push('goblin');
    }
    return queue;
  }
}
