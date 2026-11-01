(function () {
 'use strict';
 const esc = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmtDate = d => { if(!d)return '—'; const [y,m,day]=d.split('-');return `${day}/${m}/${y}`; };
 const today = () => AppStore.daysFromNow(0);
 const time = min => `${Math.floor((min||0)/60)}h ${String((min||0)%60).padStart(2,'0')}min`;
 const compactTime = min => `${Math.floor((min||0)/60)}h${String((min||0)%60).padStart(2,'0')}`;
 const num = n => Number(n||0).toLocaleString('pt-BR');
 const pct=(a,b)=>b?Math.round(a/b*100):null;
 const normalized = v => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const score = p => p===null?'neutral':p>=75?'good':p>=50?'medium':'bad';
 const rate = p => p===null?'—':`${p}%`;
 function sumRecords(records){
  return records.reduce((acc,r)=>{acc.count++;acc.minutes+=r.minutes;acc.questions+=r.questions;acc.correct+=r.correct; if(r.type==='Revisão')acc.revisions++; return acc;},{count:0,minutes:0,questions:0,correct:0,revisions:0});
 }
 const aggregate = rs => {const a=sumRecords(rs);return {...a,errors:a.questions-a.correct,rate:pct(a.correct,a.questions)};};
 const sortRecent = (a,b) => b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''));
 const byDate = (a,b)=>a.dueDate.localeCompare(b.dueDate);
 const priorityRank = {'Alta':0,'Média':1,'Baixa':2};
 const priorityTag = p => `<span class="priority priority-${p==='Alta'?'high':p==='Média'?'medium':'low'}">${esc(p)}</span>`;
 const rateTag = p => `<span class="rate rate-${score(p)}">${rate(p)}</span>`;
 const itemById=(arr,id)=>arr.find(x=>x.id===id);
 const lookup = data => ({group:id=>itemById(data.groups,id),content:id=>itemById(data.contents,id)});
 const reviewStatus = d => d < today() ? 'overdue' : d===today() ? 'today' : 'later';
 const daysBetween = (a,b) => Math.round((new Date(`${b}T12:00:00`)-new Date(`${a}T12:00:00`))/86400000);
 const chartColor = (g) => g?.color||'#8192AE';
 window.U = {esc,fmtDate,today,time,compactTime,num,pct,normalized,score,rate,sumRecords,aggregate,sortRecent,byDate,priorityRank,priorityTag,rateTag,itemById,lookup,reviewStatus,daysBetween,chartColor};
})();
