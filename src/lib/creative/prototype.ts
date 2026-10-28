import type { CompanyIntelligence, CreativeBrief, Lead, Prototype, PrototypePage } from "../types";
import { ARCHETYPES } from "./archetypes";
import { artworkSet } from "./art";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function baseCss(brief: CreativeBrief): string {
  const { palette: p, typography: t } = brief.tokens;
  return `:root{
  --bg:${p.background};--surface:${p.surface};--ink:${p.ink};--muted:${p.muted};
  --accent:${p.accent};--accent-ink:${p.accentInk};--secondary:${p.secondary};
  --line:color-mix(in srgb, ${p.ink} 14%, transparent);
  --display:${t.display};--body:${t.body};
  --max:1240px;--gutter:clamp(20px,5vw,72px);--radius:2px;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
h1,h2,h3{font-family:var(--display);font-weight:500;letter-spacing:-0.025em;line-height:1.03;margin:0 0 16px}
h1{font-size:clamp(38px,7vw,86px);letter-spacing:-0.04em}
h2{font-size:clamp(28px,4vw,46px)}
h3{font-size:clamp(20px,2vw,24px);letter-spacing:-0.01em}
p{margin:0 0 18px;color:var(--muted);max-width:68ch}
.shell{width:100%;max-width:var(--max);margin:0 auto;padding:0 var(--gutter)}
.eyebrow{font-family:var(--display);font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin:0 0 18px}
.skip{position:absolute;left:-9999px;top:0;background:var(--accent);color:var(--accent-ink);padding:12px 18px;z-index:100}
.skip:focus{left:12px;top:12px}
header.site{position:sticky;top:0;z-index:50;backdrop-filter:saturate(140%) blur(14px);background:color-mix(in srgb,var(--bg) 82%,transparent);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:76px}
.brand{font-family:var(--display);font-weight:600;letter-spacing:-0.02em;font-size:19px}
.brand span{color:var(--accent)}
.nav-links{display:flex;gap:26px;align-items:center}
.nav-links a{font-size:14px;color:var(--muted);transition:color .18s ease}
.nav-links a:hover,.nav-links a:focus-visible{color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 22px;border-radius:var(--radius);border:1px solid transparent;font-size:14px;font-weight:600;letter-spacing:.01em;cursor:pointer;transition:transform .16s cubic-bezier(.22,1,.36,1),background .16s ease,color .16s ease}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--accent);color:var(--accent-ink)}
.btn-primary:hover{filter:brightness(1.06)}
.btn-ghost{border-color:var(--line);color:var(--ink);background:transparent}
.btn-ghost:hover{border-color:var(--ink)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.nav-toggle{display:none;background:none;border:1px solid var(--line);color:var(--ink);width:44px;height:44px;border-radius:var(--radius);align-items:center;justify-content:center;cursor:pointer}
.hero{padding:clamp(56px,9vw,120px) 0 clamp(40px,6vw,80px)}
.hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(28px,5vw,64px);align-items:center}
.hero h1{max-width:15ch}
.hero .lead{font-size:clamp(17px,1.4vw,20px);color:var(--muted);max-width:46ch;margin-bottom:32px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap}
.hero-art{position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:var(--radius);background:var(--surface)}
.hero-art img{width:100%;height:100%;object-fit:cover;transform:scale(1.02)}
.art-credit{position:absolute;bottom:10px;right:12px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:color-mix(in srgb,var(--bg) 72%,transparent);padding:4px 8px}
.marquee{border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;padding:16px 0;margin:0 0 clamp(48px,7vw,88px)}
.marquee-track{display:flex;gap:48px;white-space:nowrap;font-family:var(--display);font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);animation:slide 34s linear infinite}
.marquee-track span::after{content:"◦";margin-left:48px;color:var(--accent)}
@keyframes slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
section.band{padding:clamp(48px,7vw,96px) 0;border-top:1px solid var(--line)}
.two-col{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(24px,5vw,72px);align-items:start}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
.card{background:var(--surface);padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;gap:10px}
.card .num{font-family:var(--display);font-size:12px;letter-spacing:.18em;color:var(--accent)}
.card p{margin:0;font-size:15px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,4vw,64px);align-items:center}
.figure{overflow:hidden;border:1px solid var(--line);background:var(--surface)}
.figure img{width:100%;height:100%;object-fit:cover}
.cta-band{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.cta-band h2{max-width:20ch}
.list-clean{list-style:none;margin:0;padding:0;display:grid;gap:0}
.list-clean li{display:grid;grid-template-columns:auto 1fr;gap:18px;padding:22px 0;border-bottom:1px solid var(--line);align-items:baseline}
.list-clean .idx{font-family:var(--display);font-size:12px;letter-spacing:.16em;color:var(--accent)}
.list-clean h3{margin:0 0 6px}
.list-clean p{margin:0;font-size:15px}
form.demo{display:grid;gap:16px;max-width:520px}
label{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px}
input,textarea{width:100%;min-height:48px;padding:12px 14px;background:var(--surface);border:1px solid var(--line);color:var(--ink);font:inherit;font-size:15px;border-radius:var(--radius)}
input:disabled,textarea:disabled{opacity:.65;cursor:not-allowed}
.note{font-size:13px;color:var(--muted);border-left:2px solid var(--accent);padding-left:12px;margin-top:8px}
.notice{position:fixed;left:50%;bottom:24px;transform:translate(-50%,120%);background:var(--ink);color:var(--bg);padding:12px 20px;font-size:14px;border-radius:var(--radius);transition:transform .28s cubic-bezier(.22,1,.36,1);z-index:80;max-width:calc(100% - 32px);text-align:center}
.notice.show{transform:translate(-50%,0)}
footer.site{border-top:1px solid var(--line);padding:48px 0 64px;margin-top:0}
.foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px}
.foot-grid p{font-size:14px}
.foot-meta{margin-top:36px;padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted);letter-spacing:.04em}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.reveal.in{opacity:1;transform:none}
.demo-badge{display:block;width:100%;text-align:center;background:var(--accent);color:var(--accent-ink);font-family:var(--display);font-size:10px;letter-spacing:.18em;text-transform:uppercase;padding:6px 14px;position:relative;z-index:60}
@media (max-width:940px){
  .hero-grid,.two-col,.split,.foot-grid{grid-template-columns:1fr}
  .hero{padding-top:44px}
  .nav-toggle{display:inline-flex}
  .nav-links{position:absolute;top:76px;left:0;right:0;flex-direction:column;align-items:flex-start;gap:0;background:var(--bg);border-bottom:1px solid var(--line);padding:8px var(--gutter) 20px;display:none}
  .nav-links.open{display:flex}
  .nav-links a{padding:14px 0;width:100%;font-size:16px;border-bottom:1px solid var(--line)}
  .nav-links .btn{margin-top:14px;width:100%;justify-content:center}
  .hero-art{aspect-ratio:16/11}
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}
  .reveal{opacity:1;transform:none}
}`;
}

