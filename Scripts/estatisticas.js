/* Estatísticas derivadas exclusivamente dos registros persistidos localmente. */
(function(){
 'use strict';
 const {esc}=U;
 const $=s=>document.querySelector(s);
 const now=new Date();
 const loadCalendarColor=()=>{try{const c=localStorage.getItem('concursoplus-calendar-accent');return /^#[0-9a-f]{6}$/i.test(c||'')?c:'#4478eb';}catch{return '#4478eb';}};
 const state={days:'all',group:'',banca:'',pieGroup:'',calendarColor:loadCalendarColor(),calendarTouched:false,calendarMonth:new Date(now.getFullYear(),now.getMonth(),1),selectedDay:null};
 const DOW=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
 const WEEK=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
 let data;
 async function init(){
  try{await AppStore.ready;}catch{return;}
  UI.chrome('estatisticas');
  $('#page').innerHTML=`<header class="page-header"><div class="header-copy"><div class="eyebrow">ÁREA DE ESTUDOS <span class="eyebrow-dot"></span> ESTATÍSTICAS</div><h1>Seus estudos em perspectiva</h1><p>Explore seus hábitos, desempenho, dificuldades e revisões com dados dos próprios registros.</p></div><div class="header-tag">${UI.icon('chart',15)} Dados locais</div></header>
  <section class="toolbar stats-toolbar"><div class="toolbar-filters"><label class="select-wrap"><span>Período</span><select id="stat-days"><option value="all" selected>Todo o histórico</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Últimos 12 meses</option></select></label><label class="select-wrap"><span>Grupo</span><select id="stat-group"><option value="">Todos os grupos</option></select></label><label class="select-wrap"><span>Banca</span><select id="stat-banca"><option value="">Todas as bancas</option>${AppStore.BANCAS.map(b=>UI.option(b,b,'')).join('')}</select></label></div><a class="btn btn-primary" href="registros.html">${UI.icon('plus',17)} Novo registro</a></section>
  <div id="stats-body"></div>`;
  $('#stat-days').addEventListener('change',e=>{state.days=e.target.value;render();});
  $('#stat-group').addEventListener('change',e=>{state.group=e.target.value;state.pieGroup='';render();});
  $('#stat-banca').addEventListener('change',e=>{state.banca=e.target.value;render();});
  $('#stats-body').addEventListener('click',e=>{
   const a=e.target.closest('[data-stat-action]');if(!a)return;
   if(a.dataset.statAction==='prev-month'||a.dataset.statAction==='next-month'){
    state.calendarMonth=new Date(state.calendarMonth.getFullYear(),state.calendarMonth.getMonth()+(a.dataset.statAction==='prev-month'?-1:1),1);
    state.selectedDay=null;state.calendarTouched=true;render();
   }
   if(a.dataset.statAction==='day'){state.selectedDay=a.dataset.day;render();}
   if(a.dataset.statAction==='current-month'){state.calendarMonth=new Date(now.getFullYear(),now.getMonth(),1);state.calendarTouched=true;state.selectedDay=null;render();}
  });
  $('#stats-body').addEventListener('change',e=>{
   if(e.target.id==='pie-group'){state.pieGroup=e.target.value;render();}
   if(e.target.id==='calendar-color'&&/^#[0-9a-f]{6}$/i.test(e.target.value)){
    state.calendarColor=e.target.value;
    try{localStorage.setItem('concursoplus-calendar-accent',state.calendarColor);}catch{}
    render();
   }
  });
  window.addEventListener('concursoplus:changed',refresh);window.addEventListener('storage',refresh);
  refresh();
 }
 function refresh(){try{data=AppStore.load();if(!state.calendarTouched){const current=`${state.calendarMonth.getFullYear()}-${String(state.calendarMonth.getMonth()+1).padStart(2,'0')}`;const last=[...data.records].filter(r=>r.date<=U.today()).sort((a,b)=>b.date.localeCompare(a.date))[0];if(last&&!data.records.some(r=>r.date.startsWith(current))){const [y,m]=last.date.split('-').map(Number);state.calendarMonth=new Date(y,m-1,1);}}if(state.group&&!data.groups.some(g=>g.id===state.group))state.group='';$('#stat-group').innerHTML='<option value="">Todos os grupos</option>'+data.groups.map(g=>UI.option(g.id,g.name,state.group)).join('');render();}catch(e){UI.toast(e.message,'error');}}
 function recordsFiltered(ignorePeriod=false){
  const begin=ignorePeriod||state.days==='all'?null:AppStore.daysFromNow(-Number(state.days)+1);
  return data.records.filter(r=>(!begin||r.date>=begin)&&(!state.group||r.groupId===state.group)&&(!state.banca||r.banca===state.banca));
 }
 const group=id=>data.groups.find(g=>g.id===id);
 const content=id=>data.contents.find(c=>c.id===id);
 const metric=(icon,label,value,color)=>`<article class="metric-card metric-${color}"><div class="metric-top"><span class="metric-icon">${UI.icon(icon,18)}</span><span class="metric-label">${label}</span></div><div class="metric-number">${value}</div></article>`;
 const panel=(icon,title,desc,contentHTML,other='',css='')=>`<section class="panel insight-panel ${css}"><div class="panel-header"><div><div class="panel-title">${UI.icon(icon,19)}<h2>${title}</h2></div><p>${desc}</p></div>${other}</div>${contentHTML}</section>`;
 function empty(icon,title,desc){return UI.emptyState(icon,title,desc);}
 function contentStats(records){return data.contents.filter(c=>!state.group||c.groupId===state.group).map(c=>{
  const rs=records.filter(r=>r.contentId===c.id),st=U.aggregate(rs),revision=rs.filter(r=>r.type==='Revisão').length,studies=rs.filter(r=>r.type==='Estudo').length;
  return {...c,group:group(c.groupId),...st,revision,studies};
 });}
 function render(){
  const records=recordsFiltered(),aggregate=U.aggregate(records),contents=contentStats(records),active=contents.filter(c=>c.count),groups=data.groups.filter(g=>!state.group||g.id===state.group).map(g=>({...g,...U.aggregate(records.filter(r=>r.groupId===g.id))})).filter(g=>g.count);
  const reviewed=records.filter(r=>r.type==='Revisão'),reviewByGroup=data.groups.filter(g=>!state.group||g.id===state.group).map(g=>({...g,revisions:reviewed.filter(r=>r.groupId===g.id).length})).filter(g=>g.revisions).sort((a,b)=>b.revisions-a.revisions);
  const reviewedContents=contents.filter(c=>c.revision).sort((a,b)=>b.revision-a.revision||a.name.localeCompare(b.name,'pt-BR'));
  const qualifying=active.filter(c=>c.questions>=10),byLow=[...qualifying].sort((a,b)=>a.rate-b.rate||b.questions-a.questions),byHigh=[...qualifying].sort((a,b)=>b.rate-a.rate||b.questions-a.questions);
  const byErrors=[...active].filter(c=>c.questions>0).sort((a,b)=>b.errors-a.errors||a.name.localeCompare(b.name,'pt-BR'));
  const byErrorRate=[...qualifying].sort((a,b)=>(b.errors/b.questions)-(a.errors/a.questions)||b.questions-a.questions);
  const byHours=[...active].sort((a,b)=>b.minutes-a.minutes);
  const medianHours=[...qualifying].sort((a,b)=>a.minutes-b.minutes);const median=medianHours.length?medianHours[Math.floor((medianHours.length-1)/2)].minutes:Infinity;
  const difficulty=byHours.filter(c=>c.questions>=10&&c.minutes>=median&&c.rate<65);
  const priority=[...qualifying].filter(c=>c.errors>0).sort((a,b)=>(b.errors/(1+b.revision))-(a.errors/(1+a.revision))||a.rate-b.rate);
  const uncovered=contents.filter(c=>c.studies>0).sort((a,b)=>a.revision-b.revision||b.studies-a.studies);
  $('#stats-body').innerHTML=`
   <section class="metric-section"><div class="section-title"><div><h2>Resumo dos estudos</h2><p>Todos os números abaixo seguem os filtros de período, grupo e banca.</p></div></div><div class="metrics-grid">${metric('layers','Registros',U.num(aggregate.count),'blue')}${metric('clock','Horas de estudo',U.time(aggregate.minutes),'purple')}${metric('note','Questões respondidas',U.num(aggregate.questions),'cyan')}${metric('check','Acertos',U.num(aggregate.correct),'green')}${metric('target','Taxa de acerto',U.rate(aggregate.rate),'amber')}${metric('error','Erros',U.num(aggregate.errors),'red')}</div></section>
   <div class="insight-section-heading"><span class="heading-index">01</span><div><h2>Desempenho e erros</h2><p>Veja a regularidade, evolução e os conteúdos de maior dificuldade.</p></div></div>
   ${panel('calendar','Calendário de estudos','Intensidade por horas acumuladas; personalize a cor ao lado.',calendarHTML(recordsFiltered(true)),'','calendar-panel')}
   ${panel('grid','Grupos mais estudados','Participação de cada grupo nas horas de estudo, sem rolagem e com identificação direta.',groupPieHTML(groups.sort((a,b)=>b.minutes-a.minutes)),'','groups-wide-panel')}
   ${panel('chart','Questões e horas ao longo dos meses','Outubro de 2026 a fevereiro de 2028 · duas escalas independentes para horas e questões.',trendHTML(recordsFiltered(true)),'','trend-panel')}
   <div class="insight-grid feature-visual-grid">
    ${panel('target','Acertos x erros','Distribuição de respostas corretas e incorretas.',accuracyHTML(records),`<label class="mini-select"><span class="sr-only">Filtrar gráfico por grupo</span><select id="pie-group"><option value="">Todos os grupos</option>${data.groups.filter(g=>!state.group||g.id===state.group).map(g=>UI.option(g.id,g.name,state.pieGroup)).join('')}</select></label>`,'feature-panel accuracy-panel')}
    ${panel('calendar','Horas por dia da semana','Volume total de estudos por dia, no período selecionado.',weekdayHTML(records),'','feature-panel weekday-panel')}
   </div>
   <div class="insight-grid compact-chart-grid">
    ${panel('error','Mais erros em números absolutos','Volume de questões erradas por conteúdo.',miniBarHTML(byErrors.slice(0,6),'errors'),'','compact-panel')}
    ${panel('error','Maior taxa de erros','Percentual de erros (mínimo de 10 questões).',dotRankHTML(byErrorRate.slice(0,6)),'','compact-panel')}
    ${panel('target','Menor desempenho','Conteúdos com ao menos 10 questões.',radialRanksHTML(byLow.slice(0,4),'low'),'','compact-panel')}
    ${panel('check','Maior desempenho','Conteúdos com ao menos 10 questões.',radialRanksHTML(byHigh.slice(0,4),'high'),'','compact-panel')}
   </div>
   <div class="insight-section-heading"><span class="heading-index">02</span><div><h2>Estudos</h2><p>Distribuição do tempo, assuntos recorrentes e dias de maior dedicação.</p></div></div>
   <div class="insight-grid compact-chart-grid study-grid">
    ${panel('book','Conteúdos mais estudados','Distribuição relativa das horas dos conteúdos mais recorrentes.',treemapHTML(byHours.slice(0,6)),'','compact-panel')}
    ${panel('error','Muito estudo e baixo desempenho','Tempo acima da mediana dos conteúdos e taxa de acerto inferior a 65% · mínimo de 10 questões.',difficultyHTML(difficulty.slice(0,4)),'','compact-panel')}
   </div>
   <div class="insight-section-heading"><span class="heading-index">03</span><div><h2>Revisões</h2><p>Contabiliza apenas atividades do tipo Revisão. Lembretes futuros não contam como sessões realizadas.</p></div></div>
   <div class="insight-grid">
    ${panel('grid','Revisões por grupo','Seis grupos com mais sessões de revisão realizadas.',revisionGroupsHTML(reviewByGroup.slice(0,6)),'','review-visual-panel')}
    ${panel('layers','Revisões por conteúdo','Seis conteúdos mais revisados.',revisionContentsHTML(reviewedContents.slice(0,6)),'','review-visual-panel')}
    ${panel('error','Maior necessidade de revisão','Índice de atenção: erros ÷ (1 + revisões), mínimo de 10 questões.',revisionNeedHTML(priority.slice(0,4)),'','review-visual-panel')}
    ${panel('clock','Poucas ou nenhuma revisão','Conteúdos estudados com menor frequência de revisões.',revisionCoverageHTML(uncovered.slice(0,6)),'','review-visual-panel')}
   </div>
   <div class="insight-section-heading"><span class="heading-index">04</span><div><h2>Comparativo visual de conteúdos</h2><p>Comparação de horas acumuladas e desempenho, sem tabelas de difícil leitura.</p></div></div>
   <div class="insight-grid performance-chart-grid">
     ${panel('clock','Horas dedicadas por conteúdo','Top 5 em horas · fatias proporcionais ao tempo entre os cinco conteúdos.',contentPieHTML(byHours.slice(0,5),'minutes'),'','content-pie-panel')}
     ${panel('target','Desempenho por conteúdo','Top 5 por taxa de acerto (mínimo 10 questões) · fatias indicam acertos absolutos; legenda mostra a taxa.',contentPieHTML(byHigh.slice(0,5),'correct'),'','content-pie-panel')}
   </div>`;
 }
 function getDayISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
 function calendarHTML(all){
  const date=state.calendarMonth,y=date.getFullYear(),m=date.getMonth(),length=new Date(y,m+1,0).getDate(),offset=(new Date(y,m,1).getDay()+6)%7;
  const dayMap=new Map();
  for(const r of all){if(!r.date.startsWith(`${y}-${String(m+1).padStart(2,'0')}`))continue;
   if(!dayMap.has(r.date))dayMap.set(r.date,{minutes:0,questions:0,correct:0,byGroup:{},count:0,sessions:[]});
   const d=dayMap.get(r.date);d.sessions.push(r);d.count++;d.minutes+=r.minutes;d.questions+=r.questions;d.correct+=r.correct;d.byGroup[r.groupId]=(d.byGroup[r.groupId]||0)+r.minutes;
  }
  const cells=Array.from({length:offset},()=>'<span class="calendar-blank" aria-hidden="true"></span>');
  for(let i=1;i<=length;i++){
   const iso=getDayISO(new Date(y,m,i)),d=dayMap.get(iso);
   const tooltip=d?`${U.fmtDate(iso)} • ${U.time(d.minutes)} • ${d.count} registro(s) • ${U.num(d.questions)} questões`:`${U.fmtDate(iso)} • Sem estudo`;
   cells.push(`<button type="button" data-stat-action="day" data-day="${iso}" class="calendar-day ${iso===U.today()?'is-today':''} ${state.selectedDay===iso?'is-selected':''} ${d?.minutes?'has-study':''} ${d?.minutes>0&&d.minutes<180?'is-light':''} ${d?.minutes>=180?'is-strong':''} ${d?.minutes>240?'is-intensive':''}" style="--day-color:${state.calendarColor}" title="${esc(tooltip)}" aria-label="${esc(tooltip)}" aria-pressed="${state.selectedDay===iso}"><span>${i}</span>${d?.minutes?`<small class="calendar-day-hours">${U.compactTime(d.minutes)}</small>`:''}</button>`);
  }

  const selected=state.selectedDay?dayMap.get(state.selectedDay):null;
  const sessions=selected?.sessions||[];
  const details=sessions.map(r=>{const g=group(r.groupId),c=content(r.contentId);return `<article class="calendar-session" style="--session-color:${g?.color||'#64748b'}"><div class="calendar-session-top"><span><i class="tiny-dot" style="--dot:${g?.color||'#64748b'}"></i>${esc(g?.name||'Grupo não encontrado')}</span><b>${U.compactTime(r.minutes)}</b></div><strong>${esc(c?.name||'Conteúdo não encontrado')}</strong><div class="session-meta"><span>${esc(r.banca)}</span><span>${esc(r.type)}</span><span>${U.num(r.questions)} questões</span><span>${U.num(r.correct)} acertos</span><span>${U.rate(U.pct(r.correct,r.questions))} de acertos</span></div>${r.notes?`<p class="session-note">${esc(r.notes)}</p>`:''}</article>`;}).join('');
  return `<div class="calendar-layout" style="--day-color:${state.calendarColor}"><div class="calendar-main"><div class="calendar-month-nav"><div class="calendar-month-name"><strong>${date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</strong><button type="button" class="text-link" data-stat-action="current-month">Hoje</button></div><div class="calendar-nav-actions"><button type="button" data-stat-action="prev-month" title="Mês anterior" aria-label="Mês anterior">${UI.icon('chevron',17)}</button><button type="button" data-stat-action="next-month" title="Próximo mês" aria-label="Próximo mês">${UI.icon('chevron',17)}</button></div></div><div class="calendar-weekdays">${DOW.map(x=>`<span>${x}</span>`).join('')}</div><div class="calendar-days">${cells.join('')}</div></div>
   <div class="calendar-aside"><div class="calendar-explain"><div class="calendar-color-heading"><div><strong>Cor do calendário</strong><small>Escolha a cor da intensidade.</small></div><label class="color-field" for="calendar-color"><input id="calendar-color" aria-label="Escolher cor do calendário" type="color" value="${state.calendarColor}"><span>${state.calendarColor.toUpperCase()}</span></label></div><div class="intensity-guide"><div><i class="level-sample level-low"></i><span>Menos de 3 horas<small>Tom suave</small></span></div><div><i class="level-sample level-mid"></i><span>De 3h a 4h<small>Tom acentuado</small></span></div><div><i class="level-sample level-high"></i><span>Mais de 4 horas<small>Borda em destaque</small></span></div></div><p>Selecione uma data para visualizar as sessões, conteúdos, questões e observações registrados.</p><small>O calendário respeita os filtros de grupo e banca independentemente do período escolhido.</small></div>${state.selectedDay?`<div class="calendar-selected"><div class="calendar-selected-heading"><strong>${U.fmtDate(state.selectedDay)}</strong><span>${selected?`${U.time(selected.minutes)} · ${selected.count} sessão(ões)`:'Sem sessões'}</span></div>${sessions.length?`<div class="calendar-session-list">${details}</div>`:`<p class="empty-day">Nenhum estudo foi registrado neste dia.</p>`}</div>`:''}</div></div>`;
 }
 function trendHTML(rs){
  // Eixo X fixo: outubro/2026 até fevereiro/2028 (17 meses).
  const pts=Array.from({length:17},(_,i)=>{
    const d=new Date(2026,9+i,1),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const totals=U.aggregate(rs.filter(r=>r.date.startsWith(key)));
    return {key,label:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),year:String(d.getFullYear()).slice(-2),questions:totals.questions,hours:totals.minutes/60};
  });
  const maxQ=Math.max(1,...pts.map(p=>p.questions)),maxH=Math.max(1,...pts.map(p=>p.hours));
  const W=1160,H=350,left=67,right=78,top=31,bottom=67,w=W-left-right,h=H-top-bottom;
  const x=i=>left+w*i/(pts.length-1),y=(v,max)=>top+h-v/max*h;
  function curve(key,max){const a=pts.map((p,i)=>({x:x(i),y:y(p[key],max)}));let d=`M${a[0].x},${a[0].y}`;for(let i=1;i<a.length;i++){const before=a[i-1],current=a[i],mid=(before.x+current.x)/2;d+=` C${mid},${before.y} ${mid},${current.y} ${current.x},${current.y}`;}return d;}
  const lines=[0,.25,.5,.75,1].map(f=>{const yy=top+(1-f)*h;return `<line x1="${left}" x2="${W-right}" y1="${yy}" y2="${yy}" class="trend-grid-line"/><text x="${left-12}" y="${yy+4}" text-anchor="end" class="trend-axis-label">${Math.round(maxQ*f).toLocaleString('pt-BR')}</text><text x="${W-right+12}" y="${yy+4}" class="trend-axis-label">${(maxH*f).toLocaleString('pt-BR',{maximumFractionDigits:1})}h</text>`;}).join('');
  const circles=(key,max,color)=>pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p[key],max)}" r="5" fill="${color}" stroke="var(--surface)" stroke-width="2.3" tabindex="0"><title>${p.label}/${p.year} — ${key==='hours'?p.hours.toLocaleString('pt-BR',{maximumFractionDigits:1})+' horas':p.questions+' questões'}</title></circle>`).join('');
  const totals=U.aggregate(rs.filter(r=>r.date>='2026-10-01'&&r.date<='2028-02-29'));
  return `<div class="trend-meta"><span><i style="background:#24b783"></i> Questões <small>eixo esquerdo</small></span><span><i style="background:#fa677a"></i> Horas <small>eixo direito</small></span><span class="trend-total">${U.num(totals.questions)} questões · ${U.time(totals.minutes)} no período</span></div><div class="trend-scroll"><svg class="trend-svg" role="img" aria-label="Linhas de outubro de 2026 a fevereiro de 2028: verde representa questões, vermelho representa horas" viewBox="0 0 ${W} ${H}">${lines}<path d="${curve('questions',maxQ)}" class="trend-line" stroke="#24b783"/><path d="${curve('hours',maxH)}" class="trend-line" stroke="#fa677a"/>${circles('questions',maxQ,'#24b783')}${circles('hours',maxH,'#fa677a')}${pts.map((p,i)=>`<text x="${x(i)}" y="${H-36}" text-anchor="middle" class="trend-x-label">${p.label}</text><text x="${x(i)}" y="${H-21}" text-anchor="middle" class="trend-x-label trend-year">${p.year}</text>`).join('')}</svg></div><p class="chart-footnote">O período é fixo; passe o mouse nos pontos para consultar os valores. Meses sem sessões permanecem zerados.</p>`;
 }
 function groupPieHTML(groups){
  const nonzero=groups.filter(g=>g.minutes>0),total=nonzero.reduce((s,g)=>s+g.minutes,0);
  if(!total)return empty('grid','Sem horas registradas','Registre sessões para visualizar a distribuição de tempo.');
  let from=0;
  const segments=nonzero.map(g=>{const a=from;from+=100*g.minutes/total;return `${g.color} ${a}% ${from}%`;});
  return `<div class="group-viz"><div class="group-pie" style="background:conic-gradient(${segments.join(',')})" role="img" aria-label="Distribuição proporcional das horas por grupo"><div><small>Tempo total</small><strong>${U.time(total)}</strong><small>${nonzero.length} grupos estudados</small></div></div><div class="group-viz-list">${nonzero.map(g=>{const pct=g.minutes/total*100;return `<div class="group-viz-item" title="${esc(g.name)}: ${U.time(g.minutes)}"><div class="group-viz-top"><i class="tiny-dot" style="--dot:${g.color}"></i><span>${esc(g.name)}</span><strong>${pct.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</strong></div><div class="group-viz-bottom"><div class="group-viz-track"><i style="width:${pct}%;background:${g.color}"></i></div><small>${U.time(g.minutes)}</small></div></div>`;}).join('')}</div></div>`;
 }
 function miniBarHTML(items,kind){
  if(!items.length)return empty('inbox','Sem dados suficientes','Amplie os filtros para visualizar o gráfico.');
  const max=Math.max(1,...items.map(o=>o.errors));
  return `<div class="compact-bars" role="img" aria-label="Erros absolutos por conteúdo">${items.map((o,i)=>`<div class="compact-bar" title="${esc(o.name)}: ${U.num(o.errors)} erros de ${U.num(o.questions)} questões"><strong>${U.num(o.errors)}</strong><div class="compact-bar-track"><span style="height:${Math.max(4,o.errors/max*100)}%"></span></div><small>${esc(o.name)}</small></div>`).join('')}</div>`;
 }
 function dotRankHTML(items){
  if(!items.length)return empty('inbox','Sem dados suficientes','Registre pelo menos 10 questões por conteúdo.');
  return `<div class="dot-ranks">${items.map(o=>{const val=U.pct(o.errors,o.questions)||0;return `<div class="dot-rank" title="${esc(o.name)} — ${o.errors} erros em ${o.questions} questões"><div class="dot-rank-info"><span>${esc(o.name)}</span><b>${val}%</b></div><div class="dot-rank-axis"><i style="left:${Math.min(100,val)}%"></i></div></div>`;}).join('')}<div class="dot-rank-labels"><span>0%</span><span>50%</span><span>100%</span></div></div>`;
 }
 function radialRanksHTML(items,mode){
  if(!items.length)return empty('inbox','Sem dados suficientes','É necessário ter no mínimo 10 questões por conteúdo.');
  const clr=mode==='high'?'#27bd97':'#f0817f';
  return `<div class="radial-ranks">${items.map(o=>`<div class="radial-rank" title="${esc(o.name)} — ${U.rate(o.rate)} em ${U.num(o.questions)} questões"><div class="radial-ring" style="--radial-value:${Math.max(0,Math.min(100,o.rate||0))}%;--radial-color:${clr}"><span>${U.rate(o.rate)}</span></div><strong>${esc(o.name)}</strong><small>${U.num(o.questions)} questões</small></div>`).join('')}</div>`;
 }
 function treemapHTML(items){
  if(!items.length)return empty('inbox','Sem horas registradas','Os assuntos com maior tempo serão exibidos aqui.');
  const total=items.reduce((n,x)=>n+x.minutes,0);
  const tile=o=>{const color=o.group?.color||'#4478eb',pct=total?o.minutes/total*100:0;return `<div class="treemap-tile" style="--tile-color:${color};flex:${Math.max(1,o.minutes)} 1 0%" title="${esc(o.name)} — ${U.time(o.minutes)}"><div><span>${esc(o.name)}</span><b>${U.time(o.minutes)}</b></div><small>${Math.round(pct)}% do tempo mostrado</small></div>`;};
  const rows=[items.slice(0,2),items.slice(2)];
  return `<div class="compact-treemap" role="img" aria-label="Mosaico com áreas proporcionais às horas dos seis conteúdos mais estudados">${rows.filter(r=>r.length).map(r=>`<div class="treemap-row" style="flex:${r.reduce((n,x)=>n+x.minutes,0)} 1 0%">${r.map(tile).join('')}</div>`).join('')}</div>`;
 }
 function difficultyHTML(items){
  if(!items.length)return empty('check','Sem pontos críticos','Nenhum conteúdo atingiu simultaneamente tempo acima da mediana e taxa de acerto menor que 65%.');
  return `<div class="effort-alerts" role="list" aria-label="Conteúdos de alto tempo de estudo e baixo aproveitamento">${items.map(o=>`<article role="listitem" class="effort-alert" title="${esc(o.name)}: ${U.time(o.minutes)} e ${U.rate(o.rate)} em ${U.num(o.questions)} questões"><div class="effort-alert-main"><div class="effort-score" style="--effort-rate:${Math.min(100,Math.max(0,o.rate||0))}%"><strong>${U.rate(o.rate)}</strong><span>acertos</span></div><div class="effort-detail"><strong title="${esc(o.name)}">${esc(o.name)}</strong><span>${esc(o.group?.name||'Grupo não encontrado')}</span><div class="effort-time">${UI.icon('clock',14)} <b>${U.time(o.minutes)}</b><small>de estudo</small></div></div></div><div class="effort-footer"><span>${U.num(o.questions)} questões</span><span>Meta de referência: 65%</span></div></article>`).join('')}</div>`;
 }
 function revisionGroupsHTML(items){
  if(!items.length)return empty('inbox','Nenhuma revisão registrada','Os grupos aparecem após a realização de revisões.');
  const max=Math.max(1,...items.map(o=>o.revisions));
  return `<div class="revision-vertical" role="list" aria-label="Quantidade de revisões por grupo">${items.map(o=>`<div class="revision-vertical-item" role="listitem" title="${esc(o.name)}: ${U.num(o.revisions)} revisões"><b>${U.num(o.revisions)}</b><div class="revision-vertical-axis"><i style="height:${Math.max(6,100*o.revisions/max)}%;--revision-bar:${o.color||'#6477de'}"></i></div><span class="revision-vertical-label">${esc(o.name)}</span></div>`).join('')}</div><div class="revision-footnote">Cada coluna representa o número de revisões concluídas no grupo.</div>`;
 }
 function revisionContentsHTML(items){
  if(!items.length)return empty('inbox','Nenhuma revisão registrada','Conteúdos revisados aparecerão aqui.');
  return `<div class="revision-content-tiles" role="list">${items.map((o,i)=>`<article class="revision-content-tile" role="listitem"><div class="revision-count" style="--revision-shade:${o.group?.color||'#6a87e8'}"><b>${U.num(o.revision)}</b><small>${o.revision===1?'vez':'vezes'}</small></div><div class="revision-content-info"><strong title="${esc(o.name)}">${esc(o.name)}</strong><small title="${esc(o.group?.name||'')}">${esc(o.group?.name||'Sem grupo')}</small></div></article>`).join('')}</div>`;
 }
 function revisionNeedHTML(items){
  if(!items.length)return empty('check','Nenhuma necessidade identificada','Registre questões para calcular a prioridade de revisão.');
  return `<div class="revision-priority-grid" role="list">${items.map((o,i)=>`<article class="revision-priority-item" role="listitem" title="${esc(o.name)}: ${o.errors} erros, ${o.revision} revisões, ${U.rate(o.rate)} de acerto"><div class="revision-priority-top"><span class="priority-index">${String(i+1).padStart(2,'0')}</span><span class="priority-label">${i===0?'Maior atenção':'Atenção'}</span></div><strong class="priority-content" title="${esc(o.name)}">${esc(o.name)}</strong><div class="revision-priority-metrics"><div><b>${U.num(o.errors)}</b><small>erros</small></div><div><b>${U.num(o.revision)}</b><small>revisões</small></div><div><b>${U.rate(o.rate)}</b><small>acertos</small></div></div></article>`).join('')}</div>`;
 }
 function revisionCoverageHTML(items){
  if(!items.length)return empty('inbox','Nenhum conteúdo estudado','Registre estudos para visualizar a cobertura de revisão.');
  return `<div class="revision-coverage-grid" role="list">${items.map(o=>`<article class="revision-coverage-item" role="listitem" title="${esc(o.name)}: ${o.studies} estudos e ${o.revision} revisões"><div class="coverage-marker ${o.revision===0?'zero-reviews':'some-reviews'}"><b>${U.num(o.revision)}</b><small>${o.revision===1?'revisão':'revisões'}</small></div><div class="coverage-info"><strong title="${esc(o.name)}">${esc(o.name)}</strong><small>${U.num(o.studies)} estudo${o.studies===1?'':'s'} realizado${o.studies===1?'':'s'}</small></div></article>`).join('')}</div>`;
 }
 // As fatias nunca somam taxas individuais: para desempenho, representam
 // a DISTRIBUIÇÃO DE ACERTOS ABSOLUTOS entre os cinco melhores conteúdos.
 // A taxa de cada conteúdo continua explícita na legenda.
 function contentPieHTML(items,kind){
  if(!items.length)return empty('chart','Sem dados suficientes','Registre horas e questões para exibir os cinco primeiros conteúdos.');
  const palette=['#4878e9','#9e6ae9','#1bb8a6','#e5a844','#e66b89'];
  const values=items.map(o=>kind==='minutes'?o.minutes:o.correct);
  const total=values.reduce((a,b)=>a+b,0);
  if(total<=0)return empty('chart','Sem valores para o gráfico','Não há horas ou acertos suficientes para calcular a distribuição.');
  let current=0;
  const stops=items.map((o,i)=>{const begin=current;current+=100*values[i]/total;return `${palette[i]} ${begin}% ${current}%`;});
  return `<div class="group-viz content-donut-viz"><div class="group-pie" role="img" aria-label="${kind==='minutes'?'Proporção de horas':'Distribuição de acertos absolutos'} entre os cinco conteúdos" style="background:conic-gradient(${stops.join(',')})"><div><small>${kind==='minutes'?'Horas · Top 5':'Acertos · Top 5'}</small><strong>${kind==='minutes'?U.time(total):U.num(total)}</strong><small>${kind==='minutes'?'somente top 5':'acertos somados'}</small></div></div><div class="group-viz-list content-donut-legend">${items.map((o,i)=>{const percent=values[i]/total*100;const label=kind==='minutes'?U.time(o.minutes):U.rate(o.rate);const tooltip=kind==='minutes'?`${U.time(o.minutes)}, ${percent.toFixed(1)}% do tempo entre os cinco`:`${U.num(o.correct)} acertos em ${U.num(o.questions)} questões, ${U.rate(o.rate)} de aproveitamento`;return `<div class="group-viz-item" title="${esc(o.name)} — ${esc(tooltip)}"><div class="group-viz-top"><i class="tiny-dot" style="--dot:${palette[i]}"></i><span title="${esc(o.name)}">${esc(o.name)}</span><strong>${label}</strong></div><div class="group-viz-bottom"><div class="group-viz-track"><i style="width:${percent}%;background:${palette[i]}"></i></div><small>${kind==='minutes'?`${percent.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`:`${U.num(o.correct)} acertos`}</small></div></div>`;}).join('')}</div></div>`;
 }
 function columnHTML(items,kind){
  if(!items.length)return empty('chart','Sem dados suficientes','Registre horas e questões para gerar o comparativo.');
  const value=x=>kind==='minutes'?x.minutes/60:x.rate;
  const max=kind==='minutes'?Math.max(1,...items.map(value)):100;
  return `<div class="column-chart" role="img" aria-label="Gráfico de colunas de ${kind==='minutes'?'horas por conteúdo':'desempenho por conteúdo'}"><div class="column-grid"><span>${kind==='minutes'?Math.ceil(max):'100'}${kind==='minutes'?'h':'%'}</span><span>${kind==='minutes'?Math.round(max/2):'50'}${kind==='minutes'?'h':'%'}</span><span>0</span></div><div class="column-bars">${items.map(c=>{const v=value(c),pct=Math.max(0,Math.min(100,v/max*100)),val=kind==='minutes'?U.time(c.minutes):U.rate(c.rate);return `<div class="column-item" title="${esc(c.name)}: ${val}"><strong>${esc(val)}</strong><div class="column-track"><span style="--bar-height:${pct}%;--bar-color:${kind==='rate'?(c.rate>=70?'#28b98d':c.rate>=50?'#f4bd62':'#f07882'):(c.group?.color||'#4b91e8')}"></span></div><small title="${esc(c.name)}">${esc(c.name)}</small></div>`;}).join('')}</div></div>`;
 }
 function accuracyHTML(records){
  const r=state.pieGroup?records.filter(x=>x.groupId===state.pieGroup):records,a=U.aggregate(r);
  if(!a.questions)return empty('target','Sem questões respondidas','Registre questões ou selecione outro grupo.');
  const percent=a.correct/a.questions*100;
  return `<div class="accuracy-layout"><div class="accuracy-donut" style="--accuracy:${percent}%" role="img" aria-label="${U.num(a.correct)} acertos e ${U.num(a.errors)} erros"><div><strong>${U.rate(a.rate)}</strong><small>de acertos</small></div></div><div class="accuracy-summary"><div><i style="--dot:#1eac7a"></i><span>Acertos</span><strong>${U.num(a.correct)}</strong></div><div><i style="--dot:#e96b76"></i><span>Erros</span><strong>${U.num(a.errors)}</strong></div><small><b>${U.num(a.questions)}</b> questões respondidas</small></div></div>`;
 }
 function rankingHTML(items,kind,label){
  if(!items.length)return empty('inbox','Sem dados suficientes',kind==='difficulty'?'Nenhum conteúdo atende simultaneamente aos critérios de dificuldade.':'Adicione registros ou amplie os filtros para obter resultados.');
  const values=items.map(o=>kind==='minutes'?o.minutes:kind==='errors'?o.errors:kind==='revisions'?o.revisions:kind==='need'?o.errors/(1+o.revision):kind==='coverage'?o.studies:kind==='difficulty'?o.minutes:kind==='error-rate'?U.pct(o.errors,o.questions):o.rate||0);
  const max=(kind==='rate'||kind==='error-rate')?100:Math.max(...values,1);
  return `<div class="insight-ranked">${items.map((o,i)=>{
   const g=o.group||group(o.groupId)||o,color=g?.color||o.color||'#397AF5',v=values[i];
   let primary,secondary='';
   if(kind==='minutes')primary=U.time(o.minutes);
   if(kind==='errors') {primary=U.num(o.errors)+' erros';secondary=`${U.num(o.questions)} questões · ${U.rate(o.rate)} acertos`;}
   if(kind==='error-rate'){primary=U.rate(U.pct(o.errors,o.questions));secondary=`${U.num(o.errors)} erros de ${U.num(o.questions)} questões`;}
   if(kind==='rate'){primary=U.rate(o.rate);secondary=`${U.num(o.questions)} questões`;}
   if(kind==='revisions'){primary=`${U.num(o.revisions)} ${o.revisions===1?'revisão':'revisões'}`;secondary=o.questions?`${U.num(o.questions)} questões realizadas`:'';}
   if(kind==='need'){primary=`${U.num(o.errors)} erros`;secondary=`${o.revision} revisões · ${U.rate(o.rate)} acertos`;}
   if(kind==='coverage'){primary=o.revision?`${o.revision} revisão(ões)`:'Nenhuma revisão';secondary=`${o.studies} estudo(s) registrado(s)`;}
   if(kind==='difficulty'){primary=U.time(o.minutes);secondary=`${U.rate(o.rate)} de acertos · ${U.num(o.questions)} questões`;}
   return `<div class="insight-item"><div class="insight-line"><span class="insight-name"><i class="tiny-dot" style="--dot:${color}"></i><span title="${esc(o.name)}">${esc(o.name)}</span></span><strong>${primary}</strong></div>${secondary?`<div class="insight-secondary">${secondary}</div>`:''}<div class="insight-track"><span style="width:${Math.max(v?3:0,v/max*100)}%;background:${kind==='errors'||kind==='error-rate'||kind==='need'||kind==='difficulty'?'#e96b76':kind==='rate'?'#21a77c':color}"></span></div></div>`;
  }).join('')}</div>`;
 }
 function weekdayHTML(rs){
  if(!rs.length)return empty('calendar','Nenhum estudo registrado','Adicione sessões para ver a distribuição semanal.');
  const values=Array(7).fill(0);for(const r of rs)values[new Date(r.date+'T12:00:00').getDay()]+=r.minutes;
  const max=Math.max(1,...values),order=[1,2,3,4,5,6,0];
  return `<div class="weekday-columns">${order.map(d=>`<div class="weekday-column" title="${WEEK[d]}: ${U.time(values[d])}"><b>${U.compactTime(values[d])}</b><div><span style="height:${values[d]/max*100}%"></span></div><small>${WEEK[d].split('-')[0].slice(0,3)}</small></div>`).join('')}</div>`;
 }
 document.addEventListener('DOMContentLoaded',init);
})();
