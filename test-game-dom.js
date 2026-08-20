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
  console.log('1) El currículum');
  check($('screenCreate').classList.contains('on'), 'la pantalla del currículum se muestra al abrir');
  const rows = doc.querySelectorAll('#statRows .stat-row');
  check(rows.length === 8, `se listan las 8 habilidades (${rows.length})`);
  check(doc.querySelectorAll('#objGrid .opt').length >= 3, 'se puede declarar un objetivo profesional');
  check(doc.querySelectorAll('#bgGrid .opt').length === 6, 'se listan las 6 experiencias previas');
  check(doc.querySelectorAll('#perkGrid .opt').length === 6, 'se listan los 6 rasgos');
  check($('createAvatar').innerHTML.indexOf('<svg') === 0, 'el avatar se dibuja desde el principio');

  console.log('2) La edad decide la etapa de vida');
  const etapaCon = edad => {
    $('inAge').value = String(edad);
    $('inAge').dispatchEvent(new window.Event('input', { bubbles: true }));
    return $('etapaBox').textContent;
  };
  check(/despertar/i.test(etapaCon(15)), 'a los 15 años estás en El despertar');
  check(/realidad/i.test(etapaCon(20)), 'a los 20 en El choque con la realidad');
  check(/construcci/i.test(etapaCon(30)), 'a los 30 en La construcción');
  check(/tarde/i.test(etapaCon(50)), 'a los 50 en Nunca es tarde');

  console.log('3) Repartir habilidades actualiza avatar y puntos');
  const before = $('createAvatar').innerHTML;
  const plus = rows[0].querySelectorAll('.pm button')[1];
  for (let i = 0; i < 10; i++) click(plus);
  check($('poolLeft').textContent === '50', `los puntos bajan al repartir (${$('poolLeft').textContent})`);
  check($('createAvatar').innerHTML !== before, 'el avatar cambia con las habilidades');
  click(rows[0].querySelectorAll('.pm button')[0]);
  check($('poolLeft').textContent === '51', 'restar devuelve el punto');

  const objBtn = doc.querySelectorAll('#objGrid .opt')[2];
  click(objBtn);
  check(objBtn.classList.contains('sel'), 'el objetivo elegido queda marcado');
  click($('btnRandomChar'));
  check($('poolLeft').textContent === '0', 'rellenar al azar reparte todos los puntos');
  check(errors.length === 0, 'sin errores en el currículum: ' + errors.join(' | '));

  console.log('4) La entrevista de evaluación');
  $('inName').value = 'Prueba';
  $('inName').dispatchEvent(new window.Event('input', { bubbles: true }));
  $('inAge').value = '30';
  $('inAge').dispatchEvent(new window.Event('input', { bubbles: true }));
  click($('btnStart'));
  check($('screenEntrevista').classList.contains('on'), 'enviar la candidatura abre la entrevista');
  check(!$('screenCreate').classList.contains('on'), 'el currículum se oculta');
  check($('entName').textContent.length > 0, 'hay alguien al otro lado de la mesa');
  check(/entrevist|comit|selecci|feria|junta/i.test($('entRole').textContent), 'se indica el escenario');

  // sentarse y responder a todo
  click($('entBody').querySelector('button'));
  let preguntas = 0, guard = 0;
  while (guard++ < 20) {
    const opts = $('entBody').querySelectorAll('.ent-opt');
    if (opts.length) { preguntas++; click(opts[Math.min(1, opts.length - 1)]); }
    const cont = $('entBody').querySelector('button.btn');
    if (cont && !$('entBody').querySelector('.ent-sello')) { click(cont); continue; }
    if ($('entBody').querySelector('.ent-sello')) break;
  }
  check(preguntas >= 4, `la entrevista hace al menos 4 preguntas (${preguntas})`);
  check(!!$('entBody').querySelector('.ent-sello'), 'termina siempre con el sello de rechazo');
  check(/rechaz/i.test($('entBody').textContent), 'el rechazo se dice con todas las letras');
  check(/Autenticidad/i.test($('entBody').textContent), 'se muestran los dos ejes al salir');
  check(errors.length === 0, 'sin errores en la entrevista: ' + errors.join(' | '));

  console.log('5) Salir al mundo');
  click([...$('entBody').querySelectorAll('button')].pop());
  check($('screenGame').classList.contains('on'), 'se entra al mundo');
  check(!$('screenEntrevista').classList.contains('on'), 'la entrevista se cierra');
  check($('hudDay').textContent === '1', 'el HUD marca el día 1');
  check(doc.querySelector('[data-v="autenticidad"]') !== null, 'el HUD muestra la autenticidad');
  check(doc.querySelector('[data-v="social"]') !== null, 'el HUD muestra la aprobación social');
  check(doc.querySelector('[data-v="estadoNom"]').textContent.length > 0, 'el HUD nombra el estado actual');

  console.log('6) El recorrido inicial por la ciudad');
  check($('modalBack').classList.contains('on'), 'al salir de la entrevista arranca la guía');
  check(/Cómo funciona/i.test($('mTitle').textContent), 'empieza explicando el juego');
  check(/dos maneras/i.test($('mBody').textContent), 'explica que cada acción tiene dos vías');
  check(/las dos barras/i.test($('mBody').textContent), 'y que hay decisiones que suman en las dos');
  const pasos = doc.querySelectorAll('.guia-punto').length;
  check(pasos === 8, `la guía tiene un paso por barrio más la intro y los mandos (${pasos})`);
  // recorrer la guía entera comprobando que cada barrio lista sus lugares
  let lugaresVistos = 0;
  for (let i = 1; i < pasos; i++) {
    const sig = [...doc.querySelectorAll('.guia-nav .btn')].find(b => /Siguiente|Empezar|Cerrar/.test(b.textContent));
    click(sig);
    lugaresVistos += doc.querySelectorAll('#mBody .act').length;
  }
  check(lugaresVistos >= 21, `la guía describe los 21 lugares del mapa (${lugaresVistos})`);
  check(/Mayús/i.test($('mBody').textContent), 'el último paso explica cómo correr');
  click([...doc.querySelectorAll('.guia-nav .btn')].find(b => /Empezar|Cerrar/.test(b.textContent)));
  check(!$('modalBack').classList.contains('on'), 'la guía se cierra al terminar');

  await wait(320);
  check(errors.length === 0, 'sin errores en el bucle: ' + errors.join(' | '));

  console.log('7) Entrar en un lugar y elegir cómo hacerlo');
  key('e');
  check($('modalBack').classList.contains('on'), 'pulsar E delante de la puerta abre el lugar');
  check($('mTitle').textContent === 'Tu apartamento', `apareces junto a tu casa (salió "${$('mTitle').textContent}")`);
  check(/Primera vez aquí/i.test($('mBody').textContent), 'la primera visita explica para qué sirve el sitio');
  const acciones = [...doc.querySelectorAll('#mBody .act')];
  check(acciones.length >= 3, 'la casa ofrece varias acciones');
  const planificar = acciones.find(a => a.textContent.includes('Planificar el día'));
  check(!!planificar, 'se puede planificar el día');
  check(planificar.querySelectorAll('.way').length === 2, 'la acción ofrece las dos vías');
  check(/tu manera|de verdad|importa/i.test(planificar.querySelector('.way.auth').textContent), 'una vía es la tuya');
  check(planificar.querySelector('.way.soc') !== null, 'la otra es la que se espera');

  const authAntes = Number(doc.querySelector('[data-v="autenticidad"]').textContent);
  const horaAntes = $('hudClock').textContent;
  click(planificar.querySelector('.way.auth button'));
  check($('hudClock').textContent !== horaAntes, `la acción hace avanzar el reloj (${horaAntes} → ${$('hudClock').textContent})`);
  check(Number(doc.querySelector('[data-v="autenticidad"]').textContent) > authAntes,
    'elegir tu vía sube la autenticidad en el HUD');
  check(doc.querySelectorAll('.toast').length > 0, 'la acción informa de su resultado');
  const repetir = [...doc.querySelectorAll('#mBody .act')].find(a => a.textContent.includes('Planificar el día'));
  check([...repetir.querySelectorAll('button')].every(b => b.disabled), 'planificar queda bloqueado el resto del día');

  const diaAntes = Number($('hudDay').textContent);
  const dormir = [...doc.querySelectorAll('#mBody .act')].find(a => a.textContent.includes('Dormir'));
  click(dormir.querySelector('button'));
  check(Number($('hudDay').textContent) === diaAntes + 1, 'dormir pasa al día siguiente');
  check(!$('modalBack').classList.contains('on'), 'al dormir se cierra el panel');
  check(errors.length === 0, 'sin errores al actuar: ' + errors.join(' | '));

  console.log('8) Movimiento del jugador');
  const posBefore = $('hudPlace').textContent;
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));
  await wait(260);
  doc.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'd', bubbles: true }));
  check(errors.length === 0, 'moverse no rompe nada');
  check(typeof posBefore === 'string' && posBefore.length > 0, 'el HUD indica dónde estás');

  console.log('9) Paneles del juego');
  const panels = [['p', 'Prueba'], ['n', 'Tus negocios'], ['q', 'Misiones'], ['m', 'Mapa de la ciudad'], ['l', 'Diario']];
  for (const [k, title] of panels) {
    key(k);
    check($('modalBack').classList.contains('on'), `la tecla ${k} abre un panel`);
    check($('mTitle').textContent === title, `la tecla ${k} abre "${title}" (salió "${$('mTitle').textContent}")`);
    check($('mBody').children.length > 0, `el panel ${title} tiene contenido`);
    key('Escape');
    check(!$('modalBack').classList.contains('on'), `Escape cierra ${title}`);
  }
  key('l');
  check(doc.querySelectorAll('#mBody .log-day').length > 0, 'el diario separa por días');
  check(doc.querySelectorAll('#mBody .log-sub').length > 0, 'y guarda el desglose de cada entrada');
  key('Escape');
  key('p');
  check(/Autenticidad/i.test($('mBody').textContent), 'el perfil muestra los dos ejes');
  check(/en qué influye|detalle/i.test($('mBody').textContent), 'el perfil explica cada característica');
  check(doc.querySelectorAll('#mBody .stat-row .pm button').length === 8, 'el perfil permite subir las 8 características');
  key('Escape');
  for (const b of doc.querySelectorAll('[data-open]')) {
    click(b);
    check($('modalBack').classList.contains('on'), `el botón ${b.dataset.open} abre su panel`);
    click($('mClose'));
  }

  console.log('9b) La guía se puede volver a abrir');
  key('?');
  check($('modalBack').classList.contains('on'), 'la tecla ? abre la guía');
  check(/Guía de la ciudad/i.test($('mSub').textContent), 'y es la guía de la ciudad');
  key('Escape');

  console.log('10) La pantalla de final está montada');
  check(!!$('screenFinal'), 'existe la pantalla de final');
  check(!$('screenFinal').classList.contains('on'), 'no aparece mientras la partida sigue');
  check(!!$('finRestart') && !!$('finContinue'), 'ofrece empezar otra vida o seguir jugando');

  console.log('11) Guardado');
  click($('btnSaveGame'));
  const saved = window.localStorage.getItem('rutapropia_save_v2');
  check(!!saved, 'la partida se guarda en localStorage');
  const data = JSON.parse(saved || '{}');
  check(data.s && data.s.name === 'Prueba', 'el guardado conserva el personaje');
  check(data.s && typeof data.s.autenticidad === 'number', 'el guardado conserva la autenticidad');
  check(data.s && data.s.entrevista && data.s.entrevista.hecha, 'el guardado recuerda la entrevista');
  check(data.pos && typeof data.pos.x === 'number', 'el guardado conserva la posición');

  console.log('12) Sin errores al final');
  await wait(200);
  check(errors.length === 0, 'ningún error registrado: ' + errors.join(' | '));

  window.close();
  if (fails === 0) console.log(`\n✅ INTEGRACIÓN DOM CORRECTA (${checks} comprobaciones)`);
  else { console.error(`\n❌ ${fails} de ${checks} comprobaciones fallaron`); process.exit(1); }
})().catch(e => { console.error('❌ Excepción:', e); process.exit(1); });
