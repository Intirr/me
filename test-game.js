/* Pruebas del RPG "Ruta Propia".
   Valida el mundo, el currículum y la entrevista, los dos ejes del juego
   (autenticidad y aprobación social), los estados derivados, los dilemas de
   cada acción, la economía, los finales y el avatar.
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
  check(M.ETAPAS.length === 4, 'las 4 etapas de vida del diseño');
  check(M.OBJETIVOS.length >= 3, 'hay objetivos profesionales que elegir');

  const ids = new Set(), actionIds = new Set();
  let conDilema = 0, sinDilema = 0;
  M.PLACES.forEach(p => {
    check(!ids.has(p.id), `id de lugar único: ${p.id}`); ids.add(p.id);
    check(p.actions.length > 0, `${p.id}: tiene acciones`);
    p.actions.forEach(a => {
      check(!actionIds.has(a.id), `${a.id}: id de acción único en todo el juego (${p.id})`); actionIds.add(a.id);
      check(!!a.label && !!a.icon, `${p.id}/${a.id}: etiqueta e icono`);
      if (a.g) Object.keys(a.g).forEach(k => check(keys.has(k), `${p.id}/${a.id}: característica válida "${k}"`));
      if (a.req && a.req.stat) Object.keys(a.req.stat).forEach(k =>
        check(keys.has(k), `${p.id}/${a.id}: requisito válido "${k}"`));
      if (a.req && a.req.item) check(M.ITEMS.some(i => i.id === a.req.item), `${p.id}/${a.id}: objeto requerido existe`);
      check((a.h || 0) <= 6, `${p.id}/${a.id}: no ocupa más de 6 h`);

      if (a.w) {
        conDilema++;
        check(!!a.w.a && !!a.w.s, `${p.id}/${a.id}: tiene vía auténtica y vía social`);
        ['a', 's'].forEach(k => {
          const v = a.w[k];
          check(!!v.l && !!v.d, `${p.id}/${a.id}/${k}: etiqueta y descripción`);
          finite(v.au, `${p.id}/${a.id}/${k}: delta de autenticidad`);
          finite(v.so, `${p.id}/${a.id}/${k}: delta de aprobación`);
          if (v.gm != null) check(v.gm > 0 && v.gm < 3, `${p.id}/${a.id}/${k}: multiplicador de exp razonable`);
          if (v.mm != null) check(v.mm > 0 && v.mm < 3, `${p.id}/${a.id}/${k}: multiplicador de dinero razonable`);
        });
        // el conflicto tiene que existir: las dos vías no pueden tirar igual
        check(a.w.a.au > a.w.s.au, `${p.id}/${a.id}: la vía auténtica da más autenticidad`);
        check(a.w.s.so > a.w.a.so, `${p.id}/${a.id}: la vía social da más aprobación`);
        check(a.w.a.au > 0 && a.w.a.so <= 0, `${p.id}/${a.id}: ser fiel a ti cuesta aprobación`);
      } else sinDilema++;
    });
  });
  check(conDilema >= 60, `la mayoría de acciones plantean un dilema (${conDilema} de ${conDilema + sinDilema})`);

  M.BIZ_TYPES.forEach(b => {
    b.stats.forEach(k => check(keys.has(k), `negocio ${b.id}: característica válida "${k}"`));
    check(b.base > b.upkeep, `negocio ${b.id}: el ingreso base supera los costes fijos`);
  });
  M.QUESTS.forEach(q => check(typeof q.check === 'function', `misión ${q.id}: tiene comprobación`));
})();

/* ------------------------------------------------------------------ */
console.log('2) Etapas de vida y entrevista');
(() => {
  // la edad decide la etapa, sin huecos entre los tramos
  const casos = [[14, 'colegial'], [17, 'colegial'], [18, 'joven'], [23, 'joven'],
                 [24, 'creador'], [39, 'creador'], [40, 'renacer'], [80, 'renacer']];
  casos.forEach(([edad, id]) => check(M.etapaPorEdad(edad).id === id, `${edad} años → etapa ${id}`));

  M.ETAPAS.forEach(et => {
    const ent = M.ENTREVISTAS[et.id];
    check(!!ent, `${et.id}: tiene entrevista propia`);
    check(ent.preguntas.length >= 4, `${et.id}: al menos 4 preguntas`);
    check(!!ent.rechazo.auth && !!ent.rechazo.social && !!ent.rechazo.mixto,
      `${et.id}: hay rechazo para cada forma de responder`);
    ent.preguntas.forEach((p, i) => {
      check(p.r.length === 3, `${et.id}/p${i}: tres respuestas`);
      p.r.forEach((r, j) => {
        check(!!r.t, `${et.id}/p${i}/r${j}: tiene texto`);
        finite(r.a, `${et.id}/p${i}/r${j}: delta de autenticidad`);
        finite(r.s, `${et.id}/p${i}/r${j}: delta de aprobación`);
      });
      // toda pregunta ofrece al menos una salida auténtica y una complaciente
      check(p.r.some(r => r.a > 0), `${et.id}/p${i}: se puede responder con autenticidad`);
      check(p.r.some(r => r.s > 0), `${et.id}/p${i}: se puede responder complaciendo`);
    });
  });

  // el rechazo es inevitable, se responda como se responda
  M.ETAPAS.forEach(et => {
    const ent = M.ENTREVISTAS[et.id];
    [0, 1, 2].forEach(idx => {
      const s = M.newGame({ name: 'E', age: et.rango[0], bg: 'estudiante', perk: 'madrugador', objetivo: 'aprender', seed: 5 });
      const marcas = ent.preguntas.map(p => p.r[Math.min(idx, p.r.length - 1)]);
      const res = M.resolverEntrevista(s, marcas);
      check(!!res.texto && res.texto.length > 40, `${et.id}/opción ${idx}: el rechazo tiene texto`);
      check(['auth', 'social', 'mixto'].indexOf(res.tono) >= 0, `${et.id}/opción ${idx}: tono válido`);
      check(s.entrevista.hecha === true, `${et.id}/opción ${idx}: queda registrada`);
      check(s.autenticidad >= 0 && s.autenticidad <= 100, `${et.id}/opción ${idx}: autenticidad en rango`);
      check(s.social >= 0 && s.social <= 100, `${et.id}/opción ${idx}: aprobación en rango`);
      check(s.quests.q1.done === true, `${et.id}/opción ${idx}: la misión del rechazo se completa`);
    });
  });

  // responder siempre con autenticidad y responder siempre complaciendo llevan a sitios distintos
  const ent = M.ENTREVISTAS.creador;
  const mkl = (pick) => {
    const s = M.newGame({ name: 'E', age: 30, bg: 'autodidacta', perk: 'resiliente', objetivo: 'aprender', seed: 7 });
    M.resolverEntrevista(s, ent.preguntas.map(pick));
    return s;
  };
  const fiel = mkl(p => p.r.slice().sort((a, b) => b.a - a.a)[0]);
  const complaciente = mkl(p => p.r.slice().sort((a, b) => b.s - a.s)[0]);
  check(fiel.autenticidad > complaciente.autenticidad, 'ser fiel deja más autenticidad');
  check(complaciente.social > fiel.social, 'complacer deja más aprobación social');
})();

