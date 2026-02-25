/**
 * Aero Visit - Visual Wind Tunnel Engine
 * Streamlines flow around paper airplanes showing drag, lift, and turbulence.
 */

// ──────────────────────────────────────────────
// Streamline - a continuous flow line across the tunnel
// ──────────────────────────────────────────────
class Streamline {
  constructor(canvas, yPos) {
    this.canvas = canvas;
    this.baseY = yPos;
    this.reset();
  }

  reset() {
    const w = this.canvas._displayW || 600;
    this.points = [];
    this.x = w + Math.random() * 80; // spawn on RIGHT edge
    this.y = this.baseY;
    this.opacity = 0.25 + Math.random() * 0.45;
    this.thickness = 1 + Math.random() * 2;
    this.speed = 0.35 + Math.random() * 0.5;
    this.r = 120; this.g = 180; this.b = 255;
    this.maxPoints = 40 + Math.floor(Math.random() * 30);
  }

  update(windSpeed, type, plane) {
    const spd = this.speed * (windSpeed / 3);
    const w = this.canvas._displayW || 600;
    const h = this.canvas._displayH || 350;

    // Wind flows RIGHT-TO-LEFT (hitting the nose of the airplane)
    let dx = -spd;
    let dy = 0;

    // Get airplane collision shape - tight to the body
    const px = plane.x, py = plane.y;
    const pw = plane.width * 0.55, ph = plane.height * 0.55;
    const relX = this.x - px; // positive = to the right of plane (incoming wind side)
    const relY = this.y - py;
    const dist = Math.sqrt(relX * relX + relY * relY);
    const inZone = Math.abs(relX) < pw && Math.abs(relY) < ph;
    // "approaching" = wind coming from the right toward the nose
    const approaching = relX > -pw * 0.15 && relX < pw * 0.6;
    const nearBody = Math.abs(relY) < ph * 0.7;

    if (type === 'dart') {
      // LAMINAR FLOW - tight smooth deflection, wind hits pointy nose
      if (inZone || (approaching && nearBody)) {
        const deflectRadius = pw * 0.45;
        if (dist < deflectRadius && dist > 0) {
          const pushStrength = (1 - dist / deflectRadius) * 3.5;
          dy += (relY > 0 ? 1 : -1) * pushStrength * spd;
          dx *= 0.8;
        }
        // Speed up past the tail (left side)
        if (relX < 0) dx *= 1.1;
        this.r = 100; this.g = 200; this.b = 255;
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }

    } else if (type === 'glider') {
      // LIFT FLOW - wind hits wide wings from the right
      const wingSpan = ph * 0.7;
      const nearWings = Math.abs(relX) < pw * 0.5 && Math.abs(relY) < wingSpan;

      if (nearWings || (approaching && Math.abs(relY) < wingSpan)) {
        const deflectRadius = Math.max(pw, ph) * 0.55;
        if (dist < deflectRadius && dist > 0) {
          const pushStrength = (1 - dist / deflectRadius) * 4;
          if (relY > 0) {
            // Below wings: strong upward deflection (LIFT!)
            dy -= pushStrength * spd * 1.4;
            this.r = 50; this.g = 230; this.b = 100;
          } else {
            dy += pushStrength * spd * 0.5;
            this.r = 100; this.g = 200; this.b = 255;
          }
          dx *= 0.75;
        }
        // Upwash past trailing edge (left side of plane)
        if (relX < -pw * 0.15) {
          dy -= 0.3 * spd;
          this.r = 80; this.g = 220; this.b = 120;
        }
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }

    } else if (type === 'tumbler') {
      // HIGH DRAG - wind smashes into the blunt nose from the right
      const bluntRadius = Math.max(pw, ph) * 0.7;
      // "nearFront" = right side of the plane where the blunt face is
      const nearFront = relX < pw * 0.6 && relX > -pw * 0.25;

      if ((nearFront && nearBody) || dist < bluntRadius) {
        if (relX > 0) {
          // In front of the nose: PILE UP, slow way down
          dx *= 0.15;
          const scatter = (1 - dist / bluntRadius) * 5;
          dy += (relY > 0 ? 1 : -1) * scatter * spd;
          this.r = 255; this.g = 100; this.b = 60;
        } else {
          // Behind (wake): turbulent chaos
          dx *= 0.5;
          dy += (Math.sin(performance.now() / 80 + this.baseY * 0.1) * 3 +
                 (Math.random() - 0.5) * 4) * (windSpeed / 5);
          this.r = 255; this.g = 140; this.b = 80;
        }
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }
    }

    this.x += dx;
    this.y += dy;

    // Keep within tunnel walls
    if (this.y < 20) this.y = 20;
    if (this.y > h - 20) this.y = h - 20;

    // Store trail point
    this.points.push({ x: this.x, y: this.y, r: this.r, g: this.g, b: this.b });
    if (this.points.length > this.maxPoints) this.points.shift();

    // Reset when off LEFT edge (wind exits left)
    if (this.x < -20) {
      this.x = w + Math.random() * 40;
      this.y = this.baseY;
      this.points = [];
    }
  }

