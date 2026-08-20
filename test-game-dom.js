/* Prueba de integración del juego en un DOM real (jsdom):
   crea un personaje, entra al mundo, deja correr el bucle de render y abre
   todos los paneles comprobando que nada lanza errores.
   Ejecuta: node test-game-dom.js     (requiere jsdom)                      */
const fs = require('fs');
const path = require('path');

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (_) { console.log('⚠️  jsdom no está instalado (npm install). Prueba omitida.'); process.exit(0); }

let fails = 0, checks = 0;
const check = (cond, msg) => { checks++; if (!cond) { console.error('  ✗ ' + msg); fails++; } };

// Contexto 2D falso: jsdom no dibuja, pero así validamos que el render se
// ejecuta entero sin lanzar excepciones.
function fakeCtx() {
  const grad = { addColorStop() {} };
  const noop = () => {};
  return {
    canvas: null, globalCompositeOperation: 'source-over',
    fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt', font: '', textAlign: '', textBaseline: '',
    save: noop, restore: noop, translate: noop, scale: noop, rotate: noop, setTransform: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, ellipse: noop, rect: noop,
    fill: noop, stroke: noop, fillRect: noop, strokeRect: noop, clearRect: noop, clip: noop,
    fillText: noop, strokeText: noop, drawImage: noop, putImageData: noop,
    createLinearGradient: () => grad, createRadialGradient: () => grad, createPattern: () => null,
    measureText: () => ({ width: 42 }),
  };
}

