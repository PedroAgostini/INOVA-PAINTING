/* Lightweight script for inner pages (404, Privacy Policy, Terms of Use) */
(() => {
  const header = document.getElementById('header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const btn = document.querySelector('.menu-btn'), nav = document.getElementById('mnav');
  if (btn && nav) {
    const set = open => { nav.hidden = !open; btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
    btn.addEventListener('click', () => set(nav.hidden));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !nav.hidden) { set(false); btn.focus(); } });
  }
})();
