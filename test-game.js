/* Pruebas del RPG "Ruta Propia".
   Valida el mundo (que todo sea alcanzable a pie), la simulación de muchos
   días, los rangos de todos los recursos y el SVG del avatar/radar.
   Ejecuta: node test-game.js                                              */
const M = require('./load-game.js');

let fails = 0, checks = 0;
const check = (cond, msg) => { checks++; if (!cond) { console.error('  ✗ ' + msg); fails++; } };
const finite = (v, msg) => check(typeof v === 'number' && isFinite(v), `${msg} (valor: ${v})`);

/* ------------------------------------------------------------------ */
console.log('1) Datos coherentes');
(() => {
  const keys = new Set(M.STAT_KEYS);
  check(keys.size === 8, '8 características');

  const ids = new Set(), actionIds = new Set();
  M.PLACES.forEach(p => {
    check(!ids.has(p.id), `id de lugar único: ${p.id}`); ids.add(p.id);
    check(p.actions.length > 0, `${p.id}: tiene acciones`);
    const aids = new Set();
    p.actions.forEach(a => {
      check(!aids.has(a.id), `${p.id}/${a.id}: id de acción único dentro del lugar`); aids.add(a.id);
      // los flags de "una vez al día" se guardan por id: deben ser únicos en todo el juego
      check(!actionIds.has(a.id), `${a.id}: id de acción único en todo el juego (${p.id})`); actionIds.add(a.id);
      check(!!a.label && !!a.icon, `${p.id}/${a.id}: etiqueta e icono`);
      if (a.g) Object.keys(a.g).forEach(k => check(keys.has(k), `${p.id}/${a.id}: característica válida "${k}"`));
      if (a.req && a.req.stat) Object.keys(a.req.stat).forEach(k =>
        check(keys.has(k), `${p.id}/${a.id}: requisito válido "${k}"`));
      if (a.req && a.req.item) check(M.ITEMS.some(i => i.id === a.req.item), `${p.id}/${a.id}: objeto requerido existe`);
      check((a.h || 0) <= 6, `${p.id}/${a.id}: no ocupa más de 6 h`);
    });
  });

  M.BIZ_TYPES.forEach(b => {
    b.stats.forEach(k => check(keys.has(k), `negocio ${b.id}: característica válida "${k}"`));
    Object.keys(b.req || {}).forEach(k => check(keys.has(k), `negocio ${b.id}: requisito válido "${k}"`));
    check(b.base > b.upkeep, `negocio ${b.id}: el ingreso base supera los costes fijos`);
  });

  M.BACKGROUNDS.forEach(b => Object.keys(b.bonus).forEach(k =>
    check(keys.has(k), `trasfondo ${b.id}: bonus válido "${k}"`)));
  M.QUESTS.forEach(q => check(typeof q.check === 'function', `misión ${q.id}: tiene comprobación`));
})();

/* ------------------------------------------------------------------ */
console.log('2) Mundo: todo alcanzable a pie (40 semillas)');
for (let i = 0; i < 40; i++) {
  const w = M.worldGen(1000 + i * 7919);
  check(w.buildings.length === M.PLACES.filter(p => p.kind === 'building').length, `semilla ${i}: todos los edificios colocados`);
  check(w.spots.length === M.PLACES.filter(p => p.kind === 'spot').length, `semilla ${i}: todos los puntos colocados`);
  const r = M.reachability(w, w.spawn);
  check(r.missing.length === 0, `semilla ${i}: sin lugares inaccesibles (${r.missing.join(', ')})`);
  check(r.visited > 3000, `semilla ${i}: el mundo transitable es amplio (${r.visited})`);
  // la casilla de aparición nunca puede ser sólida
  const sx = Math.floor(w.spawn.x / M.TILE), sy = Math.floor(w.spawn.y / M.TILE);
  check(!w.isSolid(sx, sy), `semilla ${i}: aparición en casilla transitable`);
  // ninguna puerta puede estar bloqueada por decoración
  w.buildings.forEach(b => check(!w.isSolid(b.door.x, b.door.y), `semilla ${i}: puerta libre en ${b.id}`));
  w.spots.forEach(s => check(!w.isSolid(s.x, s.y), `semilla ${i}: punto libre en ${s.id}`));
}

