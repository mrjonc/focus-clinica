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

  function update() {
    const doctorCount = Number(doctors.value);
    const dailyConsultations = Number(consultations.value);
    const monthlyConsultations = doctorCount * dailyConsultations * 22;
    const hours = (monthlyConsultations * 3) / 60;
    const revenue = monthlyConsultations * 0.2 * 0.45 * 200;

    calculator.querySelector("#roi-doctors-value").value = doctorCount;
    calculator.querySelector("#roi-consultations-value").value =
      `${dailyConsultations} / médico`;
    calculator.querySelector("#roi-hours").value =
      `${hoursFormat.format(hours)} h`;
    calculator.querySelector("#roi-revenue").value =
      currencyFormat.format(revenue);
    calculator.querySelector("#roi-explanation").textContent =
      `${numberFormat.format(monthlyConsultations)} consultas/mês × 3 min = ${hoursFormat.format(hours)} h. ` +
      `Receita: ${numberFormat.format(monthlyConsultations)} × 20% × 45% × R$ 200. ` +
      "Simulação ilustrativa, sem garantia de retorno; não desconta a mensalidade.";
  }

  calculator.addEventListener("input", update);
  calculator.addEventListener("submit", (event) => event.preventDefault());
  update();
})();