const html = fs.readFileSync(path.join(__dirname, 'juego.html'), 'utf8');
const errors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://local.test/juego.html',
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
    if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    window.addEventListener('error', e => errors.push(e.message || String(e.error)));
    window.prompt = () => 'Negocio de prueba';
  },
});
const { window } = dom;
const doc = window.document;
const $ = id => doc.getElementById(id);
const click = n => n.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const key = k => doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(60);   // deja que se dispare DOMContentLoaded
  console.log('1) Pantalla de creación');
  check($('screenCreate').classList.contains('on'), 'la pantalla de creación se muestra al abrir');
  const rows = doc.querySelectorAll('#statRows .stat-row');
  check(rows.length === 8, `se listan las 8 características (${rows.length})`);
  check(doc.querySelectorAll('#bgGrid .opt').length === 6, 'se listan los 6 trasfondos');
  check(doc.querySelectorAll('#perkGrid .opt').length === 6, 'se listan los 6 rasgos');
  check($('createAvatar').innerHTML.indexOf('<svg') === 0, 'el avatar se dibuja desde el principio');

  console.log('2) Repartir características actualiza avatar y puntos');
  const before = $('createAvatar').innerHTML;
  const plus = rows[0].querySelectorAll('.pm button')[1];
  for (let i = 0; i < 10; i++) click(plus);
  check($('poolLeft').textContent === '50', `los puntos bajan al repartir (${$('poolLeft').textContent})`);
  check($('createAvatar').innerHTML !== before, 'el avatar cambia con las características');
  check(rows[0].querySelector('.vv').textContent === '20', 'la característica sube a 20');
  const minus = rows[0].querySelectorAll('.pm button')[0];
  click(minus);
  check($('poolLeft').textContent === '51', 'restar devuelve el punto');

  console.log('3) Trasfondo, rasgo y aleatorio');
  const bgBtn = doc.querySelectorAll('#bgGrid .opt')[3];
  click(bgBtn);
  check(bgBtn.classList.contains('sel'), 'el trasfondo elegido queda marcado');
  const perkBtn = doc.querySelectorAll('#perkGrid .opt')[2];
  click(perkBtn);
  check(perkBtn.classList.contains('sel'), 'el rasgo elegido queda marcado');
  click($('btnRandomChar'));
  check($('poolLeft').textContent === '0', 'el personaje aleatorio reparte todos los puntos');
  check(errors.length === 0, 'sin errores durante la creación: ' + errors.join(' | '));

  console.log('4) Empezar la aventura');
  $('inName').value = 'Prueba';
  $('inName').dispatchEvent(new window.Event('input', { bubbles: true }));
  click($('btnStart'));
  check($('screenGame').classList.contains('on'), 'se entra al mundo');
  check(!$('screenCreate').classList.contains('on'), 'la creación se oculta');
  check($('hudDay').textContent === '1', 'el HUD marca el día 1');
  check($('hudMeters').children.length >= 4, 'las barras de estado se construyen');
  check(doc.querySelectorAll('.toast').length > 0, 'se muestran avisos de bienvenida');

  console.log('5) El bucle de render corre sin errores');
  await wait(320);
  check(errors.length === 0, 'sin errores en el bucle: ' + errors.join(' | '));

  console.log('6) Entrar en un lugar y actuar');
  key('e');
  check($('modalBack').classList.contains('on'), 'pulsar E delante de la puerta abre el lugar');
  check($('mTitle').textContent === 'Tu apartamento', `apareces junto a tu casa (salió "${$('mTitle').textContent}")`);
  const acciones = [...doc.querySelectorAll('#mBody .act')];
  check(acciones.length >= 3, 'la casa ofrece varias acciones');
  const planificar = acciones.find(a => a.textContent.includes('Planificar el día'));
  check(!!planificar, 'se puede planificar el día');
  const horaAntes = $('hudClock').textContent;
  click(planificar.querySelector('button'));
  check($('hudClock').textContent !== horaAntes, `la acción hace avanzar el reloj (${horaAntes} → ${$('hudClock').textContent})`);
  check(doc.querySelectorAll('.toast').length > 0, 'la acción informa de su resultado');
  const repetir = [...doc.querySelectorAll('#mBody .act')].find(a => a.textContent.includes('Planificar el día'));
  check(repetir.querySelector('button').disabled, 'planificar queda bloqueado el resto del día');

  const diaAntes = Number($('hudDay').textContent);
  const dormir = [...doc.querySelectorAll('#mBody .act')].find(a => a.textContent.includes('Dormir'));
  click(dormir.querySelector('button'));
  check(Number($('hudDay').textContent) === diaAntes + 1, 'dormir pasa al día siguiente');
  check(!$('modalBack').classList.contains('on'), 'al dormir se cierra el panel');
  check(errors.length === 0, 'sin errores al actuar: ' + errors.join(' | '));

  console.log('7) Movimiento del jugador');
  const posBefore = $('hudPlace').textContent;
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));
  await wait(260);
  doc.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'd', bubbles: true }));
  check(errors.length === 0, 'moverse no rompe nada');
  check(typeof posBefore === 'string' && posBefore.length > 0, 'el HUD indica dónde estás');

  console.log('8) Paneles del juego');
  const panels = [['p', 'Prueba'], ['n', 'Tus negocios'], ['q', 'Misiones'], ['m', 'Mapa de la ciudad'], ['l', 'Diario']];
  for (const [k, title] of panels) {
    key(k);
    check($('modalBack').classList.contains('on'), `la tecla ${k} abre un panel`);
    check($('mTitle').textContent === title, `la tecla ${k} abre "${title}" (salió "${$('mTitle').textContent}")`);
    check($('mBody').children.length > 0, `el panel ${title} tiene contenido`);
    key('Escape');
    check(!$('modalBack').classList.contains('on'), `Escape cierra ${title}`);
  }
  for (const b of doc.querySelectorAll('[data-open]')) {
    click(b);
    check($('modalBack').classList.contains('on'), `el botón ${b.dataset.open} abre su panel`);
    click($('mClose'));
  }

  console.log('9) Repartir puntos de nivel desde el perfil');
  key('p');
  const plusButtons = doc.querySelectorAll('#mBody .stat-row .pm button');
  check(plusButtons.length === 8, 'el perfil permite subir las 8 características');
  key('Escape');

  console.log('10) Guardado');
  click($('btnSaveGame'));
  const saved = window.localStorage.getItem('rutapropia_save_v1');
  check(!!saved, 'la partida se guarda en localStorage');
  const data = JSON.parse(saved || '{}');
  check(data.s && data.s.name === 'Prueba', 'el guardado conserva el personaje');
  check(data.pos && typeof data.pos.x === 'number', 'el guardado conserva la posición');

  console.log('11) Sin errores al final');
  await wait(200);
  check(errors.length === 0, 'ningún error registrado: ' + errors.join(' | '));

  window.close();
  if (fails === 0) console.log(`\n✅ INTEGRACIÓN DOM CORRECTA (${checks} comprobaciones)`);
  else { console.error(`\n❌ ${fails} de ${checks} comprobaciones fallaron`); process.exit(1); }
})().catch(e => { console.error('❌ Excepción:', e); process.exit(1); });
