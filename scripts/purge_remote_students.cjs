// Credentials and record contents are never printed or backed up.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),env={};
for(const name of ['web/.env.local','admin/.env.local','.env.local']){
 const file=path.join(root,name);if(!fs.existsSync(file))continue;
 for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_0-9]+)=(.*)$/);if(m&&!env[m[1]])env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
}
const base=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
const key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
async function request(route,method='GET',body){
 if(!base||!key)throw Error('Missing server credential');
 const headers={apikey:key,'Content-Type':'application/json'};
 if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
 const r=await fetch(base+route,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(!r.ok){let info={};try{info=await r.json();}catch{}throw Error(method+' '+route.split('?')[0]+' HTTP '+r.status+' code='+(info.code||info.error||'unknown'));}
 return r.status===204?null:await r.json();
}
async function main(){
 console.log(JSON.stringify({credentialType:key?.startsWith('sb_secret_')?'secret':key?.startsWith('sb_publishable_')?'publishable':key?.startsWith('eyJ')?'legacy-jwt':'unknown'}));
 const schema=await request('/rest/v1/');
 const tables=Object.keys(schema.definitions||{});
 console.log(JSON.stringify({tables}));
 for(const table of tables){
  const props=schema.definitions[table].properties||{};
  console.log(JSON.stringify({table,columns:Object.keys(props)}));
 }
 const buckets=await request('/storage/v1/bucket');
 console.log(JSON.stringify({buckets:buckets.map(b=>({id:b.id,public:b.public}))}));
 const connections=await readAll('project_connections');
 const feedbacks=await readAll('mentor_feedbacks');
 const parse=r=>{try{return JSON.parse(r.message||'{}');}catch{return {};}};
 const students=connections.filter(r=>r.proposer_type==='student'||parse(r).source_type==='student');
 const studentIds=new Set(students.flatMap(r=>[r.source_project_id,parse(r).id]).filter(Boolean));
 // Confirmed retired local student project and excluded test registry ID.
 studentIds.add('proj-grad-exhibit-platform');
 studentIds.add('test-1791342391301');
 const linked=feedbacks.filter(r=>studentIds.has(r.project_id));
 const unresolved=feedbacks.filter(r=>!studentIds.has(r.project_id));
 console.log(JSON.stringify({studentConnections:students.length,linkedFeedbacks:linked.length,otherFeedbackProjectIds:unresolved.map(r=>r.project_id)}));
 if(process.argv.includes('--apply')){
  const keep=connections.filter(r=>!students.includes(r));
  for(const row of linked)await request('/rest/v1/mentor_feedbacks?id=eq.'+encodeURIComponent(row.id),'DELETE');
  for(const row of students)await request('/rest/v1/project_connections?id=eq.'+encodeURIComponent(row.id),'DELETE');
  const after=await readAll('project_connections');const afterFeedback=await readAll('mentor_feedbacks');
  if(students.some(r=>after.some(a=>a.id===r.id))||linked.some(r=>afterFeedback.some(a=>a.id===r.id)))throw Error('Deletion verification failed');
  if(keep.some(r=>!after.some(a=>JSON.stringify(a)===JSON.stringify(r))))throw Error('Preservation verification failed');
  console.log(JSON.stringify({deletedConnections:students.length,deletedFeedbacks:linked.length,preservedConnections:keep.length,remainingFeedbacks:afterFeedback.length,verified:true}));
  return;
 }
 for(const table of tables){
  let rows;try{rows=await readAll(table);}catch(e){console.log(e.message);continue;}
  const groups={};
  for(const row of rows){
   let parsed={};try{parsed=JSON.parse(row.message||'{}');}catch{}
   const group=table==='project_connections'?JSON.stringify({registry:row.target_project_id==='__project_registry__',proposer:row.proposer_type,source_type:parsed.source_type,origin:parsed.origin}):'feedback';
   groups[group]=(groups[group]||0)+1;
  }
  console.log(JSON.stringify({table,count:rows.length,groups}));
 }
}
async function readAll(table){const rows=[];for(let offset=0;;offset+=500){const batch=await request(`/rest/v1/${table}?select=*&order=id&limit=500&offset=${offset}`);rows.push(...batch);if(batch.length<500)return rows;}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
