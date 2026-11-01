(function () {
 'use strict';
 const {esc}=U;
 const SVG={
  book:'<path d="M12 7.5c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1v-13c-3-1-6-1-9 1Zm0 0v13"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  layers:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
  chart:'<path d="M4 20V10m5 10V5m5 15v-8m5 8V7"/><path d="M2 20h20"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus:'<path d="M12 5v14m-7-7h14"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 5 5L20 7"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  error:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  moon:'<path d="M20 15a8 8 0 0 1-11-11A8 8 0 1 0 20 15Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/>',
  upload:'<path d="M12 16V4m-4 4 4-4 4 4M4 17v3h16v-3"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13v-2l2-1-2-4-2 1-2-2V3H9v2L7 7 5 6l-2 4 2 1v2l-2 1 2 4 2-1 2 2v2h6v-2l2-2 2 1 2-4z"/>',
  edit:'<path d="m13 5 6 6M4 20l5-.9L20 7a2.1 2.1 0 0 0-3-3L4.9 16z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
  note:'<path d="M8 4h8l4 4v13H4V4h4zm8 0v5h4M8 13h8m-8 4h6"/>',
  close:'<path d="m5 5 14 14M19 5 5 19"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  filter:'<path d="M4 7h16M7 12h10m-7 5h4"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  shield:'<path d="M12 3 4 6v6c0 5 4 8 8 10 4-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9v1"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  refresh:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M5 9a8 8 0 0 1 13-3l2 5M4 13l2 5a8 8 0 0 0 13-3"/>',
  inbox:'<path d="M3 5h18v14H3zM3 13h6l2 3h2l2-3h6"/>',
  trophy:'<path d="M7 3h10v8a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 4v5m-4 0h8"/>'
 };
 const icon=(name,size=18)=>`<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]||SVG.info}</svg>`;
 let toastTimeout;
 function chrome(page) {
  const active=page==='registros'?'registros':'estatisticas';
  document.documentElement.dataset.theme=AppStore.load().preferences?.theme==='dark'?'dark':'light';
  document.getElementById('app').innerHTML=`
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="brand-icon">${icon('book',26)}</div><div><strong>Concurso<span>+</span></strong><small>Estudo inteligente</small></div></div>
        <div class="sidebar-section-label">MENU PRINCIPAL</div>
        <nav aria-label="Navegação principal" class="nav-menu">
          <a href="registros.html" class="nav-link ${active==='registros'?'active':''}" ${active==='registros'?'aria-current="page"':''}>${icon('layers')}<span>Registros</span></a>
          <a href="estatisticas.html" class="nav-link ${active==='estatisticas'?'active':''}" ${active==='estatisticas'?'aria-current="page"':''}>${icon('chart')}<span>Estatísticas</span></a>
        </nav>
        <div class="sidebar-footer">
          <div class="local-caption">${icon('shield',16)} <span>Salvo em Data/dados.js</span></div>
          <button class="sidebar-option" type="button" data-global-action="backup">${icon('download')} <span>Dados e backup</span></button>
          <button class="sidebar-option" type="button" data-global-action="theme">${icon('moon')} <span id="theme-label">Tema escuro</span></button>
          <p class="footer-version">Concurso+ · Versão portátil 3.0</p>
        </div>
      </aside>
      <div class="mobile-overlay" id="mobile-overlay"></div>
      <div class="main-shell"><div class="mobile-top"><button class="icon-button" type="button" data-global-action="menu" aria-label="Abrir menu">${icon('menu',23)}</button><span class="mobile-brand">Concurso+</span><button class="icon-button" type="button" data-global-action="theme" aria-label="Alternar tema">${icon('moon',21)}</button></div><main id="page" class="main-content"></main></div>
    </div>
    <dialog id="app-modal" class="app-dialog" aria-label="Janela de edição"><div id="modal-body"></div></dialog>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <input type="file" id="import-file" accept=".json,application/json" hidden>
  `;
  const dialog=document.querySelector('#app-modal');
  dialog.addEventListener('click',e=>{ if(e.target===dialog)close(); });
  document.querySelector('#mobile-overlay').addEventListener('click',toggleMenu);
  document.querySelector('#theme-label').textContent=document.documentElement.dataset.theme==='dark'?'Tema claro':'Tema escuro';
  document.addEventListener('click',globalClicks);
  initializeNoteTooltips();
  document.querySelector('#import-file').addEventListener('change',handleImport);
 }
 function initializeNoteTooltips(){
  const tooltip=document.createElement('div');tooltip.className='floating-note-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;document.body.appendChild(tooltip);
  let current=null;
  function place(btn){const rect=btn.getBoundingClientRect(),width=Math.min(310,window.innerWidth-24),left=Math.max(12,Math.min(window.innerWidth-width-12,rect.left+rect.width/2-width/2));tooltip.style.left=`${left}px`;tooltip.style.width=`${width}px`;const h=tooltip.offsetHeight;tooltip.style.top=`${rect.bottom+12+h>window.innerHeight?Math.max(8,rect.top-h-12):rect.bottom+12}px`;}
  function show(btn){if(!btn||!btn.dataset.note)return;btn.removeAttribute('title');current=btn;tooltip.innerHTML='<strong>Nota do registro</strong><p></p>';tooltip.querySelector('p').textContent=btn.dataset.note;tooltip.hidden=false;place(btn);}
  function hide(){tooltip.hidden=true;current=null;}
  document.addEventListener('pointerover',e=>{const btn=e.target.closest?.('[data-note]');if(btn&&btn!==current)show(btn);});
  document.addEventListener('pointerout',e=>{if(current&&e.target.closest?.('[data-note]')===current&&!current.contains(e.relatedTarget))hide();});
  document.addEventListener('focusin',e=>{const btn=e.target.closest?.('[data-note]');if(btn)show(btn);else hide();});
  document.addEventListener('focusout',e=>{if(current&&e.target===current)hide();});
  window.addEventListener('scroll',()=>{if(current&&document.body.contains(current))place(current);},{passive:true,capture:true});
  window.addEventListener('resize',()=>{if(current)place(current);});
 }
 function toggleMenu(){document.body.classList.toggle('menu-open');}
 function globalClicks(e) {
  const action=e.target.closest('[data-global-action]')?.dataset.globalAction;
  if(!action)return;
  if(action==='menu')toggleMenu();
  if(action==='theme'){
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    document.querySelector('#theme-label').textContent=next==='dark'?'Tema claro':'Tema escuro';
    AppStore.setTheme(next).catch(err=>{document.documentElement.dataset.theme=next==='dark'?'light':'dark';toast('Falha ao salvar o tema: '+err.message,'error');});
  }
  if(action==='backup')openBackup();
  if(action==='close-modal')close();
  if(action==='export')exportBackup();
  if(action==='import')document.querySelector('#import-file').click();
  if(action==='start-empty')confirm('Iniciar com dados vazios','Todos os grupos, conteúdos, registros e lembretes serão apagados. Faça um backup antes de continuar.',async()=>{await AppStore.empty();toast('Todos os dados foram apagados.');});
  if(action==='migrate-legacy')migrateLegacy();
 }
 function openModal(inner) {
  const dialog=document.querySelector('#app-modal');
  document.querySelector('#modal-body').innerHTML=inner;
  dialog.showModal();
  dialog.scrollTop=0;
 }
 function close(){const d=document.querySelector('#app-modal');if(d.open)d.close();}
 function modalHeader(title,desc='') {return `<div class="modal-header"><div><h2>${esc(title)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div><button type="button" class="icon-button" data-global-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>`;}
 function modalActions(positive='Salvar alterações') {return `<div class="modal-actions"><button type="button" class="btn btn-ghost" data-global-action="close-modal">Cancelar</button><button type="submit" class="btn btn-primary">${esc(positive)}</button></div>`;}
 function toast(message,type='success') {
  const el=document.querySelector('#toast');if(!el)return;
  clearTimeout(toastTimeout);el.textContent=message;el.className=`toast visible toast-${type}`;
  toastTimeout=setTimeout(()=>el.classList.remove('visible'),3700);
 }
 function confirm(title,body,callback,action='Excluir definitivamente') {
  openModal(`${modalHeader(title)}<p class="confirm-text">${esc(body)}</p><div class="modal-actions"><button class="btn btn-ghost" data-global-action="close-modal">Cancelar</button><button id="confirm-action" class="btn btn-danger">${esc(action)}</button></div>`);
  document.querySelector('#confirm-action').addEventListener('click',async()=>{
    const btn=document.querySelector('#confirm-action');btn.disabled=true;
    try{await callback();close();}catch(err){btn.disabled=false;toast(err.message,'error');}
  });
 }
 function openBackup(){
  const d=AppStore.load();
  openModal(`${modalHeader('Dados e backup','Arquivo: Data/dados.js · persistência portátil')}
   <div class="backup-note">${icon('shield',19)}<p>Os dados são gravados automaticamente em <strong>Data/dados.js</strong>, dentro da pasta do projeto. Para levar seus registros a outro computador, copie essa pasta. Também é possível importar e exportar backups JSON.</p></div>
   <div class="backup-stats"><span><strong>${U.num(d.groups.length)}</strong> grupos</span><span><strong>${U.num(d.contents.length)}</strong> conteúdos</span><span><strong>${U.num(d.records.length)}</strong> registros</span><span><strong>${U.num(d.reviews.length)}</strong> lembretes</span></div>
   <div class="backup-options"><button class="backup-option" data-global-action="export">${icon('download',21)}<span><strong>Exportar backup</strong><small>Baixar todos os dados em um arquivo .json</small></span>${icon('arrow',16)}</button>
   <button class="backup-option" data-global-action="import">${icon('upload',21)}<span><strong>Importar backup</strong><small>Substituir os dados atuais por um arquivo .json</small></span>${icon('arrow',16)}</button></div>
   <div class="backup-options"><button class="backup-option" data-global-action="migrate-legacy">${icon('refresh',21)}<span><strong>Migrar dados da versão anterior</strong><small>Importar dados guardados no localStorage, se existirem neste navegador</small></span>${icon('arrow',16)}</button></div>
   <div class="danger-zone"><p>Gerenciar armazenamento</p><button class="btn btn-outline-danger" data-global-action="start-empty">${icon('trash',16)} Limpar todos os dados</button></div>`);
 }
 function exportBackup(){
  try{
    const json=JSON.stringify(AppStore.load(),null,2);const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`concurso-plus-backup-${U.today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup exportado.');
  }catch(err){toast(err.message,'error');}
 }
 async function handleImport(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>15*1024*1024){toast('Arquivo muito grande (máximo 15 MB).','error');return;}
  try{const data=JSON.parse(await file.text());await AppStore.importData(data);close();toast('Backup importado com sucesso.');}
  catch(err){toast('Falha na importação: '+err.message,'error');}
 }
 async function migrateLegacy(){
   try {
     const legacy=localStorage.getItem(AppStore.KEY);
     if(!legacy)throw new Error('Nenhum dado anterior encontrado nesta origem do navegador. Exporte o JSON no sistema antigo e importe aqui.');
     const parsed=JSON.parse(legacy);
     const confirmed=window.confirm(`Substituir os dados atuais pelos dados antigos encontrados no navegador? (${parsed.records?.length||0} registros). Faça um backup dos dados atuais antes.`);
     if(!confirmed)return;
     await AppStore.importData(parsed);close();toast('Registros anteriores migrados para Data/dados.js.');
   }catch(err){toast(err.message,'error');}
 }
 function emptyState(iconName,title,desc,action='') {return `<div class="empty-state"><div class="empty-icon">${icon(iconName,22)}</div><strong>${esc(title)}</strong><p>${esc(desc)}</p>${action}</div>`;}
 const label=(name,html,extra='')=>`<label class="field"><span>${esc(name)}</span>${html}${extra}</label>`;
 const option=(value,text,selected)=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(text)}</option>`;
 window.UI={icon,chrome,openModal,close,modalHeader,modalActions,toast,confirm,emptyState,label,option};
})();