/* ------------------------------------------------------------------ */
console.log('3) Los dos ejes y sus estados');
(() => {
  check(M.estadoDe(80, 80).id === 'liderazgo', 'ambos altos → liderazgo genuino');
  check(M.estadoDe(20, 90).id === 'mascara', 'mucha aprobación y poca autenticidad → máscara');
  check(M.estadoDe(90, 10).id === 'ostracismo', 'poca aprobación → ostracismo');
  check(M.estadoDe(50, 50).id === 'transito', 'en medio → en construcción');
  check(M.estadoDe(71, 71).id === 'liderazgo', 'el umbral del liderazgo es 70');
  check(M.estadoDe(70, 70).id !== 'liderazgo', 'justo en 70 todavía no es liderazgo');

  const s = M.newGame({ name: 'E', age: 30, bg: 'empleado', perk: 'analitico', objetivo: 'estable', seed: 4 });
  s.autenticidad = 90; s.social = 10;
  check(M.enfoqueLaser(s) === true, 'ostracismo con autenticidad alta enciende el enfoque láser');
  s.autenticidad = 30;
  check(M.enfoqueLaser(s) === false, 'ostracismo sin autenticidad no da enfoque láser');

  // la máscara agota y bloquea lo creativo
  const m = M.newGame({ name: 'M', age: 30, bg: 'empleado', perk: 'analitico', objetivo: 'estable', seed: 6 });
  const normalMax = M.maxEnergy(m);
  m.autenticidad = 20; m.social = 90;
  check(M.maxEnergy(m) < normalMax, 'con la máscara puesta baja la energía máxima');
  const creativa = M.PLACE_BY.estudio.actions.find(a => a.w && a.w.a.cre);
  check(!!creativa, 'hay acciones creativas marcadas');
  check(!!M.viaBloqueada(m, creativa, 'a'), 'la máscara bloquea la vía creativa');
  check(!M.viaBloqueada(m, creativa, 's'), 'la vía complaciente sigue disponible');
  m.autenticidad = 60;
  check(!M.viaBloqueada(m, creativa, 'a'), 'al quitarse la máscara vuelve lo creativo');
})();

