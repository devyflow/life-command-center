import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// Disposable, loopback-only QA workspace. This server never contacts the live cloud.
const day=new Date();day.setMinutes(day.getMinutes()-day.getTimezoneOffset());const today=day.toISOString().slice(0,10);
let revision=1;
let state={
  tasks:Array.from({length:24},(_,index)=>({id:100+index,title:`QA task ${index+1}: make a little progress`,area:'Career',category:'Projects',date:today,start:null,plan:'today',progress:0,duration:30,energy:'medium',next:'Take one small step',timer:true,repeat:'none',postponed:0})),
  profile:{xp:250,streak:4,bestStreak:4,sessions:0,accuratePlans:0,boundaries:0,lastProductive:'2020-01-01'},
  requests:[
    {id:201,name:'Pending example',initials:'PE',purpose:'Plan a study session',status:'pending',date:today,start:'16:00',duration:30,outcome:'Agree the next action',urgency:'This week',flexibility:'Flexible',note:'Disposable example',impact:'Fits a free window.',safe:true},
    {id:202,name:'Approved example',initials:'AE',purpose:'Earlier project check-in',status:'approved',date:today,start:'15:00',duration:30,outcome:'Pick a next step',urgency:'Today',flexibility:'Flexible',note:'Disposable example',impact:'No conflict.',safe:true}
  ],
  availability:[],share:{token:'local-example',oneTime:true,expires:true,approval:true,questions:true,privacy:true}
};
const files=new Map([['/','index.html'],...['app.js','scene.js','styles.css','manifest.webmanifest','sw.js','icon-192.png','icon-512.png'].map(file=>['/'+file,file])]);
const types={html:'text/html',js:'application/javascript',css:'text/css',webmanifest:'application/manifest+json',png:'image/png'};
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  res.setHeader('cache-control','no-store');
  const json=(body,status=200)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body));};
  try{
    if(path==='/api/session')return json({user:{name:'Isolated QA workspace'}});
    if(path==='/api/state'){
      if(req.method==='PUT'){
        let raw='';for await(const chunk of req)raw+=chunk;
        const incoming=JSON.parse(raw);
        if(incoming.baseRevision!==revision&&!incoming.force)return json({state,revision},409);
        state=incoming.state;revision++;
      }
      return json({state,revision});
    }
    if(req.method!=='GET'||!files.has(path))return json({error:'Not found'},404);
    const file=files.get(path);let content=await readFile(new URL('../client/'+file,import.meta.url));
    if(file==='index.html')content=Buffer.from(content.toString().replaceAll('experience-v2',`qa-${Date.now()}`));
    res.writeHead(200,{'content-type':types[file.split('.').at(-1)]||'application/octet-stream'});res.end(content);
  }catch{json({error:'Local QA request failed'},500);}
});
server.listen(4213,'127.0.0.1',()=>console.log('Isolated QA workspace: http://127.0.0.1:4213 — all test data lives in memory.'));
