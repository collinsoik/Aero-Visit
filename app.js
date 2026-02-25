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
    const h = this.canvas._displayH || 350;
    this.points = [];
    this.x = -Math.random() * 80;
    this.y = this.baseY;
    this.opacity = 0.25 + Math.random() * 0.45;
    this.thickness = 1 + Math.random() * 2;
    this.speed = 0.8 + Math.random() * 1.2;
    // Color will be set during draw based on deflection
    this.r = 120; this.g = 180; this.b = 255;
    this.maxPoints = 40 + Math.floor(Math.random() * 30);
  }

  update(windSpeed, type, plane) {
    const spd = this.speed * (windSpeed / 3);
    const w = this.canvas._displayW || 600;
    const h = this.canvas._displayH || 350;

    // Advance head position
    let dx = spd;
    let dy = 0;

    // Get airplane collision shape
    const px = plane.x, py = plane.y;
    const pw = plane.width * 1.2, ph = plane.height * 1.2;
    const relX = this.x - px;
    const relY = this.y - py;
    const dist = Math.sqrt(relX * relX + relY * relY);
    const inZone = Math.abs(relX) < pw && Math.abs(relY) < ph;
    const approaching = relX < pw * 0.3 && relX > -pw * 1.5;
    const nearBody = Math.abs(relY) < ph * 1.3;

    if (type === 'dart') {
      // LAMINAR FLOW - smooth deflection around narrow body
      if (inZone || (approaching && nearBody)) {
        const deflectRadius = pw * 0.8;
        if (dist < deflectRadius && dist > 0) {
          const pushStrength = (1 - dist / deflectRadius) * 2.5;
          dy += (relY > 0 ? 1 : -1) * pushStrength * spd;
          dx *= 0.85;
        }
        // Slight acceleration past the tail (low drag)
        if (relX > 0) dx *= 1.1;
        this.r = 100; this.g = 200; this.b = 255;
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }

    } else if (type === 'glider') {
      // LIFT FLOW - air curves up under wide wings, downwash above
      const wingSpan = ph * 1.5;
      const nearWings = Math.abs(relX) < pw * 0.9 && Math.abs(relY) < wingSpan;

      if (nearWings || (approaching && Math.abs(relY) < wingSpan)) {
        const deflectRadius = Math.max(pw, ph) * 1.2;
        if (dist < deflectRadius && dist > 0) {
          const pushStrength = (1 - dist / deflectRadius) * 3;
          // Below wings: strong upward deflection (LIFT!)
          if (relY > 0) {
            dy -= pushStrength * spd * 1.2;
            this.r = 50; this.g = 230; this.b = 100; // green = lift
          } else {
            // Above: slight downwash
            dy += pushStrength * spd * 0.4;
            this.r = 100; this.g = 200; this.b = 255;
          }
          dx *= 0.8;
        }
        if (relX > pw * 0.3) {
          // Upwash behind trailing edge
          dy -= 0.3 * spd;
          this.r = 80; this.g = 220; this.b = 120;
        }
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }

    } else if (type === 'tumbler') {
      // HIGH DRAG - air piles up in front, chaotic turbulent wake behind
      const bluntRadius = Math.max(pw, ph) * 1.5;
      const nearFront = relX > -pw * 1.5 && relX < pw * 0.5;

      if ((nearFront && nearBody) || dist < bluntRadius) {
        if (relX < 0) {
          // In front: SLOW DOWN hard, scatter outward
          dx *= 0.2;
          const scatter = (1 - dist / bluntRadius) * 4;
          dy += (relY > 0 ? 1 : -1) * scatter * spd;
          this.r = 255; this.g = 100; this.b = 60; // red = drag
        } else {
          // Behind: turbulent wake - random chaotic motion
          dx *= 0.6;
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

    // Reset when off right edge
    if (this.x > w + 20) {
      this.x = -Math.random() * 40;
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
    const t = performance.now() / 1000;
    const w = windSpeed / 10;

    if (this.type === 'dart') {
      this.angle = Math.sin(t * 1.5) * 0.015 * windSpeed;
      this.x = this.homeX + Math.sin(t * 0.8) * 1.5;
      this.y = this.homeY + Math.sin(t * 1.2) * 1;
    } else if (this.type === 'glider') {
      this.angle = -0.05 * w + Math.sin(t * 0.6) * 0.02;
      this.x = this.homeX + Math.sin(t * 0.5) * 2;
      this.y = this.homeY - windSpeed * 4 + Math.sin(t * 0.9) * 3;
    } else {
      this.angle = Math.sin(t * 3.5) * 0.12 * w + Math.sin(t * 5) * 0.04 * windSpeed;
      this.x = this.homeX + windSpeed * 2.5 + Math.sin(t * 2) * 3;
      this.y = this.homeY + Math.sin(t * 1.8) * 4 * w;
    }
  }

  launch(tunnelW) {
    if (this.launched) return;
    this.launched = true;
    this.launchProgress = 0;
    this.launchPhase = 'fly';
    this.bounceProgress = 0;
    this._tw = tunnelW;
    this._sx = this.x;
    this._sy = this.y;
  }

  updateLaunch() {
    if (!this.launched) return false;
    if (this.launchPhase === 'fly') {
      const rate = this.type === 'dart' ? 0.024 : this.type === 'glider' ? 0.015 : 0.008;
      this.launchProgress += rate;
      const p = this.launchProgress;
      if (this.type === 'dart') {
        this.x = this._sx + p * (this._tw + 40);
        this.y = this._sy + Math.sin(p * Math.PI) * -5;
        this.angle = 0;
      } else if (this.type === 'glider') {
        this.x = this._sx + p * (this._tw + 40);
        this.y = this._sy + Math.sin(p * Math.PI) * -60;
        this.angle = -Math.sin(p * Math.PI) * 0.18;
      } else {
        this.x = this._sx + p * (this._tw + 40);
        this.y = this._sy + p * 30 + Math.sin(p * Math.PI * 6) * 10;
        this.angle = Math.sin(p * Math.PI * 8) * 0.3;
      }
      if (this.launchProgress >= 1) { this.launchPhase = 'bounce'; this.bounceProgress = 0; }
    } else {
      this.bounceProgress += 0.04;
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
    this.windSpeed = 3;
    this.hovered = false;
    this.visible = true;
    this.sparkles = [];

    this._applySize();

    const cx = this.canvas._displayW * 0.38;
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
    const h = this.canvas._displayH || 420;
    const count = 55; // dense set of flow lines
    this.streamlines = [];
    for (let i = 0; i < count; i++) {
      const y = 25 + (i / (count - 1)) * (h - 50);
      this.streamlines.push(new Streamline(this.canvas, y));
    }
  }

  resize() {
    this._applySize();
    this.airplane.homeX = this.canvas._displayW * 0.38;
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

    // Shake at max wind
    if (this.windSpeed >= 10) {
      ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    }

    // Background
    this._drawBackground();

    // Streamlines
    for (const sl of this.streamlines) {
      sl.update(this.windSpeed, this.type, this.airplane);
      sl.draw(ctx);
    }

    // Airplane
    if (this.airplane.launched) this.airplane.updateLaunch();
    else this.airplane.react(this.windSpeed);
    this.airplane.draw(ctx, this.windSpeed, this.hovered);

    // Wind gauge
    this._drawWindGauge();

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

  // Sliders
  [
    { s: 'speed-dart', l: 'speed-dart-value', t: dart },
    { s: 'speed-glider', l: 'speed-glider-value', t: glider },
    { s: 'speed-tumbler', l: 'speed-tumbler-value', t: tumbler },
  ].forEach(({ s, l, t }) => {
    const sl = document.getElementById(s);
    if (!sl || !t.canvas) return;
    sl.addEventListener('input', e => {
      const v = parseInt(e.target.value, 10);
      t.setWindSpeed(v);
      const lb = document.getElementById(l);
      if (lb) lb.textContent = v;
    });
  });

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
      t.airplane.launch(t.canvas._displayW);
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
