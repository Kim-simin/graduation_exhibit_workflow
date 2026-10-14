const fs=require('node:fs'); const path=require('node:path');
const root=path.resolve(__dirname,'..');
const env={};
for(const name of ['web/.env.local','admin/.env.local']) {
  const file=path.join(root,name); if(!fs.existsSync(file))continue;
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)) {
    const match=line.match(/^([A-Z_0-9]+)=(.*)$/); if(match && !env[match[1]])env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
  }
}
async function main(){
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key || /your-|placeholder/i.test(key)){console.log('REMOTE_DELETE_UNAVAILABLE: no configured service role credential');return;}
  const url=env.NEXT_PUBLIC_SUPABASE_URL;
  const response=await fetch(url+'/rest/v1/mentoring_projects?source_type=eq.student&select=id',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Remote audit status '+response.status);
  const rows=await response.json();
  console.log(JSON.stringify({remote_student_projects:rows.length}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
