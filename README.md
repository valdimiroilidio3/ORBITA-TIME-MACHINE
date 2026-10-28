# ORBITA Time Machine

Sistema de transformação digital visual para conversão de leads. A partir de uma lead real, a
ORBITA Time Machine captura o website atual, documenta oportunidades **com evidência**, gera uma
direção criativa específica para a empresa, produz um protótipo web navegável e permite comparar
antes/depois num link privado de apresentação comercial.

O princípio central: **antes de vender a criação de um website, o cliente vê aquilo que poderá receber.**

---

## 1. Estado do repositório e integração

O repositório original (`valdimiroilidio3/ORBITA-TIME-MACHINE`) continha apenas `README.md` e um
commit inicial — não existia base de código, rotas, autenticação, agentes ou fornecedores de IA para
reutilizar. Por isso, a Time Machine foi construída como **aplicação Next.js (App Router) + TypeScript
completa**, com fronteiras de módulo preparadas para o sistema ORBITA existente:

| Módulo pedido | Implementação neste repositório |
| --- | --- |
| `TimeMachineDashboard` | `src/app/(app)/page.tsx` + `src/components/Dashboard.tsx` |
| `LeadSnapshot` | `src/lib/analysis/*` + secção «A · Company Intelligence» (`src/components/AnalysisSections.tsx`) |
| `WebsiteAnalyzer` | `src/lib/capture.ts` + `src/lib/analysis/html.ts` |
| `CreativeBriefGenerator` | `src/lib/creative/brief.ts` + `src/lib/creative/archetypes.ts` + `src/lib/ai/enrich.ts` |
| `MasterPromptGenerator` | `briefToMasterPrompt()` + `src/components/PromptEditor.tsx` |
| `PrototypeGenerator` | `src/lib/creative/prototype.ts` + `src/lib/creative/art.ts` + `src/components/Comparison.tsx` (Protótipo) |
| `BeforeAfterSlider` | `src/components/Comparison.tsx` |
| `PrototypePreview` | rota `src/app/api/prototype/[id]/[page]/route.ts` (HTML isolado + CSP) |
| `OpportunityMap` | `buildOpportunities()` + `OpportunitySection` |
| `PrivateShowcase` | `src/app/showcase/[slug]/page.tsx` + `src/lib/showcase*.ts` |
| `GenerationJobManager` | `src/lib/jobs.ts` + `src/components/RunPanel.tsx` |

Se o sistema ORBITA já existir noutro repositório, os módulos `src/lib/**` são agnósticos de UI e
podem ser importados diretamente; a persistência está isolada em `src/lib/repo.ts` + `src/lib/db.ts`
para substituição por Prisma/Postgres sem tocar no domínio.

---

## 2. Arranque

```bash
npm install
cp .env.example .env          # define segredos e (opcional) AI_API_KEY
npm run db:seed -- --demo     # utilizadores + leads de demonstração + 1 projeto de exemplo
npm run dev                   # http://localhost:3000
```

Credenciais iniciais (definidas em `.env`):

- **admin** — `ORBITA_ADMIN_EMAIL` / `ORBITA_ADMIN_PASSWORD` (default `admin@orbita.pt`)
- **membro** — `ORBITA_MEMBER_EMAIL` / `ORBITA_MEMBER_PASSWORD` (default `equipa@orbita.pt`)

Requisitos: Node.js **>= 22.5** (usa `node:sqlite` nativo, sem compilação de módulos nativos).

Scripts:

| Comando | Efeito |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento em `0.0.0.0:3000` |
| `npm run build` / `npm start` | build e execução em produção |
| `npm test` | 63 testes (domínio, segurança, pipeline, componentes) |
| `npm run lint` / `npm run typecheck` | ESLint flat config e `tsc --noEmit` |
| `npm run db:seed -- --demo` | semente com leads e um projeto completo |
| `npm run capture:doctor` | diagnóstico do ambiente de captura |
| `npm run capture:install` | instala Chromium para o Playwright |

---

## 3. Fluxo funcional

1. **Selecionar lead** no dashboard (`+ Nova Time Machine`) → escolher lead existente ou criar uma.
   Com «Iniciar geração automaticamente» ligado, o pipeline arranca na criação.
