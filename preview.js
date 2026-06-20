/* Renderiza muestras del avatar a PNG para inspección visual. */
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const M = require('./load-app.js');

function png(svg, name) {
  const r = new Resvg(svg, { background: '#0c0f14', fitTo: { mode: 'width', value: 480 } });
  fs.writeFileSync(name, r.render().asPng());
  console.log('wrote', name);
}

const D = M.DEFAULTS;
const cases = {
  'prev-default.png': D,
  'prev-barba-gafas.png': Object.assign({}, D, { complexion: 'atletica', tonoMuscular: 78, peso: 35, caraForma: 'cuadrada', vello: 'corta', gafas: 'cuadradas', peinado: 'corto', cabello: '#15110e', cejas: 'gruesas', nariz: 60, boca: 45 }),
  'prev-afro-redonda.png': Object.assign({}, D, { complexion: 'media', peso: 55, caraForma: 'redonda', peinado: 'afro', piel: '#5a3420', cabello: '#15110e', ojos: '#3a2417', cejas: 'naturales', ojosTam: 70, nariz: 55, boca: 65, vitalidad: 85 }),
  'prev-corazon-largo.png': Object.assign({}, D, { complexion: 'delgada', caraForma: 'corazon', peinado: 'largo', cabello: '#a76a32', piel: '#f7d9bf', ojos: '#3f6e7d', cejas: 'arqueadas', ojosTam: 78, boca: 70, pecas: 'si', cadera: 70, hombros: 35 }),
  'prev-robusta-perilla.png': Object.assign({}, D, { complexion: 'robusta', peso: 80, caraForma: 'redonda', peinado: 'rapado', vello: 'perilla', piel: '#c98a5b', gafas: 'sol', nariz: 70, orejas: 70 }),
  'prev-recogido.png': Object.assign({}, D, { complexion: 'media', caraForma: 'ovalada', peinado: 'recogido', cabello: '#3b2a1a', piel: '#e0a87e', ojos: '#3f7a66', cejas: 'finas', ojosTam: 75, boca: 75, cuello: 70, hombros: 40, cadera: 60 }),
  'prev-bigote-larga.png': Object.assign({}, D, { complexion: 'media', caraForma: 'larga', peinado: 'medio', vello: 'bigote', cabello: '#6b4423', cejas: 'rectas', nariz: 75, altura: 195 }),
};
Object.entries(cases).forEach(([n, s]) => png(M.avatarSVG(s), n));

// montaje radar default
png(M.radarSVG(M.dimensions(M.DEFAULTS)), 'prev-radar.png');
