(() => {
  const grid = document.querySelector("[data-contributors]");
  const template = document.querySelector("#developer-card-template");
  const status = document.querySelector("[data-team-status]");
  const service = window.FocusTeamGitHub;
  if (!grid || !template || !status || !service || grid.dataset.initialized)
    return;
  grid.dataset.initialized = "true";

  const members = window.FocusTeamMembers || [];
  const messages = {
    "not-found": "Perfil não encontrado no GitHub.",
    forbidden: "Consulta ao GitHub temporariamente indisponível.",
    "rate-limit": "Limite de consultas ao GitHub atingido. Tente mais tarde.",
    "invalid-username": "Username do GitHub inválido.",
    "invalid-response": "Não foi possível ler este perfil do GitHub.",
    network: "Não foi possível carregar este perfil. Tente mais tarde.",
    http: "O GitHub está temporariamente indisponível.",
  };

  function addLink(container, href, label, name) {
    if (!href) return;
    const link = document.createElement("a");
    link.className = "developer-link";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    link.setAttribute("aria-label", `${label} de ${name} (abre em nova aba)`);
    container.append(link);
  }

  function loadPhoto(avatar, source, fallbackSource, position = "center") {
    if (!source) return;
    const image = document.createElement("img");
    image.alt = ""; // Foto decorativa: o nome adjacente já identifica o integrante.
    image.width = 72;
    image.height = 72;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.style.objectPosition = position;
    // Mantém o ícone visível até a foto carregar, inclusive se houver falha.
    image.className = "developer-photo-pending";
    image.addEventListener(
      "load",
      () => {
        image.classList.remove("developer-photo-pending");
        avatar.replaceChildren(image);
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        image.remove();
        if (fallbackSource && fallbackSource !== source)
          loadPhoto(avatar, fallbackSource, undefined, position);
      },
      { once: true },
    );
    // 72 px é o maior avatar do layout; 144 px mantém nitidez em telas 2x.
    const url = new URL(source, document.baseURI);
    if (url.hostname === "avatars.githubusercontent.com")
      url.searchParams.set("s", "144");
    image.src = url.href;
    avatar.append(image);
  }

  function createCard(member) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector("[data-contributor-name]").textContent =
      member.name || member.username || "Integrante da equipe";
    const role = card.querySelector("[data-contributor-role]");
    role.textContent = member.role || "";
    role.hidden = !role.textContent;
    const skills = card.querySelector("[data-contributor-bio]");
    skills.textContent = (member.skills || []).join(" | ");
    skills.title = skills.textContent;
    skills.hidden = !skills.textContent;
    if (member.username) {
      card.setAttribute("aria-busy", "true");
      card.classList.add("developer-card-loading");
    }
    grid.append(card);
    return card;
  }

  function renderCard(card, member, { profile, error, stale }) {
    const name =
      profile?.name || member.name || member.username || "Integrante da equipe";
    const heading = card.querySelector("[data-contributor-name]");
    heading.textContent = name;
    heading.title = name;
    const notice = card.querySelector("[data-contributor-notice]");
    notice.textContent = stale
      ? "Exibindo a última atualização disponível."
      : messages[error] || "";
    notice.hidden = !notice.textContent;

    const links = card.querySelector("[data-contributor-links]");
    const github =
      profile?.github ||
      (member.username && !["not-found", "invalid-username"].includes(error)
        ? `https://github.com/${encodeURIComponent(member.username)}`
        : null);
    addLink(links, github, "GitHub", name);
    addLink(
      links,
      service.safeUrl(member.linkedin, {
        hosts: ["linkedin.com", "www.linkedin.com"],
      }),
      "LinkedIn",
      name,
    );
    links.hidden = !links.childElementCount;
    const customPhoto = service.safeUrl(member.photo, { allowLocal: true });
    loadPhoto(
      card.querySelector(".developer-avatar"),
      profile?.photo || customPhoto,
      customPhoto,
      member.photoPosition,
    );
    card.classList.remove("developer-card-loading");
    card.setAttribute("aria-busy", "false");
  }

  async function loadMember(member, card) {
    let result = { profile: null, error: null, stale: false };
    if (member.username) {
      try {
        result = await service.getProfile(member.username);
      } catch {
        result.error = "network";
      }
    }
    renderCard(card, member, result);
    return result;
  }

  async function loadTeam() {
    grid.setAttribute("aria-busy", "true");
    status.textContent = members.length
      ? "Carregando equipe…"
      : "Integrantes da equipe em breve.";
    const cards = members.map((member) => ({
      member,
      card: createCard(member),
    }));
    const results = await Promise.all(
      cards.map(({ member, card }) => loadMember(member, card)),
    );
    grid.setAttribute("aria-busy", "false");
    if (members.length) {
      status.textContent = results.some((result) => result.error)
        ? "Alguns perfis estão temporariamente indisponíveis ou desatualizados."
        : "";
    }
  }

  loadTeam();
})();
