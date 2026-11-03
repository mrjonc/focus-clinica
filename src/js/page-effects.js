(() => {
  const root = document.documentElement;
  const header = document.querySelector(".main-header");
  const preview = document.querySelector(".product-preview");
  const counters = [...document.querySelectorAll("[data-count]")];
  if (!header) return;
  const duration = 1500; // Duração da contagem em milissegundos.
  let headerHeight;
  let previewHeight;

  function measure() {
    const rem = parseFloat(getComputedStyle(root).fontSize);
    const nextHeaderHeight = header.getBoundingClientRect().height / rem;
    if (nextHeaderHeight !== headerHeight) {
      headerHeight = nextHeaderHeight;
      root.style.setProperty("--header-height", `${headerHeight}rem`);
    }
    if (!preview) return;
    const nextPreviewHeight = preview.offsetHeight / rem;
    if (nextPreviewHeight !== previewHeight) {
      previewHeight = nextPreviewHeight;
      preview.parentElement.style.setProperty(
        "--preview-height",
        `${previewHeight}rem`,
      );
    }
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

  // Anima a entrada do conteúdo. Controles interativos mantêm as próprias transições.
  const targets = [
    ...document.querySelectorAll(
      [
        ".hero-content > :not(.hero-actions)",
        ".image-doctor",
        ".cards-grid-metrics > .card",
        ".timeline-item",
        ".roi-calculator",
        "main .section-header > *",
        ".feature-text > .sub-tag",
        ".feature-text > h3",
        ".feature-text > p",
        ".feature-text .check-list > li",
        ".feature-preview",
        ".connected-cards > .card",
        ".modulos-preview .dashboard-topbar",
        ".modulos-preview .dashboard-brand",
        ".modulos-preview .dashboard-menu-item",
        ".modulos-preview .dashboard-sidebar-profile",
        ".module-titlebar",
        ".module-specialty-card",
        ".modules-section > .preview-note",
        ".comparison-card",
        ".testimonial-card",
        ".metrics-card",
      ].join(","),
    ),
  ];
  const siblingIndexes = new WeakMap();
  const delayStep = 180; // Intervalo entre elementos irmãos, em milissegundos.
  const revealThreshold = 0.12;
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target.parentElement;
        if (!element) {
          reveal.unobserve(entry.target);
          return;
        }
        if (entry.isIntersecting && entry.intersectionRatio >= revealThreshold) {
          element.classList.remove("reveal-pending");
          reveal.unobserve(entry.target);
        }
      });
    },
    { threshold: [0, revealThreshold] },
  );
  const anchors = [];
  targets.forEach((element) => {
    const parent = element.parentElement;
    const index = siblingIndexes.get(parent) || 0;
    siblingIndexes.set(parent, index + 1);
    const delay = Math.min(index, 3) * delayStep;
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
      reveal.unobserve(anchor);
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
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        countObserver.unobserve(element);
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
          const text = format(element, Number(element.dataset.count) * eased);
          if (element.textContent !== text) element.textContent = text;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: [0, 0.5] },
  );

  counters.forEach((element) => {
    element.textContent = format(element, 0);
    countObserver.observe(element);
  });
})();

