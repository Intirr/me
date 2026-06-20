/* Carga las funciones puras de la app extrayéndolas del <script> embebido
   en index.html. Así index.html es la única fuente de verdad y las pruebas
   en Node validan exactamente el código que corre en el navegador. */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const source = blocks.find(b => b.includes('avatarSVG'));
if (!source) throw new Error('No se encontró el <script> de la app en index.html');

const mod = { exports: {} };
// El IIFE define module.exports cuando 'module' existe (Node). 'document' no
// existe aquí, por lo que el init del DOM se omite automáticamente.
new Function('module', 'exports', source)(mod, mod.exports);

module.exports = Object.assign({}, mod.exports, { __source: source });
