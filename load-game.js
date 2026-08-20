/* Carga la lógica del juego extrayéndola del <script> embebido en juego.html.
   Así juego.html sigue siendo la única fuente de verdad y las pruebas en Node
   validan exactamente el código que se ejecuta en el navegador. */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'juego.html'), 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const source = blocks.find(b => b.includes('worldGen'));
if (!source) throw new Error('No se encontró el <script> del juego en juego.html');

const mod = { exports: {} };
// El IIFE exporta sus funciones cuando existe 'module' (Node). Como no hay
// 'document', el arranque de la interfaz se omite solo.
new Function('module', 'exports', source)(mod, mod.exports);

module.exports = Object.assign({}, mod.exports, { __source: source });
