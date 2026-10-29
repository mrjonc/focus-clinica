(() => {
  const root = document.documentElement;
  const header = document.querySelector('.main-header');
  const preview = document.querySelector('.product-preview');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const counters = [...document.querySelectorAll('[data-count]')];
  const duration = 1500; // Duração da contagem em milissegundos.
  let frame;
  let counted = false;

  function measure() {
    const rem = parseFloat(getComputedStyle(root).fontSize);
    root.style.setProperty('--header-height', `${header.getBoundingClientRect().height / rem}rem`);
    if (preview) preview.parentElement.style.setProperty('--preview-height', `${preview.offsetHeight / rem}rem`);
  }
  measure();
  if ('ResizeObserver' in window) {
    const sizes = new ResizeObserver(measure);
    sizes.observe(header);
    if (preview) sizes.observe(preview);
  } else {
    window.addEventListener('resize', measure, { passive: true });
  }

  const format = (element, value) => `${element.dataset.prefix || ''}${value.toFixed(Number(element.dataset.decimals || 0))}${element.dataset.suffix || ''}`;
  const finish = () => {
    cancelAnimationFrame(frame);
    counters.forEach(element => { element.textContent = format(element, Number(element.dataset.count)); });
  };

  // O HTML já contém os valores finais e permanece visível sem suporte ao observer.
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('.hero-content, .image-doctor, .metrics-overview > .section-tag, .metrics-overview > h2, .cards-grid-metrics > .card, .about-content, .roi-calculator, main > section:nth-of-type(n+4)');
  const shown = new WeakSet();
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const element = entry.target.parentElement;
      if (motion.matches) {
        element.classList.remove('reveal-pending');
      } else if (entry.isIntersecting) {
        element.classList.remove('reveal-pending');
        shown.add(element);
      } else if (shown.has(element)) {
        // threshold zero: rearma apenas após sair por completo, nos dois sentidos.
        element.classList.add('reveal-pending');
        shown.delete(element);
      }
    });
  }, { threshold: 0 });
  targets.forEach(element => {
    // A âncora mantém a área observada estável enquanto o conteúdo se move.
    const anchor = document.createElement('span');
    anchor.className = 'reveal-anchor';
    anchor.setAttribute('aria-hidden', 'true');
    element.append(anchor);
    element.classList.add('reveal-ready');
    if (!motion.matches) element.classList.add('reveal-pending');
    reveal.observe(anchor);
    // Navegar por teclado nunca deixa um controle focado invisível.
    element.addEventListener('focusin', () => element.classList.remove('reveal-pending'));
  });

  const section = document.querySelector('.metrics-overview');
  const countObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || counted || motion.matches) return;
    counted = true;
    countObserver.disconnect();
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      counters.forEach(element => { element.textContent = format(element, Number(element.dataset.count) * eased); });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    counters.forEach(element => { element.textContent = format(element, 0); });
    frame = requestAnimationFrame(tick);
  }, { threshold: 0 });
  if (section && !motion.matches) countObserver.observe(section);

  motion.addEventListener('change', () => {
    if (motion.matches) {
      targets.forEach(element => element.classList.remove('reveal-pending'));
      finish();
      counted = true;
      countObserver.disconnect();
    }
  });
})();
