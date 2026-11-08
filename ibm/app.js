const pages = [...document.querySelectorAll('[data-page]')];
const pageNames = new Set(pages.map(page => page.id));
const nav = document.querySelector('#site-nav');
const menuToggle = document.querySelector('.menu-toggle');
const main = document.querySelector('#main');

function showPage() {
  const target = decodeURIComponent(location.hash.slice(1));
  const current = pageNames.has(target) ? target : target.startsWith('note-') ? 'journal' : 'about';
  pages.forEach(page => { page.hidden = page.id !== current; });
  document.querySelectorAll('.site-nav a').forEach(link => {
    if (link.hash === `#${current}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.title = `${current[0].toUpperCase()}${current.slice(1)} / IBM concept study`;
  requestAnimationFrame(() => {
    if (target.startsWith('note-')) {
      noteCategory = 'all';
      document.querySelector('#note-search').value = '';
      document.querySelectorAll('[data-note-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.noteFilter === 'all')));
      filterNotes();
      const note = document.getElementById(target);
      if (note) { note.open = true; note.scrollIntoView({block: 'start'}); }
    } else window.scrollTo({top: 0, behavior: 'instant'});
    main.focus({preventScroll: true});
    requestMorph();
  });
}

menuToggle.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }
});
window.addEventListener('hashchange', showPage);

document.querySelectorAll('[data-team-filter]').forEach(button => button.addEventListener('click', () => {
  const selected = button.dataset.teamFilter;
  document.querySelectorAll('[data-team-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelectorAll('[data-team]').forEach(item => { item.hidden = selected !== 'all' && item.dataset.team !== selected; });
}));

let noteCategory = 'all';
function filterNotes() {
  const query = document.querySelector('#note-search').value.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('.note').forEach(note => {
    const matches = (noteCategory === 'all' || note.dataset.noteCategory === noteCategory) && (!query || note.dataset.noteSearch.includes(query) || note.textContent.toLowerCase().includes(query));
    note.hidden = !matches;
    if (matches) shown++;
  });
  document.querySelector('#empty-notes').hidden = shown > 0;
}
document.querySelector('#note-search').addEventListener('input', filterNotes);
document.querySelectorAll('[data-note-filter]').forEach(button => button.addEventListener('click', () => {
  noteCategory = button.dataset.noteFilter;
  document.querySelectorAll('[data-note-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  filterNotes();
}));

document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nTopic: ${data.get('topic')}\n\n${data.get('message')}`;
  const mailto = `mailto:magnesium037@outlook.com?subject=${encodeURIComponent('Site enquiry — ' + data.get('topic'))}&body=${encodeURIComponent(body)}`;
  document.querySelector('#form-status').textContent = 'Opening your mail app…';
  window.location.href = mailto;
});

const values = [...document.querySelectorAll('.values-fallback li')].map(item => ({
  title: item.querySelector('h3').textContent,
  copy: item.querySelector('p').textContent
}));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const forceMotion = new URLSearchParams(location.search).has('motion');
if (forceMotion) document.documentElement.classList.add('motion-preview');
const mobileValues = matchMedia('(max-width: 680px)');
const valueScroll = document.querySelector('#values-scroll');
const valueStage = document.querySelector('.values-stage');
const animation = window.lottie?.loadAnimation({
  container: document.querySelector('#value-glyph'), renderer: 'svg',
  loop: false, autoplay: false, path: 'assets/animation/ibm-values.json'
});
let animationReady = false;
let pendingMorph = false;
let activeValue = -1;
let mobileValueIndex = 0;
let mobileProgress = 0;
let mobileAnimation = 0;
let desktopProgress;
let lastMorphTime = 0;
function lerp(a, b, t) { return a + (b - a) * t; }
function approach(a, b, elapsed) { return a + (b - a) * (1 - Math.exp(-elapsed / 90)); }
function frameAt(progress) { return Math.max(0, Math.min(5, progress)) * 100; }
function renderMorph(progress) {
  if (!animationReady) return;
  animation.goToAndStop(frameAt(progress), true);
  const nearest = Math.round(progress);
  if (nearest !== activeValue) {
    activeValue = nearest;
    document.querySelector('#value-number').textContent = `${String(nearest + 1).padStart(2, '0')} / 06`;
    document.querySelector('#value-title').textContent = values[nearest].title;
    document.querySelector('#value-copy').textContent = values[nearest].copy;
  }
  const handoff = Math.abs((progress % 1) - 0.5);
  const textOpacity = Math.min(1, handoff / 0.12);
  document.querySelector('#value-title').style.opacity = textOpacity;
  document.querySelector('#value-copy').style.opacity = textOpacity;
  document.querySelector('#values-progress').style.transform = `scaleX(${progress / 5})`;
  document.querySelector('#value-prev').disabled = mobileValueIndex === 0;
  document.querySelector('#value-next').disabled = mobileValueIndex === 5;
}
function updateMorph(now) {
  pendingMorph = false;
  if ((motion.matches && !forceMotion && !mobileValues.matches) || document.querySelector('#about').hidden) {
    desktopProgress = undefined;
    return;
  }
  if (mobileValues.matches) {
    desktopProgress = undefined;
    renderMorph(mobileProgress);
    return;
  }
  const rect = valueScroll.getBoundingClientRect();
  const stageHeight = valueStage.offsetHeight;
  const distance = Math.max(1, rect.height - 3 * stageHeight);
  const target = Math.max(0, Math.min(5, (-rect.top - stageHeight) / distance * 5));
  let progress = desktopProgress === undefined ? target
    : approach(desktopProgress, target, Math.min(32, Math.max(0, now - lastMorphTime)));
  if (Math.abs(progress - target) < .001) progress = target;
  desktopProgress = progress;
  lastMorphTime = now;
  renderMorph(progress);
  if (progress !== target) requestMorph();
}
function requestMorph() {
  if (!pendingMorph) { pendingMorph = true; requestAnimationFrame(updateMorph); }
}
function chooseMobileValue(delta) {
  if (!mobileValues.matches) return;
  const next = Math.max(0, Math.min(5, mobileValueIndex + delta));
  if (next === mobileValueIndex) return;
  valueScroll.scrollIntoView({block: 'start', behavior: 'instant'});
  mobileValueIndex = next;
  cancelAnimationFrame(mobileAnimation);
  if (motion.matches && !forceMotion) {
    mobileProgress = next;
    requestMorph();
    return;
  }
  const start = mobileProgress;
  const begin = performance.now();
  function tick(now) {
    const fraction = Math.min(1, (now - begin) / 580);
    const eased = fraction * fraction * (3 - 2 * fraction);
    mobileProgress = lerp(start, next, eased);
    requestMorph();
    if (fraction < 1) mobileAnimation = requestAnimationFrame(tick);
  }
  mobileAnimation = requestAnimationFrame(tick);
}
function syncMotion() {
  const interactive = animationReady && (mobileValues.matches || forceMotion || !motion.matches);
  document.body.classList.toggle('morph-enabled', interactive);
  document.querySelector('.values-fallback').setAttribute('aria-hidden', String(interactive));
  requestMorph();
}
animation?.setSubframe?.(true);
animation?.addEventListener('DOMLoaded', () => { animationReady = true; syncMotion(); });
animation?.addEventListener('data_failed', () => { animationReady = false; syncMotion(); });
motion.addEventListener('change', syncMotion);
mobileValues.addEventListener('change', syncMotion);
window.addEventListener('scroll', requestMorph, {passive: true});
window.addEventListener('resize', requestMorph);
document.querySelector('#value-prev').addEventListener('click', () => chooseMobileValue(-1));
document.querySelector('#value-next').addEventListener('click', () => chooseMobileValue(1));
valueStage.addEventListener('keydown', event => {
  if (!mobileValues.matches) return;
  if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
    event.preventDefault();
    chooseMobileValue(['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1);
  }
});
document.querySelector('#skip-values').addEventListener('click', () => document.querySelector('#people-preview').scrollIntoView({behavior: 'smooth'}));

const revealPhotos = [...document.querySelectorAll('[data-photo-reveal]')];
if ('IntersectionObserver' in window) {
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      photoObserver.unobserve(entry.target);
    });
  }, {threshold: .16, rootMargin: '0px 0px -6% 0px'});
  revealPhotos.forEach(photo => photoObserver.observe(photo));
  document.body.classList.toggle('reveal-ready', !motion.matches || forceMotion);
  motion.addEventListener('change', () => document.body.classList.toggle('reveal-ready', !motion.matches || forceMotion));
}

if (new URLSearchParams(location.search).has('selftest')) {
  const structureGood = pages.length === 7 && values.length === 6 && revealPhotos.length === 2 && frameAt(0) === 0 && frameAt(5) === 500 && frameAt(2.345) > 234 && frameAt(2.345) < 235 && approach(0, 1, 16) > 0 && approach(0, 1, 16) < 1;
  const linksGood = [...document.querySelectorAll('a[href^="#"]')].every(link => document.getElementById(link.hash.slice(1)));
  console.assert(structureGood && linksGood, 'Concept site self-check failed');
  document.documentElement.dataset.selftest = structureGood && linksGood ? 'passed' : 'failed';
}
syncMotion();
showPage();
