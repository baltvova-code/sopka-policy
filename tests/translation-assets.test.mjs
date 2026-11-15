import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const provenance=JSON.parse(fs.readFileSync(new URL('translations/source.json',root),'utf8'));
const baseline=execFileSync('git',['show',`${provenance.commit}:index.html`]);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const article=(text,language)=>new RegExp(`<article\\b[^>]*id="${language}"[^>]*>([\\s\\S]*?)<\\/article>`).exec(text)?.[1];
const blocks=text=>[...text.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match=>match[2]);
const source=blocks(article(baseline.toString('utf8'),'en'));
const tags=value=>value.match(/<[^>]+>/g)||[];
const hrefs=value=>[...value.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
const numbers=value=>(value.replace(/<[^>]+>/g,'').replace(/&#(?:x[\da-f]+|\d+);/gi,'').match(/\d+(?:\.\d+)?/g)||[]).sort();
const locales=['kk','es','pt-BR'];
const labels=['skip','homeAria','language','heroTitle','heroSubtitle','heroTagline','navigation','inDocument','policy','deletion','support','noAdvertising','backToTop','by','languageName','fontLicense'];

test('translations use the published November 14 source, with exact commit and content digest',()=>{
  assert.equal(provenance.commit,'fec805f7ea027cd669564b608fec9cec49541e01');
  assert.equal(provenance.effectiveDate,'2026-11-14');
  assert.equal(sha(baseline),provenance.gitBlobSha256);
  assert.equal(sha(JSON.stringify(source)),provenance.englishBlocksSha256);
  assert.equal(source.length,62);
  assert.ok(source[1].includes('November 14, 2026'));
  assert.ok(source[45].includes('30 days'));
  assert.ok(source[26].includes('Starting with versionCode 12'));
});

for(const language of locales){
  const copy=JSON.parse(fs.readFileSync(new URL(`translations/${language}.json`,root),'utf8'));
  test(`${language}: all 62 source blocks are present, with their links, markup and numeric constraints`,()=>{
    assert.equal(copy.blocks.length,source.length);
    for(const [i,value]of copy.blocks.entries()){
      assert.equal(typeof value,'string',`block ${i}`);
      assert.ok(value.trim(),`block ${i}`);
      assert.deepEqual(tags(value),tags(source[i]),`markup block ${i}`);
      assert.deepEqual(hrefs(value),hrefs(source[i]),`links block ${i}`);
      assert.deepEqual(numbers(value),numbers(source[i]),`numbers block ${i}`);
      if(source[i].includes('%'))assert.equal((value.match(/%/g)||[]).length,(source[i].match(/%/g)||[]).length,`percent block ${i}`);
    }
    // Language grammar may place API/SDK before Android/Billing; require every
    // technical term in the correct block without imposing English word order.
    for(const [i,literals]of [[16,['MET Norway','GPS','0.01','24','Expires','If-Modified-Since']], [20,['BRouter','brouter.de','IP']], [21,['Overpass API','overpass-api.de','IP']], [22,['Photon','photon.komoot.io','GPS','1','25','32']], [26,['versionCode 11','versionCode 12','Google Play Billing','Google DataTransport']], [30,['Location Accuracy','Android WebView']], [43,['512','KiB','2.1','MB','24']], [44,['HTTPS','Android','API','GPS','Bluetooth','BLE']], [45,['VPS','30','IP','HTTP']], [46,['90','Billing','SDK']]]){
      for(const literal of literals)assert.ok(copy.blocks[i].includes(literal),`${language} block ${i}: ${literal}`);
    }
  });
  test(`${language}: page title, description and complete shell labels are translated`,()=>{
    assert.ok(copy.title.includes('SOPKA'));
    assert.ok(copy.description.includes('SOPKA'));
    assert.deepEqual(Object.keys(copy.labels).sort(),labels.sort());
    for(const value of Object.values(copy.labels))assert.ok(value.trim());
    assert.equal(copy.labels.fontLicense,'Roboto Flex · OFL 1.1');
    assert.ok(copy.blocks[1].includes('14')&&copy.blocks[1].includes('2026'));
  });
}

test('English and Russian source articles remain unchanged',()=>{
  for(const language of ['en','ru'])assert.deepEqual(blocks(article(html,language)),blocks(article(baseline.toString('utf8'),language)));
});