/* ------------------------------------------------------------------ */
console.log('3) Avatar y radar sin artefactos (extremos + 200 perfiles)');
function validateSVG(svg, ctx) {
  check(typeof svg === 'string' && svg.startsWith('<svg') && svg.includes('</svg>'), `${ctx}: SVG bien formado`);
  check(!/NaN|undefined|Infinity/.test(svg), `${ctx}: sin NaN/undefined/Infinity`);
  check(!/(cx|cy|rx|ry|x|y|width|height|x1|y1|x2|y2)="(\s*)"/.test(svg), `${ctx}: sin atributos numéricos vacíos`);
}
[0, 1, 50, 99, 100].forEach(v => {
  const st = {}; M.STAT_KEYS.forEach(k => { st[k] = v; });
  validateSVG(M.avatarSVG(st), `avatar todo=${v}`);
  validateSVG(M.radarSVG(st), `radar todo=${v}`);
});
M.STAT_KEYS.forEach(dom => {
  const st = {}; M.STAT_KEYS.forEach(k => { st[k] = 0; });
  st[dom] = 100;
  validateSVG(M.avatarSVG(st), `avatar dominante=${dom}`);
});
for (let i = 0; i < 200; i++) {
  const st = {}; M.STAT_KEYS.forEach(k => { st[k] = Math.floor(Math.random() * 101); });
  validateSVG(M.avatarSVG(st), `avatar aleatorio#${i}`);
  validateSVG(M.radarSVG(st), `radar aleatorio#${i}`);
}

/* ------------------------------------------------------------------ */
console.log('4) Creación de personaje');
M.BACKGROUNDS.forEach(bg => {
  M.PERKS.forEach(pk => {
    const s = M.newGame({ name: 'X', age: 30, bg: bg.id, perk: pk.id, seed: 42 });
    M.STAT_KEYS.forEach(k => check(s.stats[k] >= 0 && s.stats[k] <= 100, `${bg.id}/${pk.id}: ${k} en rango`));
    finite(s.money, `${bg.id}/${pk.id}: dinero inicial`);
    check(s.energy > 0 && s.energy <= M.maxEnergy(s), `${bg.id}/${pk.id}: energía inicial válida`);
    check(s.day === 1, `${bg.id}/${pk.id}: empieza el día 1`);
  });
});
(() => { // los puntos repartidos en la creación llegan al juego
  const stats = {}; M.STAT_KEYS.forEach((k, i) => { stats[k] = M.START_BASE + (i < 4 ? 15 : 0); });
  const s = M.newGame({ name: 'Y', age: 22, bg: 'deportista', perk: 'incansable', stats, seed: 5 });
  check(s.stats[M.STAT_KEYS[0]] >= 25, 'las características elegidas se aplican');
})();

/* ------------------------------------------------------------------ */
console.log('5) Reglas de las acciones');
(() => {
  const s = M.newGame({ name: 'Z', age: 28, bg: 'empleado', perk: 'resiliente', seed: 11 });
  const gym = M.PLACE_BY.gimnasio, fuerza = gym.actions[0];

  const before = { h: s.hour, e: s.energy, m: s.money };
  const r = M.doAction(s, gym, fuerza);
  check(r.ok, 'entrenar es posible al empezar el día');
  check(s.hour > before.h, 'la acción consume tiempo');
  check(s.energy < before.e, 'la acción consume energía');
  check(s.money < before.m, 'la acción cobra su precio');

  // sin energía no se puede
  s.energy = 0;
  check(!M.canDo(s, gym, fuerza).ok, 'sin energía la acción se bloquea');
  // sin dinero tampoco
  s.energy = 100; s.money = 0;
  check(!M.canDo(s, gym, fuerza).ok, 'sin dinero la acción se bloquea');
  // fuera de horario
  s.money = 1000; s.hour = 23.5;
  check(!M.canDo(s, gym, fuerza).ok, 'de madrugada ya no da tiempo');
  // requisitos por característica
  const avanzado = gym.actions[3];
  s.hour = 9; s.stats.vigor = 10;
  check(!M.canDo(s, gym, avanzado).ok, 'los requisitos de característica se respetan');
  s.stats.vigor = 60;
  check(M.canDo(s, gym, avanzado).ok, 'cumpliendo el requisito se desbloquea');
  // acciones de una vez al día
  const casa = M.PLACE_BY.casa, plan = casa.actions.find(a => a.id === 'planificar');
  M.doAction(s, casa, plan);
  check(!M.canDo(s, casa, plan).ok, 'planificar sólo una vez al día');
})();

