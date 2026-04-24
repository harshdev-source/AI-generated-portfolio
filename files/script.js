/* ═══════════════════════════════════════
   HARSH VERMA PORTFOLIO — script.js
═══════════════════════════════════════ */

const API = 'http://localhost:3000/api';

/* ── DARK MODE ─────────────────────────── */
let isDark = localStorage.getItem('darkMode') === 'true';

function applyDark() {
  document.body.classList.toggle('dark', isDark);
  const icon = document.getElementById('toggleIcon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

function toggleDark() {
  isDark = !isDark;
  localStorage.setItem('darkMode', isDark);
  applyDark();
}

applyDark();

/* ── NAVIGATION ─────────────────────────── */
function goTo(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  const btn = document.querySelector('[data-page="' + p + '"]');
  if (btn) btn.classList.add('active');
  window.scrollTo(0, 0);
  // Re-draw 3D models for visible canvases
  setTimeout(() => drawAll(), 50);
}

/* ── TOAST ───────────────────────────────── */
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderColor = isError ? '#f4a58a' : '';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── CONTACT FORM ────────────────────────── */
async function sendMsg() {
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg = document.getElementById('c-msg').value.trim();
  if (!name || !email || !msg) return showToast('⚠ Please fill all fields!', true);

  try {
    const res = await fetch(API + '/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message: msg })
    });
    if (res.ok) {
      document.getElementById('c-name').value = '';
      document.getElementById('c-email').value = '';
      document.getElementById('c-msg').value = '';
      showToast('✦ Message sent! I\'ll get back to you soon.', false);
    } else {
      showToast('Something went wrong. Try again!', true);
    }
  } catch {
    // Fallback for when server isn't running
    document.getElementById('c-name').value = '';
    document.getElementById('c-email').value = '';
    document.getElementById('c-msg').value = '';
    showToast('✦ Message noted! (Start the server to persist data)', false);
  }
}

/* ── STAR RATING ─────────────────────────── */
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.v);
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.v) <= selectedRating));
    });
    star.addEventListener('mouseenter', () => {
      const v = parseInt(star.dataset.v);
      stars.forEach(s => s.style.color = parseInt(s.dataset.v) <= v ? '#f4a58a' : '');
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.style.color = '');
    });
  });

  loadReviews();
  drawAll();
});

