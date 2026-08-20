# 🎮 Ruta Propia · El mundo del propósito

Un RPG de **mundo abierto 2D en pixel art** sobre lo que cuesta construir una vida
propia. Rellenas un currículum, te evalúan, **te rechazan** — siempre — y a partir
de ahí sales a una ciudad a decidir, una y otra vez, entre **encajar** y **ser fiel
a ti mismo**.

> «Romper la mente para cambiar la vida».
> Cada acción del juego se puede hacer de dos maneras. Ninguna es gratis.

![El mundo](docs/mundo.png)

## ⚖️ Los dos ejes

Todo el juego se mueve entre dos fuerzas que casi nunca tiran hacia el mismo lado:

| | Eje | Sube cuando… | Baja cuando… |
|---|---|---|---|
| 🔥 | **Autenticidad** | decides según tus valores, aprendes lo que te importa, creas algo tuyo | cedes a la presión del grupo o ignoras lo que piensas |
| 👥 | **Aprobación social** | encajas, complaces, dices lo que quieren oír | pones límites o tomas un camino que nadie entiende |

Es *paz interior y sentido de dirección* contra *estatus y cómo te ven*. La partida
consiste en negociar entre las dos sin romperte.

## 🌗 Los tres estados

De la combinación de ambos ejes sale un estado que cambia **la interfaz, el color
del mundo y lo que puedes hacer**:

| Estado | Condición | Qué pasa |
|---|---|---|
| 🕳️ **Ostracismo incomprendido** | aprobación < 20 | Parte de la gente deja de hablarte. Pero si además tienes la autenticidad alta se enciende el **enfoque láser**: aprendes un 35 % más rápido. |
| 🎭 **La máscara social** | aprobación > 80 y autenticidad < 30 | Validación fácil, y el mundo entero **se apaga**: paleta gris, menos energía máxima, el estrés sube un 40 % más y **se bloquean las opciones creativas**. |
| 🌟 **Liderazgo genuino** | ambos > 70 | Impactas de verdad. La gente te busca, tus proyectos rinden un 18 % más y aguantas más. Es el estado más difícil de sostener. |

| Con la máscara puesta | En liderazgo genuino |
|---|---|
| ![Máscara social](docs/estado-mascara.png) | ![Liderazgo genuino](docs/estado-liderazgo.png) |

## 📄 1. El currículum y el rechazo inevitable

La partida empieza rellenando un formulario. La decisión clave es la **edad**: define
tu etapa de vida, contra qué te vas a estrellar y quién te va a rechazar.

| Etapa | Edad | El choque | Quién te evalúa |
|---|---|---|---|
| 🎒 **El despertar** | 14-17 | Pertenecer al grupo o descubrir quién eres | El orientador escolar, en la feria de proyectos |
| 🧾 **El choque con la realidad** | 18-23 | Ingresos ya, o construir algo propio | Selección de personal de una cadena de tiendas |
| 🚀 **La construcción** | 24-39 | Tu visión o lo que el mercado premia | Un socio de un fondo, en el comité de inversión |
| 🌱 **Nunca es tarde** | 40+ | "Ya es tarde" contra empezar otra vez | Un comité de contratación que te ve mayor |

Cada etapa tiene **su propia entrevista** con cuatro preguntas y tres respuestas cada
una. Responder con la verdad, decir lo que quieren oír o quedarte en medio cambia los
dos ejes… pero **el resultado siempre es un rechazo**. Ése es el detonante: nadie te
va a dar permiso.

![La entrevista](docs/entrevista.png)

También declaras tu **objetivo profesional** (la primera decisión real del juego), tu
**experiencia previa**, un **rasgo distintivo** y repartes **60 puntos** entre ocho
habilidades. El avatar se genera con todo eso: complexión, postura, apertura de brazos,
halo mental y núcleo de energía salen de lo que has declarado.

![El currículum](docs/cv.png)

## 🔀 2. Cada acción, dos maneras de hacerla

67 de las 80 acciones del juego plantean un dilema. La vía auténtica suele enseñar más
y costar aprobación; la complaciente paga antes y te vacía por dentro.

![Un dilema](docs/dilema.png)

Unos ejemplos reales del juego:

| Acción | 🔥 A tu manera | 👥 Como se espera |
|---|---|---|
| Entrenar | Tu progresión, sin público | Series para el espejo |
| Trabajar | Hacer el trabajo bien | Hacer lo que luce ante el jefe (**+20 % de sueldo**) |
| Pitch a inversores | Contar el proyecto que tienes | Contar el proyecto que quieren financiar |
| Hablar en público | Contar también lo que salió mal | Contar sólo la parte que brilla |
| Mejorar el producto | Arreglar lo que sabes que está mal | Añadir lo que piden los que gritan |

Las trece acciones sin dilema tampoco son neutras: dormir y el banco no juzgan a nadie,
pero **el muelle** (nadar, pescar, ver el atardecer, pensar en tu rumbo) sube la
autenticidad y baja la aprobación siempre. Es el sitio del mapa donde nadie entiende
qué haces ahí.

## 🌍 3. El mundo

Una ciudad de **108 × 84 casillas** en pixel art generado por código, con cinco distritos
y **20 lugares**:

- **🌳 Norte** — tu apartamento, Gimnasio Titán, Centro Zen, Centro de Salud, Parque Sol
- **⛲ Centro** — Biblioteca Central, Café Aroma, Universidad, Club Social, Plaza Mayor
- **🏦 Financiero** — Banco Meridiano, Torre Corporativa, Coworking Nodo, Incubadora Impulso
- **🛒 Sur** — Mercado Central, Bazar Suministros, Escuela de Oficios, Estudio Creativo, Centro de Ferias
- **⚓ Costa** — Muelle del Sur

