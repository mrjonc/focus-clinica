# Focus Clínica — Landing Page

> **Slogan:** _Tecnologia que organiza. Cuidado que aproxima._

A landing page do **Focus Clínica** foi desenvolvida para apresentar um software de gestão médica de alta performance. A plataforma conecta agenda, prontuário eletrônico por especialidades e gestão financeira para otimizar o tempo das equipes de saúde e humanizar o atendimento aos pacientes.

🔗 **Demonstração da Landing Page:** [focus-clinica.vercel.app](https://focus-clinica.vercel.app/)

🔗 **Protótipo no Figma:** [Design do Focus Clínica no Figma](https://www.figma.com/design/ctNGaNMeS665UBKFjH1aiX/Focus-Clinica---LP?node-id=53-7&t=c8QtKKv6jcIK2l8V-1)

## Equipe

| Integrante | Atuação |
| --- | --- |
| [Claudia Ferreira de Mello](https://www.linkedin.com/in/claudia-ferreira-de-mello) | Design |
| [Neto Mendes](https://github.com/netoMendes21) | Dev Frontend |
| [Jonathan Lima](https://github.com/mrjonc) | Dev Frontend |
| [Danielle Braga](https://github.com/daniebraga) | Dev Frontend |

---

## Sumário

- [Visão Geral e Diferenciais](#visão-geral-e-diferenciais)
- [Funcionalidades e Módulos](#funcionalidades-e-módulos)
- [Calculadora ROI (Simulação em Tempo Real)](#calculadora-roi-simulação-em-tempo-real)
- [Arquitetura de JavaScript & Efeitos Visuais](#arquitetura-de-javascript--efeitos-visuais)
- [Design System & UI Architecture](#design-system--ui-architecture)
- [Responsividade e Acessibilidade](#responsividade-e-acessibilidade)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Executar o Projeto Localmente](#como-executar-o-projeto-localmente)
- [Desenvolvimento e Autoria](#desenvolvimento-e-autoria)
- [Segurança e LGPD](#segurança-e-lgpd)

---

## Visão Geral e Diferenciais

O projeto foi construído do zero com foco em **alta performance visual, carregamento ultrarrápido e semântica web refinada**.

- **Métricas de Impacto Exibidas:**
  - **+150k** consultas agendadas.
  - **99,8%** de taxa de satisfação dos pacientes.
  - **45%** de redução na taxa de ausências via lembretes automáticos no WhatsApp.
  - **+28%** de taxa de ocupação da agenda e **32 horas poupadas por mês**.
- **Comparativo de Valor:** Exibição clara do contraste entre a gestão tradicional (planilhas e confirmações manuais) e a automação do Focus Clínica.
- **Formulário de Captação / Trial (14 Dias):** Validações nativas para solicitação de demonstrações e período de teste gratuito sem necessidade de cartão de crédito.

---

## Funcionalidades e Módulos

1. **Agenda Inteligente & Calendário:** Visualizações por dia, semana e profissional; bloqueios, retornos e status em tempo real.
2. **Lembretes via WhatsApp:** Confirmações automáticas para redução de faltas.
3. **Prontuário Eletrônico & Evolução Clínica:** Histórico centralizado por área de atuação e acompanhamento contínuo do paciente.
4. **Módulo de Especialidades:** Configuração e gestão de áreas médicas (Pediatria, Clínica Geral, Cardiologia, Dermatologia, Psicologia, Nutrição).
5. **Gestão Financeira:** Relatórios de receitas, repasses médicos e indicadores de desempenho.

---

## Calculadora ROI (Simulação em Tempo Real)

A landing page inclui uma **Calculadora de Retorno sobre Investimento (ROI)** desenvolvida em JavaScript Vanilla (`roi-calculator.js`). Ela permite aos gestores simularem os ganhos mensais e o tempo economizado com a automação da clínica.

### Fórmulas Aplicadas

- **Consultas Mensais:**

  $$\text{Consultas Totais} = \text{Médicos} \times \text{Consultas/Dia} \times 22 \text{ (dias úteis)}$$

- **Horas Economizadas:**

  $$\text{Horas Poupadas} = \frac{\text{Consultas Totais} \times 3 \text{ min}}{60}$$

### Recursos do Script

- **Internacionalização de Números (`Intl.NumberFormat`):** Formatação nativa em `pt-BR` para horas, numerais simples e moeda corrente (BRL sem decimais).
- **Preenchimento Dinâmico de Slider (`--range-progress`):** Atualização via CSS Custom Property para preenchimento gradual da barra de ajuste conforme a interação.
- **Leitura Acessível (A11y):** Atualização contínua de atributos `aria-valuetext` para leitores de tela durante o ajuste dos _sliders_.

---

## Arquitetura de JavaScript & Efeitos Visuais

A lógica client-side é estruturada em módulos focados em performance e acessibilidade:

1. **`roi-calculator.js` (Simulador de Impacto Financeiro):**
   - Reatividade nativa acionada pelo evento `input` sem dependência de bibliotecas externas.
   - Ajuste contextual de plurais/singulares e sufixos orientados por breakpoints (ajuste dinâmico para telas maiores/menores via `matchMedia`).

2. **`navigation.js` (Navegação & Scroll Spy):**
   - **Reset Inteligente:** Limpa o hash da URL e reseta o scroll no recarregamento usando `history.scrollRestoration = "manual"`.
   - **Scroll Spy via RAF:** Atualiza o atributo `aria-current="location"` no link ativo utilizando `requestAnimationFrame` para evitar o retrabalho de renderização do navegador (_layout thrashing_).
   - **Controle de Interação:** Prioriza a seleção por clique por 1,2s, liberando o acompanhamento dinâmico assim que o usuário faz _scroll_, `wheel` ou `touchstart`.
   - **Menu Mobile Acessível:** Gerenciamento de `aria-expanded`, suporte à tecla `Escape` (com retorno de foco para o botão de alternância) e fechamento ao clicar fora ou perder o foco (`focusout`).

3. **`page-effects.js` (Animações & Efeitos de Scroll):**
   - **Ajuste Dinâmico de Dimensões:** Utiliza `ResizeObserver` para sincronizar variáveis CSS (`--header-height` e `--preview-height`) em tempo real.
   - **Revelação Granular por Âncoras:** Emprega `IntersectionObserver` com elementos `span.reveal-anchor` injetados dinamicamente para animar cards e textos individualmente com escalonamento de atraso (`--reveal-delay`).
   - **Contadores de Desempenho:** Contagem progressiva interpolada via matemática de suavização (_cubic easing_) configurada através de data-attributes (`data-count`, `data-prefix`, `data-suffix`).
   - **Carrosséis Touch Nativo (Mobile):** Controles dinâmicos de carrossel com suporte a navegação por setas de teclado, drag/swipe e sincronização com leitores de tela.

---

## Design System & UI Architecture

A estilização é regida por variáveis CSS nativas (`:root`), permitindo manutenção simplificada, suporte nativo a temas e consistência tipográfica:

- **Paleta de Cores (Tema Claro & Dark Mode ready):**
  - **Primary (Verde Clínico):** `#1b6b51` (Dark: `#8bd6b6`)
  - **Secondary:** `#4c6359` / **Tertiary:** `#3e6374`
  - **Superfícies Glassmorphism:** Transparências com `backdrop-filter: blur()`.
- **Tipografia:**
  - **Títulos & Headings:** `Plus Jakarta Sans`
  - **Interface & Dashboard Preview:** `Outfit`
  - **Texto de Corpo:** `Inter`
- **Iconografia:** Sprite SVG otimizado (`assets/icons/sprite.svg`) para reduzir requisições HTTP e garantir renderização vetorial cristalina.

---

## Responsividade e Acessibilidade

O projeto adota uma abordagem **Mobile-First** detalhada no `responsive.css`:

- **Breakpoints Estratégicos:**
  - **Mobile (`<= 600px` / `37.5rem`):** Ajuste de menus em grade/dropdown, tabelas com scroll horizontal inteligente, elementos estacados e carrossel touch com _scroll-snap_ para métricas.
  - **Tablet (`600px` a `992px`):** Layouts balanceados em 2 colunas para cards de comparação, métricas e formulários.
  - **Desktop (`>= 992px`):** Experiência ampla com grid de até 12 colunas, navegação fluida e painel fixo.
- **Acessibilidade & Animações:**
  - Suporte completo a **`prefers-reduced-motion: reduce`**, desativando transições suaves para usuários com sensibilidade ao movimento.
  - Atributos `aria-expanded`, `aria-controls`, `aria-label` e estados `polite` em áreas dinâmicas.
  - Navegação por teclado otimizada com indicação clara de `:focus-visible`.

---

## Tecnologias Utilizadas

- **HTML5 Semântico:** Estruturação orientada a SEO, boas práticas e leitores de tela.
- **CSS3 (Vanilla):** CSS Grid, Flexbox, Variáveis CSS, Glassmorphism e Container Queries (`@container`).
- **JavaScript (ES6+):** Scripts modulares para calculadoras, manipulação de DOM, menu responsivo e efeitos de revelação ao rolar (`IntersectionObserver`).
- **SVG Sprites & WebP:** Formatos de imagem leves de alta performance.

---

## Estrutura do Projeto

```text
focus-clinica/
├── assets/
│   ├── icons/
│   │   ├── circle-check.svg
│   │   ├── privacy-shield.svg
│   │   ├── sprite.svg          # Sprite único com todos os ícones da aplicação
│   │   └── field-*.svg         # Ícones para inputs de formulário
│   └── img/                    # Logos e ilustrações em .webp, .png e .svg
├── src/
│   ├── css/
│   │   ├── style.css           # Variáveis Globais, Design System e Componentes
│   │   └── responsive.css      # Regras de responsividade, media queries e A11y
│   └── js/
│       ├── navigation.js       # Controle de navegabilidade e menu mobile
│       ├── page-effects.js     # Animações de scroll, contadores e revelação
│       └── roi-calculator.js   # Regras da Calculadora ROI
├── index.html                  # Arquivo principal HTML5
└── README.md                   # Documentação do projeto
```

---

## Como Executar o Projeto Localmente

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/mrjonc/focus-clinica.git
   ```

2. **Navegue até a pasta do projeto:**

   ```bash
   cd focus-clinica
   ```

3. **Abra no navegador:**

   Como é uma aplicação frontend nativa (sem dependências de compilação), basta abrir o arquivo `index.html` em qualquer navegador moderno. Recomenda-se o uso da extensão Live Server no VS Code para simulação de servidor local.

---

## Segurança e LGPD

- **Privacidade por Design:** Os formulários de captação contam com caixas de seleção explícitas e aviso de conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
- **Dados Fictícios na Prévia:** Todas as telas de simulação e indicadores na landing page utilizam dados ilustrativos.