/* ------------------------------------------------------------------ */
console.log('6) Banco y negocios');
(() => {
  const s = M.newGame({ name: 'B', age: 30, bg: 'heredero', perk: 'analitico', seed: 3 });
  const m0 = s.money;
  check(M.bankDeposit(s, 1000).ok && s.savings === 1000 && s.money === m0 - 1000, 'ingresar mueve dinero al ahorro');
  check(!M.bankDeposit(s, -5).ok, 'no se puede ingresar una cantidad negativa');
  check(M.bankWithdraw(s, 400).ok && s.savings === 600, 'retirar devuelve el dinero a caja');
  check(!M.bankWithdraw(s, 1e9).ok || (s.savings === 0 && s.money >= 0), 'retirar de más se limita al saldo');
  M.bankDeposit(s, 1e9);
  check(s.money === 0 && s.savings > 0, 'ingresar de más se limita a la caja disponible');
  M.bankWithdraw(s, 1e9);
  const lim = M.loanLimit(s);
  check(!M.bankLoan(s, lim + 1000).ok, 'el banco no presta por encima del límite');
  check(M.bankLoan(s, 500).ok && s.debt === 500, 'el préstamo aumenta la deuda');
  check(M.bankRepay(s, 500).ok && s.debt === 0, 'amortizar reduce la deuda');

  s.money = 20000;
  const f = M.foundBiz(s, 'puesto', 'Puesto de prueba');
  check(f.ok && s.bizs.length === 1, 'se puede registrar un negocio');
  const b = s.bizs[0];
  finite(M.bizIncome(s, b), 'ingreso del negocio finito');
  const inc0 = M.bizIncome(s, b);
  M.bizAction(s, b.id, 'mejorar');
  check(b.level === 2, 'el negocio sube de nivel');
  check(M.bizIncome(s, b) > inc0, 'subir de nivel aumenta el ingreso');
  s.stats.liderazgo = 80;
  M.bizAction(s, b.id, 'contratar');
  check(b.emp === 1, 'se puede contratar');
  const v = M.bizValue(s, b);
  const before = s.money;
  M.bizAction(s, b.id, 'vender');
  check(s.bizs.length === 0 && s.money === before + v, 'vender el negocio devuelve su valor');
  check(!M.canFound(s, 'startup').ok || s.stats.intelecto >= 48, 'los negocios exigentes piden características');
  check(M.buyItem(s, 'bici').ok && s.items.bici, 'se puede comprar equipo');
  check(!M.buyItem(s, 'bici').ok, 'no se compra dos veces el mismo objeto');
})();