![Mapa del mundo](docs/mapa.png)

Por la ciudad pasean **seis personajes** y no todos te tratan igual: la inversora deja
de atenderte si caes en el ostracismo, y el librero y la artista se enfrían contigo si
te pones la máscara.

## ⚙️ 4. Los sistemas

- **Tiempo y energía** — el día va de las 7:00 a las 24:00; cada acción cuesta horas,
  energía y a veces dinero. Dormir cierra el día.
- **Estado** — energía, estrés y ánimo afectan al rendimiento; la autenticidad también
  (vivir sin rumbo propio te resta hasta un 12 %).
- **Progresión** — ocho características (Vigor, Intelecto, Disciplina, Carisma,
  Creatividad, Finanzas, Liderazgo, Equilibrio), experiencia por acción y 3 puntos a
  repartir por nivel.
- **Dinero** — nómina, trabajos por horas, gastos diarios, ahorro con interés, préstamos
  al 1 % diario y descubierto que se convierte en deuda.
- **Negocios** — cinco modelos (puesto de mercado, tienda online, agencia, cafetería,
  startup) que dependen de características distintas y **rinden según tu estado**:
  vender humo con la máscara puesta paga menos que aportar valor real.
- **Misiones** — diez pasos desde "sobrevive al rechazo" hasta el liderazgo genuino.
- **Objetos con doble lectura** — el traje sube la aprobación y baja la autenticidad;
  la biblioteca personal hace lo contrario.
- **Eventos, hábitos, rachas y logros**, y guardado automático en el navegador.

## 🏁 5. Los finales

La partida termina cuando un estado se sostiene en el tiempo:

- 🌟 **Liderazgo genuino** — 5 días con ambos ejes por encima de 70. El final bueno.
- 🎭 **La máscara se quedó pegada** — 12 días complaciendo con la autenticidad por los suelos.
- 🕳️ **El desierto** — 12 días aislado *y* sin rumbo propio.

Estar en el ostracismo con la cabeza clara **no es un final**: es un sitio incómodo
donde se puede vivir y crear. Al llegar a un final puedes leer el epílogo y elegir entre
empezar otra vida o seguir jugando.

## ▶️ Jugar

Abre **`juego.html`** en cualquier navegador moderno. No hay nada que instalar.

```bash
python3 -m http.server 8000   # y visita http://localhost:8000/juego.html
```

**Controles:** `W A S D` o flechas para moverte · `E` para interactuar · `P` perfil ·
`N` negocios · `Q` misiones · `M` mapa · `L` diario · `Esc` cerrar. En móvil aparecen
un mando y un botón **E**.

## 🧪 Desarrollo

La app no tiene dependencias en tiempo de ejecución. Las pruebas corren en Node y **leen
el código directamente del `<script>` embebido**, así que validan exactamente lo que se
ejecuta en el navegador.

```bash
npm install          # sólo para pruebas y previsualización
npm test             # lógica pura (~299.000 comprobaciones)
npm run test:dom     # integración real con jsdom: currículum → entrevista → mundo
npm run test:all     # todo
npm run preview:game # regenera docs/mapa.png y los avatares
node shots.js        # regenera las capturas del README (necesita playwright-core)
```

`npm test` comprueba, entre otras cosas:

- Que **las dos vías de cada acción tiran de verdad en direcciones opuestas**: la
  auténtica siempre da más autenticidad y cuesta aprobación, y la social al revés.
- Que **la entrevista acaba en rechazo se responda como se responda**, en las cuatro
  etapas y con las tres columnas de respuestas.
- Los umbrales de los **tres estados**, que la máscara bloquea lo creativo y baja el
  techo de energía, y que el enfoque láser sólo se enciende con autenticidad alta.
- Los **cuatro finales**, incluido que el ostracismo con rumbo propio *no* termina la partida.
- **12 partidas completas de 120 días** con dos formas de jugar (fiel a uno mismo y
  complaciente), verificando en cada acción que ninguna magnitud se sale de rango y
  que jugar de una manera u otra lleva a sitios distintos.
- **40 semillas de mundo** comprobando por inundación que se llega a pie a todos los
  lugares, 200 avatares sin coordenadas inválidas y determinismo por semilla.

## 📁 Estructura

```
juego.html         EL JUEGO: currículum, entrevista y mundo abierto (HTML + CSS + JS)
index.html         Diseñador de Personajes con diagnóstico de vida (herramienta aparte)
load-game.js       Extrae la lógica del juego desde juego.html para Node
test-game.js       Pruebas de ejes, estados, dilemas, mundo, economía y finales
test-game-dom.js   Integración con jsdom: rellenar el CV, ser rechazado, jugar y guardar
preview-game.js    Genera docs/mapa.png y los avatares de ejemplo
shots.js           Regenera las capturas del README abriendo el juego de verdad
load-app.js · test-render.js · test-dom.js · preview.js · gen-hero.js   (del diseñador)
```

## ⚠️ Aviso

Es un **juego** y una herramienta de reflexión, no un diagnóstico psicológico ni
asesoramiento financiero. Las cifras de negocio son una simplificación pensada para
jugar. Si algo de tu vida real (ánimo, estrés, dinero, sensación de no encajar) te
preocupa, habla con un profesional.
