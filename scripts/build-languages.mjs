import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const ROOT=new URL('../',import.meta.url);
export const BASE='https://baltvova-code.github.io/sopka-policy/';
export const LANGUAGES=['ru','en','kk','es','pt-BR'];
export const NATIVE_NAMES={ru:'Русский',en:'English',kk:'Қазақша',es:'Español','pt-BR':'Português (Brasil)'};
const TEMPLATE=new URL('templates/source-2026-11-17.html',ROOT);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const blocks=article=>[...article.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match=>match[2]);
export function sourceArticle(html,language){
  const found=new RegExp(`<article\\b[^>]*id="${language}"[^>]*>[\\s\\S]*?<\\/article>`).exec(html);
  if(!found)throw Error('Missing source article '+language);
  return found[0];
}

export async function readSource(){
  const source=JSON.parse(await fs.readFile(new URL('translations/source.json',ROOT),'utf8'));
  const bytes=await fs.readFile(TEMPLATE);
  if(source.templateFile!=='templates/source-2026-11-17.html'||hash(bytes)!==source.templateSha256)throw Error('Authored source template hash mismatch');
  const html=bytes.toString('utf8'),en=sourceArticle(html,'en'),ru=sourceArticle(html,'ru');
  if(blocks(en).length!==source.englishBlockCount||source.englishBlockCount!==80||hash(JSON.stringify(blocks(en)))!==source.englishBlocksSha256)throw Error('Authored English block digest mismatch');
  return {html,en,ru,source};
}

const existing={
  ru:{title:'SOPKA — Политика конфиденциальности',description:'Политика конфиденциальности SOPKA от blaZe apps: данные поездок, датчики, внешние сервисы, диагностика, хранение и удаление.',labels:{skip:'К тексту политики',homeAria:'SOPKA — в начало',language:'Язык',heroTitle:'Политика конфиденциальности',heroSubtitle:'SOPKA / КОНФИДЕНЦИАЛЬНОСТЬ',heroTagline:'Ваши поездки. Ваши данные.',navigation:'Навигация по политике',inDocument:'В этом документе',policy:'Политика на русском',deletion:'Удаление данных',support:'Поддержка',noAdvertising:'Без рекламы.',backToTop:'Наверх ↑',by:'от blaZe apps',languageName:'Русский',fontLicense:'Roboto Flex · OFL 1.1'}},
  en:{title:'SOPKA — Privacy Policy',description:'SOPKA Privacy Policy by blaZe apps: ride data, sensors, external services, diagnostics, retention and deletion.',labels:{skip:'Skip to policy',homeAria:'SOPKA — back to top',language:'Language',heroTitle:'Privacy policy',heroSubtitle:'SOPKA / PRIVACY',heroTagline:'Your rides. Your data.',navigation:'Policy navigation',inDocument:'In this document',policy:'Policy in English',deletion:'Data deletion',support:'Support',noAdvertising:'No advertising.',backToTop:'Back to top ↑',by:'by blaZe apps',languageName:'English',fontLicense:'Roboto Flex · OFL 1.1'}}
};
export async function copyFor(language){return existing[language]??JSON.parse(await fs.readFile(new URL(`translations/${language}.json`,ROOT),'utf8'));}
const SHORT_NAMES={ru:'RU',en:'EN',kk:'KK',es:'ES','pt-BR':'PT'};
function languageLinks(language,legacy=false,label='Language'){
 const prefix=legacy?'':'../';
 const flag=code=>`<img class="language-flag" src="${prefix}assets/flag-${code}.svg" width="24" height="18" alt="">`;
 const links=LANGUAGES.map(code=>`<a href="${prefix}${code}/" lang="${code}" hreflang="${code}"${code===language?' aria-current="page"':''}>${flag(code)}<span>${NATIVE_NAMES[code]}</span><span class="language-check" aria-hidden="true">✓</span></a>`).join('');
 const current=language?flag(language)+`<span>${SHORT_NAMES[language]}</span>`:flag('ru')+flag('en')+'<span>RU/EN</span>';
 return `<details class="policy-languages"><summary aria-label="${escape(label)}: ${escape(language?NATIVE_NAMES[language]:'Русский / English')}">${current}<span class="language-chevron" aria-hidden="true"></span></summary><div class="policy-language-list">${links}</div></details>`;
}
function seo(language){
  return `<link rel="canonical" href="${BASE}${language?language+'/':''}">\n`+
    LANGUAGES.map(code=>`<link rel="alternate" hreflang="${code}" href="${BASE}${code}/">`).join('\n')+
    `\n<link rel="alternate" hreflang="x-default" href="${BASE}">\n`;
}

export function translatedArticle(english,language,copy){
  let count=0;
  const translated=english.replace(/(<(h2|h3|p|li)\b[^>]*>)([\s\S]*?)(<\/\2>)/g,(_match,open,_tag,_inner,close)=>{
    const value=copy.blocks[count++];
    if(typeof value!=='string'||!value.trim())throw Error(`Missing ${language} block ${count-1}`);
    return open+value+close;
  });
  if(count!==80||copy.blocks.length!==count)throw Error('Translation block count mismatch '+language);
  return translated.replace('id="en" lang="en"',`id="${language}" lang="${language}"`)
    .replaceAll('id="title-en"',`id="title-${language}"`).replaceAll('aria-labelledby="title-en"',`aria-labelledby="title-${language}"`)
    .replaceAll('id="delete-en"',`id="delete-${language}"`);
}