2. **Pipeline real e observável** (`src/lib/jobs.ts`), sete etapas com estado persistido:
   `ingest → capture → analyze → brief → prompt → prototype → finalize`.
   Cada etapa pode ser repetida individualmente; «Retomar» corre apenas as etapas não concluídas.
3. **Captura** (`captureWebsite`): validação anti-SSRF, fetch endurecido do HTML, e captura real com
   Playwright (desktop 1440×900, mobile 390×844 e página completa). Cada screenshot fica guardada como
   artefacto com origem (`playwright` ou `upload`).
4. **Análise** (`analyzeHtml` + `buildOpportunities`): viewport, hierarquia H1/H2, CTAs, texto
   alternativo, famílias tipográficas, paleta, JSON-LD, Open Graph, densidade de conteúdo, HTTPS e
   disponibilidade. Cada oportunidade cita **evidência e página de origem**; hipóteses são marcadas.
5. **Direção criativa**: arquétipo escolhido pelo setor (8 arquétipos distintos), tokens de design,
   estrutura de páginas, copywriting, CTAs, acessibilidade, SEO, performance e critérios de aceitação.
   Com `AI_API_KEY`, o fornecedor remoto enriquece o briefing; sem chave, o motor local determinístico
   produz o mesmo conjunto de campos (nunca fica em falta).
6. **Prompt master** editável, descarregável em Markdown, com todas as secções exigidas.
7. **Protótipo navegável**: 3 páginas ligadas entre si (início, serviço, contacto), responsivo, animações
   respeitando `prefers-reduced-motion`, imagem gerada original, formulários desativados e identificação
   permanente de conceito demonstrativo.
8. **Comparação interativa** (`Comparison`): modos divisor, lado a lado, site atual e nova proposta;
   rato, toque e teclado; desktop/mobile; zoom da captura; estado alternativo quando não há captura.
9. **Link privado** (`/showcase/[slug]`): token não previsível trocado por cookie HttpOnly, expiração,
   revogação, rotação, estados rascunho/revisão/publicado, CTAs de orçamento, reunião e WhatsApp.

---

## 4. Base de dados

SQLite (ficheiro em `ORBITA_DATA_DIR`, por defeito `./data/orbita.sqlite`, excluído do Git).
Esquema em `src/lib/db.ts`:

| Tabela | Conteúdo |
| --- | --- |
| `users` | operadores (admin/member/viewer), scrypt + salt por utilizador |
| `sessions` | sessões assinadas com HMAC, hash do segredo, expiração |
| `leads` | empresa, setor, localização, website, contactos, serviços, notas |
| `time_machines` | estado, progresso, empresa, experiência atual, oportunidades, briefing, prompt master, protótipo, token de showcase (hash), estado comercial, custos/limites, `archived_at` |
| `jobs` | execuções com etapas, estado, duração, logs e erro por etapa |
| `artifacts` | screenshots/uploads com dimensões, bytes e origem |
| `usage_events` | contabilização para limites de utilização e custo |

Artefactos em `data/artifacts/<time_machine_id>/`.

---

## 5. API

| Método | Rota | Notas |
| --- | --- | --- |
| POST | `/api/auth/login` · `/api/auth/logout` | sessão HttpOnly/SameSite=Lax |
| GET/POST | `/api/leads` | pesquisa e criação de leads |
| PATCH | `/api/leads/[id]` | edição dos dados da empresa (nome, setor, website, contactos, serviços) |
| GET/POST | `/api/time-machines` | filtros e criação (`autoStart`) |
| GET/PATCH/DELETE | `/api/time-machines/[id]` | estado do job, prompt master, título, eliminação |
| POST | `/api/time-machines/[id]/run` | inicia/reinicia etapas (limites aplicados) |
| PATCH | `/api/time-machines/[id]/archive` | arquivar/restaurar |
| POST | `/api/time-machines/[id]/showcase` | `issue`, `rotate`, `revoke`, `status` |
| POST | `/api/time-machines/[id]/upload` | screenshots autorizados (PNG/JPEG/WebP ≤ 8 MB) |
| GET | `/api/artifacts/[id]` | imagens privadas (sessão ou cookie de showcase) |
| GET | `/api/prototype/[id]/[page]` | protótipo HTML com CSP restritiva |
| GET | `/api/showcase/[slug]/access?k=` | troca de token por cookie e redirecionamento limpo |