/* ------------------------------------------------------------------ */
console.log('4) Las dos vías de una acción llevan a sitios distintos');
(() => {
  const mk = () => {
    const s = M.newGame({ name: 'V', age: 30, bg: 'empleado', perk: 'resiliente', objetivo: 'aprender', seed: 12 });
    s.money = 5000;
    return s;
  };
  const gym = M.PLACE_BY.gimnasio, fuerza = gym.actions[0];
  const a = mk(), b = mk();
  M.doAction(a, gym, fuerza, 'a');
  M.doAction(b, gym, fuerza, 's');
  check(a.autenticidad > b.autenticidad, 'la vía auténtica deja más autenticidad');
  check(b.social > a.social, 'la vía social deja más aprobación');
  check(a.counters.autenticas === 1 && a.counters.sociales === 0, 'se cuenta la decisión propia');
  check(b.counters.sociales === 1 && b.counters.autenticas === 0, 'se cuenta la decisión complaciente');
  check(a.stats.vigor >= b.stats.vigor, 'entrenar de verdad enseña al menos tanto como entrenar para la foto');

  // sin indicar vía se toma la auténtica por defecto
  const c = mk();
  M.doAction(c, gym, fuerza);
  check(c.autenticidad > c.social || c.counters.autenticas === 1, 'por defecto se juega la vía auténtica');

  // el multiplicador de dinero de la vía social se aplica de verdad
  const t1 = mk(), t2 = mk();
  [t1, t2].forEach(x => { x.job.has = true; x.job.salary = 100; x.hour = 9; });
  const torre = M.PLACE_BY.torre, turno = torre.actions[0];
  const m1 = t1.money, m2 = t2.money;
  M.doAction(t1, torre, turno, 'a');
  M.doAction(t2, torre, turno, 's');
  check(t2.money - m2 > t1.money - m1, 'hacer lo que luce ante el jefe paga más ese día');
})();

/* ------------------------------------------------------------------ */
console.log('5) Mundo: todo alcanzable a pie (40 semillas)');
for (let i = 0; i < 40; i++) {
  const w = M.worldGen(1000 + i * 7919);
  check(w.buildings.length === M.PLACES.filter(p => p.kind === 'building').length, `semilla ${i}: todos los edificios colocados`);
  check(w.spots.length === M.PLACES.filter(p => p.kind === 'spot').length, `semilla ${i}: todos los puntos colocados`);
  const r = M.reachability(w, w.spawn);
  check(r.missing.length === 0, `semilla ${i}: sin lugares inaccesibles (${r.missing.join(', ')})`);
  check(r.visited > 3000, `semilla ${i}: el mundo transitable es amplio (${r.visited})`);
  const sx = Math.floor(w.spawn.x / M.TILE), sy = Math.floor(w.spawn.y / M.TILE);
  check(!w.isSolid(sx, sy), `semilla ${i}: aparición en casilla transitable`);
  w.buildings.forEach(b => check(!w.isSolid(b.door.x, b.door.y), `semilla ${i}: puerta libre en ${b.id}`));
  w.spots.forEach(sp => check(!w.isSolid(sp.x, sp.y), `semilla ${i}: punto libre en ${sp.id}`));
}

