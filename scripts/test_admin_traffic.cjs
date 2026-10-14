const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'admin/node_modules/typescript'));
const source = fs.readFileSync(path.join(root, 'admin/lib/traffic.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
const mod = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(require, mod, mod.exports);
const { aggregateTraffic, validTrafficPath, recordTraffic, readTraffic } = mod.exports;
const now = Date.parse('2026-10-05T00:00:00+09:00');
const day = 86400000;
const events = [{at: now, path:'/'}, {at:now-day, path:'/'}, {at:now-day-1, path:'/students'}, {at:now-7*day, path:'/students'}, {at:now-30*day, path:'/archive'}, {at:now+1, path:'/future'}];
assert.equal(aggregateTraffic(events, 1, now).views, 2);
assert.equal(aggregateTraffic(events, 7, now).views, 4);
assert.equal(aggregateTraffic(events, 30, now).views, 5);
assert.equal(aggregateTraffic(events, 1, now).buckets.reduce((n,b)=>n+b.views,0),2);
assert.equal(aggregateTraffic([], 30, now).views, 0);
for (const page of ['/admin','/admin/settings','/api/test','//external','/?email=x']) assert.equal(validTrafficPath(page),false);
assert.equal(validTrafficPath('/students'), true);
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-traffic-test-'));
  const cwd = process.cwd();
  try {
    process.chdir(temp);
    assert.equal((await readTraffic(1)).views, 0);
    await Promise.all(Array.from({length:30},()=>recordTraffic('/students')));
    assert.equal((await readTraffic(1)).views, 30, 'Concurrent writes preserve every event');
    assert.equal((await readTraffic(1)).pages[0].views, 30);
    console.log('PASS: period boundaries, empty history, excluded paths, concurrent durable storage');
  } finally { process.chdir(cwd); fs.rmSync(temp, { recursive:true, force:true }); }
})().catch(error=>{console.error(error); process.exitCode=1;});
