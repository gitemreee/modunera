
(() => {
  const qs=(s,c=document)=>c.querySelector(s), qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const scriptEl=document.currentScript;const siteRoot=scriptEl?.src?.split('/assets/js/main.js')[0]+'/'||'/';
  const integrationPromise=fetch(siteRoot+'assets/js/integration-config.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
  const initIntegrations=async()=>{if(localStorage.getItem('mcCookie')!=='all'||window.__mcIntegrationsLoaded)return;window.__mcIntegrationsLoaded=true;const c=await integrationPromise;if(c.gtmContainerId){const s=document.createElement('script');s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(c.gtmContainerId);s.async=true;document.head.appendChild(s)}if(c.ga4MeasurementId){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',c.ga4MeasurementId)}if(c.clarityProjectId){(function(w,d,s,u,i){w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};const t=d.createElement(s);t.async=1;t.src=u+i;d.head.appendChild(t)})(window,document,'script','https://www.clarity.ms/tag/',c.clarityProjectId)}};
  const toast=(msg)=>{let t=qs('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
  window.MCTiny={toast};
  const progress=qs('.scroll-progress');
  const onScroll=()=>{if(progress){const d=document.documentElement;const max=d.scrollHeight-d.clientHeight;progress.style.width=(max?d.scrollTop/max*100:0)+'%'}const hm=qs('.hero-media');if(hm&&!matchMedia('(prefers-reduced-motion: reduce)').matches)hm.style.transform=`scale(1.04) translateY(${scrollY*.025}px)`};
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  const toggle=qs('.mobile-toggle'),links=qs('.nav-links');if(toggle&&links)toggle.onclick=()=>links.classList.toggle('open');
  qsa('.nav-dropdown>button').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('open'));
  qsa('.faq-question').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));
  qsa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());

  // home model selector

  // lightbox
  const lb=qs('.lightbox');qsa('[data-lightbox]').forEach(b=>b.onclick=()=>{if(lb){qs('img',lb).src=b.dataset.lightbox;lb.classList.add('open')}});if(lb){qs('button',lb).onclick=()=>lb.classList.remove('open');lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')}};

  // cookie preferences
  const cookie=qs('.cookie');if(cookie&&!localStorage.getItem('mcCookie')){setTimeout(()=>cookie.classList.add('show'),900);qsa('[data-cookie]',cookie).forEach(b=>b.onclick=()=>{localStorage.setItem('mcCookie',b.dataset.cookie);cookie.classList.remove('show');toast('Cookie-Einstellung gespeichert');initIntegrations()})}

  initIntegrations();

  // location search
  const locInput=qs('#locationSearch'),locResults=qs('#locationResults');
  if(locInput&&locResults&&window.MC_LOCATIONS){const render=()=>{const term=locInput.value.trim().toLocaleLowerCase('de-DE');if(term.length<2){locResults.classList.remove('open');return}const hits=window.MC_LOCATIONS.filter(x=>(x.n+' '+x.s).toLocaleLowerCase('de-DE').includes(term)).slice(0,10);locResults.innerHTML=hits.length?hits.map(x=>{const base=location.pathname.includes('/standorte/')?'../':'';const u=location.protocol==='file:'?base+x.u.replace(/^\//,''):siteRoot.replace(/\/$/,'')+x.u;return `<a href="${u}"><strong>${x.n}</strong><span>${x.s}</span></a>`}).join(''):'<div style="padding:15px">Kein Ort gefunden.</div>';locResults.classList.add('open')};locInput.addEventListener('input',render);document.addEventListener('click',e=>{if(!locResults.contains(e.target)&&e.target!==locInput)locResults.classList.remove('open')})}

  // faq / blog filters
  const faqSearch=qs('#faqSearch'),faqFilters=qsa('[data-faq-filter]');const applyFaq=()=>{if(!faqSearch)return;const term=faqSearch.value.toLowerCase(),active=qs('[data-faq-filter].active')?.dataset.faqFilter||'all';qsa('.faq-item[data-category]').forEach(i=>i.classList.toggle('hidden',!((active==='all'||i.dataset.category===active)&&i.textContent.toLowerCase().includes(term))))};if(faqSearch)faqSearch.addEventListener('input',applyFaq);faqFilters.forEach(b=>b.onclick=()=>{faqFilters.forEach(x=>x.classList.remove('active'));b.classList.add('active');applyFaq()});
  const blogSearch=qs('#blogSearch'),blogFilters=qsa('[data-blog-filter]');const applyBlog=()=>{if(!blogSearch)return;const term=blogSearch.value.toLowerCase(),active=qs('[data-blog-filter].active')?.dataset.blogFilter||'all';qsa('.blog-card[data-blog-category]').forEach(i=>i.classList.toggle('hidden',!((active==='all'||i.dataset.blogCategory===active)&&i.textContent.toLowerCase().includes(term))))};if(blogSearch)blogSearch.addEventListener('input',applyBlog);blogFilters.forEach(b=>b.onclick=()=>{blogFilters.forEach(x=>x.classList.remove('active'));b.classList.add('active');applyBlog()});

  // generic lead forms: save locally and open WhatsApp
  qsa('form[data-lead-form]').forEach(form=>form.addEventListener('submit',async e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(form));const lead={...fd,source:location.pathname,createdAt:new Date().toISOString()};const leads=JSON.parse(localStorage.getItem('mcLeads')||'[]');leads.push(lead);localStorage.setItem('mcLeads',JSON.stringify(leads));const c=await integrationPromise;if(c.crmEndpoint){try{await fetch(c.crmEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lead)})}catch(err){console.warn('CRM submission failed',err)}}toast('Anfrage gespeichert. WhatsApp wird geöffnet.');const msg='MODUNERA Anfrage\n'+Object.entries(fd).map(([k,v])=>`${k}: ${v}`).join('\n');setTimeout(()=>window.open('https://wa.me/905535435342?text='+encodeURIComponent(msg),'_blank'),450)}));

})();
