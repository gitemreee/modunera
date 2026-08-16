
(() => {
  const qs=(s,c=document)=>c.querySelector(s), qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const scriptEl=document.currentScript;const siteRoot=scriptEl?.src?.split('/assets/js/main.js')[0]+'/'||'/';
  const integrationPromise=fetch(siteRoot+'assets/js/integration-config.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
  const initIntegrations=async()=>{if(localStorage.getItem('mcCookie')!=='all'||window.__mcIntegrationsLoaded)return;window.__mcIntegrationsLoaded=true;const c=await integrationPromise;if(c.gtmContainerId){const s=document.createElement('script');s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(c.gtmContainerId);s.async=true;document.head.appendChild(s)}if(c.ga4MeasurementId){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',c.ga4MeasurementId)}if(c.clarityProjectId){(function(w,d,s,u,i){w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};const t=d.createElement(s);t.async=1;t.src=u+i;d.head.appendChild(t)})(window,document,'script','https://www.clarity.ms/tag/',c.clarityProjectId)}};
  // the form posts to no server: it stores locally and hands the text to WhatsApp,
  // so the confirmation must not read as "we have received your enquiry"
  const LEAD_NOTE={de:'Angaben übernommen — bitte in WhatsApp absenden.',en:'Details prepared — please send them in WhatsApp.',nl:'Gegevens overgenomen — verstuur ze in WhatsApp.',da:'Oplysninger klar — send dem i WhatsApp.',fr:'Informations préparées — envoyez-les dans WhatsApp.'};
  const toast=(msg)=>{let t=qs('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};

  // --- conversion events ------------------------------------------------------
  // Nothing on this site posts to a server: a lead is stored locally and handed to
  // WhatsApp. That makes WhatsApp the conversion, and until now it was the one
  // thing not measured — the analytics block above loads GA4, GTM and Clarity but
  // no code ever emitted an event, so the only question the business actually has
  // ("which of 15,000 pages produce contact?") had no answer.
  //
  // track() is deliberately a no-op when nothing is configured. It does not queue,
  // it does not retain, and it does not run before consent, because gtag and
  // dataLayer are only created inside initIntegrations() and that is gated on
  // mcCookie === 'all'. No consent means no globals means no event — which is the
  // behaviour the cookie notice already promises in five languages.
  const track=(name,params={})=>{try{
    const payload={...params,page_path:location.pathname,page_type:pageType(),page_lang:document.documentElement.lang||''};
    if(window.dataLayer)window.dataLayer.push({event:name,...payload});
    if(typeof window.gtag==='function')window.gtag('event',name,payload);
  }catch(err){/* measurement must never break the page it measures */}};

  // Which kind of page produced the click. With 15,000 pages a raw path is noise;
  // the useful cut is model page against location page against guide, and that is
  // decidable from the URL in every language because the slugs are fixed per
  // locale in data/locales.json.
  const PAGE_TYPES=[[/^\/(en|nl|da|fr)?\/?$/,'home'],[/\/(modelle|models|modellen|modeller|modeles)\//,'model'],
    [/\/(standorte|locations|locaties|lokationer|emplacements)\//,'location'],[/\/(laender|countries|landen|lande|pays)\//,'country'],
    [/\/(leistungen|services|diensten|ydelser)\//,'service'],[/\/(ratgeber|guides|gidsen)\//,'guide'],[/\/blog\//,'blog'],
    [/\/(faq|fragen|questions|vragen|spoergsmaal)/,'faq'],[/\/(konfigurator|studio|katalog|modellvergleich|preisvergleich|price-comparison|model-comparison)\//,'tool'],
    [/\/(kontakt|contact)\//,'contact'],[/\/legal\//,'legal']];
  const pageType=()=>{const p=location.pathname;for(const [re,name] of PAGE_TYPES)if(re.test(p))return name;return 'other'};

  // Where on the page the link was. A dock click and a hero click are the same
  // event with very different meaning: one is a reader who scrolled and decided,
  // the other is a reader who arrived ready.
  const linkPlace=(el)=>el.closest('.wa-dock')?'dock':el.closest('.nav')?'nav':el.closest('.location-hero,.page-hero,.article-visual-hero')?'hero'
    :el.closest('.cta-band')?'cta-band':el.closest('.footer')?'footer':el.closest('form')?'form':'inline';

  addEventListener('click',(e)=>{
    const link=e.target.closest?.('a[href]');if(!link)return;
    const href=link.getAttribute('href')||'';
    if(href.startsWith('https://wa.me/'))track('whatsapp_click',{link_place:linkPlace(link)});
    else if(href.startsWith('tel:'))track('phone_click',{link_place:linkPlace(link)});
    else if(/\.(pdf|zip)$/i.test(href))track('document_download',{file:href.split('/').pop()});
  },{passive:true,capture:true});

  // The dock's launch button is a <button> inside an inline script written per
  // page by build-modunera-v2.mjs, so it is reached by delegation rather than by
  // editing 7,574 copies of that script. Opening the panel is a distinct signal
  // from clicking through to WhatsApp: it is the moment of interest, and the gap
  // between the two counts is the panel's own drop-off.
  addEventListener('click',(e)=>{
    const launch=e.target.closest?.('.wa-launch');if(!launch)return;
    if(launch.getAttribute('aria-expanded')!=='true')track('whatsapp_panel_open',{trigger:'button'});
  },{passive:true,capture:true});

  window.MODUNERA={toast,track};
  let lastY=0;const progress=qs('.scroll-progress');
  const onScroll=()=>{const d=document.documentElement;if(progress){const max=d.scrollHeight-d.clientHeight;progress.style.width=(max?d.scrollTop/max*100:0)+'%'}const y=d.scrollTop;const b=document.body;b.classList.toggle('scrolled',y>40);if(Math.abs(y-lastY)>6){b.classList.toggle('scroll-up',y<lastY);lastY=y}};
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  // one panel at a time: opening a section closes whatever else was open, and so
  // does closing the drawer or clicking anywhere outside the navigation
  const toggle=qs('.mobile-toggle'),links=qs('.nav-links');
  const shutPanels=(keep)=>qsa('.nav-dropdown.open').forEach(d=>{if(d!==keep)d.classList.remove('open')});
  if(toggle&&links)toggle.onclick=()=>{if(!links.classList.toggle('open'))shutPanels()};
  qsa('.nav-dropdown>button').forEach(b=>b.onclick=()=>{const d=b.parentElement,was=d.classList.contains('open');shutPanels(d);d.classList.toggle('open',!was)});
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))shutPanels()});
  qsa('.faq-question').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));
  // a link to one question should arrive on an open answer, not a closed row
  const openHashed=()=>{const id=location.hash.slice(1);if(!id)return;const item=document.getElementById(id);if(item&&item.classList.contains('faq-item')){item.classList.add('open');item.scrollIntoView({block:'center'})}};
  openHashed();window.addEventListener('hashchange',openHashed);
  qsa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());

  // home model selector

  // lightbox
  const lb=qs('.lightbox');qsa('[data-lightbox]').forEach(b=>b.onclick=()=>{if(lb){qs('img',lb).src=b.dataset.lightbox;lb.classList.add('open')}});if(lb){qs('button',lb).onclick=()=>lb.classList.remove('open');lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')}};

  // cookie preferences
  const cookie=qs('.cookie');if(cookie&&!localStorage.getItem('mcCookie')){setTimeout(()=>cookie.classList.add('show'),900);qsa('[data-cookie]',cookie).forEach(b=>b.onclick=()=>{localStorage.setItem('mcCookie',b.dataset.cookie);cookie.classList.remove('show');initIntegrations()})}

  initIntegrations();

  // location search
  const locInput=qs('#locationSearch'),locResults=qs('#locationResults');
  // The place index is a megabyte of JSON — every town in five countries — and it
  // was loaded on page load for a search box most visitors never touch. It is now
  // fetched the first time the box is focused, which takes 1,003 KB off the home
  // page. data-locations-src is written by build-modunera-europe.mjs.
  if(locInput&&locResults){
    const render=()=>{const term=locInput.value.trim().toLocaleLowerCase('de-DE');if(term.length<2||!window.MC_LOCATIONS){locResults.classList.remove('open');return}const hits=window.MC_LOCATIONS.filter(x=>(x.n+' '+x.s).toLocaleLowerCase('de-DE').includes(term)).slice(0,10);locResults.innerHTML=hits.length?hits.map(x=>{const base=location.pathname.includes('/standorte/')?'../':'';const u=location.protocol==='file:'?base+x.u.replace(/^\//,''):siteRoot.replace(/\/$/,'')+x.u;return `<a href="${u}"><strong>${x.n}</strong><span>${x.s}</span></a>`}).join(''):'<div style="padding:15px">Kein Ort gefunden.</div>';locResults.classList.add('open')};
    let loading=false;
    const load=()=>{const src=locInput.dataset.locationsSrc;if(loading||window.MC_LOCATIONS||!src)return;loading=true;const s=document.createElement('script');s.src=src;s.onload=render;document.head.appendChild(s)};
    locInput.addEventListener('focus',load,{once:true});
    locInput.addEventListener('input',()=>{load();render()});
    document.addEventListener('click',e=>{if(!locResults.contains(e.target)&&e.target!==locInput)locResults.classList.remove('open')});
  }

  // faq / blog filters
  const faqSearch=qs('#faqSearch'),faqFilters=qsa('[data-faq-filter]');const applyFaq=()=>{if(!faqSearch)return;const term=faqSearch.value.toLowerCase(),active=qs('[data-faq-filter].active')?.dataset.faqFilter||'all';qsa('.faq-item[data-category]').forEach(i=>i.classList.toggle('hidden',!((active==='all'||i.dataset.category===active)&&i.textContent.toLowerCase().includes(term))))};if(faqSearch)faqSearch.addEventListener('input',applyFaq);faqFilters.forEach(b=>b.onclick=()=>{faqFilters.forEach(x=>x.classList.remove('active'));b.classList.add('active');applyFaq()});
  const blogSearch=qs('#blogSearch'),blogFilters=qsa('[data-blog-filter]');const applyBlog=()=>{if(!blogSearch)return;const term=blogSearch.value.toLowerCase(),active=qs('[data-blog-filter].active')?.dataset.blogFilter||'all';qsa('.blog-card[data-blog-category]').forEach(i=>i.classList.toggle('hidden',!((active==='all'||i.dataset.blogCategory===active)&&i.textContent.toLowerCase().includes(term))))};if(blogSearch)blogSearch.addEventListener('input',applyBlog);blogFilters.forEach(b=>b.onclick=()=>{blogFilters.forEach(x=>x.classList.remove('active'));b.classList.add('active');applyBlog()});

  // generic lead forms: save locally and open WhatsApp
  qsa('form[data-lead-form]').forEach(form=>form.addEventListener('submit',async e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(form));const lead={...fd,source:location.pathname,createdAt:new Date().toISOString()};const leads=JSON.parse(localStorage.getItem('mcLeads')||'[]');leads.push(lead);localStorage.setItem('mcLeads',JSON.stringify(leads));const c=await integrationPromise;if(c.crmEndpoint){try{await fetch(c.crmEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)})}catch(err){console.warn('CRM submission failed',err)}}track('lead_form_submit',{form_id:form.id||form.getAttribute('data-lead-form')||'unnamed',fields:Object.keys(fd).length});toast(LEAD_NOTE[document.documentElement.lang?.slice(0,2)]||LEAD_NOTE.de);const msg='MODUNERA Anfrage\n'+Object.entries(fd).map(([k,v])=>`${k}: ${v}`).join('\n');setTimeout(()=>window.open('https://wa.me/905535435342?text='+encodeURIComponent(msg),'_blank'),450)}));

})();
