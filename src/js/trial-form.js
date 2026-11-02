(() => {
  const form = document.querySelector("[data-trial-form]");
  if (!form) return;
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector("[data-form-status]");
  const fields = [...form.querySelectorAll("input")];
  const touched = new Set();
  const errors = new Map();
  const destination = new URL(form.dataset.platformUrl);
  if (destination.protocol !== "https:") return;

  fields.forEach((field) => {
    const error = document.createElement("p");
    error.id = `${field.id}-error`;
    error.className = "form-error";
    error.hidden = true;
    field.closest(".form-group, .form-checkbox").append(error);
    field.setAttribute(
      "aria-describedby",
      [field.getAttribute("aria-describedby"), error.id]
        .filter(Boolean)
        .join(" "),
    );
    errors.set(field, error);
  });

  function validate(field, showError = false) {
    field.setCustomValidity("");
    const value = field.value.trim();
    let message = "";
    switch (field.name) {
      case "name":
        if ((value.match(/\p{L}/gu) || []).length < 2)
          message = "Informe seu nome completo.";
        break;
      case "email":
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
          field.validity.typeMismatch
        ) {
          message = "Informe um e-mail válido, como nome@clinica.com.br.";
        }
        break;
      case "clinic_name":
        if (value.length < 2) message = "Informe o nome da clínica.";
        break;
      case "whatsapp": {
        let digits = value.replace(/\D/g, "");
        if ([12, 13].includes(digits.length) && digits.startsWith("55"))
          digits = digits.slice(2);
        if (
          !/^\+?[\d\s().-]+$/.test(value) ||
          !/^[1-9]\d(?:[2-9]\d{7}|9\d{8})$/.test(digits)
        ) {
          message = "Informe um WhatsApp com DDD, como (11) 99999-9999.";
        }
        break;
      }
      case "terms":
        if (!field.checked)
          message =
            "Aceite os Termos de Uso e a Política de Privacidade para continuar.";
        break;
    }
    field.setCustomValidity(message);
    const valid = field.validity.valid;
    if (showError) {
      const error = errors.get(field);
      error.textContent = valid ? "" : message || field.validationMessage;
      error.hidden = valid;
      if (valid) field.removeAttribute("aria-invalid");
      else field.setAttribute("aria-invalid", "true");
    }
    return valid;
  }

  form.addEventListener("focusout", ({ target }) => {
    if (!errors.has(target)) return;
    touched.add(target);
    validate(target, true);
  });
  form.addEventListener("input", ({ target }) => {
    if (!errors.has(target)) return;
    validate(target, touched.has(target));
    status.textContent = "";
  });

  // Garante o mesmo fluxo para clique e Enter, com mensagens em português.
  form.noValidate = true;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let valid = true;
    fields.forEach((field) => {
      if (field.type !== "checkbox") field.value = field.value.trim();
      touched.add(field);
      if (!validate(field, true)) valid = false;
    });
    if (!valid) {
      status.textContent = "Revise os campos indicados antes de continuar.";
      form.reportValidity();
      return;
    }
    // Apenas navega: não envia nem armazena os dados pessoais do formulário.
    window.location.assign(destination.href);
  });
  submit.disabled = false;
})();
