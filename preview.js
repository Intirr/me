/* Renderiza muestras del avatar a PNG para inspección visual. */
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const M = require('./load-app.js');

function png(svg, name) {
  const r = new Resvg(svg, { background: '#0c0f14', fitTo: { mode: 'width', value: 480 } });
  fs.writeFileSync(name, r.render().asPng());
  console.log('wrote', name);
}

const cases = {
  'prev-default.png': M.DEFAULTS,
  'prev-atleta.png': Object.assign({}, M.DEFAULTS, M.PRESETS['Atleta']),
  'prev-academico.png': Object.assign({}, M.DEFAULTS, M.PRESETS['Académico']),
  'prev-creativo.png': Object.assign({}, M.DEFAULTS, M.PRESETS['Creativo']),
  'prev-robusta-largo.png': Object.assign({}, M.DEFAULTS, { complexion: 'robusta', peinado: 'largo', piel: '#7d4a2b', cabello: '#15110e', tonoMuscular: 40, vitalidad: 80 }),
  'prev-delgada-rapado.png': Object.assign({}, M.DEFAULTS, { complexion: 'delgada', peinado: 'rapado', piel: '#f7d9bf', altura: 200, vitalidad: 30 }),
};
Object.entries(cases).forEach(([n, s]) => png(M.avatarSVG(s), n));

// montaje radar default
png(M.radarSVG(M.dimensions(M.DEFAULTS)), 'prev-radar.png');