/* ------------------------------------------------------------------ */
console.log('6) Avatar y radar sin artefactos');
function validateSVG(svg, ctx) {
  check(typeof svg === 'string' && svg.startsWith('<svg') && svg.includes('</svg>'), `${ctx}: SVG bien formado`);
  check(!/NaN|undefined|Infinity/.test(svg), `${ctx}: sin NaN/undefined/Infinity`);
  check(!/(cx|cy|rx|ry|x|y|width|height|x1|y1|x2|y2)="(\s*)"/.test(svg), `${ctx}: sin atributos numéricos vacíos`);
  check(!/\$\{/.test(svg), `${ctx}: sin plantillas sin resolver`);
}
[0, 1, 50, 99, 100].forEach(v => {
  const st = {}; M.STAT_KEYS.forEach(k => { st[k] = v; });
  validateSVG(M.avatarSVG(st), `avatar todo=${v}`);
  validateSVG(M.radarSVG(st), `radar todo=${v}`);
});
(() => { // dos avatares seguidos no pueden compartir los ids de sus degradados
  const st = {}; M.STAT_KEYS.forEach(k => { st[k] = 50; });
  const ids = svg => [...svg.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  const a = ids(M.avatarSVG(st)), b = ids(M.avatarSVG(st));
  check(a.length > 0 && a.every(x => b.indexOf(x) === -1), 'cada avatar usa identificadores propios');
})();
for (let i = 0; i < 200; i++) {
  const st = {}; M.STAT_KEYS.forEach(k => { st[k] = Math.floor(Math.random() * 101); });
  validateSVG(M.avatarSVG(st), `avatar aleatorio#${i}`);
  validateSVG(M.radarSVG(st), `radar aleatorio#${i}`);
}

/* ------------------------------------------------------------------ */
console.log('7) Currículum y arranque');
M.ETAPAS.forEach(et => {
  M.BACKGROUNDS.forEach(bg => {
    M.OBJETIVOS.forEach(ob => {
      const s = M.newGame({ name: 'X', age: et.rango[0] + 1, bg: bg.id, perk: 'incansable', objetivo: ob.id, seed: 42 });
      check(s.etapa === et.id, `${et.id}/${bg.id}: la edad fija la etapa`);
      M.STAT_KEYS.forEach(k => check(s.stats[k] >= 0 && s.stats[k] <= 100, `${et.id}/${bg.id}: ${k} en rango`));
      finite(s.money, `${et.id}/${bg.id}: dinero inicial`);
      check(s.money >= 0, `${et.id}/${bg.id}: no se empieza en negativo`);
      check(s.autenticidad >= 0 && s.autenticidad <= 100, `${et.id}/${bg.id}/${ob.id}: autenticidad inicial en rango`);
      check(s.social >= 0 && s.social <= 100, `${et.id}/${bg.id}/${ob.id}: aprobación inicial en rango`);
      check(s.energy > 0 && s.energy <= M.maxEnergy(s), `${et.id}/${bg.id}: energía inicial válida`);
      check(s.day === 1, `${et.id}/${bg.id}: empieza el día 1`);
    });
  });
});
(() => {
  const propio = M.newGame({ name: 'A', age: 30, bg: 'estudiante', perk: 'madrugador', objetivo: 'propio', seed: 1 });
  const estable = M.newGame({ name: 'B', age: 30, bg: 'estudiante', perk: 'madrugador', objetivo: 'estable', seed: 1 });
  check(propio.autenticidad > estable.autenticidad, 'declarar que quieres lo tuyo sube la autenticidad');
  check(estable.social > propio.social, 'declarar que buscas estabilidad sube la aprobación');
})();

/* ------------------------------------------------------------------ */
console.log('8) Reglas de las acciones');
(() => {
  const s = M.newGame({ name: 'Z', age: 28, bg: 'empleado', perk: 'resiliente', objetivo: 'aprender', seed: 11 });
  s.money = 3000;
  const gym = M.PLACE_BY.gimnasio, fuerza = gym.actions[0];

  const before = { h: s.hour, e: s.energy, m: s.money };
  const r = M.doAction(s, gym, fuerza, 'a');
  check(r.ok, 'entrenar es posible al empezar el día');
  check(s.hour > before.h, 'la acción consume tiempo');
  check(s.energy < before.e, 'la acción consume energía');
  check(s.money < before.m, 'la acción cobra su precio');

  s.energy = 0;
  check(!M.canDo(s, gym, fuerza).ok, 'sin energía la acción se bloquea');
  s.energy = 100; s.money = 0;
  check(!M.canDo(s, gym, fuerza).ok, 'sin dinero la acción se bloquea');
  s.money = 1000; s.hour = 23.5;
  check(!M.canDo(s, gym, fuerza).ok, 'de madrugada ya no da tiempo');
  const avanzado = gym.actions[3];
  s.hour = 9; s.stats.vigor = 10;
  check(!M.canDo(s, gym, avanzado).ok, 'los requisitos de característica se respetan');
  s.stats.vigor = 60;
  check(M.canDo(s, gym, avanzado).ok, 'cumpliendo el requisito se desbloquea');
  const casa = M.PLACE_BY.casa, plan = casa.actions.find(a => a.id === 'planificar');
  M.doAction(s, casa, plan, 'a');
  check(!M.canDo(s, casa, plan).ok, 'planificar sólo una vez al día');
})();

/* ------------------------------------------------------------------ */
console.log('9) Banco, negocios y objetos');
(() => {
  const s = M.newGame({ name: 'B', age: 45, bg: 'heredero', perk: 'analitico', objetivo: 'propio', seed: 3 });
  s.money = 8000; s.debt = 0;
  const m0 = s.money;
  check(M.bankDeposit(s, 1000).ok && s.savings === 1000 && s.money === m0 - 1000, 'ingresar mueve dinero al ahorro');
  check(!M.bankDeposit(s, -5).ok, 'no se puede ingresar una cantidad negativa');
  check(M.bankWithdraw(s, 400).ok && s.savings === 600, 'retirar devuelve el dinero a caja');
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
  const v = M.bizValue(s, b), before = s.money;
  M.bizAction(s, b.id, 'vender');
  check(s.bizs.length === 0 && s.money === before + v, 'vender el negocio devuelve su valor');

  // el mismo negocio rinde distinto según el estado del dueño
  s.money = 20000;
  const f2 = M.foundBiz(s, 'puesto', 'Puesto dos');
  check(f2.ok, 'se puede volver a montar algo tras vender');
  const bb = s.bizs[0];
  s.autenticidad = 80; s.social = 80;
  const conLiderazgo = M.bizIncome(s, bb);
  s.autenticidad = 20; s.social = 90;
  const conMascara = M.bizIncome(s, bb);
  check(conLiderazgo > conMascara, 'aportar valor real rinde más que vender humo');

  // objetos con lectura doble
  const t = M.newGame({ name: 'T', age: 30, bg: 'comercial', perk: 'ahorrador', objetivo: 'aprender', seed: 8 });
  t.money = 5000;
  const auth0 = t.autenticidad, soc0 = t.social;
  check(M.buyItem(t, 'traje').ok, 'se puede comprar el traje');
  check(t.social > soc0 && t.autenticidad < auth0, 'el traje sube la aprobación y baja la autenticidad');
  check(!M.buyItem(t, 'traje').ok, 'no se compra dos veces el mismo objeto');
  const auth1 = t.autenticidad;
  M.buyItem(t, 'libros');
  check(t.autenticidad > auth1, 'la biblioteca personal sube la autenticidad');
})();

/* ------------------------------------------------------------------ */
console.log('10) Simulación larga (12 partidas × 120 días)');
function invariants(s, ctx) {
  M.STAT_KEYS.forEach(k => {
    check(s.stats[k] >= 0 && s.stats[k] <= 100, `${ctx}: ${k} dentro de 0..100 (${s.stats[k]})`);
    finite(s.statxp[k], `${ctx}: experiencia de ${k}`);
    check(s.statxp[k] >= 0, `${ctx}: experiencia de ${k} no negativa`);
  });
  check(s.autenticidad >= 0 && s.autenticidad <= 100, `${ctx}: autenticidad en rango (${s.autenticidad})`);
  check(s.social >= 0 && s.social <= 100, `${ctx}: aprobación en rango (${s.social})`);
  check(['ostracismo', 'mascara', 'liderazgo', 'transito'].indexOf(s.estado) >= 0, `${ctx}: estado válido`);
  check(s.energy >= 0 && s.energy <= M.maxEnergy(s) + 0.001, `${ctx}: energía en rango (${s.energy})`);
  check(s.stress >= 0 && s.stress <= 100, `${ctx}: estrés en rango`);
  check(s.mood >= 0 && s.mood <= 100, `${ctx}: ánimo en rango`);
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
}

function play(seed, bgId, perkId, sesgo, days) {
  const et = M.ETAPAS[seed % 4];
  const s = M.newGame({ name: 'Sim', age: et.rango[0] + 2, bg: bgId, perk: perkId,
    objetivo: M.OBJETIVOS[seed % M.OBJETIVOS.length].id, seed: seed * 977 });
  let rc = (seed * 977) >>> 0;
  const rnd = () => { rc = (Math.imul(rc, 1103515245) + 12345) & 0x7fffffff; return rc / 0x7fffffff; };

  // la entrevista inicial, respondida al azar
  const ent = M.ENTREVISTAS[s.etapa];
  M.resolverEntrevista(s, ent.preguntas.map(p => p.r[Math.floor(rnd() * p.r.length)]));

  const acts = [];
  M.PLACES.forEach(p => p.actions.forEach(a => acts.push([p, a])));

  for (let d = 0; d < days && !s.final; d++) {
    let guard = 0;
    while (s.hour < 22 && guard++ < 40 && !s.final) {
      const opts = [];
      acts.forEach(([p, a]) => {
        if (a.sp === 'dormir') return;
        if (a.w) {
          ['a', 's'].forEach(wid => { if (M.canDo(s, p, a, wid).ok) opts.push([p, a, wid]); });
        } else if (M.canDo(s, p, a).ok) opts.push([p, a, null]);
      });
      if (!opts.length) break;
      // el sesgo decide con qué frecuencia se elige la vía complaciente
      const filtered = opts.filter(o => !o[2] || (o[2] === 's' ? rnd() < sesgo : rnd() < 1 - sesgo));
      const pick = (filtered.length ? filtered : opts)[Math.floor(rnd() * (filtered.length || opts.length))];
      const [p, a, wid] = pick;
      const r = M.doAction(s, p, a, wid);
      if (r.ui) {
        if (r.ui === 'fundar') { const t = M.BIZ_TYPES.find(t => M.canFound(s, t.id).ok); if (t) M.foundBiz(s, t.id, t.name); }
        else if (r.ui === 'tienda') { const it = M.ITEMS.find(i => !s.items[i.id] && s.money > i.cost * 3); if (it) M.buyItem(s, it.id); }
        else if (r.ui === 'depositar') M.bankDeposit(s, Math.floor(s.money * 0.3));
        else if (r.ui === 'amortizar') M.bankRepay(s, Math.min(s.money, s.debt));
        else if (r.ui === 'prestamo') M.bankLoan(s, Math.min(500, Math.max(0, M.loanLimit(s))));
        continue;
      }
      if (!r.ok) break;
      if (s.points > 0 && rnd() < 0.3) M.spendPoint(s, M.STAT_KEYS[Math.floor(rnd() * M.STAT_KEYS.length)]);
      if (s.bizs.length && rnd() < 0.15) {
        const b = s.bizs[Math.floor(rnd() * s.bizs.length)];
        M.bizAction(s, b.id, ['mejorar', 'marketing', 'contratar'][Math.floor(rnd() * 3)]);
      }
      invariants(s, `${bgId}/${perkId} día ${s.day}`);
    }
    if (s.final) break;
    M.endDay(s, []);
    invariants(s, `${bgId}/${perkId} fin del día ${s.day}`);
  }
  return s;
}

const runs = [];
let seed = 1;
for (const bg of M.BACKGROUNDS) {
  for (const sesgo of [0.15, 0.85]) {
    runs.push(play(seed, bg.id, M.PERKS[seed % M.PERKS.length].id, sesgo, 120));
    seed++;
  }
}
runs.forEach((s, i) => {
  check(s.day > 1, `partida ${i}: la partida avanza`);
  check(s.counters.actions > 20, `partida ${i}: se hacen acciones (${s.counters.actions})`);
  check(s.log.length > 0, `partida ${i}: el diario registra lo ocurrido`);
});
const fieles = runs.filter((_, i) => i % 2 === 0);       // sesgo 0.15 → juegan auténtico
const complacientes = runs.filter((_, i) => i % 2 === 1); // sesgo 0.85 → juegan complaciendo
const media = (a, k) => a.reduce((x, s) => x + s[k], 0) / a.length;
check(media(fieles, 'autenticidad') > media(complacientes, 'autenticidad'),
  `jugar fiel a uno mismo deja más autenticidad (${media(fieles, 'autenticidad').toFixed(0)} vs ${media(complacientes, 'autenticidad').toFixed(0)})`);
check(media(complacientes, 'social') > media(fieles, 'social'),
  `jugar complaciendo deja más aprobación (${media(complacientes, 'social').toFixed(0)} vs ${media(fieles, 'social').toFixed(0)})`);
check(runs.some(s => s.final), 'alguna partida llega a un final');
check(runs.some(s => s.bizs.length > 0 || s.counters.bizEarned > 0), 'las partidas llegan a montar algo propio');

/* ------------------------------------------------------------------ */
console.log('11) Los finales');
(() => {
  const mk = (au, so) => {
    const s = M.newGame({ name: 'F', age: 30, bg: 'comercial', perk: 'networker', objetivo: 'aprender', seed: 21 });
    s.autenticidad = au; s.social = so;
    return s;
  };
  const bueno = mk(85, 85);
  for (let i = 0; i < 12 && !bueno.final; i++) M.endDay(bueno, []);
  check(bueno.final && bueno.final.id === 'liderazgo', 'sostener ambos ejes altos lleva al liderazgo genuino');
  check(bueno.final.texto.length > 80, 'el final tiene epílogo');
  check(bueno.achievements.a10, 'el final bueno desbloquea su logro');

  const mascara = mk(15, 95);
  for (let i = 0; i < 20 && !mascara.final; i++) { mascara.autenticidad = 15; mascara.social = 95; M.endDay(mascara, []); }
  check(mascara.final && mascara.final.id === 'mascara', 'sostener la máscara acaba en su final');

  const desierto = mk(20, 10);
  for (let i = 0; i < 20 && !desierto.final; i++) { desierto.autenticidad = 20; desierto.social = 10; M.endDay(desierto, []); }
  check(desierto.final && desierto.final.id === 'desierto', 'el aislamiento sin rumbo acaba en el desierto');

  // el ostracismo con autenticidad alta NO es un final: es un sitio donde se puede vivir
  const ermitano = mk(90, 10);
  for (let i = 0; i < 20 && !ermitano.final; i++) { ermitano.autenticidad = 90; ermitano.social = 10; M.endDay(ermitano, []); }
  check(!ermitano.final, 'el ostracismo con rumbo propio no termina la partida');

  // con la partida terminada no se puede seguir actuando
  const gym = M.PLACE_BY.gimnasio;
  check(!M.canDo(bueno, gym, gym.actions[0]).ok, 'tras el final las acciones se bloquean');
})();

/* ------------------------------------------------------------------ */
console.log('12) Misiones, logros y descanso');
(() => {
  const s = M.newGame({ name: 'Q', age: 30, bg: 'comercial', perk: 'networker', objetivo: 'aprender', seed: 99 });
  s.money = 3000; M.checkQuests(s, []);
  check(s.quests.q4.done, 'la misión de sostenerte se completa con dinero suficiente');
  const before = s.money;
  M.checkQuests(s, []);
  check(s.money === before, 'una misión completada no vuelve a pagar recompensa');

  s.counters.rachaAuth = 12; M.checkAchievements(s, []);
  check(s.achievements.a6, 'diez decisiones propias seguidas desbloquean su logro');

  const s2 = M.newGame({ name: 'D', age: 20, bg: 'estudiante', perk: 'madrugador', objetivo: 'aprender', seed: 4 });
  s2.energy = 5; s2.hour = 22; s2.stress = 80;
  const day0 = s2.day;
  M.endDay(s2, []);
  check(s2.day === day0 + 1, 'dormir avanza un día');
  check(s2.hour === 6, 'el madrugador se levanta a las 6:00');
  check(s2.energy > 20, 'dormir recupera energía');
  check(s2.stress < 80, 'dormir baja el estrés');
})();

/* ------------------------------------------------------------------ */
console.log('13) Los personajes reaccionan al estado');
(() => {
  const s = M.newGame({ name: 'N', age: 30, bg: 'autodidacta', perk: 'resiliente', objetivo: 'propio', seed: 31 });
  const sara = M.NPCS.find(n => n.id === 'sara');     // tipo social
  const tomas = M.NPCS.find(n => n.id === 'tomas');   // tipo auténtico

  s.autenticidad = 90; s.social = 10;                 // ostracismo
  const o = M.talkTo(s, sara);
  check(!s.flags.npc_sara, 'en el ostracismo la inversora no te atiende');
  check(o.some(x => x.k === 'warn'), 'y se nota en el tono');
  const o2 = M.talkTo(s, tomas);
  check(!!s.flags.npc_tomas, 'el librero sí te habla estés donde estés');
  check(o2.length > 1, 'y te da algo la primera vez');

  const m = M.newGame({ name: 'M', age: 30, bg: 'empleado', perk: 'resiliente', objetivo: 'estable', seed: 32 });
  m.autenticidad = 15; m.social = 95;                 // máscara
  M.talkTo(m, tomas);
  check(!m.flags.npc_tomas, 'con la máscara puesta el librero se enfría');
  M.talkTo(m, sara);
  check(!!m.flags.npc_sara, 'pero la inversora te recibe encantada');
})();

/* ------------------------------------------------------------------ */
console.log('14) Determinismo con la misma semilla');
(() => {
  const run = () => {
    const s = M.newGame({ name: 'R', age: 30, bg: 'autodidacta', perk: 'ahorrador', objetivo: 'aprender', seed: 777 });
    for (let d = 0; d < 25 && !s.final; d++) {
      const gym = M.PLACE_BY.gimnasio;
      if (M.canDo(s, gym, gym.actions[1], 'a').ok) M.doAction(s, gym, gym.actions[1], 'a');
      M.endDay(s, []);
    }
    return JSON.stringify({ m: s.money, st: s.stats, a: s.autenticidad, so: s.social, l: s.level, d: s.debt });
  };
  check(run() === run(), 'dos partidas con la misma semilla evolucionan igual');
})();

/* ------------------------------------------------------------------ */
if (fails === 0) console.log(`\n✅ TODAS LAS PRUEBAS PASARON (${checks} comprobaciones)`);
else { console.error(`\n❌ ${fails} de ${checks} comprobaciones fallaron`); process.exit(1); }
