/* Les liens restent utilisables sans JavaScript ; le dialogue enrichit l'agrandissement. */
(() => {
  const dialog = document.getElementById('portfolioDialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('portfolioImage');
  const caption = document.getElementById('portfolioCaption');
  const count = document.getElementById('portfolioCount');
  const previous = document.getElementById('portfolioPrev');
  const next = document.getElementById('portfolioNext');
  let items = [], index = 0, trigger;
  function show(value) {
    index = (value + items.length) % items.length;
    const item = items[index];
    image.src = item.href;
    image.alt = item.querySelector('img').alt;
    caption.textContent = item.dataset.caption;
    count.textContent = `${index + 1} / ${items.length}`;
    previous.hidden = next.hidden = items.length < 2;
  }
  document.querySelectorAll('[data-portfolio-image]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      items = Array.from(link.closest('[data-portfolio-gallery]').querySelectorAll('[data-portfolio-image]'));
      show(items.indexOf(link));
      dialog.showModal();
    });
  });
  dialog.querySelector('.pf-close').addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus());
})();
