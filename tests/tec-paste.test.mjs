import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const ctx=vm.createContext({});vm.runInContext(readFileSync(new URL('../tec-paste.js',import.meta.url),'utf8'),ctx);
const parse=ctx.TecPaste.parse,fixture=readFileSync(new URL('./fixtures/tec-paste.txt',import.meta.url),'utf8');
test('TEC sample: four disciplines and fifteen leaves, no parent duplication',()=>{const p=parse(fixture),rows=p.entries.filter(e=>e.selected);assert.equal(p.unresolved,false);assert.equal(p.entries.filter(e=>e.kind==='discipline').length,4);assert.equal(rows.length,15);assert.equal(rows.reduce((n,e)=>n+e.total,0),84);assert.equal(rows.reduce((n,e)=>n+e.correct,0),67);assert.equal(rows.reduce((n,e)=>n+e.wrong,0),17);assert.ok(rows.some(e=>e.topic.includes('Demonstrações Contábeis > Demonstração de Fluxo')));assert.ok(rows.some(e=>e.topic.endsWith('Modelo Entidade-Relacionamento (MER)')));});
test('invalid quantities fail and unresolvable hierarchy requires review',()=>{assert.throws(()=>parse('Materia\n10\n50% (3) 50% (5)'),/quantidades/);assert.throws(()=>parse('apenas texto'),/Nenhuma/);const p=parse('Materia\n10\n50% (5) 50% (5)\nAssunto\n3 de 3\n100% (3) 0% (0)');assert.equal(p.unresolved,true);assert.equal(p.entries.filter(e=>e.selected).length,0);});
test('counts can be split across lines; metadata is ignored',()=>{const p=parse('Matéria\n2\n50% (1)\n50% (1)\n1\nAssunto\n2 de 2\n50% (1)\n50% (1)');assert.equal(p.entries.length,2);assert.equal(p.entries[1].selected,true);});