/* ── REVIEWS ─────────────────────────────── */
async function submitReview() {
  const name = document.getElementById('rv-name').value.trim();
  const email = document.getElementById('rv-email').value.trim();
  const msg = document.getElementById('rv-msg').value.trim();

  if (!name || !msg) return showToast('⚠ Name and review are required!', true);
  if (!selectedRating) return showToast('⚠ Please select a star rating!', true);

  const reviewData = { name, email, rating: selectedRating, message: msg };

  try {
    const res = await fetch(API + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (res.ok) {
      document.getElementById('rv-name').value = '';
      document.getElementById('rv-email').value = '';
      document.getElementById('rv-msg').value = '';
      selectedRating = 0;
      document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
      showToast('✦ Thanks for your review!', false);
      loadReviews();
    }
  } catch {
    // Fallback: show it locally
    const container = document.getElementById('reviewsList');
    const empty = container.querySelector('.reviews-empty');
    if (empty) empty.remove();
    container.prepend(createReviewCard({ name, rating: selectedRating, message: msg, createdAt: new Date().toISOString() }));
    document.getElementById('rv-name').value = '';
    document.getElementById('rv-msg').value = '';
    selectedRating = 0;
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    showToast('✦ Thanks! (Start the server to persist reviews)', false);
  }
}

async function loadReviews() {
  try {
    const res = await fetch(API + '/reviews');
    if (!res.ok) return;
    const data = await res.json();
    const container = document.getElementById('reviewsList');
    if (!container) return;
    container.innerHTML = '';
    if (!data.reviews || data.reviews.length === 0) {
      container.innerHTML = '<div class="reviews-empty">Be the first to leave a review below! ✨</div>';
      return;
    }
    data.reviews.forEach(r => container.appendChild(createReviewCard(r)));
  } catch {
    /* Server not running, leave empty state */
  }
}

function createReviewCard(r) {
  const card = document.createElement('div');
  card.className = 'review-card';
  const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
  const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  card.innerHTML = `
    <div class="review-stars">${stars}</div>
    <p class="review-msg">${escapeHtml(r.message)}</p>
    <div class="review-author">${escapeHtml(r.name)}</div>
    <div class="review-date">${date}</div>
  `;
  return card;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════
   3D CANVAS MODELS (pure Canvas 2D — soft 3D look)
══════════════════════════════════════════ */

function drawAll() {
  drawHeroSphere();
  drawCalcModel('canvas-calc');
  drawCalcModel('canvas-p1');
  drawAgeModel('canvas-age');
  drawAgeModel('canvas-p2');
  drawCtaModel('canvas-cta');
  drawAboutModel('canvas-about');
}

/* Smooth glow helper */
function glowCircle(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace(')',','+alpha+')').replace('rgb','rgba'));
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
}

/* ── MODEL 1: Hero Floating Sphere ── */
let heroAngle = 0;
function drawHeroSphere() {
  const c = document.getElementById('canvas-hero');
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w/2, cy = h/2, r = 130;

  // Shadow
  const shadow = ctx.createRadialGradient(cx+10, cy+130, 10, cx+10, cy+130, 60);
  shadow.addColorStop(0, 'rgba(100,150,200,0.18)');
  shadow.addColorStop(1, 'rgba(100,150,200,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.ellipse(cx+10, cy+130, 70, 22, 0, 0, Math.PI*2); ctx.fill();

  // Main sphere gradient
  const g = ctx.createRadialGradient(cx-40, cy-40, 20, cx, cy, r);
  g.addColorStop(0, '#e8f5fd');
  g.addColorStop(0.3, '#b8d9f5');
  g.addColorStop(0.7, '#8ec4f0');
  g.addColorStop(1, '#6aaae0');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();

  // Highlight
  const hi = ctx.createRadialGradient(cx-50, cy-50, 5, cx-50, cy-50, 70);
  hi.addColorStop(0, 'rgba(255,255,255,0.9)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hi;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

  // Floating rings (3D orbit effect)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(heroAngle);
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, r + 20, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(184,217,245,0.55)';
  ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(heroAngle + 1.0);
  ctx.scale(0.4, 1);
  ctx.beginPath();
  ctx.arc(0, 0, r + 28, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(196,184,240,0.45)';
  ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();

  // Small orbiting dot
  const dotX = cx + Math.cos(heroAngle * 2) * (r + 24);
  const dotY = cy + Math.sin(heroAngle * 2) * 36;
  ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(244,165,138,0.9)'; ctx.fill();

  const dot2X = cx + Math.cos(heroAngle * 2 + Math.PI) * (r + 32);
  const dot2Y = cy + Math.sin(heroAngle * 2 + Math.PI) * 28;
  ctx.beginPath(); ctx.arc(dot2X, dot2Y, 5, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(196,184,240,0.9)'; ctx.fill();

  heroAngle += 0.008;
  requestAnimationFrame(drawHeroSphere);
}

/* ── MODEL 2: Calculator (floating cubes) ── */
let calcAngle = 0;
function drawCalcModel(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w/2, cy = h/2;

  // Draw 3D-ish rounded cube
  function drawCube(x, y, size, color1, color2, color3, label) {
    const s = size, s2 = s * 0.5;

    // Front face
    ctx.fillStyle = color1;
    roundRect(ctx, x - s2, y - s2, s, s, s*0.18);
    ctx.fill();

    // Top face (parallelogram)
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(x - s2, y - s2);
    ctx.lineTo(x - s2 + s*0.3, y - s2 - s*0.22);
    ctx.lineTo(x + s2 + s*0.3, y - s2 - s*0.22);
    ctx.lineTo(x + s2, y - s2);
    ctx.closePath(); ctx.fill();

    // Right face
    ctx.fillStyle = color3;
    ctx.beginPath();
    ctx.moveTo(x + s2, y - s2);
    ctx.lineTo(x + s2 + s*0.3, y - s2 - s*0.22);
    ctx.lineTo(x + s2 + s*0.3, y + s2 - s*0.22);
    ctx.lineTo(x + s2, y + s2);
    ctx.closePath(); ctx.fill();

    // Label
    if (label) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${s*0.34}px Nunito, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + 2);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

  const a = calcAngle;
  const offY = Math.sin(a) * 8;

  drawCube(cx-32, cy + offY, 52, '#b8d9f5', '#d4ecfc', '#8ec4f0', '+');
  drawCube(cx+32, cy - offY*0.6 - 8, 44, '#c4b8f0', '#ddd6f8', '#a090e0', '−');

  ctx.fillStyle = 'rgba(168,217,212,0.9)';
  ctx.beginPath();
  ctx.arc(cx - 50, cy + 30 + offY * 0.5, 10, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = 'rgba(244,165,138,0.9)';
  ctx.beginPath();
  ctx.arc(cx + 52, cy + 24 - offY * 0.4, 8, 0, Math.PI*2);
  ctx.fill();

  calcAngle += 0.022;
}

/* ── MODEL 3: Age Calculator (donut/rings) ── */
let ageAngle = 0;
function drawAgeModel(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w/2, cy = h/2;
  const a = ageAngle;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, 62, a, a + Math.PI * 1.6);
  ctx.strokeStyle = '#f4a58a'; ctx.lineWidth = 10;
  ctx.lineCap = 'round'; ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 62, a + Math.PI * 1.6, a + Math.PI * 2);
  ctx.strokeStyle = 'rgba(244,165,138,0.2)'; ctx.lineWidth = 10; ctx.stroke();

  // Middle ring
  ctx.beginPath();
  ctx.arc(cx, cy, 44, -a * 1.3, -a * 1.3 + Math.PI * 1.2);
  ctx.strokeStyle = '#c4b8f0'; ctx.lineWidth = 8; ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 44, -a * 1.3 + Math.PI * 1.2, -a * 1.3 + Math.PI * 2);
  ctx.strokeStyle = 'rgba(196,184,240,0.2)'; ctx.lineWidth = 8; ctx.stroke();

  // Inner dot
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI*2);
  const g = ctx.createRadialGradient(cx-8, cy-8, 2, cx, cy, 24);
  g.addColorStop(0, '#ddd6f8'); g.addColorStop(1, '#a8dfd4');
  ctx.fillStyle = g; ctx.fill();

  // Text
  ctx.fillStyle = 'rgba(36,52,71,0.85)';
  ctx.font = 'bold 11px Nunito, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AGE', cx, cy);

  // Small orbiting dots
  ctx.fillStyle = '#f4a58a';
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a * 2) * 62, cy + Math.sin(a * 2) * 62, 6, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = '#c4b8f0';
  ctx.beginPath();
  ctx.arc(cx + Math.cos(-a*1.3 + Math.PI*1.2) * 44, cy + Math.sin(-a*1.3 + Math.PI*1.2) * 44, 5, 0, Math.PI*2);
  ctx.fill();

  ageAngle += 0.018;
}