// Carrosséis mobile com navegação manual, sem reprodução automática ou loop.
(() => {
  const mobile = matchMedia("(max-width: 37.5rem)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  document
    .querySelectorAll(".cards-grid-metrics, .connected-cards")
    .forEach((track) => {
      const metrics = track.classList.contains("cards-grid-metrics");
      const cards = [...track.children];
      const controls = document.createElement("div");
      controls.className =
        "metrics-carousel-controls connected-carousel-controls";
      controls.hidden = true;
      track.id = metrics ? "metrics-carousel" : "connected-carousel";
      let animation;
      let dots;
      let previous;
      let next;
      let activeIndex = -1;
      let controlsFrame = 0;

      const current = () => {
        const left = track.getBoundingClientRect().left;
        const distances = cards.map((card) =>
          Math.abs(card.getBoundingClientRect().left - left),
        );
        return distances.reduce(
          (best, distance, index) =>
            distance < distances[best] ? index : best,
          0,
        );
      };
      const updateControls = () => {
        const active = current();
        if (active === activeIndex) return;
        activeIndex = active;
        dots.forEach((dot, index) => {
          if (index === active) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
        previous.disabled = active === 0;
        next.disabled = active === cards.length - 1;
      };
      const scheduleControls = () => {
        if (controlsFrame) return;
        controlsFrame = requestAnimationFrame(() => {
          controlsFrame = 0;
          updateControls();
        });
      };
      const stopAnimation = () => {
        cancelAnimationFrame(animation);
        track.classList.remove("is-moving");
      };
      const goTo = (index) => {
        cancelAnimationFrame(animation);
        index = Math.max(0, Math.min(cards.length - 1, index));
        const from = track.scrollLeft;
        const to = Math.max(
          0,
          Math.min(
            track.scrollWidth - track.clientWidth,
            from +
              cards[index].getBoundingClientRect().left -
              track.getBoundingClientRect().left,
          ),
        );
        if (reduced.matches) {
          track.classList.remove("is-moving");
          track.scrollLeft = to;
          updateControls();
          return;
        }
        track.classList.add("is-moving");
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min(1, (now - start) / 650);
          const eased = (1 - Math.cos(Math.PI * progress)) / 2;
          track.scrollLeft = from + (to - from) * eased;
          if (progress < 1) animation = requestAnimationFrame(step);
          else {
            track.classList.remove("is-moving");
            updateControls();
          }
        };
        animation = requestAnimationFrame(step);
      };
      const addArrow = (direction) => {
        const arrow = document.createElement("button");
        arrow.type = "button";
        arrow.className = "carousel-arrow";
        arrow.setAttribute(
          "aria-label",
          direction < 0 ? "Card anterior" : "Próximo card",
        );
        arrow.setAttribute("aria-controls", track.id);
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        path.setAttribute(
          "d",
          direction < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6",
        );
        svg.append(path);
        arrow.append(svg);
        arrow.addEventListener("click", () => goTo(current() + direction));
        controls.append(arrow);
        return arrow;
      };
      previous = addArrow(-1);
      dots = cards.map((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute(
          "aria-label",
          `Mostrar ${metrics ? "métrica" : "card"} ${index + 1} de ${cards.length}`,
        );
        dot.setAttribute("aria-controls", track.id);
        dot.addEventListener("click", () => goTo(index));
        controls.append(dot);
        return dot;
      });
      next = addArrow(1);
      track.after(controls);
      const sync = () => {
        stopAnimation();
        controls.hidden = !mobile.matches;
        if (mobile.matches) {
          track.setAttribute("role", "region");
          track.setAttribute("aria-roledescription", "carrossel");
          track.setAttribute(
            "aria-label",
            metrics
              ? "Impacto em números"
              : "Recursos para a rotina da clínica",
          );
          track.tabIndex = 0;
        } else {
          ["role", "aria-roledescription", "aria-label", "tabindex"].forEach(
            (name) => track.removeAttribute(name),
          );
          track.scrollLeft = 0;
        }
        updateControls();
      };
      track.addEventListener("scroll", scheduleControls, { passive: true });
      track.addEventListener("keydown", (event) => {
        if (!mobile.matches || !["ArrowLeft", "ArrowRight"].includes(event.key))
          return;
        event.preventDefault();
        goTo(current() + (event.key === "ArrowRight" ? 1 : -1));
      });
      track.addEventListener("pointerdown", stopAnimation, { passive: true });
      window.addEventListener("resize", scheduleControls, { passive: true });
      mobile.addEventListener("change", sync);
      reduced.addEventListener("change", sync);
      sync();
    });
})();
