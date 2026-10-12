/* Gentle, content-aware reveals for the existing portfolio. */
(() => {
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window) ||
      !('MutationObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const selectors = [
    '.section-title',
    '.service-card',
    '.project-card',
    '.category-tile',
    '.award-card',
    '.testimonial-card',
    '.list article',
    '.custom-section',
    '.about-grid .panel',
    '.facts > div',
    '.contact .panel'
  ].join(', ');

  const registered = new WeakSet();
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });

  function register(root) {
    if (root.nodeType !== 1) return;
    const elements = [];
    if (root.matches(selectors)) elements.push(root);
    elements.push(...root.querySelectorAll(selectors));

    elements.forEach((element) => {
      if (registered.has(element)) return;
      registered.add(element);
      // Keep category/project groups graceful, not dramatic.
      if (element.matches('.project-card, .category-tile, .service-card')) {
        const index = Array.prototype.indexOf.call(element.parentElement.children, element);
        element.style.setProperty('--calm-delay', Math.min(index % 3, 2) * 65 + 'ms');
      }
      element.classList.add('calm-reveal');
      revealObserver.observe(element);
    });
  }

  register(main);
  // Supabase fetches and View More replace cards after the page first loads.
  new MutationObserver((changes) => {
    changes.forEach((change) => {
      change.addedNodes.forEach(register);
    });
  }).observe(main, { childList: true, subtree: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') register(main);
  });
})();
