/**
 * Aero Visit - Interactive Wind Tunnel Animation Engine
 * A kid-friendly aerodynamics demonstration with three paper airplane types.
 *
 * Canvas IDs: "tunnel-dart", "tunnel-glider", "tunnel-tumbler"
 * Slider IDs: "speed-dart", "speed-glider", "speed-tumbler"
 * Button IDs: "launch-dart", "launch-glider", "launch-tumbler"
 */

// ---------------------------------------------------------------------------
// Particle - represents a single wind streak inside the tunnel
// ---------------------------------------------------------------------------
class Particle {
  /**
   * @param {number} x - initial x position
   * @param {number} y - initial y position
   * @param {number} speed - base horizontal speed
   * @param {HTMLCanvasElement} canvas - the host canvas (for bounds)
   */
  constructor(x, y, speed, canvas) {
    this.x = x;
    this.y = y;
    this.originY = y; // remember spawn row for reset
    this.baseSpeed = speed;
    this.size = 2 + Math.random() * 3; // 2-5
    this.opacity = 0.3 + Math.random() * 0.5; // 0.3-0.8
    this.canvas = canvas;

    // Default light-blue / white palette; may be tinted at draw time
    this.r = 180 + Math.floor(Math.random() * 75);
    this.g = 210 + Math.floor(Math.random() * 45);
    this.b = 255;

    // Per-particle jitter so motion looks organic
    this.jitterPhase = Math.random() * Math.PI * 2;
    this.jitterAmp = 0.3 + Math.random() * 0.5;

    // Streak length factor (longer at higher speeds)
    this.streakFactor = 0.6 + Math.random() * 0.8;
  }

  /**
   * Advance the particle one frame.
   * Behaviour changes depending on the airplane type in the tunnel.
   *
   * @param {number} windSpeed - current wind speed (1-10)
   * @param {string} airplaneType - "dart" | "glider" | "tumbler"
   * @param {{x:number, y:number, width:number, height:number}} planePos
   */
  update(windSpeed, airplaneType, planePos) {
    const speed = this.baseSpeed * (windSpeed / 5);
    const time = performance.now() / 1000;

    // Small vertical jitter for every particle (organic feel)
    const jitter = Math.sin(time * 2 + this.jitterPhase) * this.jitterAmp;

    // ---- Type-specific flow behaviour ----
    if (airplaneType === 'dart') {
      // Laminar flow: move right, barely deflected
      this.x += speed;
      this.y += jitter * 0.3;
      // Keep colour default blue-white
      this.r = 180 + Math.floor(Math.random() * 10);
      this.g = 215;
      this.b = 255;
    } else if (airplaneType === 'glider') {
      // Lift visual: particles below the wing curve upward
      const dx = this.x - planePos.x;
      const dy = this.y - planePos.y;
      const nearWing =
        Math.abs(dx) < planePos.width * 0.7 &&
        Math.abs(dy) < planePos.height * 1.2;

      if (nearWing && dy > 0) {
        // Below wing -> deflect upward (lift)
        this.y -= speed * 0.45;
        this.x += speed * 0.7;
        // Tint green for lift zone
        this.r = 100;
        this.g = 210;
        this.b = 140;
      } else {
        this.x += speed;
        this.y += jitter * 0.4;
        this.r = 180;
        this.g = 220;
        this.b = 255;
      }
    } else if (airplaneType === 'tumbler') {
      // High drag: slow down in front, scatter chaotically
      const dx = this.x - planePos.x;
      const dy = this.y - planePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inFront = dx > -planePos.width && dx < planePos.width * 0.3;
      const nearBody = Math.abs(dy) < planePos.height * 1.5;

      if (inFront && nearBody && dist < planePos.width * 1.5) {
        // Bunch up / slow, spray outward
        this.x += speed * 0.2;
        this.y += (dy > 0 ? 1 : -1) * speed * 0.7 + jitter * 2;
        // Tint red/orange for drag zone
        this.r = 255;
        this.g = 140 + Math.floor(Math.random() * 30);
        this.b = 80;
      } else {
        this.x += speed * 0.85;
        this.y += jitter * 0.8 + Math.sin(time * 5 + this.jitterPhase) * 0.6;
        this.r = 200;
        this.g = 200;
        this.b = 255;
      }
    }

    // Wrap: when off the right edge, reset to the left
    if (this.x > this.canvas.width / (window.devicePixelRatio || 1) + 10) {
      this.reset();
    }
    // Keep within vertical tunnel bounds (with padding for walls)
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    if (this.y < 30) this.y = 30 + Math.random() * 10;
    if (this.y > h - 30) this.y = h - 30 - Math.random() * 10;
  }

