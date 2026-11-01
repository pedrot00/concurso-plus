'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const root=path.resolve(__dirname,'..');
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
async function fixture() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'concurso-test-'));
  fs.mkdirSync(path.join(dir,'Data'));
  fs.copyFileSync(path.join(root,'server.js'),path.join(dir,'server.js'));
  fs.copyFileSync(path.join(root,'tests/fixture.js'),path.join(dir,'Data/dados.js'));
  fs.writeFileSync(path.join(dir,'index.html'),'<h1>ok</h1>');
  const port=34000+Math.floor(Math.random()*9000),url=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,['server.js'],{cwd:dir,env:{...process.env,PORT:String(port)},stdio:'ignore'});
  for(let i=0;i<80;i++){
    if(child.exitCode!==null)throw new Error('Servidor terminou prematuramente.');
    try{const r=await fetch(url+'/api/data');if(r.ok)return {dir,url,child};}catch{}
    await pause(80);
  }
  throw new Error('O servidor não iniciou.');
}
test('persistência no arquivo JS, concorrência, validação e acesso local',async t=>{
  const {dir,url,child}=await fixture();
  t.after(async()=>{child.kill();await once(child,'exit').catch(()=>{});fs.rmSync(dir,{recursive:true,force:true});});
  const initial=await(await fetch(url+'/api/data')).json();
  assert.equal(initial.revision,0);
  const newData=structuredClone(initial);newData.groups.push({id:'g-test',name:'Grupo Temporário',priority:'Alta',color:'#397af5'});
  let r=await fetch(url+'/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:newData,expectedRevision:0})});
  assert.equal(r.status,200);
  const data=await(await fetch(url+'/api/data')).json();
  assert.equal(data.revision,1);
  assert.equal(data.groups.at(-1).name,'Grupo Temporário');
  assert.match(fs.readFileSync(path.join(dir,'Data/dados.js'),'utf8'),/Grupo Temporário/);
  assert.ok(fs.existsSync(path.join(dir,'Data/dados-anteriores.js')));
  r=await fetch(url+'/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:newData,expectedRevision:0})});
  assert.equal(r.status,409);
  const invalid=structuredClone(data);invalid.records[0].correct=99999;
  r=await fetch(url+'/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:invalid,expectedRevision:1})});
  assert.equal(r.status,400);
  const saved=await(await fetch(url+'/api/data')).json();assert.equal(saved.revision,1);
  assert.equal((await fetch(url+'/Data/dados.js')).status,403);
  assert.equal((await fetch(url+'/server.js')).status,200); // Código acessível apenas localmente.
  assert.equal((await fetch(url+'/index.html')).status,200);
});
