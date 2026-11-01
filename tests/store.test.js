'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const clone=o=>JSON.parse(JSON.stringify(o));
const raw=fs.readFileSync(path.join(root,'tests/fixture.js'),'utf8');
const demo=JSON.parse(raw.slice(raw.indexOf('globalThis.CONCURSOPLUS_DATA = ')+ 'globalThis.CONCURSOPLUS_DATA = '.length).trim().replace(/;$/,''));
function app(remote){
  const context={JSON,Number,Math,Array,Object,Date,String,Promise,Set,Map,crypto:globalThis.crypto,CustomEvent:function(){},document:{addEventListener(){}},console};
  context.window=context;context.addEventListener=()=>{};context.dispatchEvent=()=>{};
  context.fetch=async(url,opts)=>{
    if(url==='/api/data' && opts.method==='PUT'){
      const {data,expectedRevision}=JSON.parse(opts.body);
      if(expectedRevision!==remote.data.revision)return {ok:false,json:async()=>({error:'Conflito de escrita'})};
      remote.data=clone(data);remote.data.revision++;remote.data.updatedAt='2026-10-13T14:00:00Z';
      return {ok:true,json:async()=>({revision:remote.data.revision,updatedAt:remote.data.updatedAt})};
    }
    if(url==='/api/data')return {ok:true,json:async()=>clone(remote.data)};
    throw Error('Rota não reconhecida');
  };
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'Scripts/store.js'),'utf8'),context);
  return context.AppStore;
}
test('grupos, conteúdos, registros, revisão e tema são salvos no arquivo remoto',async()=>{
  const remote={data:clone(demo)},store=app(remote);await store.ready;
  await store.createGroup({name:'Matemática Financeira',priority:'Alta',color:'#397AF5'});
  const group=store.load().groups.find(g=>g.name==='Matemática Financeira');assert.ok(group);
  await store.createContent({name:'Juros Compostos',priority:'Média',groupId:group.id});
  const content=store.load().contents.find(c=>c.name==='Juros Compostos');assert.ok(content);
  await store.createRecord({groupId:group.id,contentId:content.id,banca:'FGV',date:'2026-10-13',type:'Estudo',minutes:125,questions:20,correct:13,notes:'Revisar taxas equivalentes',scheduleReview:true,dueDate:'2026-10-20'});
  assert.ok(remote.data.records.some(r=>r.contentId===content.id));
  assert.ok(remote.data.reviews.some(r=>r.contentId===content.id));
  await store.setTheme('dark');assert.equal(remote.data.preferences.theme,'dark');
  assert.equal(remote.data.revision,4);
  // Simula fechamento e abertura da aplicação: lê novamente os dados remotos.
  const reopened=app(remote);await reopened.ready;
  assert.ok(reopened.load().records.some(r=>r.contentId===content.id));
  assert.equal(reopened.load().preferences.theme,'dark');
  const review=reopened.load().reviews.find(r=>r.contentId===content.id);
  await reopened.remove('review',review.id);
  assert.ok(!remote.data.reviews.some(r=>r.id===review.id));
  assert.ok(remote.data.records.some(r=>r.contentId===content.id),'Registro original permanece após conclusão de lembrete');
});
