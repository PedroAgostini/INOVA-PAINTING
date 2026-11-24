/* Contact card: native share with copy-link fallback */
(() => {
  const btn = document.querySelector('.bc-share'), toast = document.querySelector('.bc-toast');
  if (!btn) return;
  const url = 'https://inovapaintingpro.com/card';
  const show = msg => { toast.textContent = msg; toast.hidden = false; clearTimeout(show.t); show.t = setTimeout(() => toast.hidden = true, 2200); };
  btn.addEventListener('click', async () => {
    const data = { title: 'Inova Painting Corp', text: 'House painters in Medway, MA: call or text (781) 420-5111', url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url); show('Link copied');
    } catch (e) { if (e && e.name !== 'AbortError') show(url); }
  });
})();