  /** Reset to the left edge at a random height */
  reset() {
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    this.x = -Math.random() * 40;
    this.y = 35 + Math.random() * (h - 70);
    this.originY = this.y;
  }

  /**
   * Render the particle as a short horizontal streak.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} windSpeed
   * @param {boolean} glow - whether the tunnel is hovered (brighter particles)
   */
  draw(ctx, windSpeed, glow) {
    ctx.save();
    ctx.globalAlpha = this.opacity * (glow ? 1.15 : 1);
    ctx.strokeStyle = `rgb(${this.r},${this.g},${this.b})`;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = this.size * 0.6;
    ctx.lineCap = 'round';

    const streakLen = this.size * this.streakFactor * (windSpeed / 3);

    if (streakLen > 3) {
      // Draw as a wind streak line
      ctx.beginPath();
      ctx.moveTo(this.x - streakLen, this.y);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    } else {
      // Draw as a small circle dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Sparkle - tiny confetti burst on launch
// ---------------------------------------------------------------------------
class Sparkle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const force = 2 + Math.random() * 4;
    this.vx = Math.cos(angle) * force;
    this.vy = Math.sin(angle) * force;
    this.life = 1; // fades from 1 to 0
    this.size = 2 + Math.random() * 3;
    this.color = ['#FFD700', '#FF6B6B', '#6BCB77', '#A66CFF', '#00D2FF'][
      Math.floor(Math.random() * 5)
    ];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12; // gravity
    this.vx *= 0.98;
    this.life -= 0.02;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// PaperAirplane - the three plane designs drawn with canvas paths
// ---------------------------------------------------------------------------
class PaperAirplane {
  /**
   * @param {string} type - "dart" | "glider" | "tumbler"
   * @param {number} x - center x
   * @param {number} y - center y
   */
  constructor(type, x, y) {
    this.type = type;
    this.homeX = x;
    this.homeY = y;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.wobble = 0;
    this.scale = 1;

    // Launch state
    this.launched = false;
    this.launchProgress = 0; // 0..1 across the tunnel
    this.launchPhase = 'fly'; // 'fly' | 'bounce'
    this.bounceProgress = 0;

    // Dimensions used for collision zones
    if (type === 'dart') {
      this.width = 80;
      this.height = 30;
    } else if (type === 'glider') {
      this.width = 60;
      this.height = 100;
    } else {
      this.width = 50;
      this.height = 60;
    }
  }

  /** Positional bounding info for particles */
  get pos() {
    return {
      x: this.x,
      y: this.y,
      width: this.width * this.scale,
      height: this.height * this.scale,
    };
  }

  // --- Drawing helpers for each airplane type ---

  /** DART: sleek, narrow, fast-looking paper airplane */
  _drawDart(ctx) {
    ctx.save();

    // Main body - elongated triangle
    ctx.beginPath();
    ctx.moveTo(40, 0); // nose tip
    ctx.lineTo(-30, -14); // top trailing edge
    ctx.lineTo(-20, 0); // tail notch
    ctx.lineTo(-30, 14); // bottom trailing edge
    ctx.closePath();
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#D94F4F';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Upper wing surface (slightly darker for fold)
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-30, -14);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fillStyle = '#FF8585';
    ctx.fill();

    // Centre fold line
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-25, 0);
    ctx.strokeStyle = '#C44040';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Wing fold crease (top)
    ctx.beginPath();
    ctx.moveTo(20, -2);
    ctx.lineTo(-25, -10);
    ctx.strokeStyle = '#D95555';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Wing fold crease (bottom)
    ctx.beginPath();
    ctx.moveTo(20, 2);
    ctx.lineTo(-25, 10);
    ctx.strokeStyle = '#D95555';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small swept-back fins
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-30, -14);
    ctx.lineTo(-26, -6);
    ctx.closePath();
    ctx.fillStyle = '#E05555';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-30, 14);
    ctx.lineTo(-26, 6);
    ctx.closePath();
    ctx.fillStyle = '#E05555';
    ctx.fill();

