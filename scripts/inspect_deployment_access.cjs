const fs=require('node:fs'),path=require('node:path');
const authPath=path.join(process.env.APPDATA,'com.vercel.cli','auth.json');
async function main(){
 if(!fs.existsSync(authPath)){console.log('No Vercel CLI credential');return;}
 const {token}=JSON.parse(fs.readFileSync(authPath,'utf8'));
 const r=await fetch('https://api.vercel.com/v9/projects?limit=100',{headers:{Authorization:'Bearer '+token}});
 if(!r.ok)throw Error('Vercel HTTP '+r.status);
 const data=await r.json();
 console.log(JSON.stringify(data.projects.map(p=>({id:p.id,name:p.name,accountId:p.accountId,rootDirectory:p.rootDirectory,repo:p.link?.repo,targets:p.targets?.production?{id:p.targets.production.id,url:p.targets.production.url}:null}))));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
