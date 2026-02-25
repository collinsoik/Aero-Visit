/**
 * Aero Visit - Wind Tunnel Visualization
 * Focused on wind-airplane interaction up close.
 */

// ──────────────────────────────────────────────
// Streamline
// ──────────────────────────────────────────────
class Streamline {
  constructor(canvas, yPos) {
    this.canvas = canvas;
    this.baseY = yPos;
    this.reset();
  }

  reset() {
    const w = this.canvas._displayW || 500;
    this.points = [];
    this.x = w + Math.random() * 60;
    this.y = this.baseY;
    this.opacity = 0.3 + Math.random() * 0.5;
    this.thickness = 1 + Math.random() * 2.2;
    this.speed = 0.3 + Math.random() * 0.45;
    this.r = 120; this.g = 180; this.b = 255;
    this.maxPoints = 35 + Math.floor(Math.random() * 25);
  }

  update(windSpeed, type, plane) {
    const spd = this.speed * (windSpeed / 3);
    const w = this.canvas._displayW || 500;
    const h = this.canvas._displayH || 340;

    // Wind flows RIGHT-TO-LEFT
    let dx = -spd;
    let dy = 0;

    const px = plane.x, py = plane.y;
    // Tight interaction zone around the scaled-up plane
    const pw = plane.width * plane.scale * 0.5;
    const ph = plane.height * plane.scale * 0.5;
    const relX = this.x - px;
    const relY = this.y - py;
    const dist = Math.sqrt(relX * relX + relY * relY);
    const inZone = Math.abs(relX) < pw && Math.abs(relY) < ph;
    const approaching = relX > -pw * 0.2 && relX < pw * 0.7;
    const nearBody = Math.abs(relY) < ph * 0.8;

    if (type === 'dart') {
      if (inZone || (approaching && nearBody)) {
        const deflectRadius = pw * 0.5;
        if (dist < deflectRadius && dist > 0) {
          const pushStrength = (1 - dist / deflectRadius) * 4;
          dy += (relY > 0 ? 1 : -1) * pushStrength * spd;
          dx *= 0.75;
        }
        if (relX < 0) dx *= 1.1;
        this.r = 100; this.g = 210; this.b = 255;
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }

    } else if (type === 'glider') {
      const wingSpan = ph * 0.8;
      const nearWings = Math.abs(relX) < pw * 0.6 && Math.abs(relY) < wingSpan;

      if (nearWings || (approaching && Math.abs(relY) < wingSpan)) {
        const deflectRadius = Math.max(pw, ph) * 0.6;
        if (dist < deflectRadius && dist > 0) {
          const pushStrength = (1 - dist / deflectRadius) * 4.5;
          if (relY > 0) {
            dy -= pushStrength * spd * 1.5;
            this.r = 50; this.g = 235; this.b = 100;
          } else {
            dy += pushStrength * spd * 0.6;
            this.r = 100; this.g = 210; this.b = 255;
          }
          dx *= 0.7;
        }
        if (relX < -pw * 0.15) {
          dy -= 0.35 * spd;
          this.r = 80; this.g = 225; this.b = 120;
        }
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }

    } else if (type === 'tumbler') {
      const bluntRadius = Math.max(pw, ph) * 0.75;
      const nearFront = relX < pw * 0.7 && relX > -pw * 0.3;

      if ((nearFront && nearBody) || dist < bluntRadius) {
        if (relX > 0) {
          dx *= 0.1;
          const scatter = (1 - dist / bluntRadius) * 6;
          dy += (relY > 0 ? 1 : -1) * scatter * spd;
          this.r = 255; this.g = 100; this.b = 60;
        } else {
          dx *= 0.4;
          dy += (Math.sin(performance.now() / 80 + this.baseY * 0.1) * 3.5 +
                 (Math.random() - 0.5) * 5) * (windSpeed / 5);
          this.r = 255; this.g = 140; this.b = 80;
        }
      } else {
        this.r = 120; this.g = 180; this.b = 255;
      }
    }

    this.x += dx;
    this.y += dy;

    if (this.y < 15) this.y = 15;
    if (this.y > h - 15) this.y = h - 15;

    this.points.push({ x: this.x, y: this.y, r: this.r, g: this.g, b: this.b });
    if (this.points.length > this.maxPoints) this.points.shift();

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

    for (let i = 1; i < this.points.length; i++) {
      const p0 = this.points[i - 1];
      const p1 = this.points[i];
      const age = i / this.points.length;
      ctx.globalAlpha = this.opacity * age;
      ctx.strokeStyle = `rgb(${p1.r},${p1.g},${p1.b})`;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    const head = this.points[this.points.length - 1];
    ctx.globalAlpha = this.opacity * 1.3;
    ctx.fillStyle = `rgb(${head.r},${head.g},${head.b})`;
    ctx.beginPath();
    ctx.arc(head.x, head.y, this.thickness * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ──────────────────────────────────────────────
// PaperAirplane - scaled up, centered
// ──────────────────────────────────────────────
class PaperAirplane {
  constructor(type, x, y) {
    this.type = type;
    this.homeX = x; this.homeY = y;
    this.x = x; this.y = y;
    this.angle = 0;
    this.scale = 2.2; // big and close-up

    if (type === 'dart')        { this.width = 90; this.height = 28; }
    else if (type === 'glider') { this.width = 55; this.height = 110; }
    else                        { this.width = 55; this.height = 65; }
  }

  _drawDart(ctx) {
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

    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(-30, -13);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fillStyle = '#FF8888';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(50, 0); ctx.lineTo(-22, 0);
    ctx.strokeStyle = '#B33'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#D55'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(25, -2); ctx.lineTo(-25, -10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 2); ctx.lineTo(-25, 10); ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawGlider(ctx) {
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

    ctx.beginPath();
    ctx.moveTo(28, 0); ctx.lineTo(5, -52);
    ctx.lineTo(-28, -44); ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fillStyle = '#82D98C';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(28, 0); ctx.lineTo(-22, 0);
    ctx.strokeStyle = '#3A7A42'; ctx.lineWidth = 1.8; ctx.stroke();

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#4AA856'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(-18, -38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 5); ctx.lineTo(-18, 38); ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawTumbler(ctx) {
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

    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(12, -22);
    ctx.lineTo(-22, -30); ctx.lineTo(-24, -10); ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fillStyle = '#BB88FF';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(12, -22);
    ctx.lineTo(15, -12); ctx.lineTo(19, 0);
    ctx.lineTo(15, 12); ctx.lineTo(12, 22);
    ctx.closePath();
    ctx.fillStyle = '#9B5FEE';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(-22, 0);
    ctx.strokeStyle = '#6B3FC0'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#7B50D0'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(5, -5); ctx.lineTo(-18, -24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(-18, 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-20, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(-20, 20); ctx.stroke();
    ctx.setLineDash([]);
  }

  draw(ctx, hovered) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    if (hovered) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 18;
    }

    // Shadow
    ctx.save();
    ctx.translate(3, 5);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    const rx = this.type === 'dart' ? 38 : this.type === 'glider' ? 30 : 24;
    const ry = this.type === 'dart' ? 10 : this.type === 'glider' ? 34 : 22;
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.type === 'dart') this._drawDart(ctx);
    else if (this.type === 'glider') this._drawGlider(ctx);
    else this._drawTumbler(ctx);

    ctx.restore();
  }

  react(windSpeed) {
    const t = performance.now() / 2500;
    const w = windSpeed / 10;

    if (this.type === 'dart') {
      this.angle = Math.sin(t * 1.2) * 0.008 * windSpeed;
      this.x = this.homeX + Math.sin(t * 0.5) * 1;
      this.y = this.homeY + Math.sin(t * 0.7) * 0.6;
    } else if (this.type === 'glider') {
      this.angle = -0.03 * w + Math.sin(t * 0.4) * 0.01;
      this.x = this.homeX + Math.sin(t * 0.3) * 1;
      this.y = this.homeY - windSpeed * 1.5 + Math.sin(t * 0.5) * 1.5;
    } else {
      this.angle = Math.sin(t * 1.8) * 0.06 * w + Math.sin(t * 2.5) * 0.02 * windSpeed;
      this.x = this.homeX + windSpeed * 1 + Math.sin(t * 1) * 1.5;
      this.y = this.homeY + Math.sin(t * 0.8) * 2 * w;
    }
  }
}

// ──────────────────────────────────────────────
// WindTunnel
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

