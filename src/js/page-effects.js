(() => {
  const root = document.documentElement;
  const header = document.querySelector(".main-header");
  const preview = document.querySelector(".product-preview");
  const counters = [...document.querySelectorAll("[data-count]")];
  const duration = 1500; // Duração da contagem em milissegundos.
  const counted = new WeakSet();
  const countFrames = new WeakMap();

  function measure() {
    const rem = parseFloat(getComputedStyle(root).fontSize);
    root.style.setProperty(
      "--header-height",
      `${header.getBoundingClientRect().height / rem}rem`,
    );
    if (preview)
      preview.parentElement.style.setProperty(
        "--preview-height",
        `${preview.offsetHeight / rem}rem`,
      );
  }
  measure();
  if ("ResizeObserver" in window) {
    const sizes = new ResizeObserver(measure);
    sizes.observe(header);
    if (preview) sizes.observe(preview);
  } else {
    window.addEventListener("resize", measure, { passive: true });
  }

  const format = (element, value) =>
    `${element.dataset.prefix || ""}${value.toFixed(Number(element.dataset.decimals || 0))}${element.dataset.suffix || ""}`;

  // O HTML já contém os valores finais e permanece visível sem suporte ao observer.
  if (!("IntersectionObserver" in window)) return;

  // Alvos pequenos: cada título, texto e card entra separadamente.
  // Não observar uma seção inteira evita revelar tudo ao mesmo tempo.
  const targets = [
    ...document.querySelectorAll(
      [
        ".hero-content > :not(.hero-actions)",
        ".hero-actions > *",
        ".image-doctor",
        ".metrics-overview > .section-tag",
        ".metrics-overview > h2",
        ".cards-grid-metrics > .card",
        ".about-content > .section-tag",
        ".about-content > h2",
        ".about-content > p",
        ".timeline-item",
        ".roi-calculator",
        "main .section-header > *",
        ".features-nav > .nav-item",
        ".feature-text > .sub-tag",
        ".feature-text > h3",
        ".feature-text > p",
        ".feature-text .check-list > li",
        ".feature-preview",
        ".connected-cards > .card",
        ".module-browser-bar",
        ".module-brand",
        ".module-menu-item",
        ".module-account",
        ".module-titlebar",
        ".module-specialty-card",
        ".modules-section > .preview-note",
        ".comparison-section > header > *",
        ".comparison-card",
        ".testimonial-card",
        ".metrics-card",
      ].join(","),
    ),
  ];
  const targetSet = new Set(targets);
  const delayStep = 180; // Intervalo entre elementos irmãos, em milissegundos.
  const revealThreshold = 0.12; // Mesmo ponto de entrada usado no portfólio.
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target.parentElement;
        if (!entry.isIntersecting) {
          // Só rearma quando o elemento sai por completo, nos dois sentidos.
          if (!element.contains(document.activeElement)) {
            element.classList.add("reveal-pending");
          }
        } else if (entry.intersectionRatio >= revealThreshold) {
          element.classList.remove("reveal-pending");
        }
      });
    },
    { threshold: [0, revealThreshold] },
  );
  const anchors = [];
  targets.forEach((element) => {
    const siblings = [...element.parentElement.children].filter((sibling) =>
      targetSet.has(sibling),
    );
    const delay = Math.min(siblings.indexOf(element), 3) * delayStep;
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    // A contratranslação da âncora mantém a área observada imóvel.
    const anchor = document.createElement("span");
    anchor.className = "reveal-anchor";
    anchor.setAttribute("aria-hidden", "true");
    element.append(anchor);
    element.classList.add("reveal-ready");
    element.classList.add("reveal-pending");
    anchors.push(anchor);
    // Navegar por teclado nunca deixa um controle focado invisível.
    element.addEventListener("focusin", () => {
      element.classList.add("reveal-focused");
      element.classList.remove("reveal-pending");
    });
    element.addEventListener("focusout", (event) => {
      if (!element.contains(event.relatedTarget))
        element.classList.remove("reveal-focused");
    });
  });

  // Duas pinturas garantem a transição também nos elementos da primeira tela.
  requestAnimationFrame(() => {
    requestAnimationFrame(() =>
      anchors.forEach((anchor) => reveal.observe(anchor)),
    );
  });

  // Observa o próprio número: a contagem não depende das âncoras de revelação
  // nem da preferência de movimento (os deslocamentos continuam sob controle do CSS).
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (!entry.isIntersecting) {
          const frame = countFrames.get(element);
          if (frame !== undefined) cancelAnimationFrame(frame);
          countFrames.delete(element);
          counted.delete(element);
          element.textContent = format(element, 0);
          return;
        }
        if (entry.intersectionRatio < 0.5 || counted.has(element)) return;
        counted.add(element);
        const card = element.closest(".card");
        const delay = card
          ? parseFloat(
              getComputedStyle(card).getPropertyValue("--reveal-delay"),
            ) || 0
          : 0;
        const start = performance.now() + delay;
        const tick = (now) => {
          const progress = Math.max(0, Math.min(1, (now - start) / duration));
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = format(
            element,
            Number(element.dataset.count) * eased,
          );
          if (progress < 1)
            countFrames.set(element, requestAnimationFrame(tick));
          else countFrames.delete(element);
        };
        countFrames.set(element, requestAnimationFrame(tick));
      });
    },
    { threshold: [0, 0.5] },
  );

  counters.forEach((element) => {
    element.textContent = format(element, 0);
    countObserver.observe(element);
  });
})();

