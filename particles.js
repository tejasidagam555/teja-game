/**
 * Particle Effects & Animations Engine for Bubble Pop Royale
 */

class Particle {
  constructor(x, y, color, speed, angle, size, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.gravity = 0.15;
    this.friction = 0.98;
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.vr = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vr;

    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * this.alpha, 0, Math.PI * 2);
    ctx.fill();

    // Subtle glow outline
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fill();

    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color = '#fbbf24', fontSize = 22) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.vy = -1.8;
    this.life = 45;
    this.maxLife = 45;
    this.alpha = 1;
    this.scale = 0.5;
  }

  update() {
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);

    // Initial pop scaling up
    if (this.scale < 1.2) {
      this.scale += 0.1;
    } else if (this.scale > 1.0) {
      this.scale -= 0.05;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctx.font = `700 ${this.fontSize}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black stroke border for crisp readability
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(this.text, 0, 0);

    // Glowing filled text
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}

class FallingBubble {
  constructor(x, y, radius, colorHex, colorObj) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colorHex = colorHex;
    this.colorObj = colorObj;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -Math.random() * 3 - 2; // Initial upward bounce bump
    this.gravity = 0.45;
    this.rotation = 0;
    this.vr = (Math.random() - 0.5) * 0.15;
    this.alpha = 1;
    this.active = true;
  }

  update(canvasHeight) {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vr;

    if (this.y + this.radius > canvasHeight) {
      this.alpha -= 0.1;
      if (this.alpha <= 0) {
        this.active = false;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);

    // Draw glossy bubble
    const grad = ctx.createRadialGradient(
      -this.radius * 0.3,
      -this.radius * 0.3,
      this.radius * 0.1,
      0,
      0,
      this.radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, this.colorObj ? this.colorObj.light : this.colorHex);
    grad.addColorStop(1, this.colorObj ? this.colorObj.dark : this.colorHex);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Highlight sheen
    ctx.beginPath();
    ctx.arc(-this.radius * 0.35, -this.radius * 0.35, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.fallingBubbles = [];
  }

  createPopBurst(x, y, colorHex, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 4.5 + 2;
      const size = Math.random() * 4 + 3;
      const life = Math.floor(Math.random() * 20 + 20);
      this.particles.push(new Particle(x, y, colorHex, speed, angle, size, life));
    }
  }

  addScoreText(x, y, text, color = '#fbbf24') {
    this.floatingTexts.push(new FloatingText(x, y, text, color));
  }

  addFallingBubble(x, y, radius, colorHex, colorObj) {
    this.fallingBubbles.push(new FallingBubble(x, y, radius, colorHex, colorObj));
  }

  update(canvasHeight) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update();
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update falling bubbles
    for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = this.fallingBubbles[i];
      fb.update(canvasHeight);
      if (!fb.active) {
        // Create pop burst at bottom
        this.createPopBurst(fb.x, fb.y, fb.colorHex, 8);
        this.fallingBubbles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw falling bubbles
    this.fallingBubbles.forEach(fb => fb.draw(ctx));

    // Draw particles
    this.particles.forEach(p => p.draw(ctx));

    // Draw floating text on top
    this.floatingTexts.forEach(ft => ft.draw(ctx));
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.fallingBubbles = [];
  }
}

window.ParticleSystem = ParticleSystem;
