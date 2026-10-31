(() => {
  const calculator = document.querySelector(".roi-calculator");
  if (!calculator) return;

  const doctors = calculator.elements.doctors;
  const consultations = calculator.elements.consultations;
  const hoursFormat = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const numberFormat = new Intl.NumberFormat("pt-BR");
  const currencyFormat = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  const quantity = (value, singular, plural) =>
    `${numberFormat.format(value)} ${value === 1 ? singular : plural}`;

  // Os limites usam os próprios atributos dos sliders para manter texto e controle coerentes.
  ["min", "max"].forEach(bound => {
    calculator.querySelector(`#roi-doctors-${bound}`).textContent =
      quantity(Number(doctors[bound]), "médico", "médicos");
    calculator.querySelector(`#roi-consultations-${bound}`).textContent =
      quantity(Number(consultations[bound]), "consulta", "consultas");
  });

  function update() {
    [doctors, consultations].forEach(input => {
      const progress = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
      input.style.setProperty('--range-progress', `${progress}%`);
    });
    const doctorCount = Number(doctors.value);
    const dailyConsultations = Number(consultations.value);
    const monthlyConsultations = doctorCount * dailyConsultations * 22;
    const hours = (monthlyConsultations * 3) / 60;
    const revenue = monthlyConsultations * 0.2 * 0.45 * 200;

    const doctorsText = quantity(doctorCount, "médico", "médicos");
    calculator.querySelector("#roi-doctors-value").value = doctorsText;
    doctors.setAttribute("aria-valuetext", doctorsText);
    calculator.querySelector("#roi-consultations-value").value =
      `${numberFormat.format(dailyConsultations)} por médico`;
    calculator.querySelector('label[for="roi-consultations"]').textContent =
      dailyConsultations === 1 ? "Consulta por dia" : "Consultas por dia";
    consultations.setAttribute("aria-valuetext",
      `${quantity(dailyConsultations, "consulta", "consultas")} por dia, por médico`);
    calculator.querySelector("#roi-hours").value =
      `${hoursFormat.format(hours)} h`;
    calculator.querySelector("#roi-hours-description").textContent =
      Number(hours.toFixed(1)) === 1 ? "economizada por mês" : "economizadas por mês";
    calculator.querySelector("#roi-revenue").value =
      currencyFormat.format(revenue);
    calculator.querySelector("#roi-explanation").textContent =
      `${quantity(monthlyConsultations, "consulta", "consultas")}/mês × 3 min = ${hoursFormat.format(hours)} h. ` +
      `Receita: ${numberFormat.format(monthlyConsultations)} × 20% × 45% × R$ 200. ` +
      "Simulação ilustrativa, sem garantia de retorno; não desconta a mensalidade.";
  }

  calculator.addEventListener("input", update);
  calculator.addEventListener("submit", (event) => event.preventDefault());
  update();
})();
