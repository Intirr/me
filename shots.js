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

(async () => {
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS);
  const browser = await chromium.launch({ executablePath: exe });
  const hechas = [];

  // 1. El currículum y 2. el rechazo
  {
    const p = await browser.newPage({ viewport: { width: 1360, height: 860 } });
    await p.goto(URL); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(DOCS, 'cv.png') }); hechas.push('cv.png');
    await p.click('#btnRandomChar');
    await p.fill('#inAge', '30'); await p.dispatchEvent('#inAge', 'input');
    await p.click('#btnStart'); await p.waitForTimeout(300);
    await entrevistar(p, 2);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(DOCS, 'entrevista.png') }); hechas.push('entrevista.png');
    // 3. el mundo y 4. el dilema
    const bts = await p.$$('#entBody button');
    await bts[bts.length - 1].click();
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(DOCS, 'mundo.png') }); hechas.push('mundo.png');
    await p.keyboard.press('e'); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(DOCS, 'dilema.png') }); hechas.push('dilema.png');
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
    await p.evaluate(({ key, auth, social }) => {
      const raw = JSON.parse(localStorage.getItem(key));
      raw.s.autenticidad = auth; raw.s.social = social;
      localStorage.setItem(key, JSON.stringify(raw));
    }, { key: SAVE, auth, social });
    await p.reload(); await p.waitForTimeout(300);
    await p.click('#btnLoadSave'); await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(DOCS, `estado-${nombre}.png`) });
    hechas.push(`estado-${nombre}.png`);
    await p.close();
  }

  await browser.close();
  console.log('✅ Capturas regeneradas en docs/: ' + hechas.join(', '));
})();
