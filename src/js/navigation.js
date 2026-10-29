(() => {
  const navbar = document.querySelector('.navbar');
  const button = navbar?.querySelector('.nav-toggle');
  const links = navbar?.querySelector('.navbar-links');
  if (!navbar || !button || !links) return;

  const compact = window.matchMedia('(max-width: 75rem)');
  const setOpen = (open, returnFocus = false) => {
    navbar.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    if (returnFocus) button.focus();
  };

  navbar.classList.add('nav-enhanced');
  button.hidden = false;
  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  links.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navbar.classList.contains('nav-open')) {
      setOpen(false, true);
    }
  });
  document.addEventListener('click', event => {
    if (!navbar.contains(event.target)) setOpen(false);
  });
  navbar.addEventListener('focusout', event => {
    if (!navbar.contains(event.relatedTarget)) setOpen(false);
  });
  compact.addEventListener('change', () => {
    const focusInsideLinks = links.contains(document.activeElement);
    setOpen(false, compact.matches && focusInsideLinks);
  });
})();
