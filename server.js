/** Concurso+ · servidor de arquivos e persistência local (sem dependências). */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const root = __dirname;
const DATA_FILE = path.join(root, 'Data', 'dados.js');
const LEGACY_FILE = path.join(root, 'Data', 'dados-anteriores.js');
const MAX_BODY = 15 * 1024 * 1024;
const port = Number(process.env.PORT || 3100);
const prefix = '// Concurso+ — dados locais portáveis. Arquivo atualizado automaticamente pelo servidor.\n' +
  '// Não execute este arquivo separadamente. Copie a pasta ConcursoPlus para transportar os dados.\n' +
  'globalThis.CONCURSOPLUS_DATA = ';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.png':'image/png', '.json':'application/json; charset=utf-8' };
let serial = Promise.resolve();
const json = (res, code, obj) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj)); };
function decodeData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  if (!raw.startsWith(prefix) || !raw.trimEnd().endsWith(';')) throw new Error('Data/dados.js não segue o formato esperado. Restaure uma cópia de segurança.');
  return JSON.parse(raw.slice(prefix.length).trim().replace(/;$/, ''));
}
function validate(d) {
  if (!d || d.version!==1 || !['groups','contents','records','reviews'].every(k=>Array.isArray(d[k]))) throw new Error('Estrutura de dados inválida.');
  if (d.groups.length>10000 || d.contents.length>100000 || d.records.length>200000 || d.reviews.length>100000) throw new Error('Limite de registros excedido.');
  const validDate = s => typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s+'T12:00:00'));
  const priorities = new Set(['Alta','Média','Baixa']),banks=new Set(['FCC','FGV','CEBRASPE','VUNESP','IBFC']);
  const keys = a => new Set(a.map(x=>x.id));
  const gi=keys(d.groups),ci=keys(d.contents),ri=keys(d.records),vi=keys(d.reviews);
  if (gi.size!==d.groups.length||ci.size!==d.contents.length||ri.size!==d.records.length||vi.size!==d.reviews.length) throw new Error('Identificadores repetidos.');
  for(const g of d.groups) if(typeof g.id!=='string'||!g.id||typeof g.name!=='string'||g.name.trim().length<2||g.name.length>90||!priorities.has(g.priority)||!/^(#[a-f\d]{6})$/i.test(g.color)) throw new Error('Grupo inválido.');
  const contents = new Map(d.contents.map(c=>[c.id,c]));
  for(const c of d.contents) if(typeof c.id!=='string'||!c.id||!gi.has(c.groupId)||typeof c.name!=='string'||c.name.trim().length<2||c.name.length>90||!priorities.has(c.priority)) throw new Error('Conteúdo inválido.');
  for(const r of d.records){
    if(typeof r.id!=='string'||!r.id||!gi.has(r.groupId)||contents.get(r.contentId)?.groupId!==r.groupId||!banks.has(r.banca)||!validDate(r.date)||!['Estudo','Revisão'].includes(r.type)) throw new Error('Registro inválido.');
    if (![r.minutes,r.questions,r.correct].every(n=>Number.isSafeInteger(n)&&n>=0)||r.minutes>599999||r.questions>1000000||r.correct>r.questions||typeof r.notes!=='string'||r.notes.length>500) throw new Error('Tempo, questões ou anotações inválidos.');
  }
  for(const v of d.reviews) if(typeof v.id!=='string'||!v.id||!gi.has(v.groupId)||contents.get(v.contentId)?.groupId!==v.groupId||!banks.has(v.banca)||!validDate(v.createdAt)||!validDate(v.dueDate)||typeof v.notes!=='string'||v.notes.length>500) throw new Error('Revisão futura inválida.');
}
async function store(next) {
  validate(next);
  const dest = path.join(root,'Data',`.dados-${randomUUID()}.tmp`);
  const raw = prefix + JSON.stringify(next,null,2).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029') + ';\n';
  try {
    await fs.promises.writeFile(dest,raw,{encoding:'utf8',flag:'wx'});
    await fs.promises.copyFile(DATA_FILE,LEGACY_FILE); // Cópia de segurança da versão anterior.
    await fs.promises.rename(dest,DATA_FILE); // Substituição atômica no mesmo volume.
  } finally {await fs.promises.rm(dest,{force:true}).catch(()=>{});}
}
function route(req,res) {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/api/data' && req.method==='GET') {
    try {const d=decodeData();validate(d);json(res,200,d);}catch(err){json(res,500,{error:err.message});} return;
  }
  if(pathname==='/api/data' && req.method==='PUT') {
    let text='',size=0,tooLarge=false;
    req.setEncoding('utf8');
    req.on('data',chunk=>{if(tooLarge)return;size+=Buffer.byteLength(chunk,'utf8');if(size>MAX_BODY){tooLarge=true;text='';json(res,413,{error:'Arquivo de dados excede 15 MB.'});return;}text+=chunk;});
    req.on('end',()=>{if(tooLarge)return;
      const run=async()=>{
        try {
          const {data,expectedRevision}=JSON.parse(text);
          if (!Number.isSafeInteger(expectedRevision)||expectedRevision<0) return json(res,400,{error:'Revisão de controle inválida.'});
          const current=decodeData();
          if ((current.revision||0)!==expectedRevision) return json(res,409,{error:'Os dados mudaram em outra aba. Atualize a página antes de salvar novamente.'});
          data.revision=expectedRevision+1;
          data.updatedAt=new Date().toISOString();
          await store(data);
          json(res,200,{revision:data.revision,updatedAt:data.updatedAt});
        }catch(err){json(res,400,{error:err.message});}
      };
      serial=serial.then(run,run);
    });
    return;
  }
  if(!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'Método não permitido.'});
  const relative=(pathname==='/'?'/index.html':pathname).replace(/^\/+/, '');
  const target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)||target===DATA_FILE||target===LEGACY_FILE||relative.toLowerCase().startsWith('data/')||relative.toLowerCase().startsWith('node_modules/')||relative.startsWith('.')) return json(res,403,{error:'Recurso protegido.'});
  let stat;try{stat=fs.statSync(target);}catch{return json(res,404,{error:'Página não encontrada.'});}
  if(!stat.isFile())return json(res,404,{error:'Não encontrado.'});
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(target).pipe(res);
}
const server=http.createServer((req,res)=>{try{route(req,res);}catch(e){json(res,500,{error:e.message});}});
server.listen(port,'127.0.0.1',()=>console.log(`Concurso+ iniciado em http://127.0.0.1:${port}`));