    ctx.restore();
  }

  /** GLIDER: wide-winged, flat, lots of surface area */
  _drawGlider(ctx) {
    ctx.save();

    // Wide wings (filled to emphasise surface area / lift)
    ctx.beginPath();
    ctx.moveTo(25, 0); // nose
    ctx.lineTo(5, -48); // left wingtip
    ctx.lineTo(-25, -40); // left trailing edge
    ctx.lineTo(-20, 0); // tail
    ctx.lineTo(-25, 40); // right trailing edge
    ctx.lineTo(5, 48); // right wingtip
    ctx.closePath();
    ctx.fillStyle = '#6BCB77';
    ctx.fill();
    ctx.strokeStyle = '#4AA856';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Upper wing half (lighter shade for paper fold)
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(5, -48);
    ctx.lineTo(-25, -40);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fillStyle = '#80D98A';
    ctx.fill();

    // Centre body fold
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-20, 0);
    ctx.strokeStyle = '#3D8B47';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wing spar creases
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#4AA856';
    ctx.lineWidth = 0.7;

    ctx.beginPath();
    ctx.moveTo(15, -5);
    ctx.lineTo(-15, -35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(15, 5);
    ctx.lineTo(-15, 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Wingtip folds
    ctx.beginPath();
    ctx.moveTo(5, -48);
    ctx.lineTo(0, -40);
    ctx.lineTo(-8, -42);
    ctx.strokeStyle = '#3D8B47';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, 48);
    ctx.lineTo(0, 40);
    ctx.lineTo(-8, 42);
    ctx.stroke();

    ctx.restore();
  }

  /** TUMBLER: blunt, stubby, chunky - clearly not aerodynamic */
  _drawTumbler(ctx) {
    ctx.save();

    // Main blunt body
    ctx.beginPath();
    ctx.moveTo(15, 0); // blunt nose (not pointy)
    ctx.lineTo(10, -18); // top-front
    ctx.lineTo(-20, -28); // top wing
    ctx.lineTo(-22, -10); // crumpled wing inner
    ctx.lineTo(-20, 0); // tail
    ctx.lineTo(-22, 10);
    ctx.lineTo(-20, 28); // bottom wing
    ctx.lineTo(10, 18); // bottom-front
    ctx.closePath();
    ctx.fillStyle = '#A66CFF';
    ctx.fill();
    ctx.strokeStyle = '#8B4FE0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Upper half lighter
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(10, -18);
    ctx.lineTo(-20, -28);
    ctx.lineTo(-22, -10);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fillStyle = '#BB88FF';
    ctx.fill();

    // Blunt nose cap (flat front)
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(10, -18);
    ctx.lineTo(13, -10);
    ctx.lineTo(16, 0);
    ctx.lineTo(13, 10);
    ctx.lineTo(10, 18);
    ctx.closePath();
    ctx.fillStyle = '#9B5FEE';
    ctx.fill();

    // Centre fold
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-20, 0);
    ctx.strokeStyle = '#7040C0';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Crumple creases (messy fold lines)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#7B50D0';
    ctx.lineWidth = 0.7;

    ctx.beginPath();
    ctx.moveTo(5, -5);
    ctx.lineTo(-15, -22);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.lineTo(-15, 22);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.lineTo(-18, -18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(-18, 18);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  /**
   * Render the paper airplane onto the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} windSpeed
   * @param {boolean} highlight - draw highlight outline when hovered
   */
  draw(ctx, windSpeed, highlight) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // Shadow underneath
    ctx.save();
    ctx.translate(3, 5);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    if (this.type === 'dart') {
      ctx.ellipse(0, 0, 35, 10, 0, 0, Math.PI * 2);
    } else if (this.type === 'glider') {
      ctx.ellipse(0, 0, 28, 30, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, 0, 22, 20, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // Highlight glow when canvas is hovered
    if (highlight) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 14;
      // Draw a ghost outline
      ctx.globalAlpha = 0.3;
      if (this.type === 'dart') this._drawDart(ctx);
      else if (this.type === 'glider') this._drawGlider(ctx);
      else this._drawTumbler(ctx);
      ctx.restore();
    }

    // Actual airplane
    if (this.type === 'dart') this._drawDart(ctx);
    else if (this.type === 'glider') this._drawGlider(ctx);
    else this._drawTumbler(ctx);

    ctx.restore();
  }

  /**
   * React to the current wind speed each frame (idle behaviour).
   * @param {number} windSpeed - 1-10
   */
  react(windSpeed) {
    if (this.launched) return; // launch animation takes priority

    const t = performance.now() / 1000;
    const w = windSpeed / 10; // normalised 0-1

    if (this.type === 'dart') {
      // Very stable - tiny wobble, stays in place
      this.wobble = Math.sin(t * 1.5) * 0.015 * windSpeed;
      this.angle = this.wobble;
      this.x = this.homeX + Math.sin(t * 0.8) * 1.5;
      this.y = this.homeY + Math.sin(t * 1.2) * 1.0;
    } else if (this.type === 'glider') {
      // Lifts up proportional to wind speed, gentle float
      this.wobble = Math.sin(t * 1.0) * 0.03 * windSpeed;
      this.angle = -0.05 * w + Math.sin(t * 0.6) * 0.02;
      this.x = this.homeX + Math.sin(t * 0.5) * 2;
      this.y = this.homeY - windSpeed * 3.5 + Math.sin(t * 0.9) * 3;
    } else {
      // Pushed back, heavy wobble, struggling
      this.wobble = Math.sin(t * 3.5) * 0.12 * w;
      this.angle = this.wobble + Math.sin(t * 5) * 0.04 * windSpeed;
      this.x = this.homeX + windSpeed * 2.5 + Math.sin(t * 2) * 3;
      this.y = this.homeY + Math.sin(t * 1.8) * 4 * w;
    }
  }

  /**
   * Begin the launch fly-through animation.
   * @param {number} tunnelWidth - width of the tunnel in CSS pixels
   */
  launch(tunnelWidth) {
    if (this.launched) return;
    this.launched = true;
    this.launchProgress = 0;
    this.launchPhase = 'fly';
    this.bounceProgress = 0;
    this._tunnelWidth = tunnelWidth;
    this._launchStartX = this.x;
    this._launchStartY = this.y;
  }

  /**
   * Advance the launch animation one frame.
   * Returns true while animation is still running.
   */
  updateLaunch() {
    if (!this.launched) return false;

    if (this.launchPhase === 'fly') {
      // Speed differs per type
      let rate;
      if (this.type === 'dart') rate = 0.022;
      else if (this.type === 'glider') rate = 0.014;
      else rate = 0.008;

      this.launchProgress += rate;
      const p = this.launchProgress;
      const tw = this._tunnelWidth;

      if (this.type === 'dart') {
        // Fast straight line
        this.x = this._launchStartX + p * (tw + 40);
        this.y = this._launchStartY + Math.sin(p * Math.PI) * -5;
        this.angle = 0;
      } else if (this.type === 'glider') {
        // Arc upward then float
        this.x = this._launchStartX + p * (tw + 40);
        this.y =
          this._launchStartY + Math.sin(p * Math.PI) * -50;
        this.angle = -Math.sin(p * Math.PI) * 0.15;
      } else {
        // Slow, wobbly, drops down
        this.x = this._launchStartX + p * (tw + 40);
        this.y =
          this._launchStartY +
          p * 30 +
          Math.sin(p * Math.PI * 6) * 8;
        this.angle = Math.sin(p * Math.PI * 8) * 0.25;
      }

      if (this.launchProgress >= 1) {
        this.launchPhase = 'bounce';
        this.bounceProgress = 0;
      }
    } else if (this.launchPhase === 'bounce') {
      // Fun bounce-back to home position
      this.bounceProgress += 0.035;
      const bp = Math.min(this.bounceProgress, 1);

      // Ease-out with overshoot (spring)
      const ease = 1 - Math.pow(1 - bp, 3);
      const overshoot = Math.sin(bp * Math.PI * 3) * (1 - bp) * 15;

      this.x = this._tunnelWidth + 60 + (this.homeX - this._tunnelWidth - 60) * ease + overshoot;
      this.y = this.y + (this.homeY - this.y) * 0.08;
      this.angle *= 0.92;

      if (this.bounceProgress >= 1) {
        this.launched = false;
        this.x = this.homeX;
        this.y = this.homeY;
        this.angle = 0;
      }
    }

    return this.launched;
  }
}

