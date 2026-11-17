import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {content} from '../content/account-2026-11-17.mjs';

const root=new URL('../',import.meta.url);
const provenance=JSON.parse(fs.readFileSync(new URL('translations/source.json',root),'utf8'));
const baseline=execFileSync('git',['show',`${provenance.commit}:index.html`]);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const article=(text,language)=>new RegExp(`<article\\b[^>]*id="${language}"[^>]*>([\\s\\S]*?)<\\/article>`).exec(text)?.[1];
const blocks=text=>[...text.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match=>match[2]);
const baselineBlocks=blocks(article(baseline.toString('utf8'),'en'));
const template=fs.readFileSync(new URL(provenance.templateFile,root),'utf8');
const source=blocks(article(template,'en'));
const currentIndex=old=>old<35?old:old+18;
const tags=value=>value.match(/<[^>]+>/g)||[];
const hrefs=value=>[...value.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
const numbers=value=>(value.replace(/<[^>]+>/g,'').replace(/&#(?:x[\da-f]+|\d+);/gi,'').match(/\d+(?:\.\d+)?/g)||[]).sort();
const locales=['kk','es','pt-BR'];
const labels=['skip','homeAria','language','heroTitle','heroSubtitle','heroTagline','navigation','inDocument','policy','deletion','support','noAdvertising','backToTop','by','languageName','fontLicense'];

test('account policy has a verified new source and preserves its historical source',()=>{
  assert.equal(provenance.commit,'fec805f7ea027cd669564b608fec9cec49541e01');
  assert.equal(provenance.effectiveDate,'2026-11-17');
  assert.equal(sha(baseline),provenance.baselineGitBlobSha256);
  assert.equal(sha(template),provenance.templateSha256);
  assert.equal(sha(JSON.stringify(source)),provenance.englishBlocksSha256);
  assert.equal(source.length,80);
  assert.equal(baselineBlocks.length,62);
  assert.ok(source[1].includes('November 17, 2026'));
  assert.ok(source[currentIndex(45)].includes('30 days'));
  assert.ok(source[26].includes('Starting with versionCode 12'));
});

for(const language of locales){
  const copy=JSON.parse(fs.readFileSync(new URL(`translations/${language}.json`,root),'utf8'));
  test(`${language}: all 80 source blocks retain links, markup and numeric constraints`,()=>{
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
      for(const literal of literals)assert.ok(copy.blocks[currentIndex(i)].includes(literal),`${language} block ${i}: ${literal}`);
    }
  });
  test(`${language}: page title, description and complete shell labels are translated`,()=>{
    assert.ok(copy.title.includes('SOPKA'));
    assert.ok(copy.description.includes('SOPKA'));
    assert.deepEqual(Object.keys(copy.labels).sort(),labels.sort());
    for(const value of Object.values(copy.labels))assert.ok(value.trim());
    assert.equal(copy.labels.fontLicense,'Roboto Flex · OFL 1.1');
    assert.ok(copy.blocks[1].includes('17')&&copy.blocks[1].includes('2026'));
  });
}

test('published articles match the authored source; unrelated historical disclosures remain exact',()=>{
  for(const language of ['en','ru']){
    const current=blocks(article(html,language));assert.deepEqual(current,blocks(article(template,language)));
    const historical=blocks(article(baseline.toString('utf8'),language));
    for(const [i,value]of historical.entries())if(!Object.hasOwn(content[language].replace,i))assert.equal(current[currentIndex(i)],value,`${language} unchanged disclosure ${i}`);
  }
});
test('account disclosure specifies consent, six categories, exclusions, limits and external deletion',()=>{
  const section=source.slice(35,53).join(' ');
  for(const term of ['250 MiB','64 MiB','20 recent','90 days','7 days','24 hours','REG.RU','Android Keystore','Gmail','Google Drive','HttpOnly','https://sopka.fun/account/delete/'])assert.ok(section.includes(term),term);
  assert.equal(source.slice(38,44).length,6);
  assert.doesNotMatch(source.join(' '),/No SOPKA account is created|not uploaded to a developer cloud database/);
});
