/**
 * textosCenso2026.ts
 * Textos oficiales del Censo de Fluidez y Comprensión Lectora 2026
 * (Plan Lectura y Escritura Mendoza — DGE), versión Estudiante, uno por año.
 *
 * Transcriptos del PDF escaneado que entregó la escuela.
 */

import type { TextoSeed } from './censo2023';

export const textosCenso2026: TextoSeed[] = [
  {
    title: 'José de San Martín, el Padre de la Patria',
    author: 'Fluidez y Comprensión Lectora 2026 — DGE Mendoza',
    level: 'Intermedio',
    year: 1,
    content: `José de San Martín es una de las figuras más importantes de la historia argentina y sudamericana. Nació en Yapeyú, Corrientes, en mil setecientos setenta y ocho. Por ese entonces, nuestro país formaba parte del Virreinato del Río de la Plata. Cuando era niño, su familia se trasladó a España, donde recibió educación y comenzó su carrera militar. Allí participó en distintas campañas. Adquirió experiencia y conocimientos que luego le serían fundamentales.

Motivado por los ideales de libertad decidió regresar a América. En mil ochocientos doce llegó a Buenos Aires y poco después fundó el Regimiento de Granaderos a Caballo, una unidad militar que se destacó por su organización y eficacia. Una de sus mayores hazañas fue la creación del Ejército de los Andes. Desde Mendoza, planificó el cruce de la cordillera, una operación militar considerada extraordinaria. El héroe y su regimiento atravesaron las montañas y obtuvieron la victoria en la batalla de Chacabuco.

San Martín continuó con su proyecto. Su objetivo era liberar al Perú, uno de los principales centros del poder español. Luego de diversas acciones militares y políticas, proclamó la independencia peruana. Su proyecto fue continental: buscó la libertad de toda la región.

El héroe no solo sobresalió por sus logros militares, sino que se destacó por su honestidad, lealtad y desinterés personal.

Se retiró de la vida pública por conflictos políticos. Por esto decidió irse a Europa, donde vivió en Francia hasta su muerte en mil ochocientos cincuenta.

En nuestro país, José de San Martín, es considerado el "Padre de la Patria". Su figura representa el esfuerzo, el compromiso y los valores necesarios para construir naciones libres y soberanas.`,
    challenges: [
      {
        question: '¿Por qué la familia de San Martín se trasladó a España cuando él era niño?',
        options: [
          'El texto dice que se trasladó y que allí él recibió educación y comenzó su carrera militar',
          'Porque lo habían nombrado jefe del Regimiento de Granaderos',
          'Porque escapaban de la batalla de Chacabuco',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué operación militar planificó desde Mendoza?',
        options: [
          'La fundación del Virreinato del Río de la Plata',
          'El cruce de la cordillera con el Ejército de los Andes',
          'La defensa de la ciudad de Buenos Aires',
        ],
        correctIdx: 1,
      },
      {
        question: 'Según el texto, ¿por qué se destacó además de por sus logros militares?',
        options: [
          'Por su fortuna personal',
          'Por su habilidad para la política europea',
          'Por su honestidad, lealtad y desinterés personal',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Quino: el dibujante que hacía pensar',
    author: 'Fluidez y Comprensión Lectora 2026 — DGE Mendoza',
    level: 'Básico',
    year: 2,
    content: `Una mañana de invierno, en la ciudad de Mendoza, un niño se sentó con lápiz y papel frente a una hoja en blanco. Muchos años después, esos trazos lo convirtieron en uno de los artistas más importantes de la Argentina. A ese niño se lo conoció como Quino, aunque su nombre real era Joaquín Salvador Lavado.

Estudió Bellas Artes pero pronto decidió dedicarse al humor gráfico, un género que combina el dibujo con la reflexión. Empezó a publicar sus trabajos en diarios y revistas. Sus viñetas llamaron la atención por su mirada crítica sobre la sociedad.

En mil novecientos sesenta y cuatro creó a Mafalda, una niña curiosa y preocupada por el mundo que la rodeaba. A través de ella y de otros personajes, Quino hablaba de temas importantes, como la paz, la justicia, la familia y la política.

Mafalda era una niña que odiaba la sopa y cuestionaba a los adultos. Junto con sus amigos Felipe, Susanita, Manolito, Libertad y Miguelito, se hizo un lugar en el mundo editorial. Sus historietas eran graciosas, invitaban a pensar y a hacerse preguntas.

El personaje de Mafalda aparece como símbolo cultural de Argentina. En Buenos Aires, se puede ver su escultura en el barrio de San Telmo y existe una plaza que lleva su nombre. En la provincia de Mendoza hay estatuas de Mafalda, Manolito y Susanita en el reconocido Paseo Arístides. Además, existe una escuela que lleva el nombre de "Joaquín Salvador Lavado". Estos homenajes permiten que lectores de todas las edades conozcan a Mafalda y recuerden la obra de su creador.

Así, aquel niño que dibujaba en silencio logró algo extraordinario: usar el humor como una forma de entender y mejorar el mundo. Aunque Quino ya no está entre nosotros, sus personajes siguen vivos en los libros y en la memoria de los lectores.`,
    challenges: [
      {
        question: '¿Cuál era el nombre real de Quino?',
        options: ['Joaquín Salvador Lavado', 'Manolito Arístides', 'Felipe Miguelito Lavado'],
        correctIdx: 0,
      },
      {
        question: '¿Qué es el humor gráfico según el texto?',
        options: [
          'Un tipo de escultura urbana',
          'Un género que combina el dibujo con la reflexión',
          'Una escuela de Bellas Artes',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué homenajes a Mafalda menciona el texto en Mendoza?',
        options: [
          'Una plaza en el barrio de San Telmo',
          'Un museo dedicado al humor gráfico',
          'Estatuas en el Paseo Arístides y una escuela con el nombre de su creador',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: '¿Quién fue Juana Azurduy y por qué es una heroína popular?',
    author: 'Fluidez y Comprensión Lectora 2026 — DGE Mendoza',
    level: 'Intermedio',
    year: 3,
    content: `Esta es la historia de una mujer que luchó por la revolución y por la independencia de nuestro país. Llegó a perder a su familia combatiendo contra el imperio español en los últimos años del Virreinato del Río de la Plata. Todo por amor a la Patria.

Nació en mil setecientos ochenta en Toroca, actualmente territorio de Bolivia. Juana aprendió el oficio de las tareas del campo acompañando a su padre mientras trabajaba. De esta forma entró en contacto con los pobladores nativos de su tierra y aprendió el idioma original. Quedó huérfana siendo joven y debió completar su crianza entre sus tíos y conventos.

A los veinticinco años se casó con Miguel Padilla, un estudiante de derecho. Tuvieron cinco hijos: Manuel, Mariano, Juliana, Mercedes y Luisa.

Cuando estalló la revolución, Juana y su esposo se unieron a los ejércitos populares. Ayudaron a destituir al gobernador y a formar una junta de gobierno que duraría hasta mil ochocientos diez. Luego de esto, las tropas realistas vencieron a los revolucionarios.

A partir de entonces, a través de una organización conocida como "Los Leales", el matrimonio combatió contra el imperio español. Juana se destacaba por su valentía y su capacidad de mando. Por ello la nombraron teniente coronel. La premiaron con la entrega simbólica de un sable de mando.

Embarazada de su quinto hijo, Juana sufrió una herida durante la batalla de la Laguna. Su esposo murió al intentar rescatarla. Ella se unió luego a las tropas de Martín Miguel de Güemes. Defendieron el norte del Alto Perú de las invasiones realistas.

Años después, Simón Bolívar la nombró coronel y le otorgó una pensión que recibió durante cinco años. Luego de la declaración de la independencia de Bolivia, Juana intentó recuperar sus tierras, sin lograrlo. Murió en la miseria a los ochenta y un años en la provincia de Jujuy.

Cien años más tarde, sus restos fueron trasladados a Bolivia. En dos mil nueve fue reconocida como Generala del Ejército Argentino.

Juana Azurduy fue una mujer valiente y decidida que, desde los campos del Alto Perú hasta las montañas del noroeste argentino, puso su vida al servicio de la libertad. Su figura encarna el coraje, la entrega y la lucha por la igualdad en tiempos de guerra; por eso, además de su rango y reconocimientos oficiales, permanece en la memoria popular como símbolo de resistencia, de liderazgo femenino y de amor a la Patria que trasciende las victorias y las privaciones de su propia vida.`,
    challenges: [
      {
        question: '¿Cómo aprendió Juana el idioma de los pobladores nativos?',
        options: [
          'En los conventos donde completó su crianza',
          'Acompañando a su padre en las tareas del campo, donde entró en contacto con ellos',
          'Se lo enseñó su esposo, que era estudiante de derecho',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Por qué la nombraron teniente coronel?',
        options: [
          'Por su valentía y su capacidad de mando',
          'Porque Simón Bolívar se lo ordenó a Güemes',
          'Porque era la esposa del jefe de "Los Leales"',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué pasó con Juana después de la independencia de Bolivia?',
        options: [
          'Fue nombrada Generala del Ejército Argentino ese mismo año',
          'Recuperó sus tierras y vivió tranquila en Jujuy',
          'Intentó recuperar sus tierras sin lograrlo y murió en la miseria',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'La dama de Los Confines',
    author: 'Fluidez y Comprensión Lectora 2026 — DGE Mendoza',
    level: 'Avanzado',
    year: 4,
    content: `Liliana Bodoc nació en mil novecientos cincuenta y ocho, en la ciudad de Santa Fe. Vivió desde los cinco años en Mendoza, donde estudió la carrera de Licenciatura en Letras en la Universidad Nacional de Cuyo. Nuestra provincia marcó su formación y su identidad literaria. Fue escritora y docente. A los cuarenta años publicó su primer libro. Se convirtió en una de las voces más originales de la literatura argentina, especialmente en la narrativa juvenil y fantástica.

Fue llamada "La dama de Los Confines" en alusión a su obra más reconocida: la "Saga de Los Confines", publicada en el año dos mil. Esta trilogía está compuesta por las siguientes obras narrativas: Los días del Venado, Los días de la Sombra y Los días del Fuego. En estos libros, Bodoc se convirtió en revelación dentro del género épico-fantástico. Lejos de imitar modelos europeos, construyó un universo propio uniendo a Latinoamérica con los pueblos indígenas. Destacó temas como la memoria, la conquista, la identidad y la resistencia cultural.

Los Confines representan los límites de lo conocido y la relación entre distintas culturas y lenguajes. También muestran la diferencia entre la historia que suele contarse y las voces que no son escuchadas. Desde allí, Liliana Bodoc le da a la épica un carácter americano. En dos mil cuatro se publicó el libro de cuentos titulado Sucedió en colores. En el año dos mil ocho, El espejo africano, novela que aborda temas relacionados con la esclavitud, la libertad y la dignidad humana uniendo historia ética y belleza literaria. En ese mismo año se presenta Amigos por el viento, una obra compuesta por siete relatos que abordan temáticas como la pérdida, los conflictos con amigos, el enamoramiento, las amistades y la soledad. Su forma de escribir, poética y sensible, fue reconocida en muchos países. Sus libros fueron traducidos a varios idiomas.

En febrero de dos mil dieciocho nos dejó físicamente, pero su obra permanece intacta, su voz sigue viva en cada una de sus obras. Sus libros continúan dialogando con los lectores y ofreciendo sentidos que no se agotan con el paso del tiempo. Desde una perspectiva profundamente arraigada en lo local, Bodoc construye un universo que se expande hacia lo universal, donde los conflictos remiten a la historia de muchos pueblos. La autora crea una forma de valentía colectiva, y nos deja la idea de que la unión de los pueblos puede ser la respuesta más poderosa frente a la injusticia.

Por eso, "La dama de Los Confines", es un reconocimiento. Los Confines representan la lucha entre el bien y el mal, desde una mirada local, que se amplía hacia lo universal. En ella los pueblos se unen para defenderse del dominio absoluto de la oscuridad.`,
    challenges: [
      {
        question: '¿Qué obras componen la "Saga de Los Confines"?',
        options: [
          'Los días del Venado, Los días de la Sombra y Los días del Fuego',
          'Sucedió en colores, El espejo africano y Amigos por el viento',
          'El espejo africano y Los días del Venado',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué hizo Bodoc en lugar de imitar los modelos europeos del género épico-fantástico?',
        options: [
          'Ambientó sus novelas en la Europa medieval',
          'Construyó un universo propio uniendo a Latinoamérica con los pueblos indígenas',
          'Abandonó la narrativa juvenil para dedicarse al ensayo',
        ],
        correctIdx: 1,
      },
      {
        question: 'Según el texto, ¿qué representan Los Confines?',
        options: [
          'La frontera entre Argentina y los países vecinos',
          'Los años que la autora vivió en Mendoza',
          'Los límites de lo conocido y la relación entre distintas culturas y lenguajes',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Sargento Cabral, el correntino que murió por salvar a San Martín',
    author: 'Fluidez y Comprensión Lectora 2026 — DGE Mendoza',
    level: 'Avanzado',
    year: 5,
    content: `Todas las tardes, en el cuartel del Regimiento de Granaderos a Caballo, el sargento primero pasaba lista y llamaba a "Juan Bautista Cabral". El sargento más antiguo respondía: "Murió en el campo del honor, pero existe en nuestros corazones. ¡Viva la Patria, Granaderos!". Era el homenaje a quien había salvado la vida de José de San Martín, en el combate de San Lorenzo.

Juan Bautista Cabral había nacido en un paraje del oeste correntino. Era hijo natural de Francisco Cabral y de la esclava Carmen Robledo. Transcurrió su infancia en la estancia donde vivía con su madre, hasta que fue un joven fuerte.

Fue incorporado al Regimiento de Granaderos a Caballo, al que habían encomendado terminar con los ataques españoles a los poblados costeros del río Paraná.

En el comienzo del enfrentamiento, en las proximidades del convento de San Lorenzo, el caballo del General, recibió un tiro de metralla en el pecho. El animal cayó, aplastando la pierna de su jinete. Alrededor de San Martín, soldados realistas intentaron atacarlo. Mientras Cabral tomaba por los hombros a San Martín para ayudarlo, fue herido de muerte por un soldado español.

El combate duró un cuarto de hora, los españoles se retiraron y subieron a las embarcaciones en las que habían venido. Los heridos, entre los que se contaba Cabral, fueron llevados al convento; allí falleció un par de horas después. Insisten en que sus últimas palabras fueron en lengua guaraní: "Muero contento, hemos batido al enemigo".

San Martín mandó colocar sobre la puerta de entrada del cuartel de Granaderos un tablero con la inscripción: "Al soldado Juan Bautista Cabral. Murió en la acción de San Lorenzo el tres de febrero de mil ochocientos trece. Desde el jefe hasta el último soldado debían saludar esta inscripción cuando ingresaban al cuartel". Sus compañeros le tributan esta memoria.

En todo el mundo se entonan las estrofas de La Marcha de San Lorenzo que es una de las composiciones más emblemáticas de la historia argentina. En ella se enaltecen y resaltan valores como el coraje, la entrega y el sacrificio. Su melodía solemne y su ritmo marcado, transmiten una sensación de avance decidido, mientras que la letra exalta la figura de Facundo Cabral, que cumple su deber sin buscar reconocimiento personal: "Cabral, soldado heroico, cubriéndose de gloria, cual precio a la victoria, su vida rinde, haciéndose inmortal. Y allí salvó su arrojo la libertad naciente de medio continente; ¡honor, honor al gran Cabral!" Presente en actos escolares y conmemoraciones, funciona como un recordatorio del pasado histórico y de los ideales fundacionales de la Nación.

Cuenta una anécdota que, como símbolo de lealtad y reconocimiento, San Martín, arrancó un botón de la chaqueta de Cabral, en el momento de su muerte. Lo llevaría en su bolsillo hasta el día de su muerte. Fue su íntima manera de recordar a quien entregó su vida por él. Símbolo de gratitud y el último secreto del General.`,
    challenges: [
      {
        question: '¿Qué respondía el sargento más antiguo cuando pasaban lista a Juan Bautista Cabral?',
        options: [
          '"Muero contento, hemos batido al enemigo"',
          '"Murió en el campo del honor, pero existe en nuestros corazones. ¡Viva la Patria, Granaderos!"',
          '"Honor, honor al gran Cabral"',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Cómo resultó herido de muerte Cabral?',
        options: [
          'Mientras tomaba por los hombros a San Martín para ayudarlo, un soldado español lo hirió',
          'Recibió un tiro de metralla en el pecho al comenzar el combate',
          'Cayó del caballo del General cuando este se desplomó',
        ],
        correctIdx: 0,
      },
      {
        question: 'Según la anécdota del final, ¿qué guardó San Martín como recuerdo?',
        options: [
          'El sable de mando de Cabral',
          'La inscripción del cuartel de Granaderos',
          'Un botón de la chaqueta de Cabral, que llevó en su bolsillo hasta su muerte',
        ],
        correctIdx: 2,
      },
    ],
  },
];
