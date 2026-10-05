import fs from 'fs'
import crypto from 'crypto'
import * as D from './dict.mjs'
// Uso: node build.mjs <cartella JSON del compendio inglese> <cartella di uscita>
const [src = 'src', out = '../../src/packs/investigator-wizard-it'] = process.argv.slice(2)
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out)
const missing = new Set()
const tr = (map, k, label) => { if (!(k in map)) { missing.add(label + ': ' + k); return k } return map[k] }
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const newId = id => [...crypto.createHash('sha256').update(id + ':it').digest()].slice(0, 16).map(b => ALNUM[b % 62]).join('')
for (const f of fs.readdirSync(src)) {
  const d = JSON.parse(fs.readFileSync(src + '/' + f)); const s = d.system; const orig = d.name
  if (d.type === 'skill') {
    const sp = s.specialization ? tr(D.spec, s.specialization, 'spec') : ''
    const nm = s.skillName === 'Any' ? 'Generico' : tr(D.skill, s.specialization + '|' + s.skillName, 'skill')
    s.specialization = sp; s.skillName = nm; d.name = sp ? `${sp} (${nm})` : nm
  } else if (d.type === 'setup') d.name = tr(D.setup, orig, 'setup')[0]
  else d.name = tr(D[d.type], orig, d.type)
  if (s.description?.value) s.description.value = D.description(s.description.value, d.type, orig)
  if (s.personalText) s.personalText = tr(D.personalText, s.personalText, 'personalText')
  for (const v of s.monetary?.values || []) if (v.name && !v.name.startsWith('CoC7.')) v.name = tr(D.monetaryName, v.name, 'monetary')
  if (/See the|Default setup/.test(s.description?.value || '')) missing.add('desc: ' + orig)
  d.flags.CoC7.cocidFlag.lang = 'it'
  d._id = newId(d._id); d._key = '!items!' + d._id
  fs.writeFileSync(`${out}/${d.name.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '_')}_${d._id}.json`, JSON.stringify(d, null, 2) + '\n')
}
if (missing.size) { console.log([...missing].join('\n')); process.exit(1) }
console.log('ok', fs.readdirSync(out).length)
