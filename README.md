# Focus Clínica — landing page

Landing page institucional para apresentar o Focus Clínica a clínicas, gestores
e profissionais da saúde. Mostra funcionalidades, benefícios, prévias do produto
e acesso à plataforma oficial.

## Links

- Plataforma oficial: <https://focus-clinica.netlify.app/>.
- Repositório: <https://github.com/mrjonc/focus-clinica>.
- Especificação fornecida: [documentação no Notion](https://app.notion.com/p/DOCUMENTA-O-DO-PROJETO-FRONT-END-3feeed34bfcc8000b011c7579a7b824e).
- API: [perfis públicos do GitHub](https://docs.github.com/en/rest/users/users#get-a-user).

O endereço da plataforma não é o endereço desta landing page. A URL e a data de
publicação da landing page ainda devem ser registradas após seu próprio deploy.
A página do Notion não estava acessível à conexão durante a implementação;
seus links internos, wireframes e aprovações não foram verificados.

## Executar localmente

Projeto estático em HTML, CSS e JavaScript, sem etapa de build nem dependências
de produção. Na pasta do projeto, execute:

```sh
python -m http.server 8000
```

Abra <http://localhost:8000>. Um servidor HTTP local, como Live Server, também
pode ser usado. As fotos locais devem ser verificadas por HTTP, não por `file://`.

## Estrutura

```text
index.html
assets/
  icons/                 Ícones SVG e sprite
  img/                   Imagens do projeto
src/
  css/
    style.css            Identidade visual e componentes
    responsive.css       Regras por tamanho de tela e movimento reduzido
  js/
    navigation.js        Menu, navegação e seção ativa
    page-effects.js      Animações, contadores e carrosséis
    roi-calculator.js    Calculadora ilustrativa
    landing-interactions.js  Navegação das funcionalidades
    trial-form.js        Validação do formulário e acesso à plataforma
    team-members.js      Configuração da equipe
    github-profiles.js   Consulta, normalização e cache da API
    team.js              Apresentação dos integrantes
tests/
  github-profiles.test.cjs
netlify.toml
```

`src/css`, `src/js` e `assets/img` correspondem às pastas de estilos, scripts e
imagens do planejamento. Não há uma pasta `pages` porque a navegação atual usa
seções na mesma página; crie-a quando houver páginas adicionais reais.

## Funcionalidades

- Menu responsivo com fechamento por Escape e indicação da seção ativa.
- Rolagem suave, respeitando `prefers-reduced-motion`.
- Funcionalidades selecionáveis por clique e teclado: setas, Home e End.
  As prévias são criadas somente quando selecionadas pela primeira vez.
  Os controles dos carrosséis atualizam apenas ao mudar o card ativo, com leituras
  agrupadas por quadro de animação.
- Botão de demonstração direcionando à seção de especialidades.
- Botão de teste grátis do hero direcionando ao formulário.
- Acesso pelo formulário após validação dos campos e do aceite dos termos.
- Calculadora de ROI e prévias com dados ilustrativos, identificados como tais.
- Carrosséis manuais e equipe alimentada pela API do GitHub.

O formulário mantém seus campos e sua apresentação original. O botão “Começar
meus 14 dias grátis” valida nome, e-mail, clínica, WhatsApp com DDD e aceite dos
termos antes de navegar para a plataforma oficial. Valores vazios ou somente
com espaços são rejeitados. O WhatsApp aceita números brasileiros de dez ou
onze dígitos com DDD e o prefixo opcional +55. Erros aparecem junto aos campos.
O mesmo fluxo funciona com clique ou Enter; sem JavaScript, o envio fica
desabilitado. Os dados não são enviados na URL nem armazenados. A landing page
não processa cadastro nem ativa testes; isso depende da plataforma.

## Integração com API

**API escolhida:** API REST pública do GitHub.

**Endpoint:** `GET https://api.github.com/users/{username}`.

**Finalidade:** nome, foto e link do GitHub nos cards da equipe. Cargo, LinkedIn
e habilidades são configurados localmente. A bio pública não substitui as stacks.

Edite `src/js/team-members.js` para adicionar, remover ou reordenar integrantes:

```js
{
  username: "seu-username",
  role: "Desenvolvedor web",
  linkedin: "https://www.linkedin.com/in/seu-perfil/",
  name: "Nome usado se não houver dados disponíveis",
  skills: ["JavaScript", "CSS", "HTML"]
}
```

Nome e foto da API têm prioridade. Dados locais completam ausências ou
falhas. Nome ausente na resposta válida usa o login, conforme a normalização
do serviço. Integrantes sem GitHub, como Claudia, usam dados locais; `photo`
aceita uma imagem em `assets/img`, e `photoPosition` ajusta o recorte com CSS.
As habilidades são exibidas como `JavaScript | CSS | HTML`, a partir de `skills`.

O serviço mantém em cache apenas nome, foto e link do perfil. Usa `fetch()`,
requisições paralelas e compartilhamento de consultas
simultâneas para o mesmo username. O cache dura uma hora e preserva perfis de
até sete dias como fallback em falhas. Há timeout de dez segundos, pausa após
erros e tratamento de 403, 404, 429, JSON inválido e falhas de conexão. Nenhum
token é incluído no frontend. As fotos do GitHub são solicitadas em 144 px.

## Imagens reais e prévias

As telas de agenda e especialidades montadas em HTML/CSS continuam explicitamente
ilustrativas. Capturas reais das telas internas dependem de imagens aprovadas
pela equipe ou de acesso autorizado a um ambiente de demonstração.

## Testes

Os testes do serviço usam apenas o Node.js:

```sh
node --test tests/github-profiles.test.cjs
```

Em 02/11/2026, os 13 testes passaram. Também foram verificados em Chromium os
fluxos de abas, teclado, demonstração e acesso em 1440, 768, 390 e
320 px, sem overflow da página, links `#`, âncoras quebradas ou IDs duplicados.
Os testes de interface usaram respostas controladas da API; os três perfis
também responderam com sucesso na consulta real realizada na avaliação inicial.

Cobrem normalização, URLs, deduplicação, cache, revalidação, armazenamento
indisponível, timeout e respostas de erro. Para a interface, verificar:

- Menu, âncoras, CTA e demonstração.
- Cada funcionalidade por clique e teclado, incluindo retorno à agenda.
- Calculadora, carrosséis, links da equipe e uma falha individual da API.
- Desktop, tablet, mobile e telas estreitas; movimento reduzido.
- Imagens, ausência de erros no console e ausência de overflow da página.

Não há uma certificação de acessibilidade nem medição de desempenho em produção
registradas. A existência de atributos ARIA não substitui uma auditoria completa.

## Publicação e colaboração

`netlify.toml` publica a raiz deste projeto estático, sem comando de build.
Crie um site Netlify próprio para a landing page e configure sua branch de
publicação. Não substitua o deploy da plataforma oficial por estes arquivos.

Fluxo previsto: branch por tarefa → commits claros → push → pull request →
revisão/aprovação → merge → deploy. O histórico contém PRs e merges, mas esta
documentação não afirma que houve aprovação formal de cada alteração.

O quadro de tarefas, o canal de comunicação, o link do Figma e a aprovação do
protótipo ainda precisam ser informados pela equipe. Não foram inventados links
ou datas para essas etapas.

## Pendências de informação

- URLs oficiais de Instagram, LinkedIn institucional, WhatsApp e central de ajuda.
- Políticas de privacidade, termos de uso e páginas de segurança aprovadas.
- Confirmação do e-mail institucional que já constava no rodapé.
- Figma, quadro de tarefas, canal de comunicação e registros de aprovação.
- Capturas autorizadas das telas internas da plataforma.
- URL e data do deploy próprio da landing page.

Itens do rodapé sem URL oficial foram preservados como texto desabilitado, em
vez de links para `#`. Os links pessoais da equipe permanecem ativos.
O histórico de alterações pode ser consultado com `git log --oneline`.
