(() => {
  const navbar = document.querySelector(".navbar");
  const button = navbar?.querySelector(".nav-toggle");
  const links = navbar?.querySelector(".navbar-links");
  if (!navbar || !button || !links) return;

  const header = navbar.closest(".main-header");
  const menuLinks = [...links.querySelectorAll('.menu a[href^="#"]')];
  const sections = menuLinks
    .map((link) => ({ link, section: document.querySelector(link.hash) }))
    .filter(({ section }) => section)
    .sort((a, b) => a.section.offsetTop - b.section.offsetTop);
  let activeLink = null;
  const setActive = (active) => {
    if (activeLink === active) return;
    activeLink = active;
    menuLinks.forEach((link) => {
      if (link === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  let frame = 0;
  let selectedLink = null;
  let selectionTimeout;
  const updatePosition = () => {
    frame = 0;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
    if (selectedLink) return;
    const offset = header.getBoundingClientRect().bottom + 32;
    let active = menuLinks[0];
    sections.forEach(({ link, section }) => {
      if (section.getBoundingClientRect().top <= offset) active = link;
    });
    setActive(active);
  };
  const schedulePosition = () => {
    if (!frame) frame = requestAnimationFrame(updatePosition);
  };
  menuLinks.forEach((link) =>
    link.addEventListener("click", () => {
      selectedLink = link;
      setActive(link);
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        selectedLink = null;
        schedulePosition();
      }, 1200);
    }),
  );
  // Uma nova interação de scroll cancela a prioridade temporária do clique.
  const releaseSelection = () => {
    selectedLink = null;
    schedulePosition();
  };
  window.addEventListener("wheel", releaseSelection, { passive: true });
  window.addEventListener("touchstart", releaseSelection, { passive: true });
  window.addEventListener("scroll", schedulePosition, { passive: true });
  window.addEventListener("resize", schedulePosition, { passive: true });
  window.addEventListener("hashchange", schedulePosition);
  updatePosition();

  const compact = window.matchMedia("(max-width: 75rem)");
  const setOpen = (open, returnFocus = false) => {
    navbar.classList.toggle("nav-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute(
      "aria-label",
      open ? "Fechar menu de navegação" : "Abrir menu de navegação",
    );
    if (returnFocus) button.focus();
  };

  navbar.classList.add("nav-enhanced");
  button.hidden = false;
  button.addEventListener("click", () => {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });
  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navbar.classList.contains("nav-open")) {
      setOpen(false, true);
    }
  });
  document.addEventListener("click", (event) => {
    if (!navbar.contains(event.target)) setOpen(false);
  });
  navbar.addEventListener("focusout", (event) => {
    if (!navbar.contains(event.relatedTarget)) setOpen(false);
  });
  compact.addEventListener("change", () => {
    const focusInsideLinks = links.contains(document.activeElement);
    setOpen(false, compact.matches && focusInsideLinks);
  });
})();
