/**
 * textosVidela.ts
 * Coleccion "Textos Fluidez Lectora Videla": dos textos por año de secundaria
 * (biografias y textos culturales), pensados para la practica de lectura en voz alta.
 *
 * Comparte la interfaz TextoSeed con censo2023.ts y se carga desde el mismo
 * endpoint del Panel de Administracion (src/app/api/admin/seed-censo/route.ts).
 */

import type { TextoSeed } from './censo2023';

export const textosVidela: TextoSeed[] = [
  {
    title: 'Lionel Messi: el chico que nunca se rindió',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Básico',
    year: 1,
    content: `Lionel Messi nació el 24 de junio de 1987 en Rosario, Argentina. Desde pequeño mostró un talento especial para el fútbol. Pasaba horas jugando en el barrio con sus amigos. Su habilidad con la pelota sorprendía a todos los que lo veían.

Sin embargo, su camino no fue fácil. A los diez años los médicos descubrieron que su cuerpo no producía suficiente hormona de crecimiento. El tratamiento que necesitaba era muy costoso y su familia no podía pagarlo.

El club Barcelona, de España, vio en él un talento extraordinario. Le ofreció hacerse cargo del tratamiento si Messi viajaba a formarse en su escuela de fútbol. Con apenas trece años, dejó su familia y su país para perseguir su sueño.

La adaptación fue difícil. Estaba lejos de su hogar y debía demostrar su valor cada día. Pero su esfuerzo habló por él. Poco a poco fue creciendo dentro del club y se convirtió en uno de los mejores jugadores del mundo.

En 2022 logró su mayor sueño: ganar la Copa del Mundo con la selección argentina en Qatar. Ese momento emocionó a millones de personas en todo el planeta.

La historia de Messi enseña que el talento es importante, pero la perseverancia es lo que marca la diferencia. Sus logros son el resultado de años de esfuerzo, sacrificio y amor por el juego.`,
    challenges: [
      {
        question: '¿Qué problema de salud descubrieron los médicos cuando Messi tenía diez años?',
        options: [
          'Que su cuerpo no producía suficiente hormona de crecimiento',
          'Que tenía una lesión grave en la rodilla',
          'Que no podía practicar deportes de contacto',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué le ofreció el club Barcelona a la familia de Messi?',
        options: [
          'Un contrato profesional inmediato',
          'Hacerse cargo del tratamiento si viajaba a formarse en su escuela de fútbol',
          'Una casa en España para toda la familia',
        ],
        correctIdx: 1,
      },
      {
        question: 'Según el texto, ¿qué es lo que marca la diferencia además del talento?',
        options: ['La suerte', 'El dinero', 'La perseverancia'],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Michael Jackson: el rey del pop',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Básico',
    year: 1,
    content: `Michael Jackson nació el 29 de agosto de 1958 en Gary, Indiana, Estados Unidos. Desde muy pequeño mostró un talento extraordinario para el canto y el baile. A los cinco años ya actuaba junto a sus hermanos en un grupo llamado "The Jackson 5".

Cuando creció, comenzó su carrera como solista. En 1982 lanzó el álbum "Thriller", que se convirtió en el disco más vendido de la historia. Sus canciones mezclaban ritmos modernos de una manera que nadie había escuchado antes.

Pero lo que más llamaba la atención era su forma de bailar. El "moonwalk" era un paso en el que parecía deslizarse hacia atrás sin despegar los pies del suelo. Se hizo famoso en todo el mundo y muchos jóvenes intentaban imitarlo.

Michael Jackson también usó su fama para ayudar a los demás. Participó en campañas solidarias y grabó canciones para recaudar fondos para personas en situación de pobreza. Creía que el arte podía cambiar el mundo.

Falleció en 2009, pero su música sigue sonando en todos los rincones del planeta. Su influencia se nota en artistas de todas las generaciones.

La vida de Michael Jackson muestra que el talento, cuando se cultiva con pasión y esfuerzo, puede dejar una huella para siempre en la historia de la humanidad.`,
    challenges: [
      {
        question: '¿Cómo se llamaba el grupo en el que actuaba junto a sus hermanos?',
        options: ['The Jackson 5', 'The Moonwalkers', 'Thriller'],
        correctIdx: 0,
      },
      {
        question: '¿En qué consistía el paso de baile llamado "moonwalk"?',
        options: [
          'En girar sobre una sola pierna sin detenerse',
          'En parecer que se deslizaba hacia atrás sin despegar los pies del suelo',
          'En saltar muy alto y caer en punta de pie',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Para qué usó Michael Jackson su fama, según el texto?',
        options: [
          'Para vender más discos que nadie',
          'Para dedicarse al cine',
          'Para participar en campañas solidarias y recaudar fondos',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Usain Bolt: el hombre más rápido del mundo',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Básico',
    year: 2,
    content: `Usain Bolt nació el 21 de agosto de 1986 en Sherwood Content, una pequeña localidad de Jamaica. Desde niño se destacó por su velocidad, aunque en sus comienzos su verdadera pasión era el críquet. Fue su entrenador quien lo convenció de dedicarse al atletismo, al notar que sus condiciones físicas eran excepcionales.

Su irrupción en el atletismo mundial fue sorprendente. En los Juegos Olímpicos de Beijing 2008, Bolt ganó tres medallas de oro y estableció tres récords mundiales en las pruebas de 100, 200 metros y relevos 4x100. Lo hizo con una facilidad que dejó atónitos a los especialistas, ya que su altura de un metro noventa y cinco lo convertía en un corredor atípico para las distancias cortas.

A lo largo de su carrera acumuló ocho medallas de oro olímpicas y once títulos mundiales. Su récord de 9,58 segundos en los 100 metros, establecido en Berlín en 2009, sigue siendo el más rápido registrado en la historia del atletismo.

Más allá de sus logros deportivos, Bolt se caracterizó por su personalidad extrovertida y su capacidad para conectar con el público. Su celebración característica, conocida como el "rayo", se convirtió en un símbolo reconocible en todo el planeta.

La historia de Usain Bolt demuestra que el talento natural, combinado con la disciplina y la confianza en uno mismo, puede llevar a una persona a alcanzar logros que parecían imposibles.`,
    challenges: [
      {
        question: '¿Cuál era la verdadera pasión de Bolt en sus comienzos?',
        options: ['El atletismo', 'El críquet', 'El fútbol'],
        correctIdx: 1,
      },
      {
        question: '¿Por qué los especialistas consideraban a Bolt un corredor atípico para las distancias cortas?',
        options: [
          'Porque entrenaba muy pocas horas por semana',
          'Porque había empezado a competir siendo muy grande',
          'Porque su altura de un metro noventa y cinco no era la habitual en esas pruebas',
        ],
        correctIdx: 2,
      },
      {
        question: '¿Qué récord suyo sigue siendo el más rápido de la historia del atletismo?',
        options: [
          'Los 9,58 segundos en 100 metros, establecido en Berlín en 2009',
          'Los 200 metros de Beijing 2008',
          'El relevo 4x100 de Londres 2012',
        ],
        correctIdx: 0,
      },
    ],
  },
  {
    title: 'La leyenda del Zonda: el viento de los Andes',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Básico',
    year: 2,
    content: `En la región de Cuyo, especialmente en Mendoza, existe un fenómeno natural que los habitantes conocen muy bien: el viento Zonda. Se trata de un viento cálido y seco que desciende desde la cordillera de los Andes y barre los valles con una fuerza característica. Pero más allá de su explicación meteorológica, este viento tiene una historia que nace en la cultura de los pueblos originarios.

Según las antiguas tradiciones huarpes, el Zonda era el espíritu de un joven guerrero que habitaba en las alturas de la montaña. Era valiente y apasionado, y amaba profundamente a su tierra. Cuando los invasores amenazaban a su pueblo, descendía con toda su fuerza para proteger a los suyos, barriendo los caminos y levantando nubes de polvo.

Los ancianos de la comunidad contaban que cuando el Zonda soplaba con intensidad, era señal de que algo importante estaba por ocurrir. Algunos lo interpretaban como una advertencia; otros, como una forma de comunicación entre el mundo de los vivos y el de los antepasados.

Con el paso del tiempo, la ciencia explicó el origen del Zonda como un viento de tipo föhn, producido cuando las masas de aire húmedo del Pacífico cruzan la cordillera y descienden calientes y secos hacia el este. Sin embargo, la leyenda sobrevivió junto a la explicación científica.

Hoy en día, los mendocinos conviven con el Zonda como parte de su identidad. Ese viento que agita los árboles y enrojece el cielo sigue siendo, para muchos, mucho más que un fenómeno del tiempo.`,
    challenges: [
      {
        question: 'Según la tradición huarpe, ¿qué era el Zonda?',
        options: [
          'Un castigo enviado por los dioses del valle',
          'El espíritu de un joven guerrero que habitaba en las alturas de la montaña',
          'El alma de una anciana que cuidaba los caminos',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Cómo explica la ciencia el origen del Zonda?',
        options: [
          'Como un viento de tipo föhn: aire húmedo del Pacífico que cruza la cordillera y desciende caliente y seco',
          'Como una corriente fría que sube desde la Patagonia',
          'Como el efecto del deshielo de la nieve en primavera',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué ocurrió con la leyenda cuando apareció la explicación científica?',
        options: [
          'Fue olvidada por completo',
          'Se transformó en otra leyenda distinta',
          'Sobrevivió junto a la explicación científica',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Mercedes Sosa: la voz de América Latina',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Intermedio',
    year: 3,
    content: `Mercedes Sosa nació el 9 de julio de 1935 en San Miguel de Tucumán, Argentina. Creció en una familia humilde y desde joven mostró una voz que parecía surgir desde lo más profundo de la tierra. No cantaba solo con su garganta, sino con toda su historia y la historia de su pueblo.

En la década de 1960, se convirtió en una de las figuras centrales del Movimiento del Nuevo Cancionero, una corriente musical que buscaba recuperar las raíces del folclore latinoamericano y darle un nuevo sentido político y social. Sus interpretaciones de canciones como "Alfonsina y el mar" o "Todo cambia" trascendieron las fronteras y la convirtieron en un símbolo de identidad continental.

Durante la última dictadura militar argentina, su música fue prohibida y ella debió exiliarse. Vivió en España y en Francia, pero nunca dejó de cantar ni de denunciar las injusticias. El exilio, lejos de silenciarla, profundizó aún más el compromiso que sentía con los más vulnerables.

Su regreso a la Argentina en 1982 fue uno de los momentos más emotivos de la historia cultural del país. El Luna Park estuvo repleto de personas que lloraron y cantaron junto a ella, celebrando el reencuentro con una voz que representaba mucho más que la música.

Mercedes Sosa falleció en 2009, pero su legado permanece vivo. Su obra enseña que el arte puede ser una forma de resistencia y que una voz comprometida con la verdad puede atravesar todas las fronteras.

Fue, es y seguirá siendo, la voz de América Latina.`,
    challenges: [
      {
        question: '¿Qué buscaba el Movimiento del Nuevo Cancionero?',
        options: [
          'Recuperar las raíces del folclore latinoamericano y darle un nuevo sentido político y social',
          'Reemplazar el folclore por la música extranjera',
          'Formar cantantes para competir en festivales europeos',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué efecto tuvo el exilio sobre Mercedes Sosa, según el texto?',
        options: [
          'La obligó a abandonar la música durante varios años',
          'Lejos de silenciarla, profundizó su compromiso con los más vulnerables',
          'La llevó a cantar solamente en idiomas extranjeros',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué enseña su obra según el cierre del texto?',
        options: [
          'Que la fama internacional es el mayor logro de un artista',
          'Que el folclore debe mantenerse sin cambios',
          'Que el arte puede ser una forma de resistencia y atravesar todas las fronteras',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'El Dragón en la mitología china: símbolo de poder y sabiduría',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Intermedio',
    year: 3,
    content: `En la cultura occidental, los dragones suelen ser presentados como criaturas aterradoras que deben ser derrotadas por héroes valientes. Sin embargo, en la mitología china, el dragón representa algo completamente diferente: es un símbolo de poder, sabiduría, prosperidad y buena fortuna.

El dragón chino, conocido como "lóng", no escupe fuego ni aterroriza a los pueblos. Vive en ríos, lagos y mares, y es considerado el guardián de las aguas. Se cree que controla las lluvias y las inundaciones, elementos fundamentales para una civilización que durante siglos dependió de la agricultura.

En el imaginario imperial chino, el dragón estaba asociado directamente con el emperador. Solo el gobernante podía usar el símbolo del dragón de cinco garras en sus vestimentas y objetos personales. Esta relación entre el dragón y el poder político no era casual: representaba que el emperador gobernaba con la legitimidad otorgada por el cielo y la naturaleza.

La figura del dragón también aparece en numerosas festividades y rituales. La danza del dragón, en la que un grupo de personas sostiene una figura articulada de tela y bambú, es una de las expresiones más conocidas de la cultura china en todo el mundo. Se realiza especialmente durante el Año Nuevo Lunar para atraer buena suerte.

Este contraste entre la visión occidental y la oriental del dragón invita a reflexionar sobre cómo las culturas construyen sus propios símbolos y significados. Un mismo ser imaginario puede representar el miedo en un contexto y la esperanza en otro.

Conocer estas diferencias nos ayuda a comprender que no existe una única manera de interpretar el mundo y que cada cultura aporta una mirada valiosa e irreemplazable.`,
    challenges: [
      {
        question: '¿De qué es considerado guardián el dragón chino?',
        options: ['Del fuego', 'De las aguas', 'De las montañas'],
        correctIdx: 1,
      },
      {
        question: '¿Quién era el único que podía usar el símbolo del dragón de cinco garras?',
        options: [
          'El emperador',
          'Los sacerdotes del templo',
          'Los campesinos durante la cosecha',
        ],
        correctIdx: 0,
      },
      {
        question: '¿A qué invita a reflexionar el contraste entre la visión occidental y la oriental del dragón?',
        options: [
          'A demostrar cuál de las dos culturas tiene razón',
          'A dejar de usar símbolos en las festividades',
          'A comprender que cada cultura construye sus propios símbolos y significados',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Serena Williams: más allá del tenis',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Intermedio',
    year: 4,
    content: `Serena Williams nació el 26 de septiembre de 1981 en Saginaw, Michigan, Estados Unidos. Creció en Compton, un barrio de Los Ángeles conocido por sus altos índices de violencia y pobreza. Fue su padre, Richard Williams, quien decidió que sus hijas aprenderían a jugar al tenis, un deporte al que prácticamente ninguna familia afroamericana de ese entorno tenía acceso.

Desde sus primeras apariciones en los torneos juveniles, Serena demostró una potencia física y una determinación mental que la diferenciaban del resto. Sin embargo, su trayectoria no estuvo libre de obstáculos. Además de las dificultades económicas de su infancia, debió enfrentar a lo largo de su carrera prejuicios raciales y de género que cuestionaban su lugar en un deporte históricamente dominado por personas blancas y de clase alta.

A pesar de ello, Serena Williams acumuló 23 títulos de Grand Slam en individuales, convirtiéndose en la tenista con más títulos de este tipo en la era abierta. Su estilo de juego, caracterizado por un saque devastador y una capacidad de recuperación extraordinaria, redefinió los estándares del tenis femenino mundial.

Pero su impacto trasciende ampliamente lo deportivo. Serena se convirtió en una figura pública que habló abiertamente sobre el racismo, la desigualdad y los derechos de las mujeres. Cuando en 2017 ganó el Abierto de Australia embarazada de ocho semanas, el mundo entero tomó conciencia de la dimensión humana que existía detrás de la atleta.

Su retiro del tenis profesional en 2022 fue un momento que generó una reflexión colectiva sobre lo que significa el deporte como espacio de lucha y transformación social. Serena Williams no solo cambió el tenis: cambió la manera en que el mundo mira a las mujeres deportistas.

Su historia es la de alguien que convirtió cada obstáculo en una razón para seguir adelante, y que usó su visibilidad para abrir puertas a quienes vendrían después.`,
    challenges: [
      {
        question: 'Además de las dificultades económicas, ¿qué obstáculos debió enfrentar Serena a lo largo de su carrera?',
        options: [
          'Lesiones que la alejaron una década del circuito',
          'Prejuicios raciales y de género que cuestionaban su lugar en el tenis',
          'La falta de entrenadores dispuestos a trabajar con ella',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué hecho de 2017 hizo que el mundo tomara conciencia de la dimensión humana detrás de la atleta?',
        options: [
          'Ganó el Abierto de Australia estando embarazada de ocho semanas',
          'Anunció su retiro por primera vez',
          'Fundó una escuela de tenis en Compton',
        ],
        correctIdx: 0,
      },
      {
        question: 'Según el texto, ¿en qué consiste el impacto de Serena más allá de lo deportivo?',
        options: [
          'En haber batido todos los récords de velocidad del saque',
          'En haber creado una marca de ropa deportiva',
          'En haber hablado sobre el racismo y la desigualdad, y cambiar la manera en que el mundo mira a las mujeres deportistas',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'El mito de Quetzalcóatl: la serpiente emplumada',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Intermedio',
    year: 4,
    content: `Entre las deidades más complejas y fascinantes de la mitología mesoamericana se encuentra Quetzalcóatl, cuyo nombre en náhuatl significa "serpiente emplumada". Esta figura combina dos elementos del mundo natural que representan dimensiones opuestas: la serpiente, que habita en la tierra, y las plumas del quetzal, un ave asociada al cielo y a la libertad. Su fusión simboliza la unión entre lo terrenal y lo divino.

Para los pueblos tolteca y azteca, Quetzalcóatl no era solo un dios, sino también un gobernante legendario. Según los relatos, existió un rey sabio con ese nombre que enseñó a su pueblo las artes, la agricultura, la medicina y la escritura. Era un gobernante justo que rechazaba los sacrificios humanos y promovía el conocimiento como camino hacia la prosperidad.

Sin embargo, fuerzas oscuras conspiraron contra él. Fue engañado por Tezcatlipoca, el dios del espejo humeante, quien mediante una treta lo hizo caer en la deshonra. Avergonzado, Quetzalcóatl abandonó su reino y marchó hacia el oriente. Según la leyenda, se arrojó al mar entre llamas y su espíritu ascendió al cielo, transformándose en el planeta Venus.

Este mito tuvo consecuencias históricas de enorme magnitud. Cuando Hernán Cortés llegó a México en 1519, algunos pueblos creyeron que era el regreso de Quetzalcóatl, quien según la profecía volvería desde el oriente. Esta confusión contribuyó, en parte, a que la conquista española encontrara menos resistencia de la esperada en un principio.

El mito de Quetzalcóatl ilustra cómo las narraciones culturales no son solo historias del pasado, sino fuerzas activas que moldean la realidad presente. Sus símbolos permanecen vivos en el arte, la arquitectura y la identidad de los pueblos de México y Centroamérica hasta el día de hoy.`,
    challenges: [
      {
        question: '¿Qué simboliza la fusión de la serpiente y las plumas del quetzal?',
        options: [
          'La unión entre lo terrenal y lo divino',
          'La lucha entre el bien y el mal',
          'El paso de las estaciones del año',
        ],
        correctIdx: 0,
      },
      {
        question: '¿En qué se transformó el espíritu de Quetzalcóatl según la leyenda?',
        options: ['En el sol', 'En el planeta Venus', 'En una montaña sagrada'],
        correctIdx: 1,
      },
      {
        question: '¿Qué consecuencia histórica tuvo el mito cuando Hernán Cortés llegó a México en 1519?',
        options: [
          'Los pueblos originarios destruyeron los templos dedicados al dios',
          'Los españoles adoptaron la religión mesoamericana',
          'Algunos pueblos creyeron que era el regreso de Quetzalcóatl y la conquista encontró menos resistencia de la esperada',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Astor Piazzolla: el hombre que revolucionó el tango',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Avanzado',
    year: 5,
    content: `Astor Piazzolla nació el 11 de marzo de 1921 en Mar del Plata, Argentina, aunque pasó gran parte de su infancia en Nueva York, ciudad donde su familia emigró en busca de mejores condiciones de vida. Fue en ese entorno multicultural donde entró en contacto con el jazz y la música clásica, influencias que más tarde marcarían de manera definitiva su visión artística.

Desde joven demostró un dominio excepcional del bandoneón, instrumento central del tango tradicional. Sin embargo, su ambición artística lo llevó a estudiar composición con maestros de primer nivel, entre ellos la reconocida pedagoga francesa Nadia Boulanger. Fue ella quien, al escucharlo tocar sus propias composiciones, lo instó a no abandonar el tango y a desarrollarlo como su lenguaje genuino.

El "tango nuevo" que Piazzolla construyó a lo largo de décadas incorporó elementos del jazz, la música de cámara y la armonía contemporánea, generando una propuesta que rompió radicalmente con las convenciones del género. Esta ruptura le valió tanto la admiración de la crítica internacional como el rechazo de sectores tradicionales del ambiente tanguero argentino, quienes lo acusaban de traicionar la esencia del tango.

La tensión entre innovación y tradición que Piazzolla encarnó no era meramente estética: era también una discusión sobre la identidad cultural argentina, sobre qué se considera legítimo dentro de una tradición y quién tiene la autoridad para transformarla. Sus obras como "Adiós Nonino", "Libertango" o "Verano porteño" son hoy parte del repertorio musical universal.

Piazzolla falleció en 1992, dejando una obra que continúa siendo interpretada y reinterpretada por músicos de todo el mundo. Su caso invita a reflexionar sobre el rol del artista como agente de transformación cultural: alguien que, en lugar de reproducir lo establecido, asume el riesgo de proponer algo radicalmente nuevo.

Su legado demuestra que la identidad cultural no es un objeto estático que debe preservarse intacto, sino una construcción viva que se renueva en cada generación a través de quienes se atreven a cuestionarla y ampliarla.`,
    challenges: [
      {
        question: '¿Qué le aconsejó Nadia Boulanger al escucharlo tocar sus propias composiciones?',
        options: [
          'Que se dedicara exclusivamente a la música clásica',
          'Que no abandonara el tango y lo desarrollara como su lenguaje genuino',
          'Que se radicara definitivamente en Nueva York',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Por qué el "tango nuevo" generó rechazo en sectores tradicionales del ambiente tanguero?',
        options: [
          'Porque lo acusaban de traicionar la esencia del tango al romper con las convenciones del género',
          'Porque se tocaba únicamente fuera de la Argentina',
          'Porque eliminaba el bandoneón de las orquestas',
        ],
        correctIdx: 0,
      },
      {
        question: 'Según el cierre del texto, ¿qué demuestra el legado de Piazzolla sobre la identidad cultural?',
        options: [
          'Que debe preservarse intacta tal como fue heredada',
          'Que solo los artistas consagrados pueden modificarla',
          'Que no es un objeto estático, sino una construcción viva que se renueva en cada generación',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'La Pachamama: tierra, identidad y cosmovisión andina',
    author: 'Textos de Fluidez Lectora (Videla)',
    level: 'Avanzado',
    year: 5,
    content: `En la cosmovisión de los pueblos andinos, la Pachamama no es simplemente la tierra entendida como suelo o territorio. Es una entidad viva, una madre que sostiene, alimenta y da sentido a la existencia de quienes habitan sobre ella. Esta concepción, profundamente arraigada en culturas como la quechua y la aymara, establece una relación entre el ser humano y la naturaleza radicalmente diferente a la que propone la tradición occidental moderna.

Mientras el pensamiento occidental tiende a concebir la naturaleza como un conjunto de recursos disponibles para ser explotados en beneficio del ser humano, la cosmovisión andina postula una relación de reciprocidad. El concepto de "ayni", que puede traducirse como intercambio justo o correspondencia, implica que todo lo que se toma de la tierra debe ser devuelto de alguna forma. Las ofrendas a la Pachamama, realizadas especialmente durante el mes de agosto, son una expresión concreta de esta lógica de reciprocidad.

La figura de la Pachamama sobrevivió a la conquista española mediante un proceso de sincretismo cultural. En muchas comunidades andinas, fue asociada con la Virgen María, lo que permitió que su culto continuara bajo una forma aceptable para los colonizadores. Este tipo de adaptación fue una estrategia de resistencia cultural que preservó saberes y prácticas ancestrales bajo una apariencia de conversión religiosa.

En las últimas décadas, la Pachamama ha trascendido su contexto originario y ha adquirido relevancia en debates globales sobre ecología, derechos de la naturaleza y modelos alternativos de desarrollo. En 2008, Ecuador incorporó en su Constitución los derechos de la naturaleza, utilizando precisamente el concepto de Pachamama como fundamento jurídico y filosófico.

Este desplazamiento desde lo mítico-religioso hacia lo jurídico-político ilustra de qué manera las cosmovisiones de los pueblos originarios pueden aportar marcos conceptuales valiosos para pensar los desafíos contemporáneos. La crisis ambiental global ha puesto en evidencia los límites del modelo extractivista occidental y ha renovado el interés por formas de relacionamiento con el entorno que priorizan el equilibrio sobre la acumulación.

Comprender la Pachamama implica, entonces, mucho más que conocer un mito o una creencia. Significa acercarse a una forma de entender el mundo que desafía categorías instaladas y propone una ética del cuidado como base de la vida en comunidad.`,
    challenges: [
      {
        question: '¿Qué implica el concepto de "ayni" en la cosmovisión andina?',
        options: [
          'Que todo lo que se toma de la tierra debe ser devuelto de alguna forma',
          'Que la tierra pertenece a quien la trabaja',
          'Que las ofrendas deben realizarse una vez por generación',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Cómo sobrevivió la figura de la Pachamama a la conquista española?',
        options: [
          'Mediante la prohibición de todo culto religioso extranjero',
          'Mediante un sincretismo cultural que la asoció con la Virgen María',
          'Mediante su traslado a comunidades de la costa del Pacífico',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué hizo Ecuador en 2008 usando el concepto de Pachamama como fundamento?',
        options: [
          'Declaró el mes de agosto como feriado nacional',
          'Creó un ministerio dedicado a los pueblos originarios',
          'Incorporó en su Constitución los derechos de la naturaleza',
        ],
        correctIdx: 2,
      },
    ],
  },
];