// ---------------------------------------------------------------------------
// WindTunnel - manages one canvas, its particles, and its airplane
// ---------------------------------------------------------------------------
class WindTunnel {
  /**
   * @param {string} canvasId - DOM id of the <canvas>
   * @param {string} airplaneType - "dart" | "glider" | "tumbler"
   */
  constructor(canvasId, airplaneType) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`WindTunnel: canvas "#${canvasId}" not found.`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.type = airplaneType;
    this.windSpeed = 3;
    this.isHovered = false;
    this.animationId = null;
    this.visible = true; // toggled by IntersectionObserver
    this.shakeOffset = { x: 0, y: 0 };
    this.sparkles = [];

    // Display size in CSS pixels
    this.displayWidth = 600;
    this.displayHeight = 350;

    this._applySize();

    // Create airplane at centre of the tunnel (slightly left of middle)
    const cx = this.displayWidth * 0.38;
    const cy = this.displayHeight * 0.5;
    this.airplane = new PaperAirplane(airplaneType, cx, cy);

    // Particle pool (object pooling - reuse, never destroy)
    this.particles = [];
    this._fillParticles(100);

    // Bind animate so we can use it as a callback
    this._animate = this.animate.bind(this);
  }

  /** (Re)calculate canvas size accounting for devicePixelRatio */
  _applySize() {
    const dpr = window.devicePixelRatio || 1;
    // Allow the canvas to be as wide as its CSS container (responsive)
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0) {
      this.displayWidth = rect.width;
      this.displayHeight = rect.height || 350;
    }
    this.canvas.width = this.displayWidth * dpr;
    this.canvas.height = this.displayHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Resize handler */
  resize() {
    this._applySize();
    // Reposition airplane home
    this.airplane.homeX = this.displayWidth * 0.38;
    this.airplane.homeY = this.displayHeight * 0.5;
    if (!this.airplane.launched) {
      this.airplane.x = this.airplane.homeX;
      this.airplane.y = this.airplane.homeY;
    }
  }

  /** Create or top-up the particle pool to the given count */
  _fillParticles(target) {
    while (this.particles.length < target) {
      const x = Math.random() * this.displayWidth;
      const y = 35 + Math.random() * (this.displayHeight - 70);
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(x, y, speed, this.canvas));
    }
    // Trim if we have too many
    while (this.particles.length > target) {
      this.particles.pop();
    }
  }

  // --- Drawing helpers ---

  /** Render the tunnel background (walls, grid, gradient) */
  _drawBackground() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    // Background gradient (light in centre, blue-gray at edges)
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6);
    bgGrad.addColorStop(0, this.isHovered ? '#FAFCFF' : '#F4F7FC');
    bgGrad.addColorStop(1, this.isHovered ? '#E2EAF4' : '#D8E2F0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // --- Tunnel walls (top and bottom metallic strips) ---
    const wallH = 26;

    // Top wall
    const topGrad = ctx.createLinearGradient(0, 0, 0, wallH);
    topGrad.addColorStop(0, '#8A9BB0');
    topGrad.addColorStop(0.5, '#B0BEC9');
    topGrad.addColorStop(1, '#CBD5DE');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, wallH);

    // Bottom wall
    const botGrad = ctx.createLinearGradient(0, h - wallH, 0, h);
    botGrad.addColorStop(0, '#CBD5DE');
    botGrad.addColorStop(0.5, '#B0BEC9');
    botGrad.addColorStop(1, '#8A9BB0');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h - wallH, w, wallH);

    // Grid lines on walls for depth
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < w; gx += 30) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, wallH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx, h - wallH);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    // Measurement marks on left side (like a real wind tunnel)
    ctx.fillStyle = 'rgba(100,120,140,0.35)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (let my = wallH + 20; my < h - wallH; my += 40) {
      // Tick mark
      ctx.fillRect(0, my, 8, 1);
      ctx.fillText(Math.round(my), 28, my + 3);
    }

    // Glass edge effect (subtle transparent gloss on top and bottom)
    const glassTop = ctx.createLinearGradient(0, wallH, 0, wallH + 18);
    glassTop.addColorStop(0, 'rgba(200,220,240,0.3)');
    glassTop.addColorStop(1, 'rgba(200,220,240,0)');
    ctx.fillStyle = glassTop;
    ctx.fillRect(0, wallH, w, 18);

    const glassBot = ctx.createLinearGradient(0, h - wallH - 18, 0, h - wallH);
    glassBot.addColorStop(0, 'rgba(200,220,240,0)');
    glassBot.addColorStop(1, 'rgba(200,220,240,0.3)');
    ctx.fillStyle = glassBot;
    ctx.fillRect(0, h - wallH - 18, w, 18);
  }

  /** Draw a small wind-speed gauge in the top-right corner */
  _drawWindGauge() {
    const ctx = this.ctx;
    const x = this.displayWidth - 70;
    const y = 36;
    const barW = 50;
    const barH = 10;
    const ratio = this.windSpeed / 10;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x, y, barW, barH);

    // Filled portion (green -> yellow -> red)
    let color;
    if (ratio < 0.4) color = '#4CAF50';
    else if (ratio < 0.7) color = '#FFC107';
    else color = '#F44336';

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW * ratio, barH);

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);

    // Label
    ctx.fillStyle = 'rgba(60,70,80,0.7)';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WIND', x, y - 3);
  }

  /** Trigger sparkle / confetti burst at the airplane position */
  spawnSparkles() {
    for (let i = 0; i < 25; i++) {
      this.sparkles.push(new Sparkle(this.airplane.x, this.airplane.y));
    }
  }

  /** Set wind speed and adjust particle count dynamically */
  setWindSpeed(speed) {
    this.windSpeed = Math.max(1, Math.min(10, speed));
    // More particles at higher speeds (80 base + up to 40 extra)
    const target = 80 + Math.floor((this.windSpeed / 10) * 40);
    this._fillParticles(target);
  }

  /** Handle hover state */
  handleHover(hovered) {
    this.isHovered = hovered;
  }

  /** Main animation loop */
  animate() {
    // Skip rendering when off-screen (performance)
    if (!this.visible) {
      this.animationId = requestAnimationFrame(this._animate);
      return;
    }

    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.save();

    // Screen shake at max wind
    if (this.windSpeed >= 10) {
      const intensity = 2;
      this.shakeOffset.x = (Math.random() - 0.5) * intensity;
      this.shakeOffset.y = (Math.random() - 0.5) * intensity;
      ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    // 1. Background
    this._drawBackground();

    // 2. Particles
    const planePos = this.airplane.pos;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.update(this.windSpeed, this.type, planePos);
      p.draw(ctx, this.windSpeed, this.isHovered);
    }

    // 3. Airplane reaction or launch update
    if (this.airplane.launched) {
      this.airplane.updateLaunch();
    } else {
      this.airplane.react(this.windSpeed);
    }

    // 4. Draw airplane
    this.airplane.draw(ctx, this.windSpeed, this.isHovered);

    // 5. Wind gauge
    this._drawWindGauge();

    // 6. Sparkles / confetti
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      this.sparkles[i].update();
      this.sparkles[i].draw(ctx);
      if (this.sparkles[i].life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }

    ctx.restore();

    this.animationId = requestAnimationFrame(this._animate);
  }

  /** Stop the animation loop */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Initialisation - wire everything up once the DOM is ready
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // --- Create the three wind tunnels ---
  const dartTunnel = new WindTunnel('tunnel-dart', 'dart');
  const gliderTunnel = new WindTunnel('tunnel-glider', 'glider');
  const tumblerTunnel = new WindTunnel('tunnel-tumbler', 'tumbler');

  const tunnels = [dartTunnel, gliderTunnel, tumblerTunnel];

  // Guard: if any canvas was missing, the tunnel's .canvas will be null
  const activeTunnels = tunnels.filter((t) => t.canvas);

  // --- Connect speed sliders ---
  const sliderPairs = [
    { sliderId: 'speed-dart', labelId: 'speed-dart-value', tunnel: dartTunnel },
    { sliderId: 'speed-glider', labelId: 'speed-glider-value', tunnel: gliderTunnel },
    { sliderId: 'speed-tumbler', labelId: 'speed-tumbler-value', tunnel: tumblerTunnel },
  ];

  sliderPairs.forEach(({ sliderId, labelId, tunnel }) => {
    const slider = document.getElementById(sliderId);
    if (!slider || !tunnel.canvas) return;
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      tunnel.setWindSpeed(val);
      const label = document.getElementById(labelId);
      if (label) label.textContent = val;
    });
  });

  // --- Connect launch buttons ---
  const buttonPairs = [
    { btnId: 'launch-dart', tunnel: dartTunnel },
    { btnId: 'launch-glider', tunnel: gliderTunnel },
    { btnId: 'launch-tumbler', tunnel: tumblerTunnel },
  ];

  buttonPairs.forEach(({ btnId, tunnel }) => {
    const btn = document.getElementById(btnId);
    if (!btn || !tunnel.canvas) return;
    btn.addEventListener('click', () => {
      if (tunnel.airplane.launched) return; // prevent double-launch

      tunnel.airplane.launch(tunnel.displayWidth);
      tunnel.spawnSparkles();

      // Fun button feedback
      const originalText = btn.textContent;
      btn.textContent = 'Whoooosh!';
      btn.disabled = true;
      btn.style.transform = 'scale(0.95)';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.transform = '';
      }, 1200);
    });
  });

  // --- Connect hover events ---
  activeTunnels.forEach((tunnel) => {
    tunnel.canvas.addEventListener('mouseenter', () => tunnel.handleHover(true));
    tunnel.canvas.addEventListener('mouseleave', () => tunnel.handleHover(false));
  });

  // --- Intersection Observer: only animate visible tunnels ---
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const tunnel = activeTunnels.find((t) => t.canvas === entry.target);
          if (tunnel) {
            tunnel.visible = entry.isIntersecting;
          }
        });
      },
      { threshold: 0.05 }
    );

    activeTunnels.forEach((t) => observer.observe(t.canvas));
  }

  // --- Responsive resize handler ---
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      activeTunnels.forEach((t) => t.resize());
    }, 150); // debounce to avoid excessive recalculations
  });

  // --- Start animation loops ---
  activeTunnels.forEach((t) => t.animate());
});
