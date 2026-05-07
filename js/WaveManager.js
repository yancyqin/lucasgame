// WaveManager handles the wave cycle: countdown between waves, spawning, detecting clears.
export class WaveManager {
  constructor() {
    this.wave = 0;
    this.inBreak = true;
    this.breakTimer = 180;
    this.spawnQueue = [];
    this.spawnDelay = 0;
    this.levelDef = null; // set by setLevel()
  }

  // Configure for a specific level definition from LEVELS array
  setLevel(levelDef) {
    this.levelDef = levelDef;
    this.reset();
  }

  // Call every frame. Returns one of:
  //   a string (enemy kind)                  → Game should spawn that enemy
  //   { waveCleared: true, bonus: N }        → wave just ended, award N gold
  //   { levelComplete: true, bonus: N }      → all level waves cleared
  //   null                                   → nothing to do this frame
  update(enemyCount) {
    if (this.inBreak) {
      this.breakTimer--;
      if (this.breakTimer <= 0) this._startWave();
      return null;
    }

    if (this.spawnDelay > 0) { this.spawnDelay--; return null; }

    if (this.spawnQueue.length > 0) {
      this.spawnDelay = 60;
      return this.spawnQueue.shift();
    }

    if (enemyCount === 0) {
      const bonus = 20 * this.wave;
      if (this.levelDef && this.wave >= this.levelDef.waves) {
        return { levelComplete: true, bonus };
      }
      this.inBreak = true;
      this.breakTimer = 300;
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

  // Returns a list of enemy kind strings for wave n, respecting level enemy restrictions.
  _buildWave(n) {
    const allowed = this.levelDef
      ? this.levelDef.enemies
      : ['goblin', 'runner', 'saboteur', 'ogre', 'dragon', 'dragonRider'];
    const queue = [];
    const count = n * 3 + 2;
    for (let i = 0; i < count; i++) {
      if (allowed.includes('dragonRider') && n >= 10 && i % 12 === 11) queue.push('dragonRider');
      else if (allowed.includes('dragon')     && n >= 7  && i % 8 === 7)  queue.push('dragon');
      else if (allowed.includes('ogre')       && n >= 5  && i % 6 === 5)  queue.push('ogre');
      else if (allowed.includes('saboteur')   && n >= 4  && i % 5 === 4)  queue.push('saboteur');
      else if (allowed.includes('runner')     && n >= 2  && i % 3 === 2)  queue.push('runner');
      else queue.push(allowed[0]);
    }
    return queue;
  }
}
