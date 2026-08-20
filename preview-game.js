/* Genera una vista aérea del mundo del juego (docs/mapa.png) a partir de la
   misma generación de mapa que usa juego.html. Sólo para desarrollo y README.
   Ejecuta: node preview-game.js                                             */
const fs = require('fs');
const path = require('path');
const M = require('./load-game.js');

const { Resvg } = require('@resvg/resvg-js');

const COLORS = { 0: '#2f6b3d', 1: '#3f4551', 2: '#6b7280', 3: '#1d4e6b', 4: '#c2a878',
                 5: '#245732', 6: '#77803c', 7: '#7a5a3a', 8: '#2b3242', 9: '#8a6a45' };
const PROP_COLOR = { arbol: '#1f5c2e', pino: '#1b5130', arbusto: '#27673a', roca: '#6b7280',
                     flor: '#f9a8d4', seta: '#dc2626', concha: '#fde8d0', cultivo: '#4d7c0f',
                     farola: '#ffe9a8', banco: '#7a5a3a', fuente: '#2a6f96' };

function mapSVG(world, px) {
  const W = world.W * px, H = world.H * px;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  out += `<rect width="${W}" height="${H}" fill="#0c0f14"/>`;
  // terreno (se agrupan las casillas iguales por fila para reducir el SVG)
  for (let y = 0; y < world.H; y++) {
    let x = 0;
    while (x < world.W) {
      const t = world.tiles[y * world.W + x];
      let run = 1;
      while (x + run < world.W && world.tiles[y * world.W + x + run] === t) run++;
      out += `<rect x="${x * px}" y="${y * px}" width="${run * px}" height="${px}" fill="${COLORS[t] || '#2f6b3d'}"/>`;
      x += run;
    }
  }
  // decoración
  world.props.forEach(p => {
    const c = PROP_COLOR[p.kind];
    if (!c) return;
    out += `<circle cx="${(p.x + 0.5) * px}" cy="${(p.y + 0.5) * px}" r="${px * 0.32}" fill="${c}" opacity="0.9"/>`;
  });
  // edificios
  world.buildings.forEach(b => {
    out += `<rect x="${b.x * px}" y="${b.y * px}" width="${b.w * px}" height="${b.h * px}" rx="${px}" `
      + `fill="${b.color}" stroke="#0c0f14" stroke-width="2"/>`;
    out += `<rect x="${b.door.x * px}" y="${b.door.y * px}" width="${px}" height="${px}" fill="#facc15"/>`;
    out += `<text x="${(b.x + b.w / 2) * px}" y="${(b.y - 0.4) * px}" fill="#e8eef6" font-size="${px * 1.5}" `
      + `font-family="sans-serif" font-weight="700" text-anchor="middle">${b.name}</text>`;
  });
  // puntos de interés
  world.spots.forEach(s => {
    out += `<circle cx="${(s.x + 0.5) * px}" cy="${(s.y + 0.5) * px}" r="${px * 1.6}" fill="none" stroke="#34d399" stroke-width="2"/>`;
    out += `<text x="${(s.x + 0.5) * px}" y="${(s.y - 1.4) * px}" fill="#34d399" font-size="${px * 1.5}" `
      + `font-family="sans-serif" font-weight="700" text-anchor="middle">${s.name}</text>`;
  });
  // aparición
  out += `<circle cx="${world.spawn.x / M.TILE * px}" cy="${world.spawn.y / M.TILE * px}" r="${px * 1.1}" fill="#ffffff"/>`;
  out += '</svg>';
  return out;
}

const world = M.worldGen(20260820);
const svg = mapSVG(world, 9);
const dir = path.join(__dirname, 'docs');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const png = new Resvg(svg, { fitTo: { mode: 'width', value: world.W * 9 } }).render().asPng();
fs.writeFileSync(path.join(dir, 'mapa.png'), png);

// Avatares de ejemplo: el mismo perfil con características distintas.
const perfiles = {
  'avatar-inicial': { vigor: 12, intelecto: 14, disciplina: 10, carisma: 12, creatividad: 12, finanzas: 10, liderazgo: 10, equilibrio: 12 },
  'avatar-desarrollado': { vigor: 78, intelecto: 82, disciplina: 74, carisma: 86, creatividad: 70, finanzas: 88, liderazgo: 76, equilibrio: 80 },
};
Object.keys(perfiles).forEach(name => {
  const out = new Resvg(M.avatarSVG(perfiles[name]), { fitTo: { mode: 'width', value: 320 } }).render().asPng();
  fs.writeFileSync(path.join(dir, name + '.png'), out);
});

const r = M.reachability(world, world.spawn);
console.log(`✅ docs/mapa.png (${world.W}×${world.H} casillas, ${world.buildings.length} edificios, `
  + `${world.spots.length} puntos, ${world.props.length} elementos de decoración)`);
console.log(`   ${r.visited} casillas transitables · lugares inaccesibles: ${r.missing.length}`);
console.log('✅ docs/avatar-inicial.png y docs/avatar-desarrollado.png');
