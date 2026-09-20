/**
 * Hexagonal Grid Physics & Logic Manager for Bubble Pop Royale
 */

const BUBBLE_COLORS = {
  red: { id: 'red', hex: '#ef4444', light: '#fca5a5', dark: '#b91c1c' },
  yellow: { id: 'yellow', hex: '#f59e0b', light: '#fde047', dark: '#b45309' },
  green: { id: 'green', hex: '#10b981', light: '#6ee7b7', dark: '#047857' },
  cyan: { id: 'cyan', hex: '#06b6d4', light: '#67e8f9', dark: '#0e7490' },
  purple: { id: 'purple', hex: '#8b5cf6', light: '#c4b5fd', dark: '#6d28d9' },
  pink: { id: 'pink', hex: '#ec4899', light: '#f472b6', dark: '#be185d' }
};

class HexGrid {
  constructor(cols = 8, rows = 12) {
    this.cols = cols;
    this.rows = rows;
    this.radius = 20; // Will be dynamic based on canvas width
    this.rowHeight = Math.sqrt(3) * this.radius;
    this.grid = []; // 2D array: grid[row][col] = bubble object or null
    this.topYOffset = 0;
    this.dangerRowLimit = 10; // If bubbles reach this row => Game Over
    this.initGrid();
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const rowCols = this.getColsInRow(r);
      const row = new Array(rowCols).fill(null);
      this.grid.push(row);
    }
  }

  getColsInRow(r) {
    // Staggered rows: even rows have `this.cols`, odd rows have `this.cols - 1`
    return r % 2 === 0 ? this.cols : this.cols - 1;
  }

  setBubbleRadius(radius) {
    this.radius = radius;
    this.rowHeight = Math.sqrt(3) * this.radius;
  }

  // Convert (row, col) to screen canvas (x, y) coordinates
  getBubblePos(r, c) {
    const isOdd = (r % 2 === 1);
    const xOffset = isOdd ? this.radius * 2 : this.radius;
    const x = xOffset + c * (this.radius * 2);
    const y = this.topYOffset + this.radius + r * this.rowHeight;
    return { x, y };
  }

  // Get neighboring cells for (r, c)
  getNeighbors(r, c) {
    const neighbors = [];
    const isOdd = (r % 2 === 1);

    // Directions for even vs odd rows
    const dirEven = [
      { r: 0, c: -1 }, { r: 0, c: 1 },    // Left, Right
      { r: -1, c: -1 }, { r: -1, c: 0 },  // Top-Left, Top-Right
      { r: 1, c: -1 }, { r: 1, c: 0 }     // Bottom-Left, Bottom-Right
    ];

    const dirOdd = [
      { r: 0, c: -1 }, { r: 0, c: 1 },    // Left, Right
      { r: -1, c: 0 }, { r: -1, c: 1 },   // Top-Left, Top-Right
      { r: 1, c: 0 }, { r: 1, c: 1 }      // Bottom-Left, Bottom-Right
    ];

    const dirs = isOdd ? dirOdd : dirEven;

    dirs.forEach(d => {
      const nr = r + d.r;
      const nc = c + d.c;
      if (nr >= 0 && nr < this.rows) {
        const maxCols = this.getColsInRow(nr);
        if (nc >= 0 && nc < maxCols) {
          neighbors.push({ r: nr, c: nc });
        }
      }
    });

    return neighbors;
  }

  // Find nearest empty cell in grid for a flying bubble at (x, y)
  getNearestEmptyCell(x, y) {
    let nearest = null;
    let minDist = Infinity;

    for (let r = 0; r < this.rows; r++) {
      const maxCols = this.getColsInRow(r);
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c] === null) {
          const pos = this.getBubblePos(r, c);
          const dist = Math.hypot(pos.x - x, pos.y - y);
          if (dist < minDist) {
            minDist = dist;
            nearest = { r, c, x: pos.x, y: pos.y };
          }
        }
      }
    }
    return nearest;
  }

  // Place bubble into grid cell
  placeBubble(r, c, bubble) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.getColsInRow(r)) {
      this.grid[r][c] = bubble;
      return true;
    }
    return false;
  }

  // Get bubble at cell
  getBubble(r, c) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.getColsInRow(r)) {
      return this.grid[r][c];
    }
    return null;
  }

  // Find matching connected cluster of same color (BFS) starting at (startR, startC)
  findMatchCluster(startR, startC) {
    const startBubble = this.getBubble(startR, startC);
    if (!startBubble) return [];

    const targetColor = startBubble.color.id;
    const cluster = [];
    const visited = new Set();
    const queue = [{ r: startR, c: startC }];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const current = queue.shift();
      const bubble = this.getBubble(current.r, current.c);
      
      if (bubble && bubble.color.id === targetColor) {
        cluster.push(current);

        const neighbors = this.getNeighbors(current.r, current.c);
        neighbors.forEach(n => {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            visited.add(key);
            const nBubble = this.getBubble(n.r, n.c);
            if (nBubble && nBubble.color.id === targetColor) {
              queue.push(n);
            }
          }
        });
      }
    }

    return cluster;
  }

  // Find all unattached (orphan) bubbles that aren't connected to the top ceiling row (BFS/DFS)
  findOrphanBubbles() {
    const connectedToTop = new Set();
    const queue = [];

    // All bubbles in row 0 (top ceiling) are roots
    for (let c = 0; c < this.getColsInRow(0); c++) {
      if (this.grid[0][c] !== null) {
        queue.push({ r: 0, c });
        connectedToTop.add(`0,${c}`);
      }
    }

    // Traverse connected bubbles starting from top row
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = this.getNeighbors(current.r, current.c);
      
      neighbors.forEach(n => {
        const key = `${n.r},${n.c}`;
        if (!connectedToTop.has(key) && this.grid[n.r][n.c] !== null) {
          connectedToTop.add(key);
          queue.push(n);
        }
      });
    }

    // Any non-null grid cell NOT in `connectedToTop` is an orphan!
    const orphans = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.getColsInRow(r); c++) {
        if (this.grid[r][c] !== null && !connectedToTop.has(`${r},${c}`)) {
          orphans.push({ r, c, bubble: this.grid[r][c] });
        }
      }
    }

    return orphans;
  }

  // Check if grid is completely cleared (Win condition)
  isEmpty() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.getColsInRow(r); c++) {
        if (this.grid[r][c] !== null) return false;
      }
    }
    return true;
  }

  // Get active color pool currently present on the grid
  getActiveColors() {
    const active = new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.getColsInRow(r); c++) {
        const bubble = this.grid[r][c];
        if (bubble) {
          active.add(bubble.color.id);
        }
      }
    }
    return Array.from(active);
  }

  // Check if any bubble has passed the danger line (Lose condition)
  hasReachedBottom() {
    for (let c = 0; c < this.getColsInRow(this.dangerRowLimit); c++) {
      if (this.grid[this.dangerRowLimit][c] !== null) return true;
    }
    return false;
  }

  // Render static grid bubbles
  draw(ctx) {
    // Draw danger line indicator
    const dangerY = this.topYOffset + this.dangerRowLimit * this.rowHeight + this.radius;
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, dangerY);
    ctx.lineTo(ctx.canvas.width, dangerY);
    ctx.stroke();
    ctx.restore();

    // Draw grid bubbles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.getColsInRow(r); c++) {
        const bubble = this.grid[r][c];
        if (bubble) {
          const pos = this.getBubblePos(r, c);
          this.drawBubble(ctx, pos.x, pos.y, this.radius, bubble.color);
        }
      }
    }
  }

  // Helper method to render a glossy gradient bubble
  drawBubble(ctx, x, y, radius, colorObj) {
    ctx.save();
    ctx.translate(x, y);

    // Radial gradient glossy bubble
    const grad = ctx.createRadialGradient(
      -radius * 0.3,
      -radius * 0.3,
      radius * 0.1,
      0,
      0,
      radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, colorObj.light);
    grad.addColorStop(1, colorObj.dark);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle dark border shadow
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();

    // Glossy highlight sheen arc
    ctx.beginPath();
    ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    ctx.restore();
  }
}

window.BUBBLE_COLORS = BUBBLE_COLORS;
window.HexGrid = HexGrid;
