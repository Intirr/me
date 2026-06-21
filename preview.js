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
// Helpers: estado base con un nivel uniforme, subiendo una dimensión concreta.
const flat = lvl => { const s = Object.assign({}, D); Object.keys(s).forEach(k => { if (typeof s[k] === 'number') s[k] = lvl; }); return s; };
const boost = (lvl, dimKey, to) => { const s = flat(lvl); M.DIMS.find(d => d.key === dimKey).parts.forEach(p => { s[p] = to; }); return s; };

const cases = {
  'prev-default.png': D,
  'prev-bajo.png': flat(16),                         // condición crítica
  'prev-alto.png': flat(94),                         // condición excepcional
  'prev-fisico.png': boost(40, 'fisico', 96),        // dominante: Físico (corpulento)
  'prev-mente.png': boost(40, 'mente', 96),          // dominante: Mente (halo)
  'prev-social.png': boost(40, 'social', 96),        // dominante: Social (postura abierta)
  'prev-bienestar.png': boost(35, 'bienestar', 96),  // dominante: Bienestar (erguido)
};
Object.entries(cases).forEach(([n, s]) => png(M.avatarSVG(s), n));

// montaje radar default
png(M.radarSVG(M.dimensions(M.DEFAULTS)), 'prev-radar.png');
