/* Captura las imágenes del README abriendo el juego en un navegador real.
   Opcional: necesita playwright-core y un Chromium instalado en la máquina.
     npm i -D playwright-core && node shots.js
   Si no hay navegador, el script lo dice y no falla la build.               */
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright-core')); }
catch (_) {
  console.log('⚠️  playwright-core no está instalado. Instálalo con "npm i -D playwright-core" para regenerar las capturas.');
  process.exit(0);
}

// Rutas habituales del navegador; también se puede fijar con CHROMIUM_PATH.
const CANDIDATOS = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const exe = CANDIDATOS.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });
if (!exe) {
  console.log('⚠️  No se ha encontrado ningún Chromium. Define CHROMIUM_PATH y vuelve a intentarlo.');
  process.exit(0);
}

const DOCS = path.join(__dirname, 'docs');
const URL = 'file://' + path.join(__dirname, 'juego.html');
const SAVE = 'rutapropia_save_v2';

// Contesta la entrevista completa eligiendo siempre la misma columna.
async function entrevistar(p, columna) {
  await p.click('#entBody button');
  for (let i = 0; i < 14; i++) {
    const opts = await p.$$('#entBody .ent-opt');
    if (opts.length) { await opts[Math.min(columna, opts.length - 1)].click(); await p.waitForTimeout(60); }
    if (await p.$('#entBody .ent-sello')) break;
    const btn = await p.$('#entBody button.btn');
    if (btn) { await btn.click(); await p.waitForTimeout(60); }
  }
}

// Coloca al jugador delante de un lugar concreto usando el mismo generador
// de mundo que el juego, para poder fotografiar sus paneles.
const M = require('./load-game.js');
async function llevarA(p, id) {
  const semilla = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).s.seed, SAVE);
  const w = M.worldGen(semilla);
  const sitio = w.buildings.find(b => b.id === id) || w.spots.find(x => x.id === id);
  const destino = sitio.door
    ? { x: (sitio.door.x + 0.5) * M.TILE, y: (sitio.door.y + 1.2) * M.TILE }
    : { x: (sitio.x + 0.5) * M.TILE, y: (sitio.y + 0.5) * M.TILE };
  await p.evaluate(({ k, destino }) => {
    const raw = JSON.parse(localStorage.getItem(k));
    raw.pos = destino;
    localStorage.setItem(k, JSON.stringify(raw));
  }, { k: SAVE, destino });
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btnLoadSave'); await p.waitForTimeout(800);
  const saltar = await p.$('.guia-nav .btn.ghost');
  if (saltar) { await saltar.click(); await p.waitForTimeout(400); }
  await p.keyboard.press('e'); await p.waitForTimeout(400);
}

// Deja al jugador justo encima de donde ronda un personaje.
async function llevarANpc(p, npcId) {
  const npc = M.NPCS.find(n => n.id === npcId);
  const semilla = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).s.seed, SAVE);
  const w = M.worldGen(semilla);
  const sitio = w.buildings.find(b => b.id === npc.cerca) || w.spots.find(x => x.id === npc.cerca);
  const destino = { x: ((sitio.door ? sitio.door.x : sitio.x) + 2.5) * M.TILE,
                    y: ((sitio.door ? sitio.door.y : sitio.y) + 2.5) * M.TILE };
  await p.evaluate(({ k, destino }) => {
    const raw = JSON.parse(localStorage.getItem(k));
    raw.pos = destino;
    localStorage.setItem(k, JSON.stringify(raw));
  }, { k: SAVE, destino });
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btnLoadSave'); await p.waitForTimeout(800);
  const saltar = await p.$('.guia-nav .btn.ghost');
  if (saltar) { await saltar.click(); await p.waitForTimeout(400); }
}

