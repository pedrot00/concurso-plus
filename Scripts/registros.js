(function(){
 'use strict';
 const {esc}=U;
 const state={search:'',banca:'',group:'',priority:'',openGroups:new Set(),openContents:new Set(),allRecords:new Set(),showAllRecent:false,showAllReviews:false,showAllRealized:false,groupBank:{},groupPriority:{}};
 let data;let initialExpansion=true;
 const $=s=>document.querySelector(s);
 async function init(){
  try{await AppStore.ready;}catch{return;}
  UI.chrome('registros');
  $('#page').innerHTML=`<header class="page-header"><div class="header-copy"><div class="eyebrow">ÁREA DE ESTUDOS <span class="eyebrow-dot"></span> REGISTROS</div><h1>Seus registros de estudo</h1><p>Organize conteúdos, acompanhe seus resultados e planeje revisões.</p></div><div class="header-tag">${UI.icon('shield',15)} Dados locais</div></header>
   <section class="toolbar"><div class="toolbar-filters"><label class="searchbox">${UI.icon('search',19)}<input type="search" id="filter-search" placeholder="Buscar grupo ou conteúdo..." autocomplete="off" aria-label="Buscar grupo ou conteúdo"></label><label class="select-wrap"><span>Banca</span><select id="filter-banca"><option value="">Todas as bancas</option>${AppStore.BANCAS.map(b=>UI.option(b,b,'')).join('')}</select></label><label class="select-wrap"><span>Grupo</span><select id="filter-grupo"><option value="">Todos os grupos</option></select></label></div><div class="action-buttons"><button class="btn btn-primary" data-action="new-record">${UI.icon('plus',17)} Novo registro</button><button class="btn btn-secondary" data-action="new-content">${UI.icon('plus',17)} Novo conteúdo</button><button class="btn btn-green" data-action="new-group">${UI.icon('plus',17)} Novo grupo</button></div></section>
   <div id="reg-body"></div>`;
  $('#filter-search').addEventListener('input',e=>{state.search=e.target.value;renderBody();});
  $('#filter-banca').addEventListener('change',e=>{state.banca=e.target.value;renderBody();});
  $('#filter-grupo').addEventListener('change',e=>{state.group=e.target.value;renderBody();});
  $('#page').addEventListener('click',pageClick);
  $('#page').addEventListener('change',e=>{if(e.target.id==='filter-priority'){state.priority=e.target.value;renderBody();}if(e.target.matches('[data-group-bank]')){state.groupBank[e.target.dataset.groupBank]=e.target.value;renderBody();}if(e.target.matches('[data-group-priority]')){state.groupPriority[e.target.dataset.groupPriority]=e.target.value;renderBody();}});
  window.addEventListener('concursoplus:changed',refresh);
  window.addEventListener('storage',refresh);
  refresh();
 }
 function refresh(){try{data=AppStore.load();if(initialExpansion){data.groups.slice(0,3).forEach(g=>state.openGroups.add(g.id));if(data.contents.length)state.openContents.add(data.contents[0].id);initialExpansion=false;}updateGroupFilter();renderBody();}catch(err){UI.toast(err.message,'error');}}
 function updateGroupFilter(){
  const el=$('#filter-grupo');el.innerHTML='<option value="">Todos os grupos</option>'+data.groups.map(g=>UI.option(g.id,g.name,state.group)).join('');
  if(state.group && !data.groups.some(g=>g.id===state.group))state.group=el.value='';
 }
 function matchGroup(g){return !state.group||g.id===state.group;}
 function matchSearch(g,c){return !state.search || U.normalized(g.name).includes(U.normalized(state.search)) || (c&&U.normalized(c.name).includes(U.normalized(state.search)));}
 function filteredRecords(){
  return data.records.filter(r=>{const g=U.itemById(data.groups,r.groupId),c=U.itemById(data.contents,r.contentId);return g&&c&&matchGroup(g)&&matchSearch(g,c)&&(!state.banca||r.banca===state.banca);});
 }
 function filteredReviews(){
  return data.reviews.filter(v=>{const g=U.itemById(data.groups,v.groupId),c=U.itemById(data.contents,v.contentId);return g&&c&&matchGroup(g)&&matchSearch(g,c)&&(!state.banca||v.banca===state.banca);}).sort(U.byDate);
 }
 function renderBody(){
  const records=filteredRecords().sort(U.sortRecent), revs=filteredReviews(), stat=U.aggregate(records);
  $('#reg-body').innerHTML=`
    ${data.isDemo?`<div class="demo-banner">${UI.icon('info',17)} <span>Dados de demonstração para explorar as funcionalidades. Você pode editar, excluir ou começar do zero em <button type="button" data-global-action="backup">Dados e backup</button>.</span></div>`:''}
    <section class="metric-section" aria-label="Indicadores gerais"><div class="section-title inline-title"><div><h2>Visão geral</h2><p>Indicadores calculados com os filtros ativos</p></div><span class="small-summary">${U.num(records.length)} registro(s) no período completo</span></div>
     <div class="metrics-grid">
      ${metric('layers','Total de registros',U.num(stat.count),'blue')}
      ${metric('clock','Horas estudadas',U.time(stat.minutes),'purple')}
      ${metric('note','Questões respondidas',U.num(stat.questions),'cyan')}
      ${metric('check','Total de acertos',U.num(stat.correct),'green')}
      ${metric('target','Taxa de desempenho',U.rate(stat.rate),'amber')}
      ${metric('error','Total de erros',U.num(stat.errors),'red')}
     </div></section>
    <div class="records-sections">
      <section class="panel record-wide-panel"><div class="panel-header"><div><div class="panel-title">${UI.icon('check',19)}<h2>Revisões realizadas</h2></div><p>Sessões registradas como revisão, ordenadas da mais recente para a mais antiga.</p></div><span class="count-pill">${U.num(records.filter(r=>r.type==='Revisão').length)}</span></div>${realizedHTML(records.filter(r=>r.type==='Revisão'))}</section>
      <section class="panel record-wide-panel"><div class="panel-header"><div><div class="panel-title">${UI.icon('calendar',19)}<h2>Revisões futuras</h2></div><p>Lembretes pendentes: concluir um lembrete não altera as estatísticas.</p></div><span class="count-pill">${U.num(revs.length)}</span></div>${futureHTML(revs)}</section>
      <section class="panel group-panel"><div class="panel-header"><div><div class="panel-title">${UI.icon('grid',19)}<h2>Conteúdos por grupo</h2></div><p>Expanda uma matéria para consultar o histórico dos conteúdos sem perder a visão geral.</p></div><div class="panel-actions"><label class="compact-select">Prioridade <select id="filter-priority"><option value="" ${!state.priority?'selected':''}>Todas</option>${AppStore.PRIORITIES.map(p=>UI.option(p,p,state.priority)).join('')}</select></label></div></div><div class="groups-container">${groupsHTML(records)}</div></section>
      <section class="panel record-wide-panel"><div class="panel-header"><div><div class="panel-title">${UI.icon('clock',19)}<h2>Últimos registros</h2></div><p>Histórico completo das atividades mais recentes, com ações para editar e excluir.</p></div><span class="count-pill">${U.num(records.length)}</span></div>${latestHTML(records)}</section>
    </div>`;
 }
 function metric(iconName,label,value,color){return `<article class="metric-card metric-${color}"><div class="metric-top"><span class="metric-icon">${UI.icon(iconName,18)}</span><span class="metric-label">${label}</span></div><div class="metric-number">${value}</div></article>`;}
 function groupsHTML(records){
  const visibleGroups=data.groups.filter(matchGroup).filter(g=>!state.search||U.normalized(g.name).includes(U.normalized(state.search))||data.contents.some(c=>c.groupId===g.id&&U.normalized(c.name).includes(U.normalized(state.search))));
  const groups=visibleGroups.filter(g=>{
   const contentIds=data.contents.filter(c=>c.groupId===g.id && matchSearch(g,c) &&(!state.priority || c.priority===state.priority)).map(c=>c.id);
   if(state.banca) return records.some(r=>r.groupId===g.id&&contentIds.includes(r.contentId));
   if(state.priority)return contentIds.length>0;return true;
  });
  if(!groups.length)return UI.emptyState('inbox','Nenhum grupo encontrado','Ajuste os filtros ou cadastre um novo grupo.');
  return groups.sort((a,b)=>U.priorityRank[a.priority]-U.priorityRank[b.priority]||a.name.localeCompare(b.name,'pt-BR')).map(g=>groupHTML(g,records)).join('');
 }
 function groupHTML(g,records){
  const bank=state.groupBank[g.id]||'',priority=state.groupPriority[g.id]||'';
  const matches=data.contents.filter(c=>c.groupId===g.id&&matchSearch(g,c)&&(!state.priority||c.priority===state.priority)&&(!priority||c.priority===priority)&&(!state.banca||records.some(r=>r.contentId===c.id&&r.banca===state.banca))&&(!bank||records.some(r=>r.contentId===c.id&&r.banca===bank)));
  const relevant=records.filter(r=>r.groupId===g.id&&matches.some(c=>c.id===r.contentId)&&(!bank||r.banca===bank));
  const a=U.aggregate(relevant),opened=state.openGroups.has(g.id);
  return `<article class="group-card" style="--group-color:${g.color}">
    <div class="group-head">
      <div class="group-head-main"><button class="group-toggle" data-action="toggle-group" data-id="${esc(g.id)}" aria-expanded="${opened}"><span class="group-mark"></span><span class="group-heading"><strong>${esc(g.name)}</strong></span><span class="group-chevron ${opened?'rotated':''}">${UI.icon('chevron',18)}</span></button>${U.priorityTag(g.priority)}</div>
      <div class="item-actions"><button class="icon-button" data-action="edit-group" data-id="${esc(g.id)}" title="Editar grupo" aria-label="Editar grupo">${UI.icon('edit',16)}</button><button class="icon-button danger-hover" data-action="delete-group" data-id="${esc(g.id)}" title="Excluir grupo" aria-label="Excluir grupo">${UI.icon('trash',16)}</button></div>
      <div class="group-summary"><strong>${U.time(a.minutes)}</strong><span>${U.num(a.correct)} de ${U.num(a.questions)} questões</span><div class="group-progress"><span style="width:${a.rate||0}%"></span></div><b>${U.rate(a.rate)}</b><small>${matches.length} conteúdos · ${a.count} registros</small></div>
      ${opened?`<div class="group-filters"><label><span>Banca</span><select data-group-bank="${esc(g.id)}"><option value="">Todas as bancas</option>${AppStore.BANCAS.map(b=>UI.option(b,b,bank)).join('')}</select></label><label><span>Prioridade</span><select data-group-priority="${esc(g.id)}"><option value="">Todas</option>${AppStore.PRIORITIES.map(p=>UI.option(p,p,priority)).join('')}</select></label></div>`:''}
    </div>
    ${opened?`<div class="group-body">${matches.length?matches.sort((a,b)=>U.priorityRank[a.priority]-U.priorityRank[b.priority]||a.name.localeCompare(b.name,'pt-BR')).map(c=>contentHTML(g,c,relevant)).join(''):`<div class="group-empty">Nenhum conteúdo encontrado com esses filtros.</div>`}<button type="button" class="group-add" data-action="new-content" data-group="${esc(g.id)}">${UI.icon('plus',14)} Adicionar conteúdo a ${esc(g.name)}</button></div>`:''}</article>`;
 }
 function contentHTML(g,c,records){
  const subset=records.filter(r=>r.contentId===c.id).sort(U.sortRecent),a=U.aggregate(subset),opened=state.openContents.has(c.id),showAll=state.allRecords.has(c.id);
  const items=showAll?subset:subset.slice(0,8);
  return `<div class="content-item" style="--group-color:${g.color}"><div class="content-row"><button type="button" class="content-toggle" data-action="toggle-content" data-id="${esc(c.id)}" aria-expanded="${opened}"><span class="content-chevron ${opened?'rotated':''}">${UI.icon('chevron',17)}</span><span class="content-dot"></span><span class="content-name">${esc(c.name)}</span></button><div class="content-priority">${U.priorityTag(c.priority)}</div><div class="content-numbers"><b>${U.compactTime(a.minutes)}</b><span>${U.num(a.correct)} / ${U.num(a.questions)}</span><div class="content-progress"><span style="width:${a.rate||0}%"></span></div><b class="${U.score(a.rate)}">${U.rate(a.rate)}</b></div><div class="item-actions"><button class="icon-button" data-action="edit-content" data-id="${esc(c.id)}" title="Editar conteúdo" aria-label="Editar conteúdo">${UI.icon('edit',15)}</button><button class="icon-button danger-hover" data-action="delete-content" data-id="${esc(c.id)}" title="Excluir conteúdo" aria-label="Excluir conteúdo">${UI.icon('trash',15)}</button></div></div>
  ${opened?`<div class="content-detail"><div class="detail-intro"><span>${U.num(subset.length)} registro(s) neste conteúdo</span><button class="text-link" data-action="new-record" data-group="${esc(g.id)}" data-content="${esc(c.id)}">${UI.icon('plus',15)} Adicionar registro</button></div>${items.length?`<div class="table-scroll"><table class="data-table compact-table"><thead><tr><th>Data</th><th>Banca</th><th>Horas</th><th>Questões</th><th>Acertos</th><th>Tipo</th><th>Desempenho</th><th class="right-cell">Ações</th></tr></thead><tbody>${items.map(r=>recordRow(r,false)).join('')}</tbody></table></div>`:UI.emptyState('inbox','Ainda sem registros','Adicione o primeiro estudo ou revisão deste conteúdo.')}${subset.length>8?`<button class="show-more" data-action="more-content-records" data-id="${esc(c.id)}">${showAll?'Recolher registros':`Expandir (${subset.length-8})`} ${UI.icon('down',15)}</button>`:''}</div>`:''}</div>`;
 }
 function recordRow(r,withContent=true){
  const c=U.itemById(data.contents,r.contentId),g=U.itemById(data.groups,r.groupId);
  return `<tr><td class="nowrap">${U.fmtDate(r.date)} ${r.notes?`<button class="icon-button note-inline" data-action="notes" data-id="${esc(r.id)}" data-note="${esc(r.notes)}" aria-label="Nota do registro">${UI.icon('note',15)}</button>`:''}</td>${withContent?`<td><span class="dot-text"><i class="tiny-dot" style="--dot:${g?.color||'#888'}"></i><span>${esc(c?.name||'—')}</span></span><small class="muted-sub">${esc(g?.name||'')}</small></td>`:''}<td>${esc(r.banca)}</td><td class="nowrap">${U.compactTime(r.minutes)}</td><td>${U.num(r.questions)}</td><td>${U.num(r.correct)}</td><td><span class="type-tag ${r.type==='Revisão'?'type-review':''}">${r.type}</span></td><td>${U.rateTag(U.pct(r.correct,r.questions))}</td><td class="right-cell"><span class="row-actions">${r.notes?`<button class="icon-button" data-action="notes" data-id="${esc(r.id)}" title="${esc(r.notes)}" data-note="${esc(r.notes)}" aria-label="Ler anotação">${UI.icon('note',15)}</button>`:''}<button class="icon-button" data-action="edit-record" data-id="${esc(r.id)}" title="Editar registro" aria-label="Editar registro">${UI.icon('edit',15)}</button><button class="icon-button danger-hover" data-action="delete-record" data-id="${esc(r.id)}" title="Excluir registro" aria-label="Excluir registro">${UI.icon('trash',15)}</button></span></td></tr>`;
 }
 function latestHTML(records){
  const subset=state.showAllRecent?records:records.slice(0,10);
  if(!records.length)return UI.emptyState('inbox','Nenhum registro','Os registros adicionados aparecerão aqui.');
  return `<div class="table-scroll"><table class="data-table latest-table"><thead><tr><th>Data</th><th>Conteúdo</th><th>Banca</th><th>Atividade</th><th>Desempenho</th><th class="right-cell">Ações</th></tr></thead><tbody>${subset.map(r=>{
   const c=U.itemById(data.contents,r.contentId),g=U.itemById(data.groups,r.groupId);
   return `<tr><td class="nowrap">${U.fmtDate(r.date)} ${r.notes?`<button class="icon-button note-inline" data-action="notes" data-id="${esc(r.id)}" title="${esc(r.notes)}" data-note="${esc(r.notes)}" aria-label="Ver nota ao passar o mouse">${UI.icon('note',15)}</button>`: ''}</td><td><span class="dot-text"><i class="tiny-dot" style="--dot:${g?.color||'#888'}"></i><span>${esc(c?.name||'—')}</span></span><small class="muted-sub">${esc(g?.name||'')}</small></td><td>${esc(r.banca)}</td><td class="latest-activity"><b>${U.compactTime(r.minutes)} · ${U.num(r.correct)}/${U.num(r.questions)}</b><small>${r.type} · questões corretas / respondidas</small></td><td>${U.rateTag(U.pct(r.correct,r.questions))}</td><td class="right-cell"><span class="row-actions">${r.notes?`<button class="icon-button" data-action="notes" data-id="${esc(r.id)}" title="${esc(r.notes)}" data-note="${esc(r.notes)}" aria-label="Ler anotação">${UI.icon('note',15)}</button>`:''}<button class="icon-button" data-action="edit-record" data-id="${esc(r.id)}" title="Editar registro" aria-label="Editar registro">${UI.icon('edit',15)}</button><button class="icon-button danger-hover" data-action="delete-record" data-id="${esc(r.id)}" title="Excluir registro" aria-label="Excluir registro">${UI.icon('trash',15)}</button></span></td></tr>`;
  }).join('')}</tbody></table></div>${records.length>10?`<button class="show-more" data-action="toggle-recent">${state.showAllRecent?'Ver apenas 10':'Ver todos os '+records.length+' registros'} ${UI.icon('arrow',14)}</button>`:''}`;
 }
 function futureHTML(revs){
  if(!revs.length)return UI.emptyState('calendar','Sem revisões pendentes','Agende uma revisão futura ao cadastrar um registro.');
  const visible=state.showAllReviews?revs:revs.slice(0,5);
  return `<div class="table-scroll"><table class="data-table upcoming-table"><thead><tr><th>Solicitada em</th><th>Revisar em</th><th>Grupo</th><th>Conteúdo</th><th>Banca</th><th>Anotação</th><th class="right-cell">Concluir</th></tr></thead><tbody>${visible.map(v=>{
   const g=U.itemById(data.groups,v.groupId),c=U.itemById(data.contents,v.contentId),status=U.reviewStatus(v.dueDate);
   return `<tr style="--row-color:${g?.color||'#888'}"><td class="nowrap">${U.fmtDate(v.createdAt)}</td><td class="nowrap"><span class="review-date ${status}">${U.fmtDate(v.dueDate)} ${status==='overdue'?'· Atrasada':status==='today'?'· Hoje':''}</span></td><td><span class="dot-text"><i class="tiny-dot" style="--dot:${g?.color||'#888'}"></i>${esc(g?.name||'—')}</span></td><td><strong>${esc(c?.name||'—')}</strong></td><td>${esc(v.banca)}</td><td>${v.notes?`<button class="icon-button" data-action="review-note" data-id="${esc(v.id)}" title="${esc(v.notes)}" data-note="${esc(v.notes)}" aria-label="Ler anotação">${UI.icon('note',16)}</button>`:'—'}</td><td class="right-cell"><button class="btn btn-complete" data-action="complete-review" data-id="${esc(v.id)}">${UI.icon('check',14)} Realizada</button></td></tr>`;
  }).join('')}</tbody></table></div>${revs.length>5?`<button class="show-more" data-action="toggle-reviews">${state.showAllReviews?'Mostrar apenas 5':`Expandir (${revs.length-5})`} ${UI.icon('down',14)}</button>`:''}`;
 }
 function realizedHTML(records){
  const sorted=[...records].sort(U.sortRecent),visible=state.showAllRealized?sorted:sorted.slice(0,5);
  if(!records.length)return UI.emptyState('check','Sem revisões registradas','Registros do tipo Revisão aparecerão nesta seção.');
  return `<div class="table-scroll"><table class="data-table realized-table"><thead><tr><th>Data</th><th>Grupo</th><th>Conteúdo</th><th>Banca</th><th>Horas</th><th>Questões</th><th>Acertos</th><th>Desempenho</th></tr></thead><tbody>${visible.map(r=>{
   const g=U.itemById(data.groups,r.groupId),c=U.itemById(data.contents,r.contentId);
   return `<tr style="--row-color:${g?.color||'#888'}"><td class="nowrap">${U.fmtDate(r.date)} ${r.notes?`<button class="icon-button note-inline" data-action="notes" data-id="${esc(r.id)}" title="${esc(r.notes)}" data-note="${esc(r.notes)}" aria-label="Ler anotação">${UI.icon('note',15)}</button>`:''}</td><td><span class="dot-text"><i class="tiny-dot" style="--dot:${g?.color||'#888'}"></i>${esc(g?.name||'—')}</span></td><td><strong>${esc(c?.name||'—')}</strong></td><td>${esc(r.banca)}</td><td>${U.compactTime(r.minutes)}</td><td>${U.num(r.questions)}</td><td>${U.num(r.correct)}</td><td>${U.rateTag(U.pct(r.correct,r.questions))}</td></tr>`;
  }).join('')}</tbody></table></div>${records.length>5?`<button class="show-more" data-action="toggle-realized">${state.showAllRealized?'Mostrar apenas 5':`Expandir (${records.length-5})`} ${UI.icon('down',14)}</button>`:''}`;
 }
 function pageClick(e){
  const btn=e.target.closest('[data-action]');if(!btn)return;
  const {action,id,group,content}=btn.dataset;
  if(action==='toggle-group'){state.openGroups.has(id)?state.openGroups.delete(id):state.openGroups.add(id);renderBody();}
  else if(action==='toggle-content'){state.openContents.has(id)?state.openContents.delete(id):state.openContents.add(id);renderBody();}
  else if(action==='more-content-records'){state.allRecords.has(id)?state.allRecords.delete(id):state.allRecords.add(id);renderBody();}
  else if(action==='toggle-recent'){state.showAllRecent=!state.showAllRecent;renderBody();}
  else if(action==='toggle-reviews'){state.showAllReviews=!state.showAllReviews;renderBody();}
  else if(action==='toggle-realized'){state.showAllRealized=!state.showAllRealized;renderBody();}
  else if(action==='new-group'||action==='edit-group')groupModal(action==='edit-group'?id:null);
  else if(action==='new-content'||action==='edit-content')contentModal(action==='edit-content'?id:null,group);
  else if(action==='new-record'||action==='edit-record')recordModal(action==='edit-record'?id:null,group,content);
  else if(action.startsWith('delete-'))deleteModal(action.slice(7),id);
  else if(action==='notes'){const r=U.itemById(data.records,id);showNote('Anotações do registro',r?.notes);}
  else if(action==='review-note'){const v=U.itemById(data.reviews,id);showNote('Anotação da revisão pendente',v?.notes);}
  else if(action==='complete-review'){UI.confirm('Marcar revisão como realizada','Este lembrete será removido definitivamente. O registro original continuará salvo, e nenhum indicador será alterado.',async()=>{await AppStore.remove('review',id);UI.toast('Lembrete concluído e removido.');},'Marcar como realizada');}
 }
 function showNote(title,notes){UI.openModal(`${UI.modalHeader(title)}<div class="note-full">${esc(notes||'Sem anotações.').replace(/\n/g,'<br>')}</div><div class="modal-actions"><button class="btn btn-primary" data-global-action="close-modal">Fechar</button></div>`);}
 function groupModal(id){
  const g=id?U.itemById(data.groups,id):null;
  UI.openModal(`${UI.modalHeader(g?'Editar grupo':'Novo grupo','Defina a área de conhecimento e sua identidade visual.')}<form id="group-form" class="modal-form">
    ${UI.label('Área de conhecimento',`<input name="name" type="text" required maxlength="90" minlength="2" placeholder="Ex.: Direito Administrativo" value="${esc(g?.name||'')}">`)}
    ${UI.label('Prioridade',`<select name="priority">${AppStore.PRIORITIES.map(p=>UI.option(p,p,g?.priority||'Média')).join('')}</select>`)}
    <div class="field"><span>Cor do grupo</span><div class="swatches">${AppStore.COLORS.map(color=>`<label class="swatch" style="--swatch:${color}" title="Cor ${color}"><input type="radio" name="color" value="${color}" ${color===(g?.color||AppStore.COLORS[0])?'checked':''} required><span></span></label>`).join('')}</div><small class="field-help">A mesma cor identificará seus conteúdos e registros.</small></div>
    ${UI.modalActions(g?'Salvar grupo':'Adicionar grupo')}
  </form>`);
  $('#group-form').addEventListener('submit',async e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);
   try{await AppStore.createGroup({name:f.get('name'),priority:f.get('priority'),color:f.get('color')},id);UI.close();UI.toast(g?'Grupo atualizado.':'Grupo adicionado.');if(!id){data=AppStore.load();const ng=data.groups[data.groups.length-1];state.openGroups.add(ng.id);renderBody();}}
   catch(err){UI.toast(err.message,'error');}
  });
 }
 function contentModal(id,defaultGroup){
  const c=id?U.itemById(data.contents,id):null;
  if(!data.groups.length){UI.toast('Cadastre um grupo antes de adicionar conteúdos.','error');groupModal();return;}
  UI.openModal(`${UI.modalHeader(c?'Editar conteúdo':'Novo conteúdo','Associe o conteúdo a uma área de conhecimento.')}<form id="content-form" class="modal-form">
    ${UI.label('Nome do conteúdo',`<input name="name" type="text" required minlength="2" maxlength="90" placeholder="Ex.: Crase" value="${esc(c?.name||'')}">`)}
    ${UI.label('Grupo pertencente',`<select name="groupId" required>${data.groups.map(g=>UI.option(g.id,g.name,c?.groupId||defaultGroup||data.groups[0].id)).join('')}</select>`)}
    ${UI.label('Prioridade',`<select name="priority">${AppStore.PRIORITIES.map(p=>UI.option(p,p,c?.priority||'Média')).join('')}</select>`)}
    ${UI.modalActions(c?'Salvar conteúdo':'Adicionar conteúdo')}
   </form>`);
  $('#content-form').addEventListener('submit',async e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);
   try{await AppStore.createContent({name:f.get('name'),groupId:f.get('groupId'),priority:f.get('priority')},id);state.openGroups.add(f.get('groupId'));UI.close();UI.toast(c?'Conteúdo atualizado.':'Conteúdo adicionado.');}
   catch(err){UI.toast(err.message,'error');}
  });
 }
 function recordModal(id,defaultGroup,defaultContent){
  const r=id?U.itemById(data.records,id):null;
  if(!data.groups.length){UI.toast('Cadastre um grupo primeiro.','error');groupModal();return;}
  if(!data.contents.length){UI.toast('Cadastre um conteúdo antes de adicionar registros.','error');contentModal(null,defaultGroup);return;}
  const groupId=r?.groupId||defaultGroup||data.contents[0].groupId;
  UI.openModal(`${UI.modalHeader(r?'Editar registro':'Novo registro','Registre uma sessão de estudo ou revisão de maneira detalhada.')}<form id="record-form" class="modal-form">
   <div class="form-grid">${UI.label('Grupo',`<select name="groupId" id="record-group" required>${data.groups.map(g=>UI.option(g.id,g.name,groupId)).join('')}</select>`)}${UI.label('Conteúdo',`<select name="contentId" id="record-content" required></select>`)}</div>
   <div class="form-grid">${UI.label('Banca',`<select name="banca" required><option value="" ${r?'':'selected'} disabled>Selecione a banca</option>${AppStore.BANCAS.map(b=>UI.option(b,b,r?.banca)).join('')}</select>`)}${UI.label('Data do estudo',`<input type="date" name="date" required value="${esc(r?.date||U.today())}">`)}</div>
   <div class="form-grid">${UI.label('Tipo',`<select name="type">${['Estudo','Revisão'].map(t=>UI.option(t,t,r?.type||'Estudo')).join('')}</select>`)}<div class="field"><span>Tempo de estudo</span><div class="time-fields"><label><input type="number" name="hours" min="0" max="9999" step="1" value="${r?Math.floor(r.minutes/60):0}" required><small>horas</small></label><label><input type="number" name="mins" min="0" max="59" step="1" value="${r?r.minutes%60:0}" required><small>minutos</small></label></div></div></div>
   <div class="form-grid">${UI.label('Questões respondidas',`<input type="number" name="questions" id="record-questions" min="0" max="1000000" step="1" required value="${r?.questions??0}">`)}${UI.label('Acertos',`<input type="number" name="correct" id="record-correct" min="0" max="${r?.questions??0}" step="1" required value="${r?.correct??0}" ${!r?.questions?'disabled':''}>`)}</div>
   ${UI.label('Anotações',`<textarea name="notes" id="record-notes" rows="4" maxlength="500" placeholder="Dúvidas, principais erros, pontos para revisar...">${esc(r?.notes||'')}</textarea>`,`<small class="text-counter"><span id="note-counter">${(r?.notes||'').length}</span>/500 caracteres</small>`)}
   <div class="schedule-box"><label class="checkbox-label"><input type="checkbox" id="schedule-check" name="scheduleReview"><span>${UI.icon('calendar',18)} Adicionar revisão futura</span></label><div id="schedule-date-wrapper" class="schedule-date" hidden>${UI.label('Data da próxima revisão',`<input id="schedule-date" name="dueDate" type="date" value="${AppStore.daysFromNow(7)}">`)}</div></div>
   ${UI.modalActions(r?'Salvar alterações':'Adicionar registro')}
   </form>`);
  const form=$('#record-form'), groups=$('#record-group'), contents=$('#record-content'),questions=$('#record-questions'),correct=$('#record-correct');
  function fillContents(value){
   const possible=data.contents.filter(c=>c.groupId===groups.value);
   contents.innerHTML='<option value="" disabled>Selecione o conteúdo</option>'+possible.map(c=>UI.option(c.id,c.name,value)).join('');
   if(!possible.some(c=>c.id===value))contents.value=possible[0]?.id||'';
  }
  fillContents(r?.contentId||defaultContent);groups.addEventListener('change',()=>fillContents());
  const syncQuestions=()=>{const max=Math.max(0,Number(questions.value)||0);correct.disabled=max===0;correct.max=String(max);if(max===0)correct.value='0';else if(Number(correct.value)>max)correct.value=String(max);};
  questions.addEventListener('input',syncQuestions);
  $('#record-notes').addEventListener('input',e=>{$('#note-counter').textContent=e.target.value.length;});
  $('#schedule-check').addEventListener('change',e=>{$('#schedule-date-wrapper').hidden=!e.target.checked;$('#schedule-date').required=e.target.checked;});
  form.addEventListener('submit',async e=>{
   e.preventDefault();const f=new FormData(form),qs=Number(f.get('questions')),co=qs>0?Number(f.get('correct')):0;
   try{
    await AppStore.createRecord({groupId:f.get('groupId'),contentId:f.get('contentId'),banca:f.get('banca'),date:f.get('date'),type:f.get('type'),minutes:Number(f.get('hours'))*60+Number(f.get('mins')),questions:qs,correct:co,notes:f.get('notes'),scheduleReview:!!f.get('scheduleReview'),dueDate:f.get('dueDate')},id);
    state.openGroups.add(f.get('groupId'));UI.close();UI.toast(r?'Registro atualizado.':'Registro salvo com sucesso.');
   }catch(err){UI.toast(err.message,'error');}
  });
 }
 function deleteModal(kind,id){
  const names={record:'registro',content:'conteúdo',group:'grupo'};
  const target=kind==='record'?U.itemById(data.records,id):kind==='content'?U.itemById(data.contents,id):U.itemById(data.groups,id);
  if(!target)return;
  let warning='Esta exclusão não pode ser desfeita.';
  if(kind==='content')warning=`O conteúdo e seus ${data.records.filter(r=>r.contentId===id).length} registro(s) e ${data.reviews.filter(v=>v.contentId===id).length} lembrete(s) serão apagados. Esta ação não pode ser desfeita.`;
  if(kind==='group')warning=`Todos os ${data.contents.filter(c=>c.groupId===id).length} conteúdos, ${data.records.filter(r=>r.groupId===id).length} registros e ${data.reviews.filter(v=>v.groupId===id).length} lembretes vinculados serão apagados definitivamente.`;
  UI.confirm(`Excluir ${names[kind]}`,warning,async()=>{await AppStore.remove(kind,id);UI.toast('Item excluído.');});
 }
 document.addEventListener('DOMContentLoaded',init);
})();