  draw(ctx) {
    if (this.points.length < 2) return;
    ctx.save();
    ctx.lineWidth = this.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw segments with color that transitions along the line
    for (let i = 1; i < this.points.length; i++) {
      const p0 = this.points[i - 1];
      const p1 = this.points[i];
      // Fade older segments
      const age = i / this.points.length;
      ctx.globalAlpha = this.opacity * age;
      ctx.strokeStyle = `rgb(${p1.r},${p1.g},${p1.b})`;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    // Draw a bright dot at the head
    const head = this.points[this.points.length - 1];
    ctx.globalAlpha = this.opacity * 1.3;
    ctx.fillStyle = `rgb(${head.r},${head.g},${head.b})`;
    ctx.beginPath();
    ctx.arc(head.x, head.y, this.thickness * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ──────────────────────────────────────────────
// Sparkle (confetti on launch)
// ──────────────────────────────────────────────
class Sparkle {
  constructor(x, y) {
    this.x = x; this.y = y;
    const a = Math.random() * Math.PI * 2;
    const f = 3 + Math.random() * 5;
    this.vx = Math.cos(a) * f;
    this.vy = Math.sin(a) * f;
    this.life = 1;
    this.size = 2 + Math.random() * 4;
    this.color = ['#FFD700','#FF6B6B','#6BCB77','#A66CFF','#4FC3F7'][Math.floor(Math.random()*5)];
  }
  update() { this.x+=this.vx; this.y+=this.vy; this.vy+=0.15; this.vx*=0.97; this.life-=0.025; }
  draw(ctx) {
    if (this.life<=0) return;
    ctx.save(); ctx.globalAlpha=this.life; ctx.fillStyle=this.color;
    ctx.fillRect(this.x-this.size/2, this.y-this.size/2, this.size, this.size);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────
// PaperAirplane - three distinct designs
// ──────────────────────────────────────────────
class PaperAirplane {
  constructor(type, x, y) {
    this.type = type;
    this.homeX = x; this.homeY = y;
    this.x = x; this.y = y;
    this.angle = 0;
    this.launched = false;
    this.launchProgress = 0;
    this.launchPhase = 'fly';
    this.bounceProgress = 0;

    if (type === 'dart')        { this.width = 90; this.height = 28; }
    else if (type === 'glider') { this.width = 55; this.height = 110; }
    else                        { this.width = 55; this.height = 65; }
  }

  get pos() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  _drawDart(ctx) {
    // Sleek pointed dart
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(-30, -13);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-30, 13);
    ctx.closePath();
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#C44040';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Top wing lighter
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(-30, -13);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fillStyle = '#FF8888';
    ctx.fill();

    // Center fold
    ctx.beginPath();
    ctx.moveTo(50, 0); ctx.lineTo(-22, 0);
    ctx.strokeStyle = '#B33'; ctx.lineWidth = 1.5; ctx.stroke();

    // Fold creases
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#D55'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(25, -2); ctx.lineTo(-25, -10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 2); ctx.lineTo(-25, 10); ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawGlider(ctx) {
    // Wide wings
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(5, -52);
    ctx.lineTo(-28, -44);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-28, 44);
    ctx.lineTo(5, 52);
    ctx.closePath();
    ctx.fillStyle = '#6BCB77';
    ctx.fill();
    ctx.strokeStyle = '#4AA856';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Top wing lighter
    ctx.beginPath();
    ctx.moveTo(28, 0); ctx.lineTo(5, -52);
    ctx.lineTo(-28, -44); ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fillStyle = '#82D98C';
    ctx.fill();

    // Center fold
    ctx.beginPath();
    ctx.moveTo(28, 0); ctx.lineTo(-22, 0);
    ctx.strokeStyle = '#3A7A42'; ctx.lineWidth = 1.8; ctx.stroke();

    // Wing spar creases
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#4AA856'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(-18, -38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 5); ctx.lineTo(-18, 38); ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawTumbler(ctx) {
    // Blunt chunky brick
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(12, -22);
    ctx.lineTo(-22, -30);
    ctx.lineTo(-24, -10);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-22, 30);
    ctx.lineTo(12, 22);
    ctx.closePath();
    ctx.fillStyle = '#A66CFF';
    ctx.fill();
    ctx.strokeStyle = '#8B4FE0';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Top lighter
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(12, -22);
    ctx.lineTo(-22, -30); ctx.lineTo(-24, -10); ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fillStyle = '#BB88FF';
    ctx.fill();

    // Blunt nose cap
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(12, -22);
    ctx.lineTo(15, -12); ctx.lineTo(19, 0);
    ctx.lineTo(15, 12); ctx.lineTo(12, 22);
    ctx.closePath();
    ctx.fillStyle = '#9B5FEE';
    ctx.fill();

    // Center fold
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(-22, 0);
    ctx.strokeStyle = '#6B3FC0'; ctx.lineWidth = 1.5; ctx.stroke();

    // Crumple creases
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#7B50D0'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(5, -5); ctx.lineTo(-18, -24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(-18, 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-20, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(-20, 20); ctx.stroke();
    ctx.setLineDash([]);
  }

  draw(ctx, windSpeed, hovered) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glow when hovered
    if (hovered) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
    }

    // Shadow underneath
    ctx.save();
    ctx.translate(4, 6);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    const r = this.type === 'dart' ? 38 : this.type === 'glider' ? 30 : 24;
    const ry = this.type === 'dart' ? 10 : this.type === 'glider' ? 34 : 22;
    ctx.ellipse(0, 0, r, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw the plane
    if (this.type === 'dart') this._drawDart(ctx);
    else if (this.type === 'glider') this._drawGlider(ctx);
    else this._drawTumbler(ctx);

    ctx.restore();
  }

  react(windSpeed) {
    if (this.launched) return;
    const t = performance.now() / 2000; // halved speed for gentler motion
    const w = windSpeed / 10;

    if (this.type === 'dart') {
      this.angle = Math.sin(t * 1.5) * 0.01 * windSpeed;
      this.x = this.homeX + Math.sin(t * 0.6) * 1;
      this.y = this.homeY + Math.sin(t * 0.8) * 0.8;
    } else if (this.type === 'glider') {
      this.angle = -0.04 * w + Math.sin(t * 0.4) * 0.015;
      this.x = this.homeX + Math.sin(t * 0.35) * 1.5;
      this.y = this.homeY - windSpeed * 3 + Math.sin(t * 0.6) * 2;
    } else {
      this.angle = Math.sin(t * 2) * 0.08 * w + Math.sin(t * 3) * 0.025 * windSpeed;
      this.x = this.homeX + windSpeed * 2 + Math.sin(t * 1.2) * 2;
      this.y = this.homeY + Math.sin(t * 1) * 3 * w;
    }
  }

  launch(tunnelW, windSpeed) {
    if (this.launched) return;
    this.launched = true;
    this.launchPhase = 'fly';
    this.bounceProgress = 0;
    this._tw = tunnelW;
    this._windSpeed = windSpeed;

    // Real physics: velocity, forces
    // Initial throw gives forward velocity
    if (this.type === 'dart') {
      this.vx = 1.5;  this.vy = -0.1;
    } else if (this.type === 'glider') {
      this.vx = 1.2;  this.vy = -0.8;  // strong upward throw for parabola
    } else {
      this.vx = 1.6;  this.vy = 0;     // faster start, drag will slow it
    }
    this.angularVel = 0;
    this.launchTime = 0; // frame counter for time-based effects
  }

  updateLaunch(windSpeed) {
    if (!this.launched) return false;

    if (this.launchPhase === 'fly') {
      const w = (windSpeed || this._windSpeed) / 10; // normalized 0-1
      const gravity = 0.04;

      if (this.type === 'dart') {
        // LOW DRAG: barely slows, very stable, slight gravity
        const drag = 0.002;
        this.vx -= drag * this.vx * Math.abs(this.vx); // drag opposes motion
        this.vx += w * 0.08; // wind pushes it along
        this.vy += gravity * 0.3; // very little drop
        this.vy *= 0.97; // dampen vertical wobble
        this.angularVel = (this.vy * 0.01); // nose follows velocity
        this.angle += this.angularVel;
        this.angle *= 0.95; // stabilizes quickly (streamlined)
      } else if (this.type === 'glider') {
        // PARABOLA: thrown upward, arcs up, peaks, then slowly comes back down
        const drag = 0.003;
        this.vx -= drag * this.vx * Math.abs(this.vx);
        this.vx += w * 0.03;
        this.vy += gravity * 0.35; // steady gravity pulls it into a parabola
        this.vy *= 0.995;          // very little damping so arc is smooth
        this.angularVel = this.vy * 0.02; // nose tilts up on climb, down on descent
        this.angle += this.angularVel;
        this.angle *= 0.94;
      } else {
        // HIGH DRAG: goes far but steadily decelerates, minimal drop
        const drag = 0.003;
        this.vx -= drag * this.vx * Math.abs(this.vx);
        this.vx += w * 0.008;
        this.vy += gravity * 0.08; // barely sags
        this.vy *= 0.995;
        this.angularVel += (Math.random() - 0.5) * 0.008 * (1 + w);
        this.angularVel *= 0.95;
        this.angle += this.angularVel;
      }

      // Minimum forward speed so it eventually crosses
      if (this.vx < 0.2) this.vx = 0.2;

      this.launchTime++;
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off tunnel walls
      const h = this._tw ? 420 : 350; // approximate tunnel height
      if (this.y < 30) { this.y = 30; this.vy = Math.abs(this.vy) * 0.5; }
      if (this.y > h - 30) { this.y = h - 30; this.vy = -Math.abs(this.vy) * 0.5; }

      // Transition to bounce-back when it exits the right side
      if (this.x > this._tw + 50) {
        this.launchPhase = 'bounce';
        this.bounceProgress = 0;
      }
    } else {
      // Bounce back to home
      this.bounceProgress += 0.035;
      const bp = Math.min(this.bounceProgress, 1);
      const ease = 1 - Math.pow(1 - bp, 3);
      const overshoot = Math.sin(bp * Math.PI * 3) * (1 - bp) * 12;
      this.x = this._tw + 60 + (this.homeX - this._tw - 60) * ease + overshoot;
      this.y += (this.homeY - this.y) * 0.1;
      this.angle *= 0.9;
      if (this.bounceProgress >= 1) {
        this.launched = false;
        this.x = this.homeX; this.y = this.homeY; this.angle = 0;
      }
    }
    return this.launched;
  }
}

// ──────────────────────────────────────────────
// WindTunnel - one canvas with streamlines
// ──────────────────────────────────────────────
class WindTunnel {
  constructor(canvasId, type) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.type = type;
    this.windSpeed = 10;
    this.hovered = false;
    this.visible = true;
    this.sparkles = [];

    this._applySize();

    const cx = this.canvas._displayW * 0.15;
    const cy = this.canvas._displayH * 0.5;
    this.airplane = new PaperAirplane(type, cx, cy);

    // Create streamlines - rows of flow lines
    this.streamlines = [];
    this._buildStreamlines();

    this._animate = this.animate.bind(this);
  }

  _applySize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 800;
    const h = rect.height || 420;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas._displayW = w;
    this.canvas._displayH = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _buildStreamlines() {
    const w = this.canvas._displayW || 600;
    const h = this.canvas._displayH || 420;
    const count = 350;
    this.streamlines = [];
    for (let i = 0; i < count; i++) {
      const y = 25 + Math.random() * (h - 50);
      const sl = new Streamline(this.canvas, y);
      // Scatter across the full width so wind is already flowing on load
      sl.x = Math.random() * w;
      sl.y = y;
      this.streamlines.push(sl);
    }
  }

  resize() {
    this._applySize();
    this.airplane.homeX = this.canvas._displayW * 0.15;
    this.airplane.homeY = this.canvas._displayH * 0.5;
    if (!this.airplane.launched) {
      this.airplane.x = this.airplane.homeX;
      this.airplane.y = this.airplane.homeY;
    }
    this._buildStreamlines();
  }

  setWindSpeed(s) {
    this.windSpeed = Math.max(1, Math.min(10, s));
  }

  spawnSparkles() {
    for (let i = 0; i < 30; i++) {
      this.sparkles.push(new Sparkle(this.airplane.x, this.airplane.y));
    }
  }

  _drawBackground() {
    const ctx = this.ctx;
    const w = this.canvas._displayW;
    const h = this.canvas._displayH;

    // Dark tunnel background
    const bg = ctx.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, w * 0.65);
    bg.addColorStop(0, '#14253A');
    bg.addColorStop(1, '#0A1520');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Tunnel walls (top + bottom metallic strips)
    const wallH = 18;
    const tg = ctx.createLinearGradient(0, 0, 0, wallH);
    tg.addColorStop(0, '#3A4A5A'); tg.addColorStop(1, '#2A3844');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, w, wallH);