const flagStyle="<style>\nheader{min-height:80px;padding:12px 0}\n.policy-languages{position:relative;margin:0;padding:0;border:0}\n.policy-languages>summary{display:flex;align-items:center;gap:9px;min-height:44px;padding:9px 13px;list-style:none;border:1px solid transparent;border-radius:24px;background:var(--soft);color:var(--accent);font:inherit;font-size:14px;font-weight:500;line-height:1.4;white-space:nowrap;cursor:pointer;user-select:none}\n.policy-languages>summary::-webkit-details-marker{display:none}\n.policy-languages>summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px}\n.language-flag{display:block;width:24px;height:18px;object-fit:contain;border-radius:3px;box-shadow:0 0 0 1px #17201720,0 2px 4px #17201718;flex:none}\n.language-chevron{width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);margin:-3px 1px 0 3px}\n.policy-languages[open] .language-chevron{transform:rotate(225deg);margin-top:3px}\n.policy-language-list{position:absolute;top:calc(100% + 8px);right:0;z-index:20;display:grid;width:246px;max-width:calc(100vw - 36px);padding:6px;background:var(--surface);border:1px solid var(--line);border-radius:15px;box-shadow:0 12px 28px #0003}\nnav .policy-language-list a{display:flex;align-items:center;gap:12px;min-height:46px;padding:10px 12px;border-radius:8px;background:transparent;font-size:14px;font-weight:500;white-space:nowrap}\nnav .policy-language-list a:hover,nav .policy-language-list a[aria-current=page]{background:var(--soft)}\n.language-check{margin-left:auto;visibility:hidden}\n[aria-current=page]>.language-check{visibility:visible}\n@media(max-width:700px){header{min-height:76px;flex-wrap:nowrap;gap:12px;padding:12px 0}.identity{flex-direction:column;gap:2px;align-items:flex-start}.maker{font-size:13px}}\n</style>";
function pageHead(template,language,copy){
  const head=template.slice(0,template.indexOf('</head>'));
  return head.replace('<html lang="ru">',`<html lang="${language}">`)
    .replace(/<title>[^<]*<\/title>/,`<title>${escape(copy.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(copy.description)}">`)
    .replaceAll('url(assets/','url(../assets/')+seo(language)+flagStyle+'</head>';
}
export function renderLocalized(source,language,copy){
  const labels=copy.labels;
  const article=language==='en'?source.en:language==='ru'?source.ru:translatedArticle(source.en,language,copy);
  const tagline=escape(labels.heroTagline).replace('. ','.<br>');
  return pageHead(source.html,language,copy)+`<body>
<a class="skip" href="#${language}">${escape(labels.skip)}</a>
<div class="shell">
<header>
<div class="identity"><a class="wordmark" href="#top" aria-label="${escape(labels.homeAria)}">SOPKA<span class="dot">.</span></a><span class="maker">${escape(labels.by)}</span></div>
<nav aria-label="${escape(labels.language)}">${languageLinks(language,false,labels.language)}</nav>
</header>
<main id="top">
<div class="hero"><span class="eyebrow">${escape(labels.heroSubtitle)}</span>
<h1>${escape(labels.heroTitle)}</h1>
<p>${tagline}</p>
<div class="route" aria-hidden="true"><span></span><span></span><span></span></div></div>
<div class="layout">
<aside aria-label="${escape(labels.navigation)}"><div class="side-label">${escape(labels.inDocument)}</div><a href="#${language}">${escape(labels.policy)}</a><a href="#delete-${language}">${escape(labels.deletion)}</a><div class="support"><span>${escape(labels.support)}</span><a href="https://sopka.fun/">sopka.fun</a></div><p class="note">${escape(labels.noAdvertising)}</p></aside>
<div class="policies">${article}</div></div>
</main>
<footer><span class="footer-brand">SOPKA · blaZe apps</span><a href="#top">${escape(labels.backToTop)}</a><a href="../assets/roboto-flex-OFL.txt">${escape(labels.fontLicense)}</a></footer>
</div></body></html>
`;
}
export function renderLegacy(source){
  const entries=[['kk','Қазақ тіліндегі саясат'],['es','Política en español'],['pt-BR','Política em português']];
  const more=entries.map(([code,text])=>`<a href="${code}/" lang="${code}">${text}</a>`).join('');
  return source.html.replace(/<nav aria-label="Язык \/ Language">[\s\S]*?<\/nav>/,`<nav aria-label="Язык / Language">${languageLinks(null,true,'Язык / Language')}</nav>`)
    .replace('<div class="support">',more+'<div class="support">')
    .replace('</head>',seo(null)+flagStyle+'</head>');
}

export async function buildPages({check=false}={}){
  const source=await readSource(),pages=new Map([['index.html',renderLegacy(source)]]);
  for(const language of LANGUAGES)pages.set(`${language}/index.html`,renderLocalized(source,language,await copyFor(language)));
  for(const [relative,html]of pages){
    const destination=new URL(relative,ROOT);
    if(check){if(await fs.readFile(destination,'utf8')!==html)throw Error('Stale policy page '+relative);}
    else{await fs.mkdir(new URL('./',destination),{recursive:true});await fs.writeFile(destination,html);}
  }
  return pages;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--capture-source')){
    throw Error('The account source is authored. Use build-account-source.mjs; the November14 template is immutable.');
  }
  const pages=await buildPages({check:process.argv.includes('--check')});
  console.log(`${pages.size} static policy pages ${process.argv.includes('--check')?'verified':'rendered'}; no scripts or remote fonts.`);
}
