(() => {
  const root = document.documentElement;
  const header = document.querySelector(".main-header");
  const preview = document.querySelector(".product-preview");
  const counters = [...document.querySelectorAll("[data-count]")];
  const duration = 1500; // Duração da contagem em milissegundos.
  const counted = new WeakSet();

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
    requestAnimationFrame(() => anchors.forEach(anchor => reveal.observe(anchor)));
  });

  // Observa o próprio número: a contagem não depende das âncoras de revelação
  // nem da preferência de movimento (os deslocamentos continuam sob controle do CSS).
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const element = entry.target;
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || counted.has(element)) return;
      counted.add(element);
      countObserver.unobserve(element);
      const card = element.closest(".card");
      const delay = card ? parseFloat(getComputedStyle(card).getPropertyValue("--reveal-delay")) || 0 : 0;
      const start = performance.now() + delay;
      const tick = now => {
        const progress = Math.max(0, Math.min(1, (now - start) / duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = format(element, Number(element.dataset.count) * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: [0, 0.5] });

  counters.forEach(element => {
    element.textContent = format(element, 0);
    countObserver.observe(element);
  });
})();
