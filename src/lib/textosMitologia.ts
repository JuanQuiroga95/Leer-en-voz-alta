/**
 * textosMitologia.ts
 * Serie de mitología y leyendas del Plan Lectura y Escritura Mendoza (DGE),
 * versión Estudiante, dos textos por año de secundaria.
 *
 * Transcriptos del PDF escaneado que entregó la escuela. El año de cada texto
 * viene indicado a mano en el original.
 */

import type { TextoSeed } from './censo2023';

export const textosMitologia: TextoSeed[] = [
  {
    title: 'Mitología griega',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Básico',
    year: 1,
    content: `En tiempos remotos, casi todas las culturas crearon mitos cuando no podían explicar el mundo que los rodeaba. Los mitos son narraciones que contaban hechos cuyos protagonistas eran dioses y héroes. Se ubicaban en un tiempo indeterminado, pero siempre pasado. Trataban de explicar lo que sucedía a su alrededor; el ciclo de la vida, la creencia en un poder superior, la noción de bien y mal.

La mitología griega está compuesta por el conjunto de relatos míticos. Estas narraciones estaban ligadas a las creencias religiosas del pueblo. Se originaron en la antigua Grecia.

Algunos de sus temas centrales son el origen del hombre y el universo, la vida de los dioses y las hazañas de los héroes.

Para los griegos, los dioses eran inmortales, tenían un poder absoluto y controlaban los fenómenos naturales. Eran adorados en templos y santuarios. Los más importantes eran los olímpicos, llamados así porque vivían aislados de los hombres, en la montaña más alta del lugar, denominada Monte Olimpo. Creían que residían en un palacio de oro y mármol rodeados de nubes y niebla.

Entre los dioses olímpicos más destacados se pueden mencionar a Zeus, el dios de los cielos y la tierra; Poseidón, el dios del mar y Hades, el dios del inframundo.

Por su parte, los héroes tenían un poder limitado y debían enfrentar desafíos y peligros. A menudo eran descendientes de dioses o tenían una conexión especial con ellos. Eran admirados y recordados por sus hazañas, por su valentía, su fuerza y su sabiduría. Algunos de los más famosos son Hércules, Perseo y Aquiles.

La mitología griega ha tenido un impacto profundo en la cultura occidental. A tal punto que se ve reflejada en el arte y la literatura. En el mundo adolescente estos relatos están presentes en videojuegos como "Dioses y héroes" o libros como "Percy Jackson", que luego fueron llevados al cine. Estas historias legendarias siguen siendo fuente de inspiración para personas de todas las edades y culturas.`,
    challenges: [
      {
        question: '¿Por qué las culturas antiguas crearon mitos, según el texto?',
        options: [
          'Porque no podían explicar el mundo que los rodeaba',
          'Para entretener a los niños en los templos',
          'Para registrar la historia de sus reyes',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Por qué a los dioses más importantes se los llamaba olímpicos?',
        options: [
          'Porque competían entre ellos en juegos',
          'Porque vivían aislados de los hombres en el Monte Olimpo',
          'Porque eran los únicos inmortales',
        ],
        correctIdx: 1,
      },
      {
        question: '¿En qué se diferenciaban los héroes de los dioses?',
        options: [
          'Los héroes controlaban los fenómenos naturales',
          'Los héroes eran adorados en templos y santuarios',
          'Los héroes tenían un poder limitado y debían enfrentar desafíos y peligros',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'El efecto Pandora',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Intermedio',
    year: 1,
    content: `La curiosidad es una característica natural de las personas. Nos impulsa a descubrir cosas nuevas y aprender. Sin embargo, aunque es valiosa, también puede traer riesgos. En psicología, esto se llama "El efecto Pandora". Su nombre viene de un antiguo mito griego.

Según la leyenda, Zeus, el dios más poderoso, estaba enojado porque Prometeo había dado el fuego sagrado a los humanos. Para castigar a la humanidad, Zeus pidió a Hefesto que hiciera una mujer, a la que llamó Pandora, cuyo nombre significa "la que tiene todos los dones".

Zeus le dio a Pandora una caja misteriosa y le dijo que nunca debía abrirla. Pero Pandora sintió curiosidad y no pudo resistir la tentación. Cuando abrió la caja, de ella salieron todos los males que causarían sufrimiento en el mundo. Asustada, intentó cerrarla, pero sólo logró mantener dentro la esperanza. Por eso, el mito dice que, aunque haya problemas en el mundo, siempre queda la esperanza.

La historia de Pandora nos recuerda que la curiosidad es una fuerza poderosa. Gracias a ella, la humanidad ha avanzado, ha descubierto nuevos conocimientos y ha encontrado soluciones a grandes problemas. Los griegos fueron grandes exploradores del conocimiento. Pitágoras, con su curiosidad por los números, descubrió el famoso teorema que aún usamos en geometría. Arquímedes, observando cómo el agua desplazaba su cuerpo en el baño, formuló el principio de flotabilidad. Hipócrates, con su afán por comprender el cuerpo humano, sentó las bases de la medicina moderna. Además, los mitos griegos y las tragedias creadas por dramaturgos como Sófocles y Eurípides fueron una forma de explorar las emociones y la conducta humana.

No hay que temer a la curiosidad, sino aprender a usarla con responsabilidad. Preguntar, investigar y descubrir son caminos esenciales para el aprendizaje. Cada nueva idea nos acerca al conocimiento y nos ayuda a comprender mejor el mundo. La clave está en explorar con criterio, sin miedo a equivocarnos, pero con la capacidad de reflexionar sobre lo que descubrimos. Como Pandora, debemos atrevernos a abrir la caja del conocimiento, pero siempre con inteligencia y sensibilidad.`,
    challenges: [
      {
        question: '¿Por qué Zeus quiso castigar a la humanidad?',
        options: [
          'Porque Pandora abrió la caja misteriosa',
          'Porque Prometeo había dado el fuego sagrado a los humanos',
          'Porque los humanos no lo adoraban en los templos',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué quedó dentro de la caja cuando Pandora logró cerrarla?',
        options: ['La esperanza', 'El fuego sagrado', 'La curiosidad'],
        correctIdx: 0,
      },
      {
        question: '¿Qué descubrió Arquímedes gracias a su curiosidad, según el texto?',
        options: [
          'El teorema que aún usamos en geometría',
          'Las bases de la medicina moderna',
          'El principio de flotabilidad, observando cómo el agua desplazaba su cuerpo en el baño',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'El origen mitológico de Roma',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Básico',
    year: 2,
    content: `Roma antigua fue una ciudad ubicada en la península itálica, en el continente europeo. Según los datos históricos, fue fundada en el año setecientos cincuenta y tres antes de Cristo. Con el correr de los siglos, se transformó en un imperio que conquistó pueblos y ciudades, no solo de Europa, sino también de Asia y África.

La historia de la fundación de esta ciudad, como muchas otras, tiene un origen mitológico. Se la conoce como la leyenda de Rómulo y Remo. Toda leyenda revela una verdad en su interior, en este caso, el poderío de uno de los imperios más importantes de la historia antigua.

Según cuentan antiguos escritores, una sacerdotisa llamada Rea Silvia queda embarazada de gemelos del dios Marte. Sus hijos estaban destinados a la muerte por ser sucesores de un trono usurpado. El hombre encargado de matarlos se apiada de ellos y los abandona en una cesta en el río Tíber. Los hermanos son rescatados por una loba que los amamanta y cría como si fueran sus cachorros. Luego de un tiempo son adoptados por un pastor.

Durante muchos años, los jóvenes se mantuvieron fieles el uno al otro. Sin embargo, en su adultez surgió la rivalidad que los separaría. Mientras trazaban los límites de la ciudad que estaban a punto de fundar, Rómulo dio muerte a su hermano. Se convirtió así en el primer y mítico rey de Roma.

Mitos como este adquieren importancia, no tanto por la verdad que guardan sino por el mensaje que dejan a su pueblo. El origen divino y la figura de la loba representan el poder y la fortaleza del imperio romano, destinado por los dioses a conquistar otros pueblos. Esta civilización ha quedado en la historia como una de las más importantes de la antigüedad ya que dejó un legado cultural, político y artístico para toda la humanidad.`,
    challenges: [
      {
        question: '¿Quiénes rescataron a Rómulo y Remo del río Tíber?',
        options: [
          'Una loba que los amamantó y crió como si fueran sus cachorros',
          'La sacerdotisa Rea Silvia',
          'El dios Marte',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué ocurrió mientras trazaban los límites de la ciudad?',
        options: [
          'Los dos hermanos fundaron Roma juntos',
          'Rómulo dio muerte a su hermano y se convirtió en el primer rey',
          'Un pastor los adoptó y los llevó lejos',
        ],
        correctIdx: 1,
      },
      {
        question: 'Según el texto, ¿por qué adquieren importancia mitos como este?',
        options: [
          'Porque permiten fechar con exactitud la fundación de las ciudades',
          'Porque demuestran que los dioses existieron',
          'No tanto por la verdad que guardan, sino por el mensaje que dejan a su pueblo',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Planetas y dioses',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Intermedio',
    year: 2,
    content: `Al igual que sus antepasados griegos, la antigua civilización romana observó con asombro los puntos de luz en el cielo nocturno, los "planetas". Los romanos no veían los cuerpos celestes como simples astros, sino que les otorgaron un significado especial. Los asociaron con sus propias deidades, figuras poderosas encargadas de gobernar los diversos aspectos de su mundo. De este modo, el espacio se convirtió en una manifestación de su mitología y creencias.

En la antigüedad, los romanos asombrados por los astros y los planetas, los bautizaron con nombres de sus dioses. Mercurio, el más cercano al Sol y veloz, tomó el nombre del ágil mensajero divino. Marte, de un distintivo color rojizo, honró al dios de la guerra. Júpiter, el gigante que reina en el sistema solar, evocó la majestad del rey de los dioses en Roma. Saturno, con sus misteriosos anillos, recordó al dios de la agricultura y el tiempo. Más tarde, al descubrirse nuevos mundos, la tradición continuó: Urano, el dios del cielo, y Neptuno, el dios de los profundos mares azules, encontraron su lugar en el espacio, continuando así el vínculo entre el cosmos y la mitología romana.

La incorporación de nombres propios de la mitología romana para los planetas no fue solo una cuestión de tradición. Reflejaba la forma en que los antiguos romanos, como los griegos, comprendían el cosmos a través de sus creencias. Este legado perdura hasta hoy en la astronomía moderna, recordándonos la profunda conexión entre la cultura antigua y nuestra exploración del universo. Al aprender los nombres de los planetas, no solo nos sumergimos en la ciencia espacial, sino también en las increíbles historias de los dioses y diosas que moldearon la civilización occidental.`,
    challenges: [
      {
        question: '¿Por qué el planeta Marte lleva el nombre del dios de la guerra?',
        options: [
          'Porque es el más cercano al Sol',
          'Por su distintivo color rojizo',
          'Porque es el más grande del sistema solar',
        ],
        correctIdx: 1,
      },
      {
        question: '¿A qué dios evocó el planeta Júpiter?',
        options: [
          'Al rey de los dioses en Roma',
          'Al ágil mensajero divino',
          'Al dios de la agricultura y el tiempo',
        ],
        correctIdx: 0,
      },
      {
        question: 'Según el texto, ¿qué refleja el uso de nombres mitológicos para los planetas?',
        options: [
          'Que los romanos conocían la astronomía moderna',
          'Que los planetas fueron descubiertos todos al mismo tiempo',
          'La forma en que los antiguos comprendían el cosmos a través de sus creencias',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Kami: cuando lo sagrado habita en todo',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Intermedio',
    year: 3,
    content: `En las antiguas historias mitológicas de Japón, los Kami no eran solo dioses que vivían en un cielo lejano. Eran parte de un relato mucho más grande, donde lo sagrado se encontraba en muchas formas y en todos los aspectos de la vida.

Las magníficas montañas no eran vistas sólo como accidentes geográficos. Se consideraban Kami, con un poder tranquilo que llenaba de asombro y respeto a quienes las observaban. También los ríos eran venerados como fuentes importantes de vida.

Los árboles antiguos, con sus ramas torcidas y raíces profundas, eran considerados fuerzas sagradas. Se pensaba que eran testigos del paso del tiempo y que guardaban una sabiduría especial. Incluso las rocas con formas extrañas podían tener un espíritu divino, un Kami digno de respeto. Otro ejemplo claro de esta creencia era el viento, que parecía susurrar secretos entre los árboles del bosque. También el trueno, cuyo sonido desde el cielo era visto como la voz fuerte de los Kami.

Estos no solo se encontraban en la naturaleza. También podían ser los espíritus de los antepasados, personas que tuvieron vidas importantes o dejaron un legado especial para su comunidad. Se creía que estos espíritus cuidaban a sus familias y hogares, siendo honrados como protectores invisibles.

Las historias antiguas decían que algunos lugares y objetos especiales podían ser hogares de los Kami. Templos construidos con devoción, rituales transmitidos de generación en generación, espejos que reflejaban el alma o espadas hechas con un propósito sagrado.

En conclusión, los Kami no eran vistos como seres lejanos ni entidades distantes que habitaban un plano inalcanzable. Para los antiguos japoneses, eran fuerzas vivas, manifestaciones de lo sagrado en cada rincón del mundo natural y humano. Su presencia tendía un vínculo profundo entre la vida cotidiana y lo divino, recordando que el universo no estaba compuesto únicamente de materia, sino también de espíritu y significado.`,
    challenges: [
      {
        question: '¿Por qué los árboles antiguos eran considerados fuerzas sagradas?',
        options: [
          'Porque se pensaba que eran testigos del paso del tiempo y guardaban una sabiduría especial',
          'Porque servían para construir los templos',
          'Porque en sus ramas vivían los espíritus del trueno',
        ],
        correctIdx: 0,
      },
      {
        question: 'Además de la naturaleza, ¿qué otra cosa podían ser los Kami?',
        options: [
          'Únicamente las montañas y los ríos',
          'Los espíritus de los antepasados, honrados como protectores invisibles',
          'Los sacerdotes que cuidaban los templos',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué idea central sobre el universo transmite el cierre del texto?',
        options: [
          'Que lo sagrado habita en un plano inalcanzable',
          'Que los Kami desaparecieron con el paso del tiempo',
          'Que el universo no estaba compuesto únicamente de materia, sino también de espíritu y significado',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'La leyenda japonesa de las mil grullas',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Avanzado',
    year: 3,
    content: `La grulla es un ave que los japoneses consideran sagrada. El motivo de la grulla se encuentra representado en muchos aspectos de la cultura japonesa. Lo podemos encontrar en libros antiguos, en pinturas, en la vestimenta y en objetos ceremoniales, desde las etiquetas del sake hasta los escudos familiares o las pinturas tradicionales.

Aunque su promedio de vida real es de cuarenta años, en la cultura popular se cree que pueden vivir hasta mil años; por eso simbolizan la salud y la prosperidad. En el mundo japonés, las grullas aparecen en ambientes boscosos, generalmente junto a pinos. Estos árboles también se asocian al concepto de una larga vida. Estas aves representan la lealtad, la fidelidad y la armonía matrimonial porque permanecen unidas a una misma pareja durante toda su vida.

En la creencia japonesa son veneradas por ser criaturas míticas. Existe una antigua tradición que consiste en crear mil grullas de papel de origami. Este arte trata de plegar papel para crear figuras, sin usar tijeras ni pegamento. Se realiza a menudo como una plegaria para que alguien enfermo se recupere o como un deseo de felicidad y buena suerte. Dice la leyenda que si se logra completar las mil grullas, el deseo será concedido.

La historia más conocida asociada a esta leyenda es la de una joven que desarrolló leucemia como consecuencia de la radiación provocada por la bomba nuclear. Mientras estaba en el hospital intentó completar las mil grullas y aunque no pudo hacerlo, esta acción significó un mensaje de paz y esperanza para todo el mundo.

Plegar mil grullas de origami requiere paciencia y dedicación. Esto lo convierte en una práctica de concentración y meditación. Esta creencia popular japonesa simboliza un acto de amor de quien las obsequia y una promesa de esperanza para quien las recibe. Aun cuando el horror y la crueldad invaden al mundo, como en la Segunda Guerra Mundial, la ilusión de recibir un deseo, plegando mil grullas de papel representa un acto de fe y esperanza.`,
    challenges: [
      {
        question: '¿Por qué las grullas representan la lealtad y la armonía matrimonial?',
        options: [
          'Porque viven en ambientes boscosos junto a pinos',
          'Porque pueden vivir hasta mil años',
          'Porque permanecen unidas a una misma pareja durante toda su vida',
        ],
        correctIdx: 2,
      },
      {
        question: '¿En qué consiste el arte del origami según el texto?',
        options: [
          'En plegar papel para crear figuras, sin usar tijeras ni pegamento',
          'En pintar grullas sobre las etiquetas del sake',
          'En bordar escudos familiares con figuras de aves',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué significó la historia de la joven del hospital?',
        options: [
          'Que la leyenda de las mil grullas era falsa',
          'Un mensaje de paz y esperanza para todo el mundo, aunque no pudo completarlas',
          'Que el origami servía como tratamiento médico',
        ],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'Mitología latinoamericana',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Intermedio',
    year: 4,
    content: `La mitología latinoamericana está compuesta por una serie de relatos relacionados con el origen del mundo y del hombre. En ellos se destaca la importancia del entorno natural y su relación determinante con los seres humanos.

Estos mitos poseen marcadas semejanzas entre sí. Por ejemplo, los dioses de la naturaleza que los incas adoraban eran muy parecidos a los antiguos chamanes de la zona amazónica. Otro caso es el lugar de privilegio que se le otorgaba al dios sol. Para los incas era Inti y los mapuches lo llamaban Antu.

En un comienzo, los colonizadores europeos prestaron poco interés a las creencias de los pueblos originarios de América. Recién a finales del siglo veinte se comenzaron a rescatar algunos datos. La tradición oral de los pueblos ayudó a la conservación de sus tradiciones y costumbres.

Uno de los pocos escritos conservados es el Popol Vuh, texto que recopila historias antiguas y sagradas para el pueblo maya quiché. En la actualidad es un recurso muy importante para conocer las bases de esa civilización.

En la primera parte se narra el mito de la creación. El dios de los cielos y el de los mares se reunieron para discutir acerca del surgimiento de la tierra. A través del poder de la palabra crearon montañas, valles y ríos. También les dieron existencia a los animales, que por no poder hablar no podían alabar a los dioses. Entonces, por último, crearon al hombre. Primero lo hicieron de barro, luego de madera y el definitivo fue el hombre de maíz. Los dioses trituraron el maíz y formaron una masa blanca. Con ella, modelaron la figura humana y le otorgaron un espíritu.

La mitología latinoamericana estuvo en estrecha relación con la naturaleza. A través de ella intentaron darle explicación al mundo y a los fenómenos naturales. Para los mayas, por ejemplo, el maíz era la base de su alimentación y de su economía. No es extraño que, en sus mitos de la creación, los primeros hombres fueran formados a partir de este alimento.

Estas historias son una expresión de la visión del mundo y del espíritu de los pueblos originarios. Su valioso aporte llega hasta nuestros días y reflejan lo más profundo del ser latinoamericano.`,
    challenges: [
      {
        question: '¿Cómo llamaban al dios sol los incas y los mapuches?',
        options: [
          'Inti los incas y Antu los mapuches',
          'Antu los incas y Inti los mapuches',
          'Popol los incas y Vuh los mapuches',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué es el Popol Vuh?',
        options: [
          'El dios de los cielos del pueblo maya',
          'Un texto que recopila historias antiguas y sagradas del pueblo maya quiché',
          'La ceremonia con la que se adoraba al maíz',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Por qué no resulta extraño que el hombre definitivo fuera creado de maíz?',
        options: [
          'Porque el maíz era el único alimento que conocían',
          'Porque los dioses no sabían trabajar el barro',
          'Porque el maíz era la base de la alimentación y la economía de los mayas',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'El fuego en la mitología latinoamericana',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Avanzado',
    year: 4,
    content: `Desde tiempos antiguos, el fuego ha sido fundamental para el desarrollo de las civilizaciones. En Latinoamérica, muchas culturas indígenas narraron historias sobre su origen, resaltando no solo su utilidad, sino también su profundo significado.

En las antiguas tierras colombianas, se cuenta que los humanos desconocían cómo dominar el fuego y, por ello, no podían cocinar sus alimentos. Solo Cuwai, un personaje misterioso, guardaba el secreto de las llamas y se negaba a compartirlo. Sin embargo, un loro astuto logró robar una brasa y se la entregó a las personas, cambiando sus vidas para siempre.

Por otro lado, los guaraníes narran que el fuego pertenecía originalmente a los buitres, quienes eran los únicos que podían hacer uso de este recurso. Entonces, el dios creador ideó un plan con ayuda de un sapo para entregar este bien tan preciado para los humanos. Fingió su muerte, atrayendo a los buitres, que encendieron una gran hoguera. Aprovechando el momento, el dios dispersó las brasas y el sapo llevó una de ellas a las personas. Gracias a esta acción, los humanos aprendieron a iniciar el fuego frotando madera. Como castigo por su egoísmo, el dios transformó a los buitres en aves carroñeras.

Para las culturas indígenas latinoamericanas, el fuego no solo es un medio para cocinar. También es un símbolo de sabiduría ancestral y unión comunitaria. Representa sanación, purificación y la conexión entre las personas.

En definitiva, los relatos sobre el origen del fuego en Latinoamérica muestran que este elemento no solo facilitó la vida cotidiana, sino que también se convirtió en un símbolo de conocimiento y unidad. Más allá de su función práctica, el fuego representa protección, transformación y vínculo con lo sagrado. A través de estas historias, las antiguas culturas transmitieron su importancia y significado. Hoy en día, su legado sigue vigente, recordándonos que el fuego no solo ilumina el mundo, sino también la historia y la identidad de quienes lo han utilizado.`,
    challenges: [
      {
        question: 'En el relato de las tierras colombianas, ¿quién guardaba el secreto de las llamas?',
        options: ['Un loro astuto', 'Cuwai, un personaje misterioso', 'El dios creador'],
        correctIdx: 1,
      },
      {
        question: '¿Cómo consiguió el dios creador guaraní quitarles el fuego a los buitres?',
        options: [
          'Fingió su muerte para atraerlos y, cuando encendieron una hoguera, dispersó las brasas',
          'Los transformó en aves carroñeras y les quitó las llamas',
          'Les enseñó a frotar madera para que ya no necesitaran el fuego',
        ],
        correctIdx: 0,
      },
      {
        question: 'Más allá de servir para cocinar, ¿qué representa el fuego para estas culturas?',
        options: [
          'Un recurso escaso que solo usaban los jefes',
          'Un castigo enviado por los dioses',
          'Sabiduría ancestral, unión comunitaria, sanación y purificación',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'La leyenda como patrimonio cultural',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Intermedio',
    year: 5,
    content: `Las leyendas y relatos populares argentinos son narraciones que han sido transmitidas oralmente. Reflejan la diversidad cultural del país. Estas historias combinan elementos de la realidad con lo fantástico. Tienen su origen en creencias autóctonas, influenciadas por la colonización española y, más tarde, por las corrientes migratorias que llegaron a Argentina.

El valor social de estas narraciones populares es significativo. Contribuyen a formar la identidad cultural de todos los pueblos. Además, fortalecen el sentido de pertenencia y la conexión con la historia local.

Las leyendas, en particular, están ancladas a lo regional; por esto es que cada zona tiene sus propias historias. Poseen una base histórica porque se originan a partir de eventos, personas o lugares reales, representativos para la comunidad. Se han ido transformando con el paso del tiempo, a través de la tradición oral y la imaginación popular. Intentan explicar el origen de elementos naturales, justificar costumbres o transmitir valores. Algunos de sus personajes son seres humanos enfrentados al poder de la naturaleza, al destino, o a hechos fantásticos, entre otros. Un motivo común es el de las transformaciones, que pueden ser la manifestación de premios o castigos.

Una historia popular argentina es la relacionada con el ceibo. Su flor es reconocida como la flor nacional. La narración explica el origen de este árbol, autóctono de Sudamérica. Anahí es la protagonista de esta historia, una joven que, al vengar la muerte de su familia, fue quemada en una hoguera. Mientras esto ocurría, su cuerpo se fue transformando en este árbol tan conocido. Así nació la leyenda de la flor del ceibo.

Estas narraciones son una parte integral de la identidad cultural y social de un pueblo. A través de ellas, podemos comprender la memoria colectiva, la tradición y el folclore de un país. Al mismo tiempo, el origen histórico de estos relatos nos permite interpretar el contexto en el que se desarrollaron. También entender la forma en que se han ido transformando a lo largo del tiempo. En este sentido, las leyendas argentinas son un valioso patrimonio cultural que debemos preservar y transmitir a las futuras generaciones, para que sigan siendo una fuente de inspiración, identidad y orgullo nacional.`,
    challenges: [
      {
        question: '¿Por qué se dice que las leyendas tienen una base histórica?',
        options: [
          'Porque se originan a partir de eventos, personas o lugares reales de la comunidad',
          'Porque fueron escritas por historiadores',
          'Porque siempre ocurren en un tiempo indeterminado',
        ],
        correctIdx: 0,
      },
      {
        question: '¿Qué le ocurrió a Anahí según la leyenda del ceibo?',
        options: [
          'Plantó el primer ceibo de Sudamérica',
          'Al vengar la muerte de su familia fue quemada, y su cuerpo se transformó en el árbol',
          'Fue transformada en flor por castigo de los dioses',
        ],
        correctIdx: 1,
      },
      {
        question: 'Según el texto, ¿cuál es el motivo común en las leyendas?',
        options: [
          'La aparición de animales que hablan',
          'El viaje de los héroes a tierras lejanas',
          'Las transformaciones, que pueden ser manifestación de premios o castigos',
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    title: 'Tesoros ocultos: un viaje a la mitología regional argentina',
    author: 'Plan Lectura y Escritura Mendoza — DGE',
    level: 'Avanzado',
    year: 5,
    content: `Argentina, un vasto territorio de paisajes imponentes y culturas diversas, alberga un rico tapiz de mitos y leyendas que han sido transmitidos de generación en generación. Estas narrativas, profundamente arraigadas en las creencias de sus pueblos originarios y enriquecidas por la influencia de los colonizadores, nos ofrecen una ventana fascinante a la cosmovisión, los valores y los temores de las distintas regiones del país.

Desde el imponente noroeste, donde las montañas parecen susurrar historias de la Pachamama, la Madre Tierra dadora de vida, y del temible Coquena, protector de los animales y los pastores, hasta la misteriosa Patagonia, hogar de seres míticos como el Nahuelito, una criatura lacustre que evoca la magia de los grandes lagos, cada región argentina posee un folklore único y vibrante.

En la fértil Mesopotamia, las leyendas del Pombero, un duende escurridizo y a veces travieso, se entrelazan con las creencias sobre el Yasy Yateré, un joven de gran belleza y poderes mágicos que protege la selva y sus habitantes. La región cuyana, con sus áridos paisajes, nos habla de la Salamanca, un espacio iniciático donde se aprenden artes mágicas bajo la tutela de entidades sobrenaturales.

La llanura pampeana, cuna del gaucho, también tiene sus propios mitos, como el del Lobizón, un hombre que se transforma en lobo en las noches de luna llena, y la figura enigmática de la Luz Mala, un espectro luminoso que vaga por los campos. Incluso la cosmopolita Buenos Aires tiene sus leyendas urbanas, reflejo de su compleja historia y su crisol de culturas.

La mitología regional argentina explora no solo los relatos fascinantes, sino también comprender la profunda conexión que existe entre las comunidades y su entorno natural, así como las complejas relaciones sociales y espirituales que han moldeado la identidad de cada región. Estas historias, lejos de ser meras supersticiones, son un legado cultural invaluable que merece ser conocido y valorado.`,
    challenges: [
      {
        question: '¿Quién es Coquena según el texto?',
        options: [
          'Una criatura lacustre de la Patagonia',
          'El protector de los animales y los pastores en el noroeste',
          'Un duende escurridizo de la Mesopotamia',
        ],
        correctIdx: 1,
      },
      {
        question: '¿Qué es la Salamanca en la región cuyana?',
        options: [
          'Un espacio iniciático donde se aprenden artes mágicas',
          'Un espectro luminoso que vaga por los campos',
          'Una montaña sagrada dedicada a la Pachamama',
        ],
        correctIdx: 0,
      },
      {
        question: 'Según el cierre, ¿qué son estas historias más allá de simples supersticiones?',
        options: [
          'Relatos inventados por los colonizadores',
          'Cuentos exclusivos de la llanura pampeana',
          'Un legado cultural invaluable que merece ser conocido y valorado',
        ],
        correctIdx: 2,
      },
    ],
  },
];