(async () => {
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS);
  const browser = await chromium.launch({ executablePath: exe });
  const hechas = [];

  // 1. El currículum y 2. el rechazo
  {
    const p = await browser.newPage({ viewport: { width: 1360, height: 860 } });
    p.on('pageerror', e => console.error('⚠️  error en la página:', e.message));
    await p.goto(URL); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(DOCS, 'cv.png') }); hechas.push('cv.png');
    await p.click('#btnRandomChar');
    await p.fill('#inAge', '30'); await p.dispatchEvent('#inAge', 'input');
    await p.click('#btnStart'); await p.waitForTimeout(300);
    await entrevistar(p, 2);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(DOCS, 'entrevista.png') }); hechas.push('entrevista.png');
    // 3. la guía inicial, 4. el mundo y 5. el dilema
    const bts = await p.$$('#entBody button');
    await bts[bts.length - 1].click();
    await p.waitForTimeout(900);
    // el recorrido arranca solo: capturamos el paso de un barrio
    await p.click('.guia-nav .btn.primary'); await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(DOCS, 'guia.png') }); hechas.push('guia.png');
    await p.click('.guia-nav .btn.ghost'); await p.waitForTimeout(600);   // saltar la guía
    await p.screenshot({ path: path.join(DOCS, 'mundo.png') }); hechas.push('mundo.png');
    await p.keyboard.press('e'); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(DOCS, 'dilema.png') }); hechas.push('dilema.png');
    await p.keyboard.press('Escape');

    // 6. el diseñador de negocios, con dinero y características suficientes
    await p.evaluate(k => {
      const raw = JSON.parse(localStorage.getItem(k));
      raw.s.money = 60000;
      Object.keys(raw.s.stats).forEach(x => { raw.s.stats[x] = 55; });
      localStorage.setItem(k, JSON.stringify(raw));
    }, SAVE);
    await llevarA(p, 'incubadora');
    const fundar = (await p.$$('#mBody .act button')).find(Boolean);
    if (fundar) { await fundar.click(); await p.waitForTimeout(350); }
    await p.screenshot({ path: path.join(DOCS, 'negocio.png') }); hechas.push('negocio.png');

    // 7. el último paso del asistente, con los números de lo que estás montando
    const sorprendeme = (await p.$$('.guia-nav .btn.ghost.sm')).find(Boolean);
    if (sorprendeme) { await sorprendeme.click(); await p.waitForTimeout(350); }
    await p.screenshot({ path: path.join(DOCS, 'negocio-resumen.png') }); hechas.push('negocio-resumen.png');

    // 8. una conversación con opciones, junto al personaje que la abre
    await p.keyboard.press('Escape');
    await llevarANpc(p, 'tomas');
    for (let i = 0; i < 30 && !(await p.$('.ent-opts')); i++) {
      await p.keyboard.press('e'); await p.waitForTimeout(150);
      const seguir = await p.$('#mBody .btn.primary, #mBody .btn.wide');
      if (seguir) { await seguir.click(); await p.waitForTimeout(180); }
    }
    if (await p.$('.ent-opts')) {
      await p.screenshot({ path: path.join(DOCS, 'charla.png') }); hechas.push('charla.png');
    }
    await p.close();
  }

  // 5 y 6. cómo se ve el mundo en cada estado
  for (const [nombre, auth, social] of [['mascara', 12, 92], ['liderazgo', 82, 82]]) {
    const p = await browser.newPage({ viewport: { width: 1200, height: 760 } });
    await p.goto(URL); await p.waitForTimeout(300);
    await p.click('#btnRandomChar');
    await p.click('#btnStart'); await p.waitForTimeout(200);
    await entrevistar(p, 0);
    const bts = await p.$$('#entBody button');
    await bts[bts.length - 1].click();
    await p.waitForTimeout(500);
    const saltar = await p.$('.guia-nav .btn.ghost');
    if (saltar) { await saltar.click(); await p.waitForTimeout(200); }
    await p.evaluate(({ key, auth, social }) => {
      const raw = JSON.parse(localStorage.getItem(key));
      raw.s.autenticidad = auth; raw.s.social = social;
      localStorage.setItem(key, JSON.stringify(raw));
    }, { key: SAVE, auth, social });
    await p.reload(); await p.waitForTimeout(300);
    await p.click('#btnLoadSave'); await p.waitForTimeout(900);
    const saltar2 = await p.$('.guia-nav .btn.ghost');
    if (saltar2) { await saltar2.click(); await p.waitForTimeout(500); }
    await p.screenshot({ path: path.join(DOCS, `estado-${nombre}.png`) });
    hechas.push(`estado-${nombre}.png`);
    await p.close();
  }

  await browser.close();
  console.log('✅ Capturas regeneradas en docs/: ' + hechas.join(', '));
})();
