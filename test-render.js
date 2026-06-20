/* Pruebas de humo para las funciones puras de render.
   Detecta NaN/undefined en el SVG (causa de artefactos visuales)
   y valida rangos del diagnóstico. Ejecuta: node test-render.js   */
const M = require('./app.js');

let fails = 0;
const check = (cond, msg) => { if (!cond) { console.error('  ✗ ' + msg); fails++; } };

function validateSVG(svg, ctx) {
  check(typeof svg === 'string' && svg.startsWith('<svg') && svg.includes('</svg>'), `${ctx}: SVG bien formado`);
  check(!/NaN/.test(svg), `${ctx}: sin NaN en coordenadas`);
  check(!/undefined/.test(svg), `${ctx}: sin "undefined"`);
  check(!/Infinity/.test(svg), `${ctx}: sin Infinity`);
  // ningún atributo numérico vacío tipo cx="" o width=""
  check(!/(cx|cy|rx|ry|x|y|width|height|x1|y1|x2|y2)="(\s*)"/.test(svg), `${ctx}: sin atributos numéricos vacíos`);
}

function randomState() {
  const s = Object.assign({}, M.DEFAULTS);
  Object.keys(s).forEach(k => {
    if (typeof s[k] === 'number') s[k] = Math.floor(Math.random() * 101);
  });
  s.altura = 140 + Math.floor(Math.random() * 71);
  s.edad = 5 + Math.floor(Math.random() * 86);
  s.complexion = ['delgada', 'media', 'atletica', 'robusta'][Math.floor(Math.random() * 4)];
  s.peinado = ['rapado', 'corto', 'medio', 'largo'][Math.floor(Math.random() * 4)];
  s.figura = ['neutro', 'masc', 'fem'][Math.floor(Math.random() * 3)];
  s.piel = ['#f7d9bf', '#e0a87e', '#5a3420'][Math.floor(Math.random() * 3)];
  s.cabello = ['#15110e', '#d8b66a', '#3a5a8c'][Math.floor(Math.random() * 3)];
  return s;
}

console.log('1) Estado por defecto');
validateSVG(M.avatarSVG(M.DEFAULTS), 'avatar default');
validateSVG(M.radarSVG(M.dimensions(M.DEFAULTS)), 'radar default');

console.log('2) Extremos (todo 0 / todo 100, cada complexión y peinado)');
['delgada', 'media', 'atletica', 'robusta'].forEach(complexion => {
  ['rapado', 'corto', 'medio', 'largo'].forEach(peinado => {
    [0, 100].forEach(v => {
      const s = Object.assign({}, M.DEFAULTS);
      Object.keys(s).forEach(k => { if (typeof s[k] === 'number') s[k] = v; });
      s.altura = v === 0 ? 140 : 210; s.complexion = complexion; s.peinado = peinado;
      validateSVG(M.avatarSVG(s), `avatar ${complexion}/${peinado}/${v}`);
    });
  });
});

console.log('3) Presets');
Object.keys(M.PRESETS).forEach(name => {
  const s = Object.assign({}, M.DEFAULTS, M.PRESETS[name]);
  validateSVG(M.avatarSVG(s), `avatar preset ${name}`);
  const d = M.diagnose(s);
  check(d.overall >= 0 && d.overall <= 100, `preset ${name}: overall en rango`);
  check(d.recos.length === 3, `preset ${name}: 3 recomendaciones`);
  check(!!d.arch.title, `preset ${name}: arquetipo definido`);
});

console.log('4) 300 estados aleatorios');
for (let i = 0; i < 300; i++) {
  const s = randomState();
  validateSVG(M.avatarSVG(s), `avatar random#${i}`);
  const dims = M.dimensions(s);
  validateSVG(M.radarSVG(dims), `radar random#${i}`);
  Object.keys(dims).forEach(k => check(dims[k] >= 0 && dims[k] <= 100, `random#${i}: dim ${k} en rango`));
  const txt = M.textReport(s);
  check(!/NaN|undefined/.test(txt), `random#${i}: informe sin NaN/undefined`);
}

console.log('5) Diagnóstico coherente');
(() => {
  const low = Object.assign({}, M.DEFAULTS);
  Object.keys(low).forEach(k => { if (typeof low[k] === 'number') low[k] = 10; });
  check(M.condition(M.overallScore(M.dimensions(low))).label === 'Crítica', 'todo bajo => Crítica');
  const high = Object.assign({}, M.DEFAULTS);
  Object.keys(high).forEach(k => { if (typeof high[k] === 'number') high[k] = 95; });
  check(M.condition(M.overallScore(M.dimensions(high))).label === 'Excepcional', 'todo alto => Excepcional');
})();

if (fails === 0) console.log('\n✅ TODAS LAS PRUEBAS PASARON');
else { console.error(`\n❌ ${fails} comprobación(es) fallaron`); process.exit(1); }
