/**
 * Shooter & Trajectory Physics Engine for Bubble Pop Royale
 */

class Shooter {
  constructor(canvasWidth, canvasHeight, hexGrid) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.hexGrid = hexGrid;

    this.x = canvasWidth / 2;
    this.y = canvasHeight - 55;
    this.angle = -Math.PI / 2; // Straight up

    this.currentBubble = null;
    this.nextBubble = null;
    this.flyingBubble = null;

    this.speed = 18; // Smooth bullet speed
    this.canShoot = true;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.x = width / 2;
    this.y = height - 55;
  }

  // Set aim angle from target pointer (targetX, targetY)
  setAim(targetX, targetY) {
    if (!this.canShoot) return;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    let angle = Math.atan2(dy, dx);

    // Limit angle range so shooter cannot aim straight down or flat sideways
    const minAngle = -Math.PI + 0.25; // ~-165 deg
    const maxAngle = -0.25;           // ~-15 deg

    if (angle > 0) {
      angle = dx > 0 ? maxAngle : minAngle;
    } else {
      angle = Math.max(minAngle, Math.min(maxAngle, angle));
    }

    this.angle = angle;
  }

  // Load new bubble onto shooter from active color pool
  loadNextBubbles(colorPool) {
    if (colorPool.length === 0) return;

    if (!this.currentBubble) {
      this.currentBubble = { color: this.getRandomColor(colorPool) };
    }
    if (!this.nextBubble) {
      this.nextBubble = { color: this.getRandomColor(colorPool) };
    }
  }

  getRandomColor(colorPool) {
    const key = colorPool[Math.floor(Math.random() * colorPool.length)];
    return BUBBLE_COLORS[key] || BUBBLE_COLORS.red;
  }

  // Swap current bubble with next preview bubble
  swapBubbles() {
    if (!this.canShoot || this.flyingBubble || !this.currentBubble || !this.nextBubble) return false;
    const temp = this.currentBubble;
    this.currentBubble = this.nextBubble;
    this.nextBubble = temp;
    window.soundEngine.playSwap();
    return true;
  }

  // Launch bubble in aim direction
  shoot() {
    if (!this.canShoot || this.flyingBubble || !this.currentBubble) return false;

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;

    this.flyingBubble = {
      x: this.x,
      y: this.y,
      vx: vx,
      vy: vy,
      color: this.currentBubble.color,
      radius: this.hexGrid.radius
    };

    this.currentBubble = this.nextBubble;
    this.nextBubble = null;
    this.canShoot = false;

    window.soundEngine.playShoot();
    return true;
  }

  // Calculate trajectory path points with wall bouncing raycast
  getTrajectoryPoints() {
    const points = [];
    const radius = this.hexGrid.radius;
    let currX = this.x;
    let currY = this.y;
    let dx = Math.cos(this.angle);
    let dy = Math.sin(this.angle);

    points.push({ x: currX, y: currY });

    const maxBounces = 2;
    let bounceCount = 0;
    const step = 15;

    for (let i = 0; i < 60; i++) {
      currX += dx * step;
      currY += dy * step;

      // Wall collision bounces
      if (currX <= radius) {
        currX = radius;
        dx = -dx;
        bounceCount++;
        points.push({ x: currX, y: currY });
      } else if (currX >= this.canvasWidth - radius) {
        currX = this.canvasWidth - radius;
        dx = -dx;
        bounceCount++;
        points.push({ x: currX, y: currY });
      }

      // Check collision with top boundary
      if (currY <= this.hexGrid.topYOffset + radius) {
        points.push({ x: currX, y: currY });
        break;
      }

      // Check collision with existing grid bubbles
      if (this.checkCollisionAt(currX, currY)) {
        points.push({ x: currX, y: currY });
        break;
      }

      if (i % 2 === 0) {
        points.push({ x: currX, y: currY });
      }

      if (bounceCount > maxBounces) break;
    }

    return points;
  }

  // Check if position (x,y) overlaps any grid bubble
  checkCollisionAt(x, y) {
    const radius = this.hexGrid.radius;
    for (let r = 0; r < this.hexGrid.rows; r++) {
      for (let c = 0; c < this.hexGrid.getColsInRow(r); c++) {
        const bubble = this.hexGrid.grid[r][c];
        if (bubble) {
          const pos = this.hexGrid.getBubblePos(r, c);
          const dist = Math.hypot(pos.x - x, pos.y - y);
          if (dist < radius * 1.8) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Update flying bubble movement & collision detection
  update() {
    if (!this.flyingBubble) return null;

    const fb = this.flyingBubble;
    fb.x += fb.vx;
    fb.y += fb.vy;

    // Side wall bounce
    if (fb.x <= fb.radius) {
      fb.x = fb.radius;
      fb.vx = -fb.vx;
      window.soundEngine.playBounce();
    } else if (fb.x >= this.canvasWidth - fb.radius) {
      fb.x = this.canvasWidth - fb.radius;
      fb.vx = -fb.vx;
      window.soundEngine.playBounce();
    }

    // Top ceiling collision
    let hit = false;
    if (fb.y <= this.hexGrid.topYOffset + fb.radius) {
      hit = true;
    } else if (this.checkCollisionAt(fb.x, fb.y)) {
      hit = true;
    }

    if (hit) {
      // Find nearest empty grid cell to snap into
      const cell = this.hexGrid.getNearestEmptyCell(fb.x, fb.y);
      const flying = this.flyingBubble;
      this.flyingBubble = null;
      return { cell, color: flying.color };
    }

    return null;
  }

  // Draw shooter turret, trajectory dots, current & preview bubbles
  draw(ctx) {
    const radius = this.hexGrid.radius;

    // 1. Draw Trajectory Aim Line
    if (this.canShoot && !this.flyingBubble) {
      const points = this.getTrajectoryPoints();
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
      }
      ctx.stroke();

      // Target impact dot indicator
      if (points.length > 0) {
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ec4899';
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Shooter Cannon Base / Turret
    ctx.save();
    ctx.translate(this.x, this.y);

    // Rotating cannon nozzle base
    ctx.rotate(this.angle + Math.PI / 2);

    // Nozzle tube
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -40, 24, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Shooter Platform Outer Ring
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Draw Loaded Current Bubble on Shooter
    if (this.currentBubble && !this.flyingBubble) {
      this.hexGrid.drawBubble(ctx, this.x, this.y, radius, this.currentBubble.color);
    }

    // 4. Draw Active Flying Bullet
    if (this.flyingBubble) {
      this.hexGrid.drawBubble(ctx, this.flyingBubble.x, this.flyingBubble.y, radius, this.flyingBubble.color);
    }
  }

  // Render Next Bubble Preview in HTML side container canvas
  drawNextPreview(previewCanvas) {
    if (!previewCanvas || !this.nextBubble) return;
    const pCtx = previewCanvas.getContext('2d');
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const radius = Math.min(previewCanvas.width, previewCanvas.height) * 0.38;
    this.hexGrid.drawBubble(
      pCtx,
      previewCanvas.width / 2,
      previewCanvas.height / 2,
      radius,
      this.nextBubble.color
    );
  }
}

window.Shooter = Shooter;
