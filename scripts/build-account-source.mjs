import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {content,tags,effectiveDate} from '../content/account-2026-11-17.mjs';
const root=new URL('../',import.meta.url),hash=value=>createHash('sha256').update(value).digest('hex');
const baseline=await fs.readFile(new URL('templates/source-2026-11-14.html',root));
if(hash(baseline)!=='1d51c5eea6efe56a852af1fdc7bac9b5d6ca6ff9b69e3042b7955c8dba5c89e9')throw Error('Historical source changed');
const article=(html,language)=>new RegExp(`<article\\b[^>]*id="${language}"[^>]*>[\\s\\S]*?<\\/article>`).exec(html)[0];
const blocks=text=>[...text.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match=>match[2]);
let html=baseline.toString('utf8');
for(const language of ['en','ru']){
  const old=article(html,language);let index=0;
  const next=old.replace(/(<(h2|h3|p|li)\b[^>]*>)([\s\S]*?)(<\/\2>)/g,(full,open,tag,inner,close)=>{
    const position=index++;let result=open+(content[language].replace[position]??inner)+close;
    if(position===35){const inserted=content[language].blocks.map((value,i)=>(i===3?'<ul>\n':'')+`<${tags[i]}>${value}</${tags[i]}>`+(i===8?'\n</ul>':'')).join('\n');result=inserted+'\n'+result;}
    return result;
  });
  if(index!==62||blocks(next).length!==80)throw Error('Unexpected source shape');html=html.replace(old,next);
}
const template='templates/source-2026-11-17.html';await fs.writeFile(new URL(template,root),html);
for(const language of ['kk','es','pt-BR']){
  const archive=new URL(`translations/archive-2026-11-14/${language}.json`,root);
  let original;try{original=await fs.readFile(archive,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;original=await fs.readFile(new URL(`translations/${language}.json`,root),'utf8');await fs.mkdir(new URL('./',archive),{recursive:true});await fs.writeFile(archive,original);}
  const translated=JSON.parse(original);if(translated.blocks.length!==62)throw Error('Historical translation shape changed');
  translated.blocks=translated.blocks.map((value,i)=>content[language].replace[i]??value);
  translated.blocks.splice(35,0,...content[language].blocks);
  await fs.writeFile(new URL(`translations/${language}.json`,root),JSON.stringify(translated,null,2)+'\n');
}
const source={commit:'fec805f7ea027cd669564b608fec9cec49541e01',baselineGitBlobSha256:hash(baseline),templateFile:template,templateSha256:hash(html),englishBlocksSha256:hash(JSON.stringify(blocks(article(html,'en')))),englishBlockCount:80,effectiveDate};
await fs.writeFile(new URL('translations/source.json',root),JSON.stringify(source,null,2)+'\n');
console.log('Authored account policy source: 80 blocks, five languages; historical source preserved.');