/* ── MODEL 4: CTA floating torus-like ── */
let ctaAngle = 0;
function drawCtaModel(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w/2, cy = h/2;
  const a = ctaAngle;

  // Rotating pastel rings
  [
    { r: 55, color: '#ddd6f8', lw: 12, offset: 0 },
    { r: 38, color: '#b8d9f5', lw: 9, offset: 1.2 },
    { r: 22, color: '#f4a58a', lw: 7, offset: 2.1 },
  ].forEach(ring => {
    const g = ctx.createRadialGradient(cx, cy, ring.r*0.5, cx, cy, ring.r+ring.lw);
    g.addColorStop(0, ring.color);
    g.addColorStop(1, ring.color + '44');
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, a + ring.offset, a + ring.offset + Math.PI*1.7);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.lw;
    ctx.lineCap = 'round'; ctx.stroke();
  });

  // Center star
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a * 0.6);
  ctx.fillStyle = 'rgba(244,165,138,0.85)';
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI/3);
    ctx.beginPath();
    ctx.ellipse(0, -14, 3, 7, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  ctaAngle += 0.016;
}

/* ── MODEL 5: About page - soft diamond ── */
let aboutAngle = 0;
function drawAboutModel(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w/2, cy = h/2;
  const a = aboutAngle;
  const bob = Math.sin(a) * 10;

  // Shadow
  const shadow = ctx.createRadialGradient(cx, cy+105+bob, 5, cx, cy+105+bob, 55);
  shadow.addColorStop(0, 'rgba(100,150,200,0.18)');
  shadow.addColorStop(1, 'rgba(100,150,200,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.ellipse(cx, cy+108+bob, 58, 14, 0, 0, Math.PI*2); ctx.fill();

  // Diamond gem
  const pts = [
    [cx, cy - 80 + bob],
    [cx + 65, cy - 10 + bob],
    [cx + 45, cy + 60 + bob],
    [cx - 45, cy + 60 + bob],
    [cx - 65, cy - 10 + bob]
  ];

  // Bottom facet
  ctx.beginPath();
  ctx.moveTo(cx, cy + 95 + bob);
  ctx.lineTo(cx + 45, cy + 60 + bob);
  ctx.lineTo(cx - 45, cy + 60 + bob);
  ctx.closePath();
  ctx.fillStyle = '#8eb4d8'; ctx.fill();

  // Side facets
  const faceColors = ['#c4e0f8','#b8d9f5','#a8c8f0','#98b8e8'];
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i+1) % pts.length];
    const top = pts[0];
    ctx.beginPath();
    ctx.moveTo(top[0], top[1]);
    ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(next[0], next[1]);
    ctx.closePath();
    ctx.fillStyle = faceColors[i % faceColors.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1; ctx.stroke();
  }

  // Top highlight
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.lineTo(pts[4][0], pts[4][1]);
  ctx.closePath();
  ctx.fillStyle = '#e4f2fc'; ctx.fill();

  // Sparkles
  [[cx+75+Math.cos(a*2)*8, cy-60+bob+Math.sin(a*2)*6, 4, '#f4a58a'],
   [cx-70+Math.cos(a*1.5)*6, cy-30+bob+Math.sin(a*1.5)*8, 3, '#c4b8f0'],
   [cx+50+Math.cos(a*3)*5, cy+20+bob+Math.sin(a*3)*5, 3, '#a8dfd4']
  ].forEach(([sx,sy,sr,sc]) => {
    ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
    ctx.fillStyle = sc; ctx.fill();
  });

  aboutAngle += 0.014;
  if (document.getElementById('page-about') && document.getElementById('page-about').classList.contains('active')) {
    requestAnimationFrame(() => drawAboutModel(id));
  }
}

/* Keep project page 3D models animated */
function animateProjectModels() {
  if (document.getElementById('page-projects') &&
      document.getElementById('page-projects').classList.contains('active')) {
    drawCalcModel('canvas-p1');
    drawAgeModel('canvas-p2');
    requestAnimationFrame(animateProjectModels);
  }
}

/* Patch goTo to start animations for sub-pages */
const _goTo = goTo;
window.goTo = function(p) {
  _goTo(p);
  if (p === 'about') requestAnimationFrame(() => drawAboutModel('canvas-about'));
  if (p === 'projects') requestAnimationFrame(animateProjectModels);
  if (p === 'home') {
    requestAnimationFrame(drawHeroSphere);
    animateHomePage();
  }
};

function animateHomePage() {
  if (!document.getElementById('page-home').classList.contains('active')) return;
  drawCalcModel('canvas-calc');
  drawAgeModel('canvas-age');
  drawCtaModel('canvas-cta');
  requestAnimationFrame(animateHomePage);
}

// Start all animations
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(drawHeroSphere);
  requestAnimationFrame(animateHomePage);
  drawAboutModel('canvas-about');
});
