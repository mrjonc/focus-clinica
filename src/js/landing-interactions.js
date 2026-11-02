(() => {
  const navigation = document.querySelector(".features-nav");
  const panel = document.querySelector(".feature-detail");
  const preview = panel?.querySelector(".feature-preview");
  if (!navigation || !panel || !preview) return;

  const buttons = [...navigation.querySelectorAll("button")];
  const text = panel.querySelector(".feature-text");
  const tag = text.querySelector(".sub-tag");
  const title = text.querySelector("h3");
  const description = text.querySelector("p");
  const list = text.querySelector(".check-list");
  const items = [...list.children];
  const check = list.querySelector("svg").cloneNode(true);
  const schedule = preview.firstElementChild;
  const original = {
    tag: tag.textContent,
    title: title.textContent,
    description: description.textContent,
    bullets: [...list.children].map((item) => item.textContent.trim()),
  };
  const cards = [...document.querySelectorAll(".connected-cards > .card")];
  const bulletSets = [
    ["Lembretes de consulta", "Confirmações automáticas", "Avisos no WhatsApp"],
    [
      "Histórico e evolução clínica",
      "Tipos de consulta",
      "Organização por especialidade",
    ],
    [
      "Receitas e repasses",
      "Relatórios de gestão",
      "Informações para acompanhar a clínica",
    ],
  ];
  const features = [
    original,
    ...cards.map((card, index) => ({
      tag: buttons[index + 1].textContent.trim(),
      title: card.querySelector("h4").textContent,
      description: card.querySelector("p").textContent,
      bullets: bulletSets[index],
    })),
  ];

  const examples = new Map();

  function getExample(index) {
    if (examples.has(index)) return examples.get(index);
    // Cria somente a prévia selecionada, reaproveitando o conteúdo existente.
    const example = cards[index - 1].cloneNode(true);
    example.className = "feature-example";
    example.removeAttribute("style");
    example
      .querySelectorAll(".reveal-anchor")
      .forEach((anchor) => anchor.remove());
    example
      .querySelectorAll("[id]")
      .forEach((element) => element.removeAttribute("id"));
    example.hidden = true;
    preview.append(example);
    examples.set(index, example);
    return example;
  }

  navigation.setAttribute("role", "tablist");
  panel.id = "feature-panel";
  panel.setAttribute("role", "tabpanel");
  panel.tabIndex = 0;
  buttons.forEach((button, index) => {
    button.id = `feature-tab-${index}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel.id);
  });

  function updateText(element, value, prefix) {
    // Preserva as âncoras acompanhadas pelo observer de animações existente.
    const anchor = element.querySelector(":scope > .reveal-anchor");
    element.replaceChildren(
      ...(prefix ? [prefix] : []),
      document.createTextNode(value),
    );
    if (anchor) element.append(anchor);
  }

  function setActiveTab(index) {
    buttons.forEach((button, current) => {
      const active = current === index;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", buttons[index].id);
  }

  function select(index, focus = false) {
    const feature = features[index];
    setActiveTab(index);
    updateText(tag, feature.tag);
    updateText(title, feature.title);
    updateText(description, feature.description);
    feature.bullets.forEach((bullet, current) =>
      updateText(items[current], bullet, check.cloneNode(true)),
    );
    schedule.hidden = index !== 0;
    if (index !== 0) getExample(index);
    preview.classList.toggle("has-example", index !== 0);
    preview.classList.add("is-selected-preview");
    examples.forEach((example, current) => {
      example.hidden = current !== index;
    });
    preview.setAttribute(
      "aria-label",
      `Prévia ilustrativa: ${buttons[index].textContent.trim()}`,
    );
    // Conteúdo selecionado por ação do visitante deve permanecer visível.
    text.querySelectorAll(".reveal-ready").forEach((element) => {
      element.classList.add("reveal-focused");
      element.classList.remove("reveal-pending");
    });
    if (focus) buttons[index].focus();
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", (event) => {
      let next;
      if (["ArrowRight", "ArrowDown"].includes(event.key))
        next = (index + 1) % buttons.length;
      else if (["ArrowLeft", "ArrowUp"].includes(event.key))
        next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else return;
      event.preventDefault();
      select(next, true);
    });
  });
  // Inicializa os atributos sem interferir na animação de entrada do conteúdo.
  setActiveTab(0);
})();