/* ------------------------------------------------------------------ */
console.log('7) Simulación larga (12 partidas × 120 días)');
function play(seed, bgId, perkId, days) {
  const s = M.newGame({ name: 'Sim', age: 27, bg: bgId, perk: perkId, seed });
  let rc = seed >>> 0;
  const rnd = () => { rc = (Math.imul(rc, 1103515245) + 12345) & 0x7fffffff; return rc / 0x7fffffff; };
  const acts = [];
  M.PLACES.forEach(p => p.actions.forEach(a => acts.push([p, a])));

  for (let d = 0; d < days; d++) {
    let guard = 0;
    while (s.hour < 22 && guard++ < 40) {
      const opts = acts.filter(([p, a]) => a.sp !== 'dormir' && M.canDo(s, p, a).ok);
      if (!opts.length) break;
      const [p, a] = opts[Math.floor(rnd() * opts.length)];
      const r = M.doAction(s, p, a);
      if (r.ui) {
        if (r.ui === 'fundar') { const t = M.BIZ_TYPES.find(t => M.canFound(s, t.id).ok); if (t) M.foundBiz(s, t.id, t.name); }
        else if (r.ui === 'tienda') { const it = M.ITEMS.find(i => !s.items[i.id] && s.money > i.cost * 3); if (it) M.buyItem(s, it.id); }
        else if (r.ui === 'depositar') M.bankDeposit(s, Math.floor(s.money * 0.3));
        else if (r.ui === 'retirar') M.bankWithdraw(s, Math.floor(s.savings * 0.5));
        else if (r.ui === 'amortizar') M.bankRepay(s, Math.min(s.money, s.debt));
        else if (r.ui === 'prestamo') M.bankLoan(s, Math.min(500, Math.max(0, M.loanLimit(s))));
        continue;
      }
      if (!r.ok) break;
      // gasta puntos de nivel de vez en cuando
      if (s.points > 0 && rnd() < 0.3) M.spendPoint(s, M.STAT_KEYS[Math.floor(rnd() * M.STAT_KEYS.length)]);
      // acciones sobre los negocios
      if (s.bizs.length && rnd() < 0.15) {
        const b = s.bizs[Math.floor(rnd() * s.bizs.length)];
        M.bizAction(s, b.id, ['mejorar', 'marketing', 'contratar'][Math.floor(rnd() * 3)]);
      }
      invariants(s, `${bgId}/${perkId} día ${s.day}`);
    }
    M.endDay(s, []);
    invariants(s, `${bgId}/${perkId} fin del día ${s.day}`);
  }
  return s;
}

function invariants(s, ctx) {
  M.STAT_KEYS.forEach(k => {
    check(s.stats[k] >= 0 && s.stats[k] <= 100, `${ctx}: ${k} dentro de 0..100 (${s.stats[k]})`);
    finite(s.statxp[k], `${ctx}: experiencia de ${k}`);
    check(s.statxp[k] >= 0, `${ctx}: experiencia de ${k} no negativa`);
  });
  check(s.energy >= 0 && s.energy <= M.maxEnergy(s) + 0.001, `${ctx}: energía en rango (${s.energy})`);
  check(s.stress >= 0 && s.stress <= 100, `${ctx}: estrés en rango`);
  check(s.mood >= 0 && s.mood <= 100, `${ctx}: ánimo en rango`);
  check(s.rep >= 0 && s.rep <= 100, `${ctx}: reputación en rango`);
  check(s.hour >= 0 && s.hour <= 24.001, `${ctx}: hora válida (${s.hour})`);
  check(s.money >= 0, `${ctx}: la caja nunca queda en negativo (${s.money})`);
  finite(s.money, `${ctx}: dinero finito`);
  finite(s.debt, `${ctx}: deuda finita`);
  finite(s.savings, `${ctx}: ahorro finito`);
  check(s.level >= 1 && s.level < 500, `${ctx}: nivel razonable (${s.level})`);
  check(s.net >= 0, `${ctx}: contactos no negativos`);
  s.bizs.forEach(b => {
    finite(M.bizIncome(s, b), `${ctx}: ingreso de ${b.name}`);
    check(b.level >= 1 && b.level <= 6, `${ctx}: nivel del negocio en rango`);
    check(b.emp >= 0 && b.emp <= 8, `${ctx}: plantilla en rango`);
  });
  check(M.PLACES.every(p => p.actions.every(a => typeof M.canDo(s, p, a).ok === 'boolean')),
    `${ctx}: canDo responde para todas las acciones`);
}

