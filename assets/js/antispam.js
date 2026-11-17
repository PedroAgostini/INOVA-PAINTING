/* Antispam: quote form time-trap + honeypot + link filter, and e-mail obfuscation.
   Runs before the form handler in main.js (capture phase) and silently drops bot submissions. */
(() => {
  const started = Date.now();

  // 1) E-mail obfuscation: <a data-mail="user|domain.com"> becomes a real mailto link at runtime
  document.querySelectorAll('[data-mail]').forEach(a => {
    const [u, d] = a.getAttribute('data-mail').split('|'); if (!u || !d) return;
    const addr = u + '@' + d;
    a.setAttribute('href', 'mailto:' + addr);
    a.querySelectorAll('[data-mail-text]').forEach(t => { t.textContent = addr; });
    if (a.hasAttribute('data-mail-text')) a.textContent = addr;
  });

  // 2) Quote form protection
  const form = document.getElementById('quote-form'); if (!form) return;
  const ts = document.createElement('input'); ts.type = 'hidden'; ts.name = 'form_age_ms'; form.append(ts);
  const fakeSuccess = () => {
    const body = form.querySelector('.form-body'), done = form.querySelector('.form-done');
    if (body && done) { body.hidden = true; done.hidden = false; }
  };
  document.addEventListener('submit', e => {
    if (e.target !== form) return;
    const age = Date.now() - started; ts.value = String(age);
    const honeypot = form.querySelector('.hp');
    const msg = (form.querySelector('[name=message]')?.value || '') + ' ' + (form.querySelector('[name=name]')?.value || '');
    const links = (msg.match(/https?:\/\/|www\./gi) || []).length;
    const spam = (honeypot && honeypot.checked) || age < 3000 || links > 1 || /<\s*a\s|\[url=/i.test(msg);
    if (spam) { e.preventDefault(); e.stopImmediatePropagation(); fakeSuccess(); }
  }, true);
})();
