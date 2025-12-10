// fluid.BGjs — lightweight glowing particle 'fluid' effect
(() => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = Math.max(1, window.devicePixelRatio || 1);

  // handle resize
  function resize() {
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // particle system
  const particles = [];
  const MAX_PARTICLES = 600;
  const huePalette = [0, 30, 200, 260, 320, 50]; // mix of hues

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // Particle constructor
  class P {
    constructor(x, y, vx, vy, life, hue) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.life = life; this.maxLife = life;
      this.hue = hue;
      this.size = rand(8, 34);
      this.alpha = 1;
    }
    update(dt) {
      // apply slow damping & slight swirl
      this.vx *= 0.985;
      this.vy *= 0.985;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      // swirl effect: small perpendicular push
      const nx = -this.vy * 0.02, ny = this.vx * 0.02;
      this.vx += nx * dt * 0.6; this.vy += ny * dt * 0.6;
      this.life -= dt;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }
    draw(ctx) {
      // radial gradient for glow
      const r = Math.max(1, this.size * (0.6 + 0.8 * (this.life / this.maxLife)));
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
      // center bright, edges transparent for glow
      const hue = Math.floor(this.hue);
      g.addColorStop(0, `hsla(${hue}, 100%, 60%, ${0.95 * this.alpha})`);
      g.addColorStop(0.45, `hsla(${hue}, 90%, 55%, ${0.25 * this.alpha})`);
      g.addColorStop(1, `hsla(${hue}, 85%, 45%, 0)`);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // spawn particles at position, with intensity
  function spawn(x, y, count = 20, speed = 1.6) {
    for (let i = 0; i < count; i++) {
      if (particles.length > MAX_PARTICLES) particles.shift();
      const ang = Math.random() * Math.PI * 2;
      const spd = rand(0.2, speed) * (0.6 + Math.random() * 1.6);
      const vx = Math.cos(ang) * spd;
      const vy = Math.sin(ang) * spd;
      const life = rand(0.9, 2.2);
      const hue = huePalette[Math.floor(Math.random() * huePalette.length)] + rand(-10, 10);
      particles.push(new P(x + rand(-6,6), y + rand(-6,6), vx, vy, life, hue));
    }
  }

  // mouse / touch handling
  let lastMouse = null;
  let isDown = false;

  function pointerMove(x, y) {
    lastMouse = { x, y };
    // spawn a few each move depending on speed
    spawn(x, y, 6, 2.8);
  }

  function pointerDown(x, y) {
    isDown = true;
    spawn(x, y, 40, 4.8);
  }

  function pointerUp() { isDown = false; }

  // normalize pointer coordinates
  function onPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  }

  window.addEventListener('mousemove', (ev) => {
    const p = onPointer(ev); pointerMove(p.x, p.y);
  }, { passive: true });

  window.addEventListener('pointerdown', (ev) => {
    const p = onPointer(ev); pointerDown(p.x, p.y);
  }, { passive: true });

  window.addEventListener('pointerup', () => { pointerUp(); }, { passive: true });

  // autoplay soft motion in center if no mouse present
  let idleTimer = 0;

  // animation loop
  let last = performance.now();
  function loop(now) {
    const dtSec = Math.min(0.06, (now - last) / 1000); // clamp dt
    last = now;

    // slight fade background to create trailing glow; black with low opacity
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, W, H);

    // spawn soft background particles occasionally
    idleTimer += dtSec;
    if (lastMouse == null && idleTimer > 0.08) {
      // gentle wandering spawns in center when idle
      const cx = W * (0.45 + Math.sin(now * 0.0006) * 0.06);
      const cy = H * (0.52 + Math.cos(now * 0.0009) * 0.06);
      spawn(cx + rand(-40,40), cy + rand(-40,40), 2, 1.4);
      idleTimer = 0;
    }

    // update & draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(dtSec);
      if (p.life <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }

    // drift effect: if mouse is held down, add continuous spawn at mouse
    if (isDown && lastMouse) {
      spawn(lastMouse.x + rand(-8,8), lastMouse.y + rand(-8,8), 6, 3.6);
    }

    window.requestAnimationFrame(loop);
  }

  // initial black fill
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // start
  requestAnimationFrame(loop);

  // helpful: if user never moves, add gentle starting particle
  setTimeout(() => {
    spawn(W * 0.5, H * 0.5, 30, 1.6);
  }, 350);

  // enable touch for mobile
  window.addEventListener('touchmove', (e) => {
    const p = onPointer(e); pointerMove(p.x, p.y);
    e.preventDefault();
  }, { passive:false });

  window.addEventListener('touchstart', (e) => {
    const p = onPointer(e); pointerDown(p.x, p.y);
    e.preventDefault();
  }, { passive:false });

  // expose small debug function if needed
  window.__fluidParticles = particles;
})();