// Somente as métricas curtas usam carrossel; leitura longa e formulários seguem estáticos.
(() => {
  const track = document.querySelector('.cards-grid-metrics');
  if (!track) return;
  const cards = [...track.children];
  const mobile = matchMedia('(max-width: 37.5rem)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = document.createElement('div');
  controls.className = 'metrics-carousel-controls';
  controls.hidden = true;
  track.id = 'metrics-carousel';
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.setAttribute('aria-controls', track.id);
  controls.append(pause);
  const dots = cards.map((card, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Mostrar métrica ${index + 1} de ${cards.length}`);
    dot.setAttribute('aria-controls', track.id);
    dot.addEventListener('click', () => { goTo(index); schedule(); });
    controls.append(dot);
    return dot;
  });
  track.after(controls);
  let timer;
  let animation;
  let paused = false;
  let interacting = false;
  let hovering = false;
  let visible = false;
  const current = () => {
    const left = track.getBoundingClientRect().left;
    return cards.reduce((best, card, index) =>
      Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
  };
  const updateDots = () => dots.forEach((dot, index) => {
    if (index === current()) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  const stopAnimation = () => {
    cancelAnimationFrame(animation);
    track.classList.remove('is-moving');
  };
  function goTo(index) {
    stopAnimation();
    const from = track.scrollLeft;
    const to = Math.min(track.scrollWidth - track.clientWidth,
      from + cards[index].getBoundingClientRect().left - track.getBoundingClientRect().left);
    if (reduced.matches) { track.scrollLeft = to; updateDots(); return; }
    track.classList.add('is-moving');
    const start = performance.now();
    const step = now => {
      const progress = Math.min(1, (now - start) / 500);
      track.scrollLeft = from + (to - from) * (1 - Math.pow(1 - progress, 3));
      if (progress < 1) animation = requestAnimationFrame(step);
      else { track.classList.remove('is-moving'); updateDots(); }
    };
    animation = requestAnimationFrame(step);
  }
  function schedule() {
    clearTimeout(timer);
    if (!mobile.matches || reduced.matches || paused || interacting || hovering || !visible || document.hidden ||
      track.contains(document.activeElement) || controls.contains(document.activeElement)) return;
    timer = setTimeout(() => { goTo((current() + 1) % cards.length); schedule(); }, 7000);
  }
  const sync = () => {
    stopAnimation();
    controls.hidden = !mobile.matches;
    pause.textContent = paused || reduced.matches ? 'Reproduzir' : 'Pausar';
    pause.disabled = reduced.matches;
    pause.setAttribute('aria-label', reduced.matches ? 'Reprodução automática desativada pela preferência de movimento reduzido' : `${paused ? 'Reproduzir' : 'Pausar'} métricas automaticamente`);
    if (mobile.matches) {
      track.setAttribute('role', 'region');
      track.setAttribute('aria-roledescription', 'carrossel');
      track.setAttribute('aria-label', 'Impacto em números');
      track.tabIndex = 0;
    } else {
      track.removeAttribute('role');
      track.removeAttribute('aria-roledescription');
      track.removeAttribute('aria-label');
      track.removeAttribute('tabindex');
      track.scrollLeft = 0;
    }
    updateDots();
    schedule();
  };
  pause.addEventListener('click', () => { paused = !paused; sync(); });
  track.addEventListener('scroll', () => { updateDots(); schedule(); }, { passive: true });
  track.addEventListener('keydown', event => {
    if (!mobile.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    goTo((current() + (event.key === 'ArrowRight' ? 1 : cards.length - 1)) % cards.length);
    schedule();
  });
  track.addEventListener('pointerdown', () => { interacting = true; stopAnimation(); schedule(); });
  const endInteraction = () => { interacting = false; schedule(); };
  window.addEventListener('pointerup', endInteraction, { passive: true });
  window.addEventListener('pointercancel', endInteraction, { passive: true });
  track.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { hovering = true; schedule(); }
  });
  track.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { hovering = false; schedule(); }
  });
  [track, controls].forEach(element => {
    element.addEventListener('focusin', schedule);
    element.addEventListener('focusout', () => queueMicrotask(schedule));
  });
  document.addEventListener('visibilitychange', schedule);
  mobile.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.25 }).observe(track);
  }
  sync();
})();
