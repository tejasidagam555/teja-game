/**
 * Level Designs & Manager for Bubble Pop Royale
 */

class LevelManager {
  constructor() {
    this.levels = this.generateLevelDefinitions();
    this.currentLevelIndex = 0;
    this.unlockedLevelMax = parseInt(localStorage.getItem('bubble_unlocked_level') || '1', 10);
    this.levelStars = JSON.parse(localStorage.getItem('bubble_level_stars') || '{}');
  }

  generateLevelDefinitions() {
    return [
      {
        id: 1,
        name: 'Easy Start',
        colors: ['red', 'yellow', 'green'],
        pattern: [
          ['red', 'red', 'yellow', 'yellow', 'green', 'green', 'red', 'red'],
          ['yellow', 'green', 'green', 'red', 'red', 'yellow', 'green'],
          ['green', 'yellow', 'red', 'yellow', 'green', 'red', 'yellow', 'green'],
          ['red', 'red', 'yellow', 'green', 'yellow', 'red', 'red']
        ],
        starThresholds: [800, 1500, 2500]
      },
      {
        id: 2,
        name: 'Rainbow Arch',
        colors: ['cyan', 'yellow', 'pink'],
        pattern: [
          ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
          ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
          ['pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'pink'],
          ['cyan', 'yellow', 'pink', 'cyan', 'pink', 'yellow', 'cyan'],
          ['pink', 'cyan', 'yellow', 'pink', 'yellow', 'cyan', 'pink']
        ],
        starThresholds: [1200, 2200, 3500]
      },
      {
        id: 3,
        name: 'Diamond Core',
        colors: ['red', 'yellow', 'green', 'cyan'],
        pattern: [
          ['red', 'yellow', 'green', 'cyan', 'cyan', 'green', 'yellow', 'red'],
          ['yellow', 'cyan', 'red', 'yellow', 'red', 'cyan', 'yellow'],
          ['green', 'red', 'cyan', 'green', 'green', 'cyan', 'red', 'green'],
          ['cyan', 'yellow', 'green', 'red', 'green', 'yellow', 'cyan'],
          ['red', 'green', 'yellow', 'cyan', 'cyan', 'yellow', 'green', 'red']
        ],
        starThresholds: [1500, 2800, 4200]
      },
      {
        id: 4,
        name: 'Color Clusters',
        colors: ['purple', 'pink', 'cyan', 'green'],
        pattern: [
          ['purple', 'purple', 'pink', 'pink', 'cyan', 'cyan', 'green', 'green'],
          ['purple', 'purple', 'pink', 'pink', 'cyan', 'cyan', 'green'],
          ['pink', 'pink', 'cyan', 'cyan', 'green', 'green', 'purple', 'purple'],
          ['pink', 'pink', 'cyan', 'cyan', 'green', 'green', 'purple'],
          ['cyan', 'cyan', 'green', 'green', 'purple', 'purple', 'pink', 'pink']
        ],
        starThresholds: [1800, 3200, 5000]
      },
      {
        id: 5,
        name: 'Star Burst',
        colors: ['red', 'yellow', 'cyan', 'purple'],
        pattern: [
          ['yellow', 'red', 'red', 'yellow', 'yellow', 'red', 'red', 'yellow'],
          ['red', 'cyan', 'purple', 'cyan', 'purple', 'cyan', 'red'],
          ['yellow', 'purple', 'yellow', 'cyan', 'cyan', 'yellow', 'purple', 'yellow'],
          ['red', 'cyan', 'purple', 'cyan', 'purple', 'cyan', 'red'],
          ['yellow', 'red', 'red', 'yellow', 'yellow', 'red', 'red', 'yellow'],
          ['purple', 'yellow', 'cyan', 'red', 'cyan', 'yellow', 'purple']
        ],
        starThresholds: [2200, 3800, 6000]
      },
      {
        id: 6,
        name: 'Hexagon Rings',
        colors: ['red', 'yellow', 'green', 'cyan', 'purple'],
        pattern: [
          ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
          ['yellow', 'green', 'cyan', 'purple', 'cyan', 'green', 'yellow'],
          ['green', 'purple', 'red', 'yellow', 'red', 'purple', 'green', 'green'],
          ['cyan', 'red', 'yellow', 'green', 'yellow', 'red', 'cyan'],
          ['purple', 'cyan', 'green', 'yellow', 'green', 'cyan', 'purple', 'purple'],
          ['red', 'yellow', 'red', 'yellow', 'red', 'yellow', 'red']
        ],
        starThresholds: [2500, 4500, 7000]
      },
      {
        id: 7,
        name: 'Heart Pulse',
        colors: ['pink', 'red', 'purple', 'cyan', 'yellow'],
        pattern: [
          ['pink', 'pink', 'red', 'red', 'red', 'red', 'pink', 'pink'],
          ['pink', 'red', 'red', 'purple', 'red', 'red', 'pink'],
          ['red', 'red', 'purple', 'cyan', 'purple', 'red', 'red', 'red'],
          ['pink', 'purple', 'cyan', 'yellow', 'cyan', 'purple', 'pink'],
          ['pink', 'pink', 'cyan', 'yellow', 'cyan', 'pink', 'pink', 'pink'],
          ['red', 'pink', 'pink', 'yellow', 'pink', 'pink', 'red'],
          ['purple', 'red', 'pink', 'pink', 'pink', 'red', 'purple', 'purple']
        ],
        starThresholds: [3000, 5200, 8000]
      },
      {
        id: 8,
        name: 'Zig-Zag Ramp',
        colors: ['cyan', 'yellow', 'green', 'purple', 'pink'],
        pattern: [
          ['cyan', 'yellow', 'green', 'purple', 'pink', 'cyan', 'yellow', 'green'],
          ['yellow', 'green', 'purple', 'pink', 'cyan', 'yellow', 'green'],
          ['green', 'purple', 'pink', 'cyan', 'yellow', 'green', 'purple', 'pink'],
          ['purple', 'pink', 'cyan', 'yellow', 'green', 'purple', 'pink'],
          ['pink', 'cyan', 'yellow', 'green', 'purple', 'pink', 'cyan', 'yellow'],
          ['cyan', 'yellow', 'green', 'purple', 'pink', 'cyan', 'yellow'],
          ['yellow', 'green', 'purple', 'pink', 'cyan', 'yellow', 'green', 'purple']
        ],
        starThresholds: [3500, 6000, 9200]
      },
      {
        id: 9,
        name: 'Dense Invasion',
        colors: ['red', 'yellow', 'green', 'cyan', 'purple', 'pink'],
        pattern: [
          ['red', 'pink', 'purple', 'cyan', 'green', 'yellow', 'red', 'pink'],
          ['pink', 'purple', 'cyan', 'green', 'yellow', 'red', 'pink'],
          ['purple', 'cyan', 'green', 'yellow', 'red', 'pink', 'purple', 'cyan'],
          ['cyan', 'green', 'yellow', 'red', 'pink', 'purple', 'cyan'],
          ['green', 'yellow', 'red', 'pink', 'purple', 'cyan', 'green', 'yellow'],
          ['yellow', 'red', 'pink', 'purple', 'cyan', 'green', 'yellow'],
          ['red', 'pink', 'purple', 'cyan', 'green', 'yellow', 'red', 'pink']
        ],
        starThresholds: [4000, 7000, 10500]
      },
      {
        id: 10,
        name: 'Master Royale',
        colors: ['red', 'yellow', 'green', 'cyan', 'purple', 'pink'],
        pattern: [
          ['purple', 'pink', 'red', 'yellow', 'yellow', 'red', 'pink', 'purple'],
          ['pink', 'red', 'cyan', 'green', 'green', 'cyan', 'red', 'pink'],
          ['red', 'cyan', 'purple', 'pink', 'pink', 'purple', 'cyan', 'red'],
          ['yellow', 'green', 'pink', 'red', 'pink', 'green', 'yellow'],
          ['yellow', 'green', 'purple', 'cyan', 'cyan', 'purple', 'green', 'yellow'],
          ['red', 'cyan', 'green', 'yellow', 'green', 'cyan', 'red'],
          ['pink', 'red', 'yellow', 'cyan', 'cyan', 'yellow', 'red', 'pink'],
          ['purple', 'pink', 'red', 'green', 'green', 'red', 'pink']
        ],
        starThresholds: [5000, 8500, 13000]
      }
    ];
  }

  getCurrentLevel() {
    return this.levels[this.currentLevelIndex];
  }

  loadLevelIntoGrid(hexGrid, levelIndex = 0) {
    this.currentLevelIndex = levelIndex;
    const lvl = this.levels[levelIndex];
    hexGrid.initGrid();

    lvl.pattern.forEach((rowPattern, r) => {
      rowPattern.forEach((colorKey, c) => {
        if (colorKey && BUBBLE_COLORS[colorKey]) {
          hexGrid.placeBubble(r, c, {
            color: BUBBLE_COLORS[colorKey]
          });
        }
      });
    });

    return lvl;
  }

  unlockNextLevel() {
    if (this.currentLevelIndex + 1 >= this.unlockedLevelMax && this.currentLevelIndex + 1 < this.levels.length) {
      this.unlockedLevelMax = this.currentLevelIndex + 2; // 1-indexed level number
      localStorage.setItem('bubble_unlocked_level', this.unlockedLevelMax.toString());
    }
  }

  saveStars(levelId, stars) {
    const existing = this.levelStars[levelId] || 0;
    if (stars > existing) {
      this.levelStars[levelId] = stars;
      localStorage.setItem('bubble_level_stars', JSON.stringify(this.levelStars));
    }
  }

  getStars(levelId) {
    return this.levelStars[levelId] || 0;
  }
}

window.LevelManager = LevelManager;
