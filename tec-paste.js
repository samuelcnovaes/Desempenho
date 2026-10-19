/* TEC plain-text imports: counts are authoritative; percentages may be rounded. */
(function(root){
'use strict';
function parse(text){
 const lines=String(text).replace(/\u00a0/g,' ').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),entries=[];let summary=null;
 if(lines.length>15000)throw Error('Cole até 15.000 linhas por vez.');
 for(let i=0;i<lines.length;i++){
  const s=lines[i].match(/Seleção\s+Resolvidas:\s*([\d.]+)\s+Acertos:\s*([\d.]+)\s+Erros:\s*([\d.]+)/i);
  if(s){summary={total:num(s[1]),correct:num(s[2]),wrong:num(s[3])};continue;}
  const quantity=lines[i].match(/^([\d.]+)(?:\s+de\s+([\d.]+))?$/i);if(!quantity||i===0)continue;
  let stats=lines[i+1]||'',used=1;if(!/\d+\s*%\s*\([\d.]+\)/.test(stats))continue;
  if((stats.match(/\([\d.]+\)/g)||[]).length===1){stats+=' '+(lines[i+2]||'');used=2;}
  const counts=[...stats.matchAll(/\d+(?:[,.]\d+)?\s*%\s*\(([\d.]+)\)/g)].map(m=>num(m[1]));
  if(counts.length!==2)throw Error('Não foi possível ler os acertos e erros de '+lines[i-1]+'.');
  const title=lines[i-1];if(/^\d|%/.test(title)&&!/[a-zá-ú]/i.test(title))throw Error('Nome de matéria ou assunto ausente.');
  const total=num(quantity[1]);if(total!==counts[0]+counts[1])throw Error('Confira as quantidades de “'+title+'”.');
  entries.push({title,total,correct:counts[0],wrong:counts[1],kind:quantity[2]?'topic':'discipline',selected:false});i+=used;
 }
 if(!entries.length)throw Error('Nenhuma matéria reconhecida. Cole o nome, a quantidade e os percentuais com acertos e erros.');
 if(entries[0].kind!=='discipline')throw Error('O texto deve começar por uma matéria com quantidade simples, como 30, seguida dos percentuais.');
 let group;for(const e of entries){if(e.kind==='discipline'){group=e;e.discipline=e.title;e.selected=false;}else e.discipline=group.title;}
 let unresolved=false;
 for(let i=0;i<entries.length;i++)if(entries[i].kind==='discipline'){
  let end=i+1;while(end<entries.length&&entries[end].kind!=='discipline')end++;
  const d=entries[i],nodes=entries.slice(i+1,end);
  if(!nodes.length){d.selected=true;d.topic='Sem assunto detalhado';continue;}
  const result=resolve(nodes,d);if(!result){unresolved=true;continue;}
  for(const leaf of result){nodes[leaf.index].selected=true;nodes[leaf.index].topic=leaf.path.join(' > ');}
 }
 return {entries,summary,unresolved};
}
function num(s){const n=Number(s.replace(/\./g,''));if(!Number.isSafeInteger(n)||n<0||n>10000000)throw Error('Quantidade inválida.');return n;}
function resolve(nodes,target){
 if(nodes.length>250)return null;let budget=0;const trees=new Map();
 const better=(a,b)=>!b||a.leaves.length>b.leaves.length||a.leaves.length===b.leaves.length&&a.cost<b.cost;
 function forest(start,wanted){
  const queue=[{end:start,correct:0,wrong:0,leaves:[],cost:0}],seen=new Map(),answers=new Map();
  for(let q=0;q<queue.length;q++){if(++budget>150000)throw Error('budget');const state=queue[q];if(state.correct===wanted.correct&&state.wrong===wanted.wrong){if(better(state,answers.get(state.end)))answers.set(state.end,state);continue;}
   const n=nodes[state.end];if(!n||state.correct+n.correct>wanted.correct||state.wrong+n.wrong>wanted.wrong)continue;
   for(const tree of trees.get(state.end)||[]){const v={end:tree.end,correct:state.correct+n.correct,wrong:state.wrong+n.wrong,leaves:[...state.leaves,...tree.leaves],cost:state.cost+tree.cost},key=v.end+':'+v.correct+':'+v.wrong;if(better(v,seen.get(key))){seen.set(key,v);queue.push(v);}}
  }return [...answers.values()];
 }
 try{for(let i=nodes.length-1;i>=0;i--){const n=nodes[i],choices=[{end:i+1,leaves:[{index:i,path:[n.title]}],cost:0}];
  for(const children of forest(i+1,n))if(children.end>i+1)choices.push({end:children.end,leaves:children.leaves.map(l=>({...l,path:[n.title,...l.path]})),cost:children.cost+(children.end-i)**2});trees.set(i,choices);}
  return forest(0,target).find(a=>a.end===nodes.length)?.leaves||null;
 }catch{return null;}
}

root.TecPaste={parse,resolve};
})(globalThis);
