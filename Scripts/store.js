/* Persistência no arquivo Data/dados.js via servidor local Node.js (sem banco). */
(function () {
  'use strict';
  const KEY = 'concursoplus:dataset:v1';
  const THEME_KEY = 'concursoplus:theme';
  const BANCAS = ['FCC', 'FGV', 'CEBRASPE', 'VUNESP', 'IBFC'];
  const PRIORITIES = ['Alta', 'Média', 'Baixa'];
  const COLORS = ['#397AF5','#8D5CEB','#18A879','#ED6579','#F49A35','#12A9BC','#64748B','#C16CC9','#E34F4F','#F97316','#EAB308','#84CC16','#16A34A','#0D9488','#0891B2','#2563EB','#4F46E5','#7C3AED','#A855F7','#DB2777','#BE123C','#92400E','#475569','#0F766E','#6D28D9','#65A30D','#B45309','#06B6D4'];
  const uuid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const daysFromNow = n => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return localDate(d); };
  const clone = data => JSON.parse(JSON.stringify(data));

  function seed() {
    const groups = [
      {id:'g-const',name:'Direito Constitucional',priority:'Alta',color:'#ED6579'},
      {id:'g-port',name:'Português',priority:'Média',color:'#8D5CEB'},
      {id:'g-info',name:'Informática',priority:'Média',color:'#397AF5'}
    ];
    const contents = [
      {id:'c-fund',groupId:'g-const',name:'Direitos Fundamentais',priority:'Alta'},
      {id:'c-estado',groupId:'g-const',name:'Organização do Estado',priority:'Média'},
      {id:'c-texto',groupId:'g-port',name:'Interpretação de Texto',priority:'Alta'},
      {id:'c-crase',groupId:'g-port',name:'Crase',priority:'Média'},
      {id:'c-poo',groupId:'g-info',name:'Programação Orientada a Objetos',priority:'Média'},
      {id:'c-sql',groupId:'g-info',name:'Banco de Dados e SQL',priority:'Alta'}
    ];
    const raw = [
      ['r-1','g-info','c-poo','FCC',-1,'Estudo',95,40,32,'Conferir questões sobre polimorfismo.'],
      ['r-2','g-port','c-texto','CEBRASPE',-2,'Estudo',75,30,21,'Revisar inferências e pressupostos.'],
      ['r-3','g-const','c-fund','FGV',-3,'Revisão',45,25,17,'Retomar os artigos 5º e 6º.'],
      ['r-4','g-info','c-sql','FCC',-4,'Estudo',110,38,31,'Questões envolvendo JOIN e GROUP BY.'],
      ['r-5','g-port','c-crase','VUNESP',-5,'Estudo',60,24,18,'Reforçar casos facultativos.'],
      ['r-6','g-const','c-estado','IBFC',-6,'Estudo',80,32,25,'Competências legislativas.'],
      ['r-7','g-info','c-poo','FGV',-8,'Revisão',40,15,13,'Retomada do conteúdo.']
    ];
    const records = raw.map(([id,groupId,contentId,banca,days,type,minutes,questions,correct,notes], index) => ({
      id,groupId,contentId,banca,date:daysFromNow(days),type,minutes,questions,correct,notes,
      createdAt:new Date(Date.now()-index*60000).toISOString()
    }));
    const reviews = [
      {id:'v-1',sourceRecordId:'r-2',groupId:'g-port',contentId:'c-texto',banca:'CEBRASPE',notes:'Revisar inferências e pressupostos.',createdAt:daysFromNow(-2),dueDate:daysFromNow(2)},
      {id:'v-2',sourceRecordId:'r-4',groupId:'g-info',contentId:'c-sql',banca:'FCC',notes:'Questões envolvendo JOIN e GROUP BY.',createdAt:daysFromNow(-4),dueDate:daysFromNow(5)}
    ];
    return {version:1, isDemo:true, groups,contents,records,reviews,updatedAt:new Date().toISOString()};
  }
  let cache=null;
  const ready = (async () => {
    const response = await fetch('/api/data', {cache:'no-store'});
    if (!response.ok) {let detail;try{detail=(await response.json()).error;}catch{} throw new Error(detail||'Não foi possível ler Data/dados.js. Inicie com npm start.');}
    const loaded=await response.json();validateStructure(loaded);cache=loaded;
    return loaded;
  })();
  ready.catch(err=>{console.error('Concurso+:',err);document.addEventListener('DOMContentLoaded',()=>{document.querySelector('#app').innerHTML=`<div style="max-width:640px;margin:12vh auto;font:16px system-ui;padding:28px;"><h1>Não foi possível iniciar o Concurso+</h1><p>${err.message}</p><p>Na pasta do projeto, execute <code>npm start</code> e acesse <code>http://127.0.0.1:3100</code>.</p></div>`;});});
  function load() {
    if (!cache) throw new Error('Dados não carregados. Inicie com npm start.');
    return clone(cache);
  }
  function validateStructure(data) {
    if (!data || data.version!==1 || !['groups','contents','records','reviews'].every(k=>Array.isArray(data[k]))) throw new Error('Arquivo de dados incompatível ou incompleto.');
  }
  function validDate(x) {
    if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
    const [y,m,d]=x.split('-').map(Number);
    const dt = new Date(y,m-1,d);
    return dt.getFullYear()===y && dt.getMonth()+1===m && dt.getDate()===d;
  }
  function requiredName(name, label) { const n=String(name||'').trim().replace(/\s+/g,' '); if (n.length<2 || n.length>90) throw new Error(`${label}: utilize entre 2 e 90 caracteres.`); return n; }
  function uniqueName(collection, name, exceptId) { if (collection.some(i => i.id!==exceptId && i.name.localeCompare(name,'pt-BR',{sensitivity:'base'})===0)) throw new Error('Já existe um item com esse nome.'); }
  function checkData(data) {
    validateStructure(data);
    const groupIds=new Set(), contentIds=new Set(), recordIds=new Set(), reviewIds=new Set();
    if (data.groups.length>10000 || data.contents.length>100000 || data.records.length>200000 || data.reviews.length>100000) throw new Error('Arquivo excede os limites admitidos.');
    for (const g of data.groups) {
      if (!g.id || groupIds.has(g.id)) throw new Error('Identificador de grupo inválido.'); groupIds.add(g.id);
      requiredName(g.name,'Grupo');
      if (!PRIORITIES.includes(g.priority) || !COLORS.includes(g.color)) throw new Error('Prioridade ou cor de grupo inválida.');
    }
    for (const c of data.contents) {
      if (!c.id || contentIds.has(c.id) || !groupIds.has(c.groupId)) throw new Error('Conteúdo inválido ou sem grupo.'); contentIds.add(c.id);
      requiredName(c.name,'Conteúdo'); if (!PRIORITIES.includes(c.priority)) throw new Error('Prioridade de conteúdo inválida.');
    }
    for (const r of data.records) {
      if (!r.id || recordIds.has(r.id) || !groupIds.has(r.groupId) || !contentIds.has(r.contentId)) throw new Error('Registro inválido.'); recordIds.add(r.id);
      const content=data.contents.find(c=>c.id===r.contentId);
      if (content.groupId!==r.groupId || !BANCAS.includes(r.banca) || !['Estudo','Revisão'].includes(r.type) || !validDate(r.date)) throw new Error('Campos de registro inconsistentes.');
      if (![r.minutes,r.questions,r.correct].every(v=>Number.isSafeInteger(v)&&v>=0) || r.minutes>599999 || r.questions>1000000 || r.correct>r.questions || r.notes?.length>500) throw new Error('Valores numéricos ou anotações inválidos.');
    }
    for (const v of data.reviews) {
      if (!v.id || reviewIds.has(v.id) || !groupIds.has(v.groupId) || !contentIds.has(v.contentId) || data.contents.find(c=>c.id===v.contentId)?.groupId!==v.groupId || !BANCAS.includes(v.banca) || !validDate(v.createdAt) || !validDate(v.dueDate) || (v.notes||'').length>500) throw new Error('Lembrete de revisão inválido.'); reviewIds.add(v.id);
    }
    return true;
  }
  async function save(data) {
    checkData(data);
    const expectedRevision=cache?.revision||0;
    const response=await fetch('/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,expectedRevision})});
    if(!response.ok){let error='Não foi possível salvar o arquivo de dados.';try{error=(await response.json()).error||error;}catch{}throw new Error(error);}
    const saved=await response.json();
    data.revision=saved.revision;data.updatedAt=saved.updatedAt;
    cache=clone(data);
    window.dispatchEvent(new CustomEvent('concursoplus:changed'));
    return clone(data);
  }
  function modify(fn) { const d=load(); fn(d); d.isDemo=false; return save(d); }
  function createGroup(payload,id) {
    return modify(d=>{
      const name=requiredName(payload.name,'Grupo'); uniqueName(d.groups,name,id);
      if (!PRIORITIES.includes(payload.priority) || !COLORS.includes(payload.color)) throw new Error('Prioridade ou cor inválida.');
      if (id) { const g=d.groups.find(v=>v.id===id); if(!g)throw new Error('Grupo não encontrado.'); Object.assign(g,{name,priority:payload.priority,color:payload.color}); }
      else d.groups.push({id:uuid(),name,priority:payload.priority,color:payload.color});
    });
  }
  function createContent(payload,id) {
    return modify(d=>{
      const name=requiredName(payload.name,'Conteúdo');
      if (!d.groups.some(g=>g.id===payload.groupId)) throw new Error('Selecione um grupo existente.');
      if (!PRIORITIES.includes(payload.priority)) throw new Error('Prioridade inválida.');
      uniqueName(d.contents.filter(c=>c.groupId===payload.groupId),name,id);
      if (id) {
        const c=d.contents.find(x=>x.id===id); if(!c)throw new Error('Conteúdo não encontrado.');
        if (c.groupId!==payload.groupId && d.records.some(r=>r.contentId===id)) throw new Error('Não é possível transferir um conteúdo que já possui registros.');
        Object.assign(c,{name,groupId:payload.groupId,priority:payload.priority});
      } else d.contents.push({id:uuid(),name,groupId:payload.groupId,priority:payload.priority});
    });
  }
  function createRecord(payload,id) {
    return modify(d=>{
      const c=d.contents.find(x=>x.id===payload.contentId);
      if (!c || c.groupId!==payload.groupId) throw new Error('Escolha um conteúdo pertencente ao grupo selecionado.');
      if (!BANCAS.includes(payload.banca)) throw new Error('Escolha uma banca da lista.');
      if (!['Estudo','Revisão'].includes(payload.type)) throw new Error('Tipo inválido.');
      if (!validDate(payload.date)) throw new Error('Selecione uma data válida.');
      const {minutes,questions,correct} = payload;
      if (![minutes,questions,correct].every(n=>Number.isSafeInteger(n)&&n>=0) || minutes>599999 || questions>1000000 || correct>questions) throw new Error('Revise os valores de tempo, questões e acertos.');
      if (questions===0 && correct!==0) throw new Error('Sem questões, os acertos devem ser zero.');
      if (minutes===0 && questions===0) throw new Error('Informe horas estudadas ou questões respondidas.');
      const notes=String(payload.notes||'').trim(); if(notes.length>500)throw new Error('As anotações aceitam até 500 caracteres.');
      const record={groupId:payload.groupId,contentId:payload.contentId,banca:payload.banca,date:payload.date,type:payload.type,minutes,questions,correct,notes};
      let recordId=id;
      if (id) { const existing=d.records.find(r=>r.id===id); if(!existing)throw new Error('Registro não encontrado.'); Object.assign(existing,record); }
      else { recordId=uuid(); d.records.push({id:recordId,...record,createdAt:new Date().toISOString()}); }
      if(payload.scheduleReview) {
        if (!validDate(payload.dueDate) || payload.dueDate<=payload.date) throw new Error('A revisão futura deve ocorrer após a data do registro.');
        d.reviews.push({id:uuid(),sourceRecordId:recordId,groupId:record.groupId,contentId:record.contentId,banca:record.banca,notes:record.notes,createdAt:record.date,dueDate:payload.dueDate});
      }
    });
  }
  function remove(kind,id) {
    return modify(d=>{
      if(kind==='record') { d.records=d.records.filter(r=>r.id!==id); }
      else if(kind==='review') { d.reviews=d.reviews.filter(r=>r.id!==id); }
      else if(kind==='content') {
        d.contents=d.contents.filter(c=>c.id!==id);
        d.records=d.records.filter(r=>r.contentId!==id);
        d.reviews=d.reviews.filter(v=>v.contentId!==id);
      } else if(kind==='group') {
        d.groups=d.groups.filter(g=>g.id!==id);
        d.contents=d.contents.filter(c=>c.groupId!==id);
        d.records=d.records.filter(r=>r.groupId!==id);
        d.reviews=d.reviews.filter(v=>v.groupId!==id);
      } else throw new Error('Tipo desconhecido.');
    });
  }
  function setTheme(theme) { if(!['light','dark'].includes(theme))throw new Error('Tema inválido.');const d=load();d.preferences={...(d.preferences||{}),theme};return save(d); }
  function empty() { return save({version:1,isDemo:false,groups:[],contents:[],records:[],reviews:[],preferences:{theme:load().preferences?.theme||'light'},updatedAt:new Date().toISOString()}); }
  function importData(json) {
    const d=typeof json==='string'?JSON.parse(json):json;
    checkData(d);
    return save({...clone(d),isDemo:false,version:1});
  }
  window.AppStore = {KEY,THEME_KEY,BANCAS,PRIORITIES,COLORS,ready,load,save,createGroup,createContent,createRecord,remove,setTheme,empty,importData,daysFromNow};
})();
