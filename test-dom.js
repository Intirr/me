/* Prueba de integración del DOM con jsdom: carga index.html + app.js,
   simula interacciones y verifica que el render no lance errores.
   Ejecuta: node test-dom.js   */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let fails = 0;
const check = (c, m) => { if (!c) { console.error('  ✗ ' + m); fails++; } else console.log('  ✓ ' + m); };

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const appjs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const { window } = dom;
const { document } = window;

// jsdom ya provee localStorage (url definida). Stubs para descargas:
window.URL.createObjectURL = () => 'blob:x';
window.URL.revokeObjectURL = () => {};
window.Blob = function (parts) { this.parts = parts; };

// errores no capturados
const errors = [];
window.addEventListener('error', e => errors.push(e.error || e.message));

// ejecutar app.js en el contexto de la ventana
const runScript = new window.Function(appjs);
runScript.call(window);

// disparar DOMContentLoaded
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

console.log('1) Render inicial');
check(document.querySelector('#avatarStage svg'), 'avatar renderizado');
check(document.querySelector('#radarWrap svg'), 'radar renderizado');
check(document.querySelectorAll('#dimBars .dim-bar').length === 6, '6 barras de dimensión');
check(document.querySelectorAll('#controls input[type="range"]').length >= 25, '25+ sliders generados');
check(document.querySelectorAll('#presets .chip').length === 6, '6 ejemplos (presets)');
check(/\d/.test(document.getElementById('condScore').textContent), 'puntuación de condición numérica');
check(document.querySelectorAll('#reco .reco').length >= 4, 'recomendaciones generadas');

console.log('2) Click en preset "Atleta"');
[...document.querySelectorAll('#presets .chip')].find(c => c.textContent === 'Atleta')
  .dispatchEvent(new window.Event('click', { bubbles: true }));
check(document.getElementById('idSub').textContent.includes('Atlética'), 'preset aplica complexión atlética');

console.log('3) Mover un slider (fuerza=90)');
const f = document.getElementById('f_fuerza');
f.value = '90';
f.dispatchEvent(new window.Event('input', { bubbles: true }));
check(document.getElementById('v_fuerza').textContent === '90', 'valor del slider actualizado');

console.log('4) Segmented (peinado=largo) y swatch (piel)');
[...document.querySelectorAll('[data-seg="peinado"] button')].find(b => b.dataset.val === 'largo')
  .dispatchEvent(new window.Event('click', { bubbles: true }));
document.querySelector('[data-sw="piel"] button').dispatchEvent(new window.Event('click', { bubbles: true }));
check(document.querySelector('#avatarStage svg'), 'avatar sigue presente tras cambios');

console.log('5) Botones: Aleatorio, Guardar, Reiniciar, Export');
document.getElementById('btnRandom').dispatchEvent(new window.Event('click', { bubbles: true }));
document.getElementById('btnSave').dispatchEvent(new window.Event('click', { bubbles: true }));
check(!!window.localStorage.getItem('dpdv_state'), 'estado guardado en localStorage');
document.getElementById('btnExportTxt').dispatchEvent(new window.Event('click', { bubbles: true }));
document.getElementById('btnExportSvg').dispatchEvent(new window.Event('click', { bubbles: true }));
document.getElementById('btnReset').dispatchEvent(new window.Event('click', { bubbles: true }));
check(document.getElementById('idName').textContent === 'Alex', 'reset vuelve a valores por defecto');

console.log('6) Sin errores en runtime');
check(errors.length === 0, 'sin excepciones no capturadas (' + errors.length + ')');
if (errors.length) errors.forEach(e => console.error('   →', e && e.message || e));

if (fails === 0) console.log('\n✅ TEST DOM OK');
else { console.error(`\n❌ ${fails} fallo(s)`); process.exit(1); }
