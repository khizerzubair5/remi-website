/* ============================================================
   REMI WEBSITE — app.js
   ============================================================ */

// Waitlist API is a Vercel serverless function — same origin in prod and local dev
const API_BASE = '';

// ── Nav: add .scrolled class on scroll ────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Scroll animations — fade-up on enter ─────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px',
});

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── Phone number normalisation ────────────────────────────────────────────────
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return null;
}

// ── Waitlist form ─────────────────────────────────────────────────────────────
const form      = document.getElementById('waitlist-form');
const errorBox  = document.getElementById('wl-error');
const submitBtn = document.getElementById('wl-submit');
const submitTxt = document.getElementById('wl-text');
const spinner   = document.getElementById('wl-spinner');
const success   = document.getElementById('wl-success');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

function clearError() {
  errorBox.textContent = '';
  errorBox.style.display = 'none';
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitTxt.style.display = on ? 'none' : 'inline';
  spinner.style.display   = on ? 'inline-block' : 'none';
}

// ── Live waitlist count + names ───────────────────────────────────────────────
async function fetchWaitlistPublic() {
  try {
    const res  = await fetch(`${API_BASE}/api/waitlist-public`);
    const data = await res.json();
    return data; // { count, names }
  } catch {
    return null;
  }
}

// On page load: if already signed up, skip the form and show success state
if (localStorage.getItem('remi_signed_up')) {
  form.style.display = 'none';
  success.style.display = 'block';
  showNamesAfterSignup();
}

// On page load: show live count below the sub-heading as social proof
(async function loadLiveCount() {
  const data = await fetchWaitlistPublic();
  if (!data || data.count === 0) return;

  const el = document.getElementById('wl-live-count');
  if (!el) return;
  el.textContent = `${data.count} student${data.count === 1 ? '' : 's'} already on the list.`;
  el.style.display = 'block';
}());

// After signup: show the names list inside the success state
async function showNamesAfterSignup() {
  const data = await fetchWaitlistPublic();
  if (!data || data.count <= 1) return; // only show if there are others

  const wrap      = document.getElementById('wl-names-wrap');
  const countEl   = document.getElementById('wl-names-count');
  const listEl    = document.getElementById('wl-names-list');
  if (!wrap || !countEl || !listEl) return;

  // Count excludes the user who just signed up (they're already in the DB)
  countEl.textContent = data.count - 1;

  listEl.innerHTML = data.names
    .map(name => `<span class="wl-name-chip">${name}</span>`)
    .join('');

  wrap.style.display = 'block';
}

// ── Phone message carousel ────────────────────────────────────────────────────
(function () {
  const DURATION = 4000; // ms per slide

  const slides      = document.querySelectorAll('.msg-slide');
  const labels      = document.querySelectorAll('.msg-label');
  const progressBar = document.getElementById('phone-progress-bar');

  if (!slides.length || !progressBar) return; // guard: not on this page

  let current = 0;
  let timer   = null;

  function showSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    labels.forEach(l => l.classList.remove('active'));

    slides[index].classList.add('active');
    labels[index].classList.add('active');
    current = index;

    // Reset progress bar then animate
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    void progressBar.offsetWidth; // force reflow
    progressBar.style.transition = `width ${DURATION}ms linear`;
    progressBar.style.width = '100%';
  }

  function advance() {
    showSlide((current + 1) % slides.length);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(advance, DURATION);
  }

  // Label click — jump to that slide, restart timer
  labels.forEach(label => {
    label.addEventListener('click', () => {
      const idx = parseInt(label.dataset.label, 10);
      showSlide(idx);
      startTimer();
    });
  });

  // Kick off
  showSlide(0);
  startTimer();
}());

// ── Waitlist form submission ──────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const name  = document.getElementById('wl-name').value.trim();
  const email = document.getElementById('wl-email').value.trim();
  const phone = document.getElementById('wl-phone').value.trim();

  // Client-side validation
  if (!name)  return showError('Please enter your first name.');
  if (!email || !email.includes('@')) return showError('Please enter a valid email address.');

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return showError('Please enter a valid US phone number.');

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone: normalizedPhone }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Already on the waitlist — treat as success on a different browser
      if (res.status === 409) {
        localStorage.setItem('remi_signed_up', 'true');
        form.style.display = 'none';
        success.style.display = 'block';
        showNamesAfterSignup();
        return;
      }
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }

    // Success — hide form, show confirmation + names list
    localStorage.setItem('remi_signed_up', 'true');
    form.style.display = 'none';
    success.style.display = 'block';
    showNamesAfterSignup();

  } catch (err) {
    showError(err.message);
    setLoading(false);
  }
});
