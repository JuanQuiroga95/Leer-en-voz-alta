/**
 * censo2023.ts
 * Textos oficiales del Censo de Fluidez y Comprensión Lectora 2023
 * (Plan Lectura y Escritura Mendoza — DGE), uno por año de secundaria.
 *
 * Se comparten entre el script de linea de comandos (src/scripts/seed-censo-2023.ts)
 * y el endpoint que los carga desde el Panel de Administracion
 * (src/app/api/admin/seed-censo/route.ts).
 */

export interface ChallengeSeed {
  question: string;
  options: string[];
  correctIdx: number;
}

export interface TextoSeed {
  title: string;
  author: string;
  level: string;
  year: number;
  content: string;
  challenges: ChallengeSeed[];
}

export const textosCenso2023: TextoSeed[] = [
  {
    title: 'Los animales y sus sentimientos',
    author: 'Fluidez y Comprensión Lectora — DGE Mendoza',
    level: 'Básico',
    year: 1,
    content: `Las emociones son una parte fundamental de la vida de los seres humanos, pero también lo son para los animales. Durante muchos años, se pensó que solo los seres humanos eran capaces de experimentar amor o tristeza. Sin embargo, gracias a la investigación científica, hoy sabemos que los animales también tienen la capacidad de experimentar y mostrar una amplia gama de emociones, desde el miedo y la tristeza hasta la alegría y el amor.

¿Qué emociones experimentan los animales?

Los animales tienen sistemas nerviosos similares a los humanos, por lo que sus emociones son también similares.

Los perros y los gatos pueden sentir emociones muy intensas, también pueden identificar las emociones de sus amos, aunque éstos intenten ocultarlas. Cuando sus dueños los acarician y les muestran afecto, se sienten felices y tranquilos. Sin embargo, si se ven amenazados o en peligro, muestran signos de miedo o agresividad. Aunque pueden parecer más independientes, los gatos son seres emocionales y muy demostrativos.

De igual manera, los elefantes tienen fuertes lazos familiares y emocionales. Si un miembro de su manada muere, muestran signos de dolor y tristeza, y pueden llorar durante varios días. Además, tienen una gran memoria emocional y son capaces de recordar a otros elefantes así como lugares especiales, durante muchos años.

Los primates comunican sus emociones a través de expresiones en la cara y utilizando los sonidos de su voz. Además, pueden identificar las emociones en otros individuos de su especie y actuar en consecuencia.

La orca es uno de los animales más inteligentes, y es considerado científicamente el animal más emocional. Son seres sociales y se comunican con un lenguaje complejo que todavía no podemos comprender.

Los animales no experimentan las emociones de la misma manera que los seres humanos. Sin embargo, pueden sentirlas y expresarlas como nosotros. Por esta razón, merecen nuestro respeto y cuidado.`,
    challenges: [
      {
        question: '¿Por qué los animales sienten emociones parecidas a las nuestras?',
        options: [
          'Porque conviven con los seres humanos',
          'Porque tienen sistemas nerviosos similares a los humanos',
          'Porque aprenden a imitar a sus dueños',
        ],
        correctIdx: 1,
      },
      {
        question: 'Según el texto, ¿qué hacen los elefantes cuando muere un miembro de su manada?',
        options: [
          'Abandonan el lugar de inmediato',
          'Buscan una nueva manada',
          'Muestran dolor y tristeza, y pueden llorar durante varios días',
        ],
        correctIdx: 2,
      },
      {
        question: '¿Qué animal es considerado científicamente el más emocional?',
        options: ['La orca', 'El elefante', 'El primate'],
        correctIdx: 0,
      },
    ],
  },
  {
    title: 'Puro músculo',
    author: 'Laurie Beckelman (El cos humà) — texto adaptado',
    level: 'Básico',
    year: 2,
    content: `¿Has probado no mover ni un músculo? Es imposible. Sí puedes decidir no dar ni un paso o doblar un dedo. Pero el corazón y el estómago también son músculos y no los puedes controlar.

Los músculos están compuestos principalmente de fibras que se contraen, transforman la energía en fuerza. Los que tú controlas son los músculos esqueléticos y tienes en total unos seiscientos cincuenta. Unen los huesos con unas franjas de tejido muy duro llamadas tendones. Los músculos esqueléticos actúan por parejas y sirven para poder moverse. Los músculos que no puedes controlar se llaman músculos lisos; forman las paredes de los vasos sanguíneos y de los intestinos. Permiten también la contracción del estómago para procesar la comida.

El músculo más potente que tienes no es ni liso ni esquelético. Se llama músculo cardíaco y es el músculo del corazón. Tu corazón late más de cuatro mil quinientas veces por hora. Su músculo, de aspecto fibroso, es único, y no lo puedes controlar.

Los vasos sanguíneos y los nervios llegan a todos los músculos. La sangre les aporta energía y los nervios controlan las acciones.

Los músculos que no utilizas pierden fuerza y volumen. Los que utilizas se vuelven fuertes y gruesos. El ejercicio repetido hace que las fibras musculares se hagan más gruesas. Los culturistas hacen ejercicios especiales para desarrollar todos los músculos principales, pero no es necesario ser culturista para estar fuerte. Haciendo ejercicio con regularidad mantendrás los músculos en forma.`,
    challenges: [
      {
        question: '¿Cómo se llaman las franjas de tejido muy duro que unen los músculos con los huesos?',
        options: ['Fibras', 'Tendones', 'Vasos sanguíneos'],
        correctIdx: 1,
      },
      {
        question: '¿Cuál es el músculo más potente del cuerpo según el texto?',
        options: [
          'El músculo cardíaco',
          'Los músculos esqueléticos de las piernas',
          'Los músculos lisos del estómago',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué les pasa a los músculos que no se utilizan?',
        options: [
          'Se vuelven más gruesos',
          'Se transforman en músculos lisos',
          'Pierden fuerza y volumen',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Publicidad',
    author: 'Ejercicios de Comprensión Lectora para Secundaria — texto adaptado',
    level: 'Medio',
    year: 3,
    content: `Los especialistas en derechos humanos piensan que la representación de las personas en la publicidad a veces es injusta. En el caso de hombres y mujeres, existe una fuerte tendencia de presentar a los primeros como los protectores, los fuertes, mientras que a las segundas las vemos básicamente en roles secundarios.

Algunas escenas discriminatorias que se dan en esos ámbitos tienden a mostrar a un tipo de personas en las que predomina la piel blanca y los cabellos claros, dejan de lado la diversidad racial que existe en nuestro país (andinos, mestizos, afrodescendientes).

Mariela Jara señala que los mensajes publicitarios a veces discriminan cuando exponen situaciones en las que priman momentos de realización, felicidad y prosperidad económica en países en el que una gran parte de la población vive en pobreza.

Para los defensores de la publicidad es el espejo de la cultura que hemos adquirido a lo largo de los años. David Solari Martín explica que el individuo observa en los anuncios comerciales ideales de belleza y comportamiento. La sociedad acepta un modelo y la publicidad lo acoge. Se manifiesta que el color de pelos que más vende en un país es el rubio y acá las mujeres no son en su mayoría rubias. Entonces, estos mensajes nos brindan parámetros de belleza que no corresponden a nuestra realidad, pero los aceptamos.

Por otro lado, las marcas de algunas instituciones bancarias y bebidas gaseosas tienen promociones en las que aparecen modelos con rasgos andinos. Lo que sucede es que hay un problema de identidad que provoca una falta de unidad entre los criterios y los mensajes que se emplean para elaborar los avisos publicitarios.`,
    challenges: [
      {
        question: 'Según los especialistas en derechos humanos, ¿cómo suele representar la publicidad a hombres y mujeres?',
        options: [
          'A ambos por igual, en roles equivalentes',
          'A los hombres como protectores y fuertes, y a las mujeres en roles secundarios',
          'A las mujeres como protagonistas y a los hombres en segundo plano',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué argumento dan los defensores de la publicidad?',
        options: [
          'Que la publicidad es el espejo de la cultura adquirida a lo largo de los años',
          'Que la publicidad no influye en las personas',
          'Que la publicidad debería estar prohibida',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué problema señala el texto al final?',
        options: [
          'Que faltan marcas de bebidas gaseosas en el país',
          'Que los avisos publicitarios son demasiado largos',
          'Un problema de identidad y falta de unidad entre los criterios y los mensajes publicitarios',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: '¿Por qué es importante bostezar?',
    author: 'Redacción National Geographic — texto adaptado',
    level: 'Medio',
    year: 4,
    content: `Una persona bosteza una media de cinco a diez veces al día. La señal, provocada por un reflejo involuntario, ocurre cuando tienes sueño, estás aburrido o ansioso, pero aún no está clara la importancia de bostezar para el organismo.

Un estudio del Instituto Politécnico de la Universidad Estatal de Estados Unidos publicado en el dos mil veintiuno en una revista científica trató de comprender el efecto del bostezo en el cuerpo.

¿Por qué bostezamos? Hasta entonces, se creía que uno de los propósitos del bostezo era despertar al individuo al inducir el estiramiento de los músculos y ayudar a que la sangre circule. Otra hipótesis es que el reflejo trabaja para oxigenar el organismo.

Sin embargo, un estudio norteamericano demostró que bostezar refresca el cerebro. A través de la inhalación simultánea de aire frío y el estiramiento de los músculos alrededor de las cavidades orales, el bostezo aumenta el flujo de sangre fría al cerebro y, por lo tanto, tiene una función termorreguladora.

Esta función, según la investigación, está ligada al nivel de atención del individuo. Esto se debe a que el cerebro funciona mejor a una temperatura ideal, por lo que si la temperatura cerebral aumenta demasiado por cualquier motivo, estamos menos alertas y atentos.

Los animales también bostezan

Además de los humanos, los expertos también han observado bostezos en otros vertebrados, como peces, ranas, serpientes, pájaros, delfines, gatos y monos.

Una investigación del Instituto Politécnico de Estados Unidos respalda la idea de que bostezar en los animales está relacionado con la actividad del cerebro. La hipótesis es que cuanto más activo es este órgano, más enfriamiento necesita.

En conclusión, los investigadores creen que, por lo tanto, la duración del bostezo entre especies aumenta con el tamaño y la cantidad de neuronas en el cerebro. Los mamíferos parecen bostezar más y durante más tiempo que las aves, por ejemplo.`,
    challenges: [
      {
        question: 'Según el estudio norteamericano mencionado, ¿cuál es la función del bostezo?',
        options: [
          'Refrescar el cerebro, cumpliendo una función termorreguladora',
          'Oxigenar los pulmones antes de dormir',
          'Relajar los músculos del cuello',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Por qué la temperatura del cerebro afecta nuestra atención?',
        options: [
          'Porque el frío nos da sueño',
          'Porque el cerebro funciona mejor a una temperatura ideal y, si aumenta demasiado, estamos menos alertas',
          'Porque el calor aumenta la cantidad de neuronas',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué relación encontraron los investigadores entre el bostezo y el cerebro de cada especie?',
        options: [
          'Que todas las especies bostezan durante el mismo tiempo',
          'Que solo bostezan los animales que duermen de noche',
          'Que la duración del bostezo aumenta con el tamaño y la cantidad de neuronas del cerebro',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Supernovas: ¿En qué consiste este fenómeno?',
    author: 'Redacción National Geographic — texto adaptado',
    level: 'Medio',
    year: 5,
    content: `La supernova es el mayor estallido que tiene lugar en el espacio exterior. Se trata de estrellas que, luego de vivir millones de años, disminuyen los elementos químicos que promueven su combustión (hidrógeno y helio, principalmente) hasta agotarlos.

Una vez que se transforman en enanas blancas (estrellas que agotaron todo el hidrógeno que utilizaban como combustible nuclear), su explosión puede clasificarse de distintas formas, de acuerdo a cómo ocurre este fenómeno.

La NASA identifica dos tipos de supernovas:

Supernovas de tipo uno

Este tipo de supernova se crea únicamente cuando dos estrellas comparten un mismo punto gravitacional, lo que la agencia espacial estadounidense identifica como sistema binario de estrellas. Otra condición para su origen es que una estrella del par sea enana blanca de carbono y oxígeno; y cuya compañera sea cualquier otra clase de estrella, como una gigante roja u otra enana blanca.

La enana blanca de este sistema binario se encarga de absorber toda la materia disponible de la estrella con mayor vitalidad. Las revistas de astronomía dicen que, cuando la cantidad absorbida alcanza un punto cuatro veces la masa del Sol, el exceso de materia del cuerpo comprimido ocasiona una supernova y se vaporiza por completo.

Supernovas de tipo dos

La segunda especie de supernova identificada por la NASA corresponde a las estrellas masivas. Este término corresponde "a todo astro aislado que produce una explosión debido a su colapso gravitatorio". Tal como dice la agencia espacial, estas estrellas pueden tener hasta cinco veces la masa del Sol en nuestro sistema solar.

Estos cuerpos aislados convierten el hidrógeno por fusión en su núcleo. Dicha reacción libera energía en forma de fotones y la presión que ejerce es empujada contra la interacción gravitatoria del espacio, que intenta atraer a la estrella sobre sí misma.

Novas: ¿Qué es este fenómeno?

En relación a los tipos de supernovas, existe otro fenómeno que se desarrolla dentro de las de tipo uno, con un detalle que las diferencia: mientras una supernova explota y muere; las estrellas que producen una nova sobreviven al fenómeno.

Se denomina nova a aquella enana blanca de un sistema binario de estrellas que, al extraer materia de su compañera, produce una explosión de fusión nuclear que no desencadena la destrucción de la estrella, y que, por lo tanto, puede dar lugar a otras explosiones.`,
    challenges: [
      {
        question: '¿Qué es un sistema binario de estrellas?',
        options: [
          'Dos estrellas que comparten un mismo punto gravitacional',
          'Una estrella que gira alrededor de un planeta',
          'Dos galaxias que chocan entre sí',
        ],
        correctIdx: 0,
      },
      {
        question: 'Según el texto, ¿a qué corresponden las supernovas de tipo dos?',
        options: [
          'A estrellas que nunca agotaron su hidrógeno',
          'A las estrellas masivas, astros aislados que explotan por su colapso gravitatorio',
          'A las enanas blancas que absorben materia de su compañera',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Cuál es la diferencia principal entre una supernova y una nova?',
        options: [
          'La nova ocurre solo en nuestro sistema solar',
          'La supernova no libera energía y la nova sí',
          'La supernova explota y muere, mientras que las estrellas que producen una nova sobreviven',
        ],
        correctIdx: 2,
      },
    ],
  },
];

/** Divisiones existentes por año (mismo criterio que seed-assignments.ts). */
export function divisionesDelAnio(year: number): string[] {
  const letras = year <= 3
    ? ['1ra', '2da', '3ra', '4ta', '5ta']
    : ['1ra', '2da', '3ra', '4ta'];
  return letras.map(d => `${year}° ${d}`);
}
