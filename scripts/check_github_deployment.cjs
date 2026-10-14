const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
async function main(){
 const result=spawnSync('git',['credential','fill'],{cwd:root,input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
 const creds=Object.fromEntries((result.stdout||'').trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
 const headers={'Accept':'application/vnd.github+json','User-Agent':'archive-cleanup'};
 if(creds.password)headers.Authorization='Bearer '+creds.password;
 const sha=spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
 const base='https://api.github.com/repos/Kim-simin/graduation_exhibit_workflow';
 for(const route of [`/commits/${sha}/status`,`/commits/${sha}/check-runs`,`/deployments?per_page=5`]){
  const r=await fetch(base+route,{headers});if(!r.ok){console.log(JSON.stringify({route,status:r.status}));continue;}
  const data=await r.json();
  console.log(JSON.stringify(route.endsWith('/status')?{sha,state:data.state,statuses:data.statuses.map(s=>({state:s.state,context:s.context,url:s.target_url,description:s.description}))}:route.endsWith('check-runs')?{checks:data.check_runs.map(c=>({name:c.name,status:c.status,conclusion:c.conclusion,url:c.details_url}))}:{deployments:data.map(d=>({id:d.id,sha:d.sha,environment:d.environment,statuses_url:d.statuses_url}))}));
  if(Array.isArray(data))for(const d of data.slice(0,3)){
   const s=await fetch(d.statuses_url,{headers});if(s.ok)console.log(JSON.stringify({deployment:d.id,statuses:(await s.json()).map(x=>({state:x.state,url:x.environment_url,log:x.log_url}))}));
  }
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