const runs = [];
let seed = 1;
for (const bg of M.BACKGROUNDS) {
  for (const pk of [M.PERKS[seed % M.PERKS.length], M.PERKS[(seed + 3) % M.PERKS.length]]) {
    runs.push(play(seed * 977, bg.id, pk.id, 120));
    seed++;
  }
}
runs.forEach((s, i) => {
  check(s.day === 121, `partida ${i}: han pasado 120 días`);
  check(s.counters.actions > 100, `partida ${i}: se han hecho muchas acciones (${s.counters.actions})`);
  check(s.log.length > 0, `partida ${i}: el diario registra lo ocurrido`);
});
const avgLevel = runs.reduce((a, s) => a + s.level, 0) / runs.length;
const withBiz = runs.filter(s => s.bizs.length > 0).length;
check(avgLevel > 5, `progresión razonable: nivel medio ${avgLevel.toFixed(1)} tras 120 días`);
check(withBiz > 0, `las partidas llegan a montar negocios (${withBiz}/${runs.length})`);

/* ------------------------------------------------------------------ */
console.log('8) Logros');
(() => {
  const s = M.newGame({ name: 'L', age: 30, bg: 'comercial', perk: 'analitico', seed: 21 });
  s.money = 5000;
  M.foundBiz(s, 'puesto', 'Puesto');
  s.stats.carisma = 70; s.stats.disciplina = 70; s.rep = 50;
  s.hour = 23;
  const out = [];
  M.endDay(s, out);
  check(s.counters.firstBizIncome === true, 'se registra el primer ingreso del negocio');
  M.checkAchievements(s, out);
  check(s.achievements.a4 === true, 'se desbloquea el logro del primer euro propio');
  check(out.some(o => /Primer euro propio/.test(o.t)), 'el logro se anuncia al jugador');
  const n = out.filter(o => /Primer euro propio/.test(o.t)).length;
  M.checkAchievements(s, out);
  check(out.filter(o => /Primer euro propio/.test(o.t)).length === n, 'un logro no se anuncia dos veces');
})();

/* ------------------------------------------------------------------ */
console.log('9) Misiones y descanso');
(() => {
  const s = M.newGame({ name: 'Q', age: 26, bg: 'comercial', perk: 'networker', seed: 99 });
  s.money = 3000; M.checkQuests(s, []);
  check(s.quests.q3.done, 'la misión del colchón de seguridad se completa con dinero suficiente');
  const before = s.money;
  M.checkQuests(s, []);
  check(s.money === before, 'una misión completada no vuelve a pagar recompensa');

  const s2 = M.newGame({ name: 'D', age: 26, bg: 'estudiante', perk: 'madrugador', seed: 4 });
  s2.energy = 5; s2.hour = 22; s2.stress = 80;
  const day0 = s2.day;
  M.endDay(s2, []);
  check(s2.day === day0 + 1, 'dormir avanza un día');
  check(s2.hour === 6, 'el madrugador se levanta a las 6:00');
  check(s2.energy > 20, 'dormir recupera energía');
  check(s2.stress < 80, 'dormir baja el estrés');
})();

/* ------------------------------------------------------------------ */
console.log('10) Determinismo con la misma semilla');
(() => {
  const run = () => {
    const s = M.newGame({ name: 'R', age: 30, bg: 'autodidacta', perk: 'ahorrador', seed: 777 });
    for (let d = 0; d < 25; d++) {
      const gym = M.PLACE_BY.gimnasio;
      if (M.canDo(s, gym, gym.actions[1]).ok) M.doAction(s, gym, gym.actions[1]);
      M.endDay(s, []);
    }
    return JSON.stringify({ m: s.money, st: s.stats, r: s.rep, l: s.level, d: s.debt });
  };
  check(run() === run(), 'dos partidas con la misma semilla evolucionan igual');
})();

/* ------------------------------------------------------------------ */
if (fails === 0) console.log(`\n✅ TODAS LAS PRUEBAS PASARON (${checks} comprobaciones)`);
else { console.error(`\n❌ ${fails} de ${checks} comprobaciones fallaron`); process.exit(1); }