    this._applySize();

    // Airplane centered in the canvas
    const cx = this.canvas._displayW * 0.45;
    const cy = this.canvas._displayH * 0.5;
    this.airplane = new PaperAirplane(type, cx, cy);

    this.streamlines = [];
    this._buildStreamlines();
    this._animate = this.animate.bind(this);
  }

  _applySize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 500;
    const h = rect.height || 340;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas._displayW = w;
    this.canvas._displayH = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _buildStreamlines() {
    const w = this.canvas._displayW || 500;
    const h = this.canvas._displayH || 340;
    const count = 700;
    this.streamlines = [];
    for (let i = 0; i < count; i++) {
      const y = 18 + Math.random() * (h - 36);
      const sl = new Streamline(this.canvas, y);
      sl.x = Math.random() * w;
      sl.y = y;
      this.streamlines.push(sl);
    }
  }

  resize() {
    this._applySize();
    this.airplane.homeX = this.canvas._displayW * 0.45;
    this.airplane.homeY = this.canvas._displayH * 0.5;
    this.airplane.x = this.airplane.homeX;
    this.airplane.y = this.airplane.homeY;
    this._buildStreamlines();
  }

  _drawBackground() {
    const ctx = this.ctx;
    const w = this.canvas._displayW;
    const h = this.canvas._displayH;

    const bg = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6);
    bg.addColorStop(0, '#14253A');
    bg.addColorStop(1, '#0A1520');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Thin tunnel walls
    const wallH = 12;
    const tg = ctx.createLinearGradient(0, 0, 0, wallH);
    tg.addColorStop(0, '#3A4A5A'); tg.addColorStop(1, '#2A3844');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, w, wallH);

    const bg2 = ctx.createLinearGradient(0, h - wallH, 0, h);
    bg2.addColorStop(0, '#2A3844'); bg2.addColorStop(1, '#3A4A5A');
    ctx.fillStyle = bg2;
    ctx.fillRect(0, h - wallH, w, wallH);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < w; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, wallH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, h - wallH); ctx.lineTo(gx, h); ctx.stroke();
    }
  }

  animate() {
    if (!this.visible) {
      this.animId = requestAnimationFrame(this._animate);
      return;
    }

    const ctx = this.ctx;

    this._drawBackground();

    for (const sl of this.streamlines) {
      sl.update(this.windSpeed, this.type, this.airplane);
      sl.draw(ctx);
    }

    this.airplane.react(this.windSpeed);
    this.airplane.draw(ctx, this.hovered);

    this.animId = requestAnimationFrame(this._animate);
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

  all.forEach(t => {
    t.canvas.addEventListener('mouseenter', () => t.hovered = true);
    t.canvas.addEventListener('mouseleave', () => t.hovered = false);
  });

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const t = all.find(x => x.canvas === e.target);
        if (t) t.visible = e.isIntersecting;
      });
    }, { threshold: 0.05 });
    all.forEach(t => obs.observe(t.canvas));
  }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => all.forEach(t => t.resize()), 150);
  });

  all.forEach(t => t.animate());
});