---

## 6. Segurança e fiabilidade

- **Anti-SSRF** (`src/lib/urls.ts`): apenas `http/https`, portas 80/443, sem credenciais na URL;
  bloqueio de `localhost`, sufixos internos, IPs privados/loopback/link-local/metadata (IPv4 e IPv6,
  incluindo `::ffff:`), resolução DNS verificada em todos os registos, redirecionamentos revalidados
  salto a salto (máx. 3), limite de tamanho/tempo, tipo de conteúdo exigido.
- **Browser isolado**: Playwright com `--no-sandbox` apenas quando necessário, contexto efémero,
  interceção de pedidos que aborta destinos bloqueados, `reducedMotion` forçado.
- **Protótipo**: servido em rota dedicada com `Content-Security-Policy: default-src 'none'` e iframe
  `sandbox="allow-scripts"` (sem `allow-same-origin`) — sem pedidos de rede a partir do protótipo.
- **Links privados**: token de 32 bytes (base64url), armazenado só em hash SHA-256, trocado por cookie
  HttpOnly assinado com HMAC e secret do servidor; rotação invalida cookies antigos; revogação imediata;
  expiração configurável. O slug inclui 6 bytes aleatórios — nunca é o único mecanismo de proteção.
- **Credenciais**: scrypt+salt, sessões assinadas, chaves de IA apenas no servidor (`src/lib/ai/provider.ts`).
- **Limites**: concorrência (`LIMIT_MAX_CONCURRENT_JOBS`), execuções por hora por utilizador, chamadas de
  IA e custo por projeto.
- **Recuperação**: falhas por etapa preservam todos os dados; `recoverStaleJobs()` marca execuções
  interrompidas por reinício; «Retomar» continua a partir do que falta.
- **Integridade**: não se inventam screenshots, prémios, avaliações ou factos. Sites inacessíveis geram
  mensagem explícita e o estado «sem captura do website atual».

---

## 7. Testes

`npm test` — 7 ficheiros, 63 testes:

| Ficheiro | Cobertura |
| --- | --- |
| `tests/urls.test.ts` | normalização, protocolos/portas/credenciais, IPv4/IPv6 privados, DNS, metadata |
| `tests/analysis.test.ts` | extração de HTML, evidência das oportunidades, ausência de invenção |
| `tests/creative.test.ts` | arquétipos distintos por setor, determinismo do briefing, prompt master completo, protótipo autónomo, escape XSS, arte determinística |
| `tests/showcase.test.ts` | emissão, tokens não previsíveis, hash vs token, rotação, revogação, expiração, rascunho |
| `tests/pipeline.test.ts` | fluxo completo com site inacessível, lead sem website, regeneração seletiva, falha e preservação, concorrência |
| `tests/auth.test.ts` | scrypt, sessões assinadas, logout, matriz de permissões |
| `tests/comparison.test.tsx` | etiquetas, slider acessível (teclado), modos, dispositivo, zoom/Esc, estado sem captura, iframe em sandbox |

---

## 8. Variáveis de ambiente

