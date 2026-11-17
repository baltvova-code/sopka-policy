import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,LANGUAGES,NATIVE_NAMES,BASE,readSource,sourceArticle,blocks,copyFor,buildPages} from '../scripts/build-languages.mjs';

const source=await readSource(),rootPath=fileURLToPath(ROOT);
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rootHtml=await fs.readFile(new URL('index.html',ROOT),'utf8');
const pages=[{relative:'index.html',language:null,html:rootHtml}];
for(const language of LANGUAGES)pages.push({relative:`${language}/index.html`,language,html:await fs.readFile(new URL(`${language}/index.html`,ROOT),'utf8')});
const style=html=>/<style>([\s\S]*?)<\/style>/.exec(html)[1];

test('all six generated pages exactly match verified-source rendering',async()=>{
  assert.equal((await buildPages({check:true})).size,6);
});
test('legacy root retains both published article byte sequences and old deletion anchors',()=>{
  for(const language of ['ru','en'])assert.deepEqual(Buffer.from(sourceArticle(rootHtml,language)),Buffer.from(sourceArticle(source.html,language)));
  assert.ok(rootHtml.includes('id="delete-ru"')&&rootHtml.includes('href="#delete-ru"'));
  assert.ok(rootHtml.includes('id="delete-en"')&&rootHtml.includes('href="#delete-en"'));
  assert.equal((rootHtml.match(/<article\b/g)||[]).length,2);
});

for(const {relative,language,html}of pages){
  test(`${relative}: five native language links and complete accessible navigation`,()=>{
    const nav=/<nav\b[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1];
    assert.ok(nav);
    assert.equal((nav.match(/<a\b/g)||[]).length,5);
    for(const code of LANGUAGES){
      assert.ok(nav.includes(`lang="${code}"`),code);
      assert.ok(nav.includes(`hreflang="${code}"`),code);
      assert.ok(nav.includes(NATIVE_NAMES[code]),code);
    }
    assert.equal((nav.match(/aria-current="page"/g)||[]).length,language?1:0);
    if(language)assert.ok(new RegExp(`lang="${language}"[^>]*aria-current="page"`).test(nav));
    for(const code of LANGUAGES)assert.ok(html.includes(`rel="alternate" hreflang="${code}" href="${BASE}${code}/"`));
    assert.ok(html.includes(`rel="alternate" hreflang="x-default" href="${BASE}"`));
  });
  test(`${relative}: links, anchors and local fonts resolve without base/JS/remote code`,async()=>{
    assert.doesNotMatch(html,/<(?:base|script|iframe|form)\b/i);
    assert.doesNotMatch(html,/@import\b/i);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,'unique anchors');
    const urls=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
    urls.push(...[...html.matchAll(/url\(([^)]+)\)/g)].map(m=>m[1].replace(/^['"]|['"]$/g,'')));
    const pageFile=path.join(rootPath,relative);
    for(const href of urls){
      if(/^(?:https?:|mailto:)/.test(href))continue;
      const [location,fragment]=href.split('#');
      let target=location?path.resolve(path.dirname(pageFile),decodeURIComponent(location)):pageFile;
      assert.ok(target===rootPath||target.startsWith(rootPath),'local resource stays within repo');
      const stat=await fs.stat(target);
      if(stat.isDirectory())target=path.join(target,'index.html');
      const bytes=await fs.readFile(target);
      assert.ok(bytes.length,href);
      if(fragment)assert.ok(bytes.toString('utf8').includes(`id="${decodeURIComponent(fragment)}"`),href);
    }
    assert.equal((html.match(/@font-face/g)||[]).length,4);
    assert.equal(style(html),language?style(source.html).replaceAll('url(assets/','url(../assets/'):style(source.html),'source design and font sizes preserved');
    assert.doesNotMatch(html,/<article\b[^>]*\bhidden\b/i);
    assert.doesNotMatch(html,/<div\b[^>]*class="policies"[^>]*\bhidden\b/i);
  });
  if(language)test(`${relative}: one full article and every shell label in the selected language`,async()=>{
    const copy=await copyFor(language),article=sourceArticle(html,language);
    assert.ok(html.includes(`<html lang="${language}">`));
    assert.equal((html.match(/<article\b/g)||[]).length,1);
    assert.equal(blocks(article).length,80);
    assert.deepEqual(blocks(article),language==='en'?blocks(source.en):language==='ru'?blocks(source.ru):copy.blocks);
    assert.ok(html.includes(`<title>${escape(copy.title)}</title>`));
    assert.ok(html.includes(`name="description" content="${escape(copy.description)}"`));
    for(const [key,value]of Object.entries(copy.labels)){
      if(key==='heroTagline')assert.ok(html.includes(escape(value).replace('. ','.<br>')),key);
      else assert.ok(html.includes(escape(value)),key);
    }
    assert.ok(html.includes(`href="#delete-${language}"`)&&html.includes(`id="delete-${language}"`));
    assert.ok(html.includes(`rel="canonical" href="${BASE}${language}/"`));
  });
}
