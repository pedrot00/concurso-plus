'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
function makeData(){const s=fs.readFileSync(path.join(base,'tests/fixture.js'),'utf8');return JSON.parse(s.slice(s.indexOf('globalThis.CONCURSOPLUS_DATA = ')+ 'globalThis.CONCURSOPLUS_DATA = '.length).trim().replace(/;$/,''));}
async function render(which) {
  const elements=new Map(),handlers=[];
  const element=key=>{if(!elements.has(key))elements.set(key,{value:'',innerHTML:'',addEventListener(type,cb){handlers.push({key,type,cb});}});return elements.get(key);};
  const ctx={Date,JSON,Math,Number,String,Array,Object,Set,Map,Intl,Promise,console,crypto:globalThis.crypto,CustomEvent:function(){},window:null,document:{addEventListener(type,cb){if(type==='DOMContentLoaded')handlers.push({type,cb});},querySelector:element},UI:{chrome(){},icon(){return '<svg></svg>';},option(v,t){return `<option value="${v}">${t}</option>`;},emptyState(icon,title){return `<p>${title}</p>`;},toast(){}},fetch:async(url,opts)=>{
    if(url==='/api/data'&&(!opts||opts.cache==='no-store'))return {ok:true,json:async()=>makeData()};
    throw Error('Unexpected fetch '+url);
  }};
  ctx.window=ctx;
  ctx.addEventListener=()=>{};
  vm.createContext(ctx);
  for (const file of ['Scripts/store.js','Scripts/utils.js',`Scripts/${which}.js`])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});
  for(const h of handlers.filter(x=>x.type==='DOMContentLoaded'))await h.cb();
  await Promise.resolve();await Promise.resolve();
  return {elements,handlers,ctx};
}
test('estatísticas são gráficos e calendário detalhado',async()=>{
  const v=await render('estatisticas');
  const html=v.elements.get('#stats-body').innerHTML;
  assert.ok(html.length>20000,'A visualização deve ser renderizada');
  assert.match(html,/outubro de 2026 a fevereiro de 2028/i);
  assert.match(html,/Calendário de estudos/);
  assert.equal(/<table/i.test(html),false,'Não deve haver tabelas nas estatísticas');
  assert.match(html,/content-donut-viz/,'Comparativos devem usar roscas com legenda');
  assert.match(html,/revision-vertical/,'Revisões por grupo devem usar colunas compactas');
  assert.match(html,/revision-content-tiles/,'Revisões por conteúdo devem usar mosaico');
  assert.match(html,/revision-priority-grid/,'Prioridades devem ser legíveis');
  assert.match(html,/revision-coverage-grid/,'Cobertura de revisões deve ser legível');
  assert.equal((html.match(/class=\"group-viz content-donut-viz/g)||[]).length,2);
  assert.ok(html.indexOf('Grupos mais estudados')>html.indexOf('Calendário de estudos'));
  assert.ok(html.indexOf('Grupos mais estudados')<html.indexOf('Questões e horas ao longo dos meses'));
  assert.match(html,/conic-gradient/);
  assert.match(html,/>out<\/text>/);
  assert.match(html,/>fev<\/text>/);
  const click=v.handlers.find(x=>x.key==='#stats-body'&&x.type==='click');
  click.cb({target:{closest(){return {dataset:{statAction:'day',day:'2026-10-12'}};}}});
  const selected=v.elements.get('#stats-body').innerHTML;
  assert.match(selected,/calendar-session/);
  assert.match(selected,/Programação Orientada a Objetos/);
  assert.match(selected,/40 questões/);
  assert.match(selected,/32 acertos/);
});
test('registros exibem notas para hover e revisões antes de grupos',async()=>{
  const v=await render('registros');
  const html=v.elements.get('#reg-body').innerHTML;
  assert.match(html,/data-note=/);
  assert.match(html,/Revisões realizadas/);
  assert.match(html,/Revisões futuras/);
  assert.match(html,/Conteúdos por grupo/);
  assert.ok(html.indexOf('Revisões realizadas')<html.indexOf('Conteúdos por grupo'));
});