function shell(options: {
  brief: CreativeBrief;
  lead: Lead;
  title: string;
  description: string;
  css: string;
  body: string;
  pages: { slug: string; title: string }[];
  active: string;
  serviceLabel: string;
}): string {
  const { brief, lead, title, description, css, body, pages, active, serviceLabel } = options;
  const navItems = pages
    .map(
      (page) =>
        `<a href="./${page.slug}"${page.slug === active ? ' aria-current="page"' : ""}>${escapeHtml(page.title)}</a>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(lead.company_name)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="noindex,nofollow">
<meta property="og:title" content="${escapeHtml(title)} — ${escapeHtml(lead.company_name)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta name="theme-color" content="${brief.tokens.palette.background}">
<style>${css}</style>
</head>
<body>
<a class="skip" href="#main">Saltar para o conteúdo</a>
<div class="demo-badge">Protótipo demonstrativo ORBITA</div>
<header class="site">
  <div class="shell nav">
    <a class="brand" href="./index">${escapeHtml(lead.company_name)}<span>.</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu">
      <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" fill="currentColor"><rect width="18" height="1.6" y="0"/><rect width="18" height="1.6" y="5.2"/><rect width="18" height="1.6" y="10.4"/></svg>
    </button>
    <nav class="nav-links" id="menu" aria-label="Navegação principal">
      ${navItems}
      <a class="btn btn-primary" href="./contacto" data-demo="O pedido de contacto nesta demonstração não é enviado.">${escapeHtml(brief.ctas[0].label)}</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site">
  <div class="shell">
    <div class="foot-grid">
      <div>
        <p class="eyebrow">${escapeHtml(lead.sector)}${lead.location ? ` · ${escapeHtml(lead.location)}` : ""}</p>
        <p style="font-family:var(--display);font-size:22px;color:var(--ink);max-width:24ch">${escapeHtml(brief.copyBlocks[0]?.heading ?? lead.company_name)}</p>
      </div>
      <div>
        <p class="eyebrow">Navegar</p>
        ${pages.map((p) => `<p><a href="./${p.slug}">${escapeHtml(p.title)}</a></p>`).join("")}
      </div>
      <div>
        <p class="eyebrow">Contactos</p>
        ${lead.contact_phone ? `<p>${escapeHtml(lead.contact_phone)}</p>` : ""}
        ${lead.contact_email ? `<p>${escapeHtml(lead.contact_email)}</p>` : ""}
        ${!lead.contact_phone && !lead.contact_email ? `<p>Contactos a confirmar com o cliente.</p>` : ""}
        <p><a class="btn btn-ghost" href="./contacto">${escapeHtml(brief.ctas[1].label)}</a></p>
      </div>
    </div>
    <div class="foot-meta">
      <span>Conceito demonstrativo criado pela ORBITA · não é o website oficial de ${escapeHtml(lead.company_name)}</span>
      <span>${escapeHtml(serviceLabel)} · imagens geradas (demonstração)</span>
    </div>
  </div>
</footer>
<div class="notice" role="status" aria-live="polite" id="notice"></div>
<script>
(function(){
  var toggle=document.querySelector('.nav-toggle');
  var menu=document.getElementById('menu');
  if(toggle&&menu){toggle.addEventListener('click',function(){
    var open=menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded',open?'true':'false');
  });}
  var notice=document.getElementById('notice');
  var timer;
  function say(msg){if(!notice)return;notice.textContent=msg;notice.classList.add('show');
    clearTimeout(timer);timer=setTimeout(function(){notice.classList.remove('show');},4200);}
  document.addEventListener('click',function(event){
    var el=event.target.closest('[data-demo]');
    if(el){event.preventDefault();say(el.getAttribute('data-demo')||'Ação demonstrativa.');}
  });
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items=[].slice.call(document.querySelectorAll('.reveal'));
  if(reduce||!('IntersectionObserver' in window)){items.forEach(function(i){i.classList.add('in');});return;}
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target);}
    });
  },{rootMargin:'0px 0px -12% 0px',threshold:0.08});
  items.forEach(function(item,index){item.style.transitionDelay=(index%4)*60+'ms';io.observe(item);});
})();
</script>
</body>
</html>`;
}

export function generatePrototype(
  lead: Lead,
  company: CompanyIntelligence,
  brief: CreativeBrief,
  options: { version: number; engine: "remote" | "local" },
): Prototype {
  const archetype = ARCHETYPES[brief.archetype as keyof typeof ARCHETYPES] ?? ARCHETYPES.professional;
  const art = artworkSet(archetype, brief.tokens, lead.company_name);
  const css = baseCss(brief);
  const serviceSlug = slugify(archetype.serviceLabel) || "servicos";
  const pagesMeta = [
    { slug: "index", title: "Início" },
    { slug: serviceSlug, title: archetype.serviceLabel },
    { slug: "contacto", title: "Contacto" },
  ];
  const services = company.services.length > 0 ? company.services : archetype.sections.slice(1, 4).map((s) => s.title);
  const hero = brief.copyBlocks[0];
  const place = lead.location ? ` em ${lead.location}` : "";

  /* ── Página inicial ── */
  const indexBody = `
<section class="hero">
  <div class="shell hero-grid">
    <div>
      <p class="eyebrow">${escapeHtml(archetype.label)}${lead.location ? ` · ${escapeHtml(lead.location)}` : ""}</p>
      <h1 class="reveal">${escapeHtml(hero.heading)}</h1>
      <p class="lead reveal">${escapeHtml(hero.body)}</p>
      <div class="hero-actions reveal">
        <a class="btn btn-primary" href="./contacto" data-demo="Nesta demonstração, a ação abre a página de contacto.">${escapeHtml(brief.ctas[0].label)}</a>
        <a class="btn btn-ghost" href="./${serviceSlug}">${escapeHtml(brief.ctas[1].label)}</a>
      </div>
    </div>
    <div class="hero-art reveal">
      <img src="${art.hero}" alt="Composição gráfica abstrata representativa de ${escapeHtml(lead.company_name)}" loading="eager" width="1400" height="950">
      <span class="art-credit">Imagem demonstrativa</span>
    </div>
  </div>
</section>
<div class="marquee" aria-hidden="true">
  <div class="marquee-track">
    ${[...services, archetype.label, lead.location ?? "Portugal", archetype.serviceLabel].map((s) => `<span>${escapeHtml(s)}</span>`).join("")}
    ${[...services, archetype.label, lead.location ?? "Portugal", archetype.serviceLabel].map((s) => `<span>${escapeHtml(s)}</span>`).join("")}
  </div>
</div>
<section class="band" aria-labelledby="sec-a">
  <div class="shell two-col">
    <div>
      <p class="eyebrow">Posicionamento</p>
      <h2 id="sec-a" class="reveal">${escapeHtml(brief.copyBlocks[1]?.heading ?? brief.positioning)}</h2>
    </div>
    <div class="reveal">
      <p>${escapeHtml(brief.copyBlocks[1]?.body ?? brief.positioning)}</p>
      <p>${escapeHtml(brief.narrative)}</p>
      <a class="btn btn-ghost" href="./${serviceSlug}">${escapeHtml(brief.ctas[1].label)}</a>
    </div>
  </div>
</section>
<section class="band" aria-labelledby="sec-b">
  <div class="shell">
    <p class="eyebrow">${escapeHtml(archetype.serviceLabel)}</p>
    <h2 id="sec-b" class="reveal">O que ${escapeHtml(lead.company_name)} faz</h2>
    <div class="card-grid" style="margin-top:32px">
      ${services
        .slice(0, 4)
        .map(
          (service, index) => `<article class="card reveal">
        <span class="num">0${index + 1}</span>
        <h3>${escapeHtml(service)}</h3>
        <p>${escapeHtml(brief.sections[(index + 1) % brief.sections.length]?.copy ?? brief.positioning)}</p>
      </article>`,
        )
        .join("")}
    </div>
  </div>
</section>
<section class="band" aria-labelledby="sec-c">
  <div class="shell split">
    <div class="figure reveal"><img src="${art.panel}" alt="Composição gráfica de apoio" width="900" height="700" loading="lazy"></div>
    <div class="reveal">
      <p class="eyebrow">${escapeHtml(brief.conceptName)}</p>
      <h2 id="sec-c">${escapeHtml(brief.sections[1]?.title ?? "Abordagem")}</h2>
      <p>${escapeHtml(brief.sections[1]?.copy ?? brief.narrative)}</p>
      <ul class="list-clean">
        ${brief.sections
          .slice(2, 5)
          .map(
            (section, index) =>
              `<li><span class="idx">0${index + 1}</span><div><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.purpose)}</p></div></li>`,
          )
          .join("")}
      </ul>
    </div>
  </div>
</section>
<section class="band cta-band">
  <div class="shell two-col">
    <div>
      <p class="eyebrow">Próximo passo</p>
      <h2 class="reveal">${escapeHtml(brief.ctas[0].label)}${place ? ` — ${escapeHtml(lead.location ?? "")}` : ""}</h2>
    </div>
    <div class="reveal">
      <p>${escapeHtml(brief.businessGoal)}</p>
      <div class="hero-actions" style="margin-top:24px">
        <a class="btn btn-primary" href="./contacto">${escapeHtml(brief.ctas[0].label)}</a>
        <a class="btn btn-ghost" href="./${serviceSlug}">${escapeHtml(archetype.serviceLabel)}</a>
      </div>
      <p class="note">Demonstração: nenhuma ação comercial real é executada nesta pré-visualização.</p>
    </div>
  </div>
</section>`;

  /* ── Página de serviços/menu ── */
  const serviceBody = `
<section class="hero" style="padding-bottom:24px">
  <div class="shell">
    <p class="eyebrow">${escapeHtml(archetype.serviceLabel)}</p>
    <h1 class="reveal">${escapeHtml(services[0] ?? archetype.serviceLabel)} e mais</h1>
    <p class="lead reveal">${escapeHtml(brief.sections[0]?.copy ?? brief.narrative)}</p>
  </div>
</section>
<section class="band">
  <div class="shell">
    <ul class="list-clean">
      ${services
        .map(
          (service, index) => `<li class="reveal">
        <span class="idx">0${index + 1}</span>
        <div>
          <h3>${escapeHtml(service)}</h3>
          <p>${escapeHtml(brief.sections[(index + 1) % brief.sections.length]?.copy ?? brief.positioning)}</p>
        </div>
      </li>`,
        )
        .join("")}
    </ul>
  </div>
</section>
<section class="band">
  <div class="shell split">
    <div class="figure reveal"><img src="${art.portrait}" alt="Composição gráfica de apoio" width="720" height="900" loading="lazy"></div>
    <div class="reveal">
      <p class="eyebrow">Como trabalhamos</p>
      <h2>${escapeHtml(brief.sections[2]?.title ?? "Processo")}</h2>
      <p>${escapeHtml(brief.sections[2]?.copy ?? brief.narrative)}</p>
      <p>${escapeHtml(brief.sections[3]?.copy ?? "")}</p>
    </div>
  </div>
</section>
<section class="band cta-band">
  <div class="shell two-col">
    <div><h2 class="reveal">${escapeHtml(brief.ctas[0].label)}</h2></div>
    <div class="reveal">
      <p>${escapeHtml(brief.businessGoal)}</p>
      <a class="btn btn-primary" href="./contacto">${escapeHtml(brief.ctas[0].label)}</a>
    </div>
  </div>
</section>`;

  /* ── Contacto ── */
  const contactBody = `
<section class="hero" style="padding-bottom:16px">
  <div class="shell">
    <p class="eyebrow">Contacto</p>
    <h1 class="reveal">${escapeHtml(brief.ctas[0].label)}</h1>
    <p class="lead reveal">${escapeHtml(brief.sections[brief.sections.length - 1]?.purpose ?? "")}</p>
  </div>
</section>
<section class="band">
  <div class="shell two-col">
    <div>
      <h2>${escapeHtml(lead.company_name)}${lead.location ? ` · ${escapeHtml(lead.location)}` : ""}</h2>
      ${lead.contact_phone ? `<p>Telefone: ${escapeHtml(lead.contact_phone)}</p>` : `<p>Telefone a confirmar com o cliente.</p>`}
      ${lead.contact_email ? `<p>Email: ${escapeHtml(lead.contact_email)}</p>` : `<p>Email a confirmar com o cliente.</p>`}
      ${lead.whatsapp ? `<p>WhatsApp: ${escapeHtml(lead.whatsapp)}</p>` : ""}
      <p class="note">Formulário demonstrativo: os campos estão desativados e não recolhem dados.</p>
    </div>
    <form class="demo" aria-label="Formulário de contacto demonstrativo">
      <div><label for="nome">Nome</label><input id="nome" name="nome" autocomplete="name" disabled placeholder="Nome completo"></div>
      <div><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" disabled placeholder="nome@empresa.pt"></div>
      <div><label for="mensagem">Mensagem</label><textarea id="mensagem" name="mensagem" rows="4" disabled placeholder="Como podemos ajudar?"></textarea></div>
      <button class="btn btn-primary" type="button" disabled>${escapeHtml(brief.ctas[0].label)}</button>
    </form>
  </div>
</section>`;

  const pages: PrototypePage[] = [
    {
      slug: "index",
      title: `${lead.company_name} — ${archetype.label}`,
      html: shell({
        brief,
        lead,
        title: `${lead.company_name} — ${hero.heading}`,
        description: brief.positioning.slice(0, 180),
        css,
        body: indexBody,
        pages: pagesMeta,
        active: "index",
        serviceLabel: archetype.serviceLabel,
      }),
    },
    {
      slug: serviceSlug,
      title: `${archetype.serviceLabel} — ${lead.company_name}`,
      html: shell({
        brief,
        lead,
        title: `${archetype.serviceLabel} — ${lead.company_name}`,
        description: brief.sections[0]?.copy.slice(0, 180) ?? brief.positioning.slice(0, 180),
        css,
        body: serviceBody,
        pages: pagesMeta,
        active: serviceSlug,
        serviceLabel: archetype.serviceLabel,
      }),
    },
    {
      slug: "contacto",
      title: `Contacto — ${lead.company_name}`,
      html: shell({
        brief,
        lead,
        title: `Contacto — ${lead.company_name}`,
        description: `Contactos demonstrativos de ${lead.company_name}.`,
        css,
        body: contactBody,
        pages: pagesMeta,
        active: "contacto",
        serviceLabel: archetype.serviceLabel,
      }),
    },
  ];

  return {
    version: options.version,
    engine: options.engine,
    entry: "index",
    pages,
    sharedCss: css,
    generatedAt: new Date().toISOString(),
    notes: [
      "Protótipo estático gerado pela ORBITA a partir da direção criativa validada.",
      "Imagens são composições originais geradas — nenhuma fotografia de terceiros é utilizada.",
      "Formulários e pagamentos intencionalmente desativados nesta fase.",
      "Conteúdo não confirmado pelo cliente está assinalado no prompt master.",
    ],
  };
}