    const bg2 = ctx.createLinearGradient(0, h - wallH, 0, h);
    bg2.addColorStop(0, '#2A3844'); bg2.addColorStop(1, '#3A4A5A');
    ctx.fillStyle = bg2;
    ctx.fillRect(0, h - wallH, w, wallH);

    // Grid lines on walls
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < w; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, wallH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, h - wallH); ctx.lineTo(gx, h); ctx.stroke();
    }
  }

  _drawWindGauge() {
    const ctx = this.ctx;
    const w = this.canvas._displayW;
    const x = w - 65, y = 26, bw = 45, bh = 6;
    const r = this.windSpeed / 10;

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, bw, bh);

    ctx.fillStyle = r < 0.4 ? '#4CAF50' : r < 0.7 ? '#FFC107' : '#F44336';
    ctx.fillRect(x, y, bw * r, bh);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, bw, bh);
  }

  animate() {
    if (!this.visible) {
      this.animId = requestAnimationFrame(this._animate);
      return;
    }

    const ctx = this.ctx;
    const w = this.canvas._displayW;
    const h = this.canvas._displayH;

    ctx.save();

    // Background
    this._drawBackground();

    // Streamlines
    for (const sl of this.streamlines) {
      sl.update(this.windSpeed, this.type, this.airplane);
      sl.draw(ctx);
    }

    // Airplane
    if (this.airplane.launched) this.airplane.updateLaunch(this.windSpeed);
    else this.airplane.react(this.windSpeed);
    this.airplane.draw(ctx, this.windSpeed, this.hovered);

    // Sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      this.sparkles[i].update();
      this.sparkles[i].draw(ctx);
      if (this.sparkles[i].life <= 0) this.sparkles.splice(i, 1);
    }

    ctx.restore();
    this.animId = requestAnimationFrame(this._animate);
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dart = new WindTunnel('tunnel-dart', 'dart');
  const glider = new WindTunnel('tunnel-glider', 'glider');
  const tumbler = new WindTunnel('tunnel-tumbler', 'tumbler');
  const all = [dart, glider, tumbler].filter(t => t.canvas);

  // Launch buttons
  [
    { b: 'launch-dart', t: dart },
    { b: 'launch-glider', t: glider },
    { b: 'launch-tumbler', t: tumbler },
  ].forEach(({ b, t }) => {
    const btn = document.getElementById(b);
    if (!btn || !t.canvas) return;
    btn.addEventListener('click', () => {
      if (t.airplane.launched) return;
      t.airplane.launch(t.canvas._displayW, t.windSpeed);
      t.spawnSparkles();
      const orig = btn.textContent;
      btn.textContent = 'Whoooosh!';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1200);
    });
  });

  // Hover
  all.forEach(t => {
    t.canvas.addEventListener('mouseenter', () => t.hovered = true);
    t.canvas.addEventListener('mouseleave', () => t.hovered = false);
  });

  // Intersection Observer
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const t = all.find(x => x.canvas === e.target);
        if (t) t.visible = e.isIntersecting;
      });
    }, { threshold: 0.05 });
    all.forEach(t => obs.observe(t.canvas));
  }

  // Resize
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => all.forEach(t => t.resize()), 150);
  });

  // GO
  all.forEach(t => t.animate());
});
