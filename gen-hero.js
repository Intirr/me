/* Genera docs/captura.png: montaje del avatar + radar para el README. */
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const M = require('./app.js');

const s = Object.assign({}, M.DEFAULTS, M.PRESETS['Equilibrado'], { nombre: 'Alex' });
const avatar = M.avatarSVG(s).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const radar = M.radarSVG(M.dimensions(s)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  .replace(/(🏋️|🧠|🤝|🛡️|🧰|🌿)\s*/g, ''); // resvg no tiene fuente de emoji; el navegador sí los muestra

const W = 980, H = 560;
const hero = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f141c"/><stop offset="100%" stop-color="#0a0d12"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="24" y="24" width="${W-48}" height="${H-48}" rx="20" fill="#141a23" stroke="#28344a"/>
  <text x="48" y="70" font-family="Segoe UI, Arial" font-size="26" font-weight="800" fill="#e8eef6">Diseñador de Personajes</text>
  <text x="48" y="96" font-family="Segoe UI, Arial" font-size="14" fill="#93a1b5">Habilidades reales · Físico · Personalidad · Diagnóstico de vida</text>

  <g transform="translate(60,120)"><svg width="300" height="420" viewBox="0 0 320 540">${avatar}</svg></g>
  <g transform="translate(560,150)"><svg width="380" height="350" viewBox="0 0 360 330">${radar}</svg></g>
</svg>`;

fs.mkdirSync('docs', { recursive: true });
const r = new Resvg(hero, { background: '#0a0d12', fitTo: { mode: 'width', value: 1180 } });
fs.writeFileSync('docs/captura.png', r.render().asPng());
console.log('wrote docs/captura.png');
