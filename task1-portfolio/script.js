// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
function setMenu(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Highlight the nav link for the section in view
const links = [...nav.querySelectorAll('a')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section').forEach(s => sectionObserver.observe(s));

// Typing effect for the hero headline
const typed = document.getElementById('typed');
const phrases = ['responsive websites', 'clean interfaces', 'useful web apps'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  let p = 0, i = 0, deleting = false;
  (function tick() {
    const word = phrases[p];
    typed.textContent = word.slice(0, i);
    if (!deleting && i === word.length) { deleting = true; return setTimeout(tick, 1600); }
    if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; }
    i += deleting ? -1 : 1;
    setTimeout(tick, deleting ? 40 : 80);
  })();
}

// Animate skill bars once visible
const skills = document.querySelector('.skills');
new IntersectionObserver((entries, obs) => {
  if (entries[0].isIntersecting) { skills.classList.add('in'); obs.disconnect(); }
}, { threshold: 0.3 }).observe(skills);

// Back to top
const toTop = document.getElementById('to-top');
window.addEventListener('scroll', () => { toTop.hidden = window.scrollY < 600; });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

// Contact form validation
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const rules = {
  name: v => v.trim().length >= 2 ? '' : 'Enter your name (at least 2 characters).',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address, like name@example.com.',
  message: v => v.trim().length >= 10 ? '' : 'Write a message of at least 10 characters.'
};
function check(field) {
  const input = form.elements[field];
  const msg = rules[field](input.value);
  document.getElementById(field + '-error').textContent = msg;
  input.closest('.field').classList.toggle('invalid', Boolean(msg));
  input.setAttribute('aria-invalid', String(Boolean(msg)));
  return !msg;
}
Object.keys(rules).forEach(f => form.elements[f].addEventListener('blur', () => check(f)));
form.addEventListener('submit', e => {
  e.preventDefault();
  status.textContent = '';
  const results = Object.keys(rules).map(check);
  if (results.includes(false)) {
    form.querySelector('.invalid input, .invalid textarea').focus();
    return;
  }
  // There is no backend here. To receive messages, point the form at a service like Formspree.
  status.textContent = 'Thanks! Your message is valid and ready to send.';
  form.reset();
});

document.getElementById('year').textContent = new Date().getFullYear();
