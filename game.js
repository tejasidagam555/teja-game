/**
 * Main Game Loop, State Controller & Event Binder for Bubble Pop Royale
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-bubble-canvas');

    // Canvas scaling parameters
    this.dpr = window.devicePixelRatio || 1;
    this.width = 440;
    this.height = 700;

    // Core Game Modules
    this.hexGrid = new HexGrid(8, 14);
    this.shooter = new Shooter(this.width, this.height, this.hexGrid);
    this.particles = new ParticleSystem();
    this.levelManager = new LevelManager();

    // Game States: 'START', 'PLAYING', 'PAUSED', 'WIN', 'GAMEOVER'
    this.state = 'START';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('bubble_high_score') || '0', 10);
    this.comboCount = 0;

    // Pointer Aiming Tracking
    this.isPointerDown = false;
    this.pointerPos = { x: this.width / 2, y: 100 };

    this.initDOM();
    this.handleResize();
    this.bindEvents();

    // Start render loop
    requestAnimationFrame(this.loop.bind(this));
  }

  initDOM() {
    document.getElementById('highscore-display').innerText = this.highScore;
    this.renderLevelSelectGrid();
  }

  handleResize() {
    const wrapper = document.getElementById('canvas-wrapper');
    const rect = wrapper.getBoundingClientRect();

    this.width = rect.width;
    this.height = rect.height;

    // Set high-DPI crisp canvas sizing
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    // Calculate optimal bubble radius based on columns
    const bubbleRadius = (this.width / (this.hexGrid.cols * 2));
    this.hexGrid.setBubbleRadius(bubbleRadius);
    this.shooter.resize(this.width, this.height);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.handleResize());

    // Canvas Pointer Aiming & Shooting Controls
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    // UI Buttons Binding
    document.getElementById('btn-start-game').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.startLevel(this.levelManager.currentLevelIndex);
    });

    document.getElementById('btn-start-level-select').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openModal('modal-levels');
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.pauseGame();
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.resumeGame();
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.startLevel(this.levelManager.currentLevelIndex);
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.startLevel(this.levelManager.currentLevelIndex);
    });

    document.getElementById('btn-levels').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openModal('modal-levels');
    });

    document.getElementById('btn-pause-levels').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openModal('modal-levels');
    });

    document.getElementById('btn-close-levels').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.closeModal('modal-levels');
    });

    document.getElementById('btn-audio').addEventListener('click', (e) => {
      const muted = window.soundEngine.toggleMute();
      const icon = e.currentTarget.querySelector('i');
      icon.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    });

    document.getElementById('swap-trigger').addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        this.shooter.swapBubbles();
        this.shooter.drawNextPreview(this.nextCanvas);
      }
    });

    // Level Win Modal Buttons
    document.getElementById('btn-next-level').addEventListener('click', () => {
      window.soundEngine.playClick();
      const nextIdx = Math.min(this.levelManager.currentLevelIndex + 1, this.levelManager.levels.length - 1);
      this.startLevel(nextIdx);
    });

    document.getElementById('btn-win-replay').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.startLevel(this.levelManager.currentLevelIndex);
    });

    document.getElementById('btn-win-menu').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openModal('modal-start');
    });

    // Game Over Buttons
    document.getElementById('btn-retry-level').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.startLevel(this.levelManager.currentLevelIndex);
    });

    document.getElementById('btn-fail-menu').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.openModal('modal-start');
    });
  }

  // Pointer event helpers
  getCanvasPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    this.isPointerDown = true;
    this.pointerPos = this.getCanvasPointerPos(e);
    this.shooter.setAim(this.pointerPos.x, this.pointerPos.y);
  }

  onPointerMove(e) {
    if (this.state !== 'PLAYING') return;
    this.pointerPos = this.getCanvasPointerPos(e);
    if (this.isPointerDown || e.pointerType === 'mouse') {
      this.shooter.setAim(this.pointerPos.x, this.pointerPos.y);
    }
  }

  onPointerUp(e) {
    if (this.state !== 'PLAYING') return;
    if (this.isPointerDown) {
      this.isPointerDown = false;
      this.pointerPos = this.getCanvasPointerPos(e);
      this.shooter.setAim(this.pointerPos.x, this.pointerPos.y);
      this.shootBubble();
    }
  }

  shootBubble() {
    if (!this.shooter.canShoot || this.shooter.flyingBubble) return;
    const shot = this.shooter.shoot();
    if (shot) {
      this.shooter.drawNextPreview(this.nextCanvas);
    }
  }

  startLevel(levelIdx = 0) {
    this.state = 'PLAYING';
    this.score = 0;
    this.comboCount = 0;
    this.updateScoreDisplay();

    const lvl = this.levelManager.loadLevelIntoGrid(this.hexGrid, levelIdx);
    document.getElementById('level-display').innerText = lvl.id;

    this.particles.clear();
    this.shooter.currentBubble = null;
    this.shooter.nextBubble = null;
    this.shooter.loadNextBubbles(lvl.colors);
    this.shooter.canShoot = true;
    this.shooter.drawNextPreview(this.nextCanvas);

    this.closeAllModals();
  }

  pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.openModal('modal-pause');
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.closeModal('modal-pause');
    }
  }

  openModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  }

  renderLevelSelectGrid() {
    const container = document.getElementById('level-grid');
    container.innerHTML = '';

    this.levelManager.levels.forEach((lvl, idx) => {
      const card = document.createElement('div');
      const isUnlocked = idx + 1 <= this.levelManager.unlockedLevelMax;
      const stars = this.levelManager.getStars(lvl.id);

      card.className = `level-card ${isUnlocked ? '' : 'locked'} ${stars > 0 ? 'completed' : ''}`;

      let starHTML = '';
      for (let s = 1; s <= 3; s++) {
        starHTML += `<i class="fa-solid fa-star ${s <= stars ? '' : 'empty'}"></i>`;
      }

      card.innerHTML = `
        <span class="level-number">${lvl.id}</span>
        <div class="level-stars">${starHTML}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          window.soundEngine.playClick();
          this.startLevel(idx);
        });
      }

      container.appendChild(card);
    });
  }

  updateScoreDisplay() {
    document.getElementById('score-display').innerText = this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('bubble_high_score', this.highScore.toString());
      document.getElementById('highscore-display').innerText = this.highScore;
    }
  }

  // Handle flying bubble snapping & matching mechanics
  onBubbleSnap(snapResult) {
    const { cell, color } = snapResult;
    if (!cell) {
      this.shooter.canShoot = true;
      return;
    }

    // Place bubble in grid
    this.hexGrid.placeBubble(cell.r, cell.c, { color });

    // Check matching cluster (3 or more bubbles)
    const cluster = this.hexGrid.findMatchCluster(cell.r, cell.c);

    if (cluster.length >= 3) {
      this.comboCount++;
      const popCount = cluster.length;
      const points = popCount * 100 * this.comboCount;
      this.score += points;
      this.updateScoreDisplay();

      // Play audio & create particle burst for each popped bubble
      window.soundEngine.playPop(this.comboCount);

      cluster.forEach(({ r, c }) => {
        const bubble = this.hexGrid.getBubble(r, c);
        const pos = this.hexGrid.getBubblePos(r, c);
        if (bubble) {
          this.particles.createPopBurst(pos.x, pos.y, bubble.color.hex, 16);
          this.hexGrid.grid[r][c] = null; // Remove bubble from grid
        }
      });

      // Show combo score text callout at hit location
      const textCallout = this.comboCount > 1 ? `+${points} (${this.comboCount}x COMBO!)` : `+${points}`;
      this.particles.addScoreText(cell.x, cell.y, textCallout, '#fbbf24');

      // Check for orphan bubbles disconnected from top ceiling
      const orphans = this.hexGrid.findOrphanBubbles();
      if (orphans.length > 0) {
        window.soundEngine.playDrop();
        const dropBonus = orphans.length * 250;
        this.score += dropBonus;
        this.updateScoreDisplay();

        orphans.forEach(({ r, c, bubble }) => {
          const pos = this.hexGrid.getBubblePos(r, c);
          this.particles.addFallingBubble(pos.x, pos.y, this.hexGrid.radius, bubble.color.hex, bubble.color);
          this.hexGrid.grid[r][c] = null;
        });

        this.particles.addScoreText(this.width / 2, this.height * 0.4, `DROP BONUS +${dropBonus}!`, '#38bdf8');
      }

      // Check win condition: grid cleared!
      if (this.hexGrid.isEmpty()) {
        this.handleLevelWin();
        return;
      }
    } else {
      // Failed to match => reset combo count
      this.comboCount = 0;

      // Check lose condition: bubbles reached bottom danger line
      if (this.hexGrid.hasReachedBottom()) {
        this.handleGameOver();
        return;
      }
    }

    // Refresh shooter colors pool to match remaining colors on grid
    const remainingColors = this.hexGrid.getActiveColors();
    if (remainingColors.length > 0) {
      this.shooter.loadNextBubbles(remainingColors);
      this.shooter.drawNextPreview(this.nextCanvas);
    } else {
      this.handleLevelWin();
      return;
    }

    this.shooter.canShoot = true;
  }

  handleLevelWin() {
    this.state = 'WIN';
    window.soundEngine.playWin();

    const lvl = this.levelManager.getCurrentLevel();
    this.levelManager.unlockNextLevel();
    this.renderLevelSelectGrid();

    // Determine star rating (1 to 3 stars)
    let stars = 1;
    if (this.score >= lvl.starThresholds[2]) stars = 3;
    else if (this.score >= lvl.starThresholds[1]) stars = 2;

    this.levelManager.saveStars(lvl.id, stars);

    // Populate win modal text & stars
    document.getElementById('win-score').innerText = this.score;
    document.getElementById('win-total-score').innerText = this.score;

    for (let s = 1; s <= 3; s++) {
      const starEl = document.querySelector(`.stars-rating .star-${s}`);
      if (starEl) {
        if (s <= stars) starEl.classList.remove('empty');
        else starEl.classList.add('empty');
      }
    }

    this.openModal('modal-win');
  }

  handleGameOver() {
    this.state = 'GAMEOVER';
    window.soundEngine.playGameOver();
    document.getElementById('fail-score').innerText = this.score;
    this.openModal('modal-gameover');
  }

  // Main 60fps game render loop
  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Hexagonal Grid
    this.hexGrid.draw(this.ctx);

    // Update & Draw Shooter Cannon & Active Bullet
    if (this.state === 'PLAYING') {
      const snapResult = this.shooter.update();
      if (snapResult) {
        this.onBubbleSnap(snapResult);
      }
    }

    this.shooter.draw(this.ctx);

    // Update & Draw Particle System
    this.particles.update(this.height);
    this.particles.draw(this.ctx);

    requestAnimationFrame(this.loop.bind(this));
  }
}

// Initialize Game on DOM Content Loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