| Variável | Função |
| --- | --- |
| `ORBITA_SESSION_SECRET` | assinatura de sessões e cookies de showcase (**obrigatório em produção**) |
| `ORBITA_ADMIN_EMAIL` / `ORBITA_ADMIN_PASSWORD` | operador inicial |
| `ORBITA_MEMBER_EMAIL` / `ORBITA_MEMBER_PASSWORD` | membro de equipa |
| `ORBITA_DATA_DIR` | diretório de dados (SQLite + artefactos) |
| `AI_PROVIDER` | `auto` \| `openai` \| `anthropic` \| `local` |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_MAX_OUTPUT_TOKENS`, `AI_TIMEOUT_MS` | fornecedor de IA |
| `CAPTURE_ENABLED`, `CAPTURE_NAV_TIMEOUT_MS`, `CAPTURE_MAX_PAGES`, `CAPTURE_MAX_BYTES` | captura |
| `LIMIT_MAX_CONCURRENT_JOBS`, `LIMIT_RUNS_PER_HOUR`, `LIMIT_MAX_COST_CENTS_PER_TM`, `LIMIT_MAX_AI_CALLS_PER_TM` | limites |
| `SHOWCASE_LINK_TTL_DAYS`, `NEXT_PUBLIC_ORBITA_CONTACT_EMAIL`, `NEXT_PUBLIC_ORBITA_WHATSAPP` | apresentação comercial |

---

## 9. Limitações conhecidas

1. **Captura visual neste ambiente**: o download de binários do Chromium não é permitido na sandbox de
   desenvolvimento. A geração funciona na mesma (análise HTML real, oportunidades com evidência,
   protótipo e comparação no estado «sem captura»). Em produção basta
   `npx playwright install --with-deps chromium` (ou imagem Docker oficial do Playwright); verifica com
   `npm run capture:doctor`.
2. **Fornecedor de IA**: por omissão corre o motor local determinístico (briefing e copy próprios da
   empresa, sem chamadas externas). Com chave configurada, o briefing é enriquecido pelo fornecedor e a
   resposta é validada por schema; falhas degradam para o motor local e ficam registadas no job.
3. **Screenshots de terceiros**: não são usadas fotografias protegidas. As imagens do protótipo são
   composições SVG originais geradas pela ORBITA, assinaladas como demonstrativas.
4. **Eliminação/expiração de artefactos**: há eliminação em cascata ao apagar o projeto; uma política de
   retenção automática (ex.: 90 dias) deve ser configurada ao nível da infraestrutura.
5. **Um único processo**: o executor de jobs é in-process (adequado a um nó). Para várias réplicas,
   substituir `startGeneration` por uma fila externa mantendo a interface de `jobs`/steps.
6. **Token na query string**: o link inicial contém o token; é imediatamente trocado por cookie e o URL é
   limpo. Evitar colar o link em canais que registem URLs completos.
7. **Email/WhatsApp**: os CTAs usam `mailto:` e `wa.me` (nenhum envio automático é simulado).

---

## 10. Critérios de aceitação — mapa de verificação

| Critério | Onde |
| --- | --- |
| 1. Selecionar lead existente | Dashboard → `+ Nova Time Machine` |
| 2. Iniciar geração real | `POST /api/time-machines/[id]/run` + `RunPanel` |
| 3. Capturar website acessível | `captureWebsite` (Playwright) |
| 4. Guardar screenshots | `storeCapturedImages` + tabela `artifacts` |
| 5. Gerar e editar prompt master | etapa `prompt` + `PromptEditor` (PATCH) |
| 6. Protótipo navegável | `generatePrototype` + `/api/prototype/[id]/[page]` |
| 7. Comparar com slider | `Comparison` (4 modos, teclado/rato/toque) |
| 8. Opportunity Map | `OpportunitySection` / secção na apresentação |
| 9. Guardar e retomar projeto | estado em SQLite + «Retomar» |
| 10. Gerar link privado | `POST …/showcase {action:"issue"}` |
| 11. Abrir e apresentar proposta | `/showcase/[slug]` |
| 12. Revogar acesso | `{action:"revoke"}` (invalida cookies) |
| 13. Recuperar de erros sem perder dados | falha por etapa, `recoverStaleJobs`, retoma seletiva |
| 14. Desktop e mobile | layouts responsivos + vista mobile na comparação |

---

## 11. Estrutura

```
src/
  app/
    (app)/page.tsx              dashboard
    (app)/tm/[id]/page.tsx      workspace de análise e geração
    login/page.tsx              autenticação
    showcase/[slug]/page.tsx    apresentação privada
    api/…                       auth, leads, time-machines, artifacts, prototype, showcase
  components/                   Dashboard, Comparison, RunPanel, ShowcasePanel, PromptEditor, …
  lib/
    analysis/                   html.ts (parser), opportunities.ts (regras com evidência)
    creative/                   archetypes.ts, copy.ts, brief.ts, prototype.ts, art.ts
    ai/                         provider.ts (OpenAI/Anthropic compatível), enrich.ts
    capture.ts                  Playwright + análise de páginas secundárias
    jobs.ts                     GenerationJobManager
    urls.ts                     validação anti-SSRF e fetch endurecido
    showcase*.ts                tokens, cookies, estados
    db.ts / repo.ts             persistência
scripts/
  seed.ts                       semente da base
  capture-doctor.mjs            diagnóstico de captura
tests/                          63 testes
```
