import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const textos = [
  {
    title: 'La Zorra y las Uvas',
    author: 'Esopo',
    level: 'Básico',
    year: 1,
    content: 'Una zorra hambrienta vio unos racimos de uvas que colgaban de una parra muy alta. Intentó alcanzarlas saltando una y otra vez, pero las uvas estaban demasiado arriba. Después de muchos intentos, la zorra se alejó diciendo: "No las quiero, esas uvas están verdes y no sirven para comer." Desde lejos, un pájaro la observaba y le dijo: "No digas que no las querés solo porque no podés alcanzarlas." La zorra bajó la cabeza y siguió su camino, sabiendo que el pájaro tenía razón. Moraleja: Es fácil despreciar lo que no podemos conseguir.',
    challenges: [
      {
        question: '¿Por qué la zorra no pudo alcanzar las uvas?',
        options: ['Porque estaban podridas', 'Porque la parra era muy alta', 'Porque tenía miedo'],
        correctIdx: 1,
      },
      {
        question: '¿Qué dijo la zorra cuando no pudo alcanzar las uvas?',
        options: ['Que las uvas estaban verdes', 'Que iba a volver mañana', 'Que necesitaba ayuda'],
        correctIdx: 0,
      },
      {
        question: '¿Cuál es la moraleja de la fábula?',
        options: ['Hay que ser más alto', 'Es fácil despreciar lo que no podemos conseguir', 'Las uvas siempre están verdes'],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'El Viento Norte y el Sol',
    author: 'Esopo',
    level: 'Básico',
    year: 1,
    content: 'El Viento Norte y el Sol discutían sobre cuál de los dos era más fuerte. Mientras hablaban, vieron a un viajero que caminaba por el sendero con un grueso abrigo. Decidieron que el más fuerte sería aquel que lograra quitarle el abrigo al viajero. El Viento Norte sopló con toda su fuerza, pero cuanto más soplaba, más se aferraba el viajero a su abrigo. Entonces fue el turno del Sol. Brilló con suavidad y calor. Poco a poco, el viajero sintió calor y se quitó el abrigo por voluntad propia. El Sol demostró que la persuasión amable es más efectiva que la fuerza bruta.',
    challenges: [
      {
        question: '¿Sobre qué discutían el Viento Norte y el Sol?',
        options: ['Sobre quién era más rápido', 'Sobre quién era más fuerte', 'Sobre quién era más viejo'],
        correctIdx: 1,
      },
      {
        question: '¿Qué pasó cuando el Viento Norte sopló con fuerza?',
        options: ['El viajero se quitó el abrigo', 'El viajero se aferró más al abrigo', 'El viajero salió corriendo'],
        correctIdx: 1,
      },
      {
        question: '¿Qué enseñanza nos deja esta fábula?',
        options: ['El sol es más caliente que el viento', 'La persuasión amable es más efectiva que la fuerza', 'Hay que usar abrigo en invierno'],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'La Liebre y la Tortuga',
    author: 'Esopo',
    level: 'Básico',
    year: 2,
    content: 'Una liebre se burlaba de una tortuga por lo lenta que era. La tortuga, cansada de las burlas, le propuso una carrera. La liebre aceptó riéndose, segura de que ganaría sin esfuerzo. El día de la carrera, la liebre salió disparada y enseguida le sacó mucha ventaja a la tortuga. Tan confiada estaba que decidió echarse a dormir una siesta debajo de un árbol. Mientras tanto, la tortuga siguió caminando sin detenerse, paso a paso, sin rendirse nunca. Cuando la liebre despertó, vio con horror que la tortuga estaba cruzando la meta. Había perdido por confiarse demasiado. Moraleja: La constancia y la perseverancia vencen a la velocidad y la soberbia.',
    challenges: [
      {
        question: '¿Por qué la liebre decidió dormir durante la carrera?',
        options: ['Porque estaba enferma', 'Porque estaba tan confiada que no creyó necesario seguir', 'Porque la tortuga le pidió que esperara'],
        correctIdx: 1,
      },
      {
        question: '¿Qué hizo la tortuga durante toda la carrera?',
        options: ['Se detuvo varias veces a descansar', 'Siguió caminando sin detenerse', 'Tomó un atajo'],
        correctIdx: 1,
      },
      {
        question: '¿Cuál es la moraleja de esta historia?',
        options: ['Los rápidos siempre ganan', 'La constancia y perseverancia vencen a la soberbia', 'Las tortugas son mejores que las liebres'],
        correctIdx: 1,
      },
      {
        question: '¿Quién propuso la carrera?',
        options: ['La liebre', 'La tortuga', 'Un juez'],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'El Zonda: viento de la montaña',
    author: 'Tradición mendocina',
    level: 'Medio',
    year: 2,
    content: 'En la provincia de Mendoza, cuando el aire se vuelve seco y caliente, la gente sabe que está llegando el Zonda. Este viento cálido baja desde la Cordillera de los Andes con fuerza y velocidad, levantando polvo y tierra a su paso. Los mendocinos conocen bien sus señales: el cielo se pone amarillento, la temperatura sube de golpe y el aire se siente pesado. En las escuelas, los maestros cierran las ventanas y les explican a los chicos que el Zonda se forma cuando las masas de aire húmedo del Pacífico chocan contra la cordillera. Al subir la montaña, el aire pierde su humedad en forma de lluvia o nieve. Cuando baja del otro lado, ya seco, se calienta rápidamente y desciende como un viento ardiente sobre los valles mendocinos. El Zonda puede durar horas o incluso días, y aunque es molesto, forma parte de la identidad de nuestra tierra.',
    challenges: [
      {
        question: '¿Desde dónde baja el viento Zonda?',
        options: ['Desde el mar', 'Desde la Cordillera de los Andes', 'Desde el desierto'],
        correctIdx: 1,
      },
      {
        question: '¿Por qué el Zonda es seco cuando llega a Mendoza?',
        options: ['Porque viene del desierto', 'Porque pierde la humedad al subir la montaña', 'Porque es un viento artificial'],
        correctIdx: 1,
      },
      {
        question: '¿Cuáles son las señales de que viene el Zonda?',
        options: ['Lluvia fuerte y truenos', 'Cielo amarillento, temperatura alta y aire pesado', 'Nieve y frío intenso'],
        correctIdx: 1,
      },
      {
        question: '¿Qué hacen los maestros en las escuelas cuando llega el Zonda?',
        options: ['Suspenden las clases', 'Cierran las ventanas y explican el fenómeno', 'Salen al patio a observarlo'],
        correctIdx: 1,
      },
      {
        question: '¿Qué significa que el Zonda "forma parte de la identidad de nuestra tierra"?',
        options: ['Que es peligroso y hay que eliminarlo', 'Que es un fenómeno natural característico de Mendoza', 'Que solo ocurre en Mendoza'],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'La historia del agua en Mendoza',
    author: 'Tradición cuyana',
    level: 'Medio',
    year: 2,
    content: 'Mendoza es una tierra de sol y poca lluvia. Desde hace siglos, sus habitantes aprendieron a cuidar cada gota de agua. Los pueblos originarios huarpes fueron los primeros en construir canales para llevar el agua de los ríos a sus cultivos. Ellos sabían que sin agua no había vida posible en el desierto. Cuando llegaron los españoles, quedaron asombrados por la inteligencia de estos sistemas de riego. Con el tiempo, Mendoza creció gracias al esfuerzo de generaciones que construyeron acequias, diques y embalses para aprovechar el agua del deshielo de los Andes. Hoy, cada vez que abrimos una canilla o vemos un viñedo verde en medio del desierto, estamos viendo el resultado de siglos de trabajo y planificación. El agua no es infinita: los glaciares se reducen y el cambio climático amenaza nuestras reservas. Por eso es responsabilidad de todos cuidar este recurso vital que hace posible la vida en nuestra provincia.',
    challenges: [
      {
        question: '¿Quiénes fueron los primeros en construir canales de riego en Mendoza?',
        options: ['Los españoles', 'Los huarpes', 'Los incas'],
        correctIdx: 1,
      },
      {
        question: '¿De dónde proviene el agua que riega los campos de Mendoza?',
        options: ['De la lluvia frecuente', 'Del deshielo de los Andes', 'Del océano Pacífico'],
        correctIdx: 1,
      },
      {
        question: '¿Por qué el texto dice que el agua "no es infinita"?',
        options: ['Porque los ríos se secan en verano', 'Porque los glaciares se reducen y el cambio climático amenaza las reservas', 'Porque la gente la desperdicia'],
        correctIdx: 1,
      },
      {
        question: '¿Qué significa la expresión "ver un viñedo verde en medio del desierto"?',
        options: ['Que Mendoza tiene mucha lluvia', 'Que es el resultado del esfuerzo humano por llevar agua', 'Que los viñedos no necesitan agua'],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'El curioso caso del pulpo',
    author: 'Ciencia para jóvenes',
    level: 'Medio',
    year: 2,
    content: 'El pulpo es uno de los animales más inteligentes del océano. Tiene ocho brazos, tres corazones y sangre de color azul. Su cerebro es tan complejo que puede resolver laberintos, abrir frascos con tapa de rosca e incluso reconocer a las personas que lo cuidan en un acuario. Pero lo que más sorprende a los científicos es su capacidad de camuflaje. En menos de un segundo, el pulpo puede cambiar el color, la textura y hasta la forma de su piel para confundirse con el fondo marino. Utiliza células especiales llamadas cromatóforos que se expanden o contraen para crear patrones de colores asombrosos. Además, cuando se siente amenazado, expulsa una nube de tinta negra para confundir al depredador y escapar rápidamente. Los científicos creen que estudiar al pulpo podría ayudarnos a desarrollar nuevos materiales que cambien de color, robots más flexibles y hasta mejores sistemas de camuflaje. Este animal, que vive apenas uno o dos años, encierra misterios que la ciencia recién está comenzando a descifrar.',
    challenges: [
      {
        question: '¿Cuántos corazones tiene un pulpo?',
        options: ['Uno', 'Dos', 'Tres'],
        correctIdx: 2,
      },
      {
        question: '¿Qué son los cromatóforos?',
        options: ['Tipos de tentáculos', 'Células que le permiten cambiar de color', 'Órganos para respirar'],
        correctIdx: 1,
      },
      {
        question: '¿Qué hace el pulpo cuando se siente amenazado?',
        options: ['Se hace el muerto', 'Expulsa una nube de tinta negra', 'Se esconde en su concha'],
        correctIdx: 1,
      },
      {
        question: '¿Por qué los científicos estudian al pulpo?',
        options: ['Para usarlo como alimento', 'Para desarrollar nuevos materiales y robots flexibles', 'Para domesticarlo como mascota'],
        correctIdx: 1,
      },
      {
        question: '¿Cuánto tiempo vive aproximadamente un pulpo?',
        options: ['Diez años', 'Uno o dos años', 'Veinte años'],
        correctIdx: 1,
      },
    ],
  },
  {
    title: 'San Martín cruza los Andes',
    author: 'Historia argentina',
    level: 'Medio',
    year: 2,
    content: 'En enero de 1817, el general José de San Martín emprendió una de las hazañas militares más extraordinarias de la historia: cruzar la Cordillera de los Andes con un ejército de más de cinco mil soldados. La travesía partió desde Mendoza, donde San Martín había entrenado y organizado al Ejército de los Andes durante dos años. Los soldados llevaban cañones, mulas cargadas con provisiones, armas y municiones. Cruzaron por pasos de montaña a más de cuatro mil metros de altura, soportando el frío extremo, la falta de oxígeno y los caminos estrechos al borde de precipicios. Muchos soldados enfermaron por el mal de altura y varios animales se desbarrancaron por los senderos empinados. A pesar de todas las dificultades, el ejército logró cruzar la cordillera y derrotó a las fuerzas realistas en la batalla de Chacabuco, liberando a Chile. Esta campaña demostró la extraordinaria capacidad de planificación de San Martín y el valor de los soldados que lo acompañaron.',
    challenges: [
      {
        question: '¿En qué año San Martín cruzó los Andes?',
        options: ['1810', '1817', '1820'],
        correctIdx: 1,
      },
      {
        question: '¿Desde qué provincia partió el Ejército de los Andes?',
        options: ['Buenos Aires', 'Córdoba', 'Mendoza'],
        correctIdx: 2,
      },
      {
        question: '¿Qué dificultades enfrentaron los soldados durante el cruce?',
        options: ['Calor extremo y sed', 'Frío, falta de oxígeno y caminos peligrosos', 'Ataques de animales salvajes'],
        correctIdx: 1,
      },
      {
        question: '¿Qué batalla ganaron después de cruzar la cordillera?',
        options: ['Batalla de Tucumán', 'Batalla de Chacabuco', 'Batalla de Maipú'],
        correctIdx: 1,
      },
      {
        question: '¿Qué cualidad destaca el texto sobre San Martín?',
        options: ['Su velocidad en combate', 'Su capacidad de planificación', 'Su fuerza física'],
        correctIdx: 1,
      },
    ],
  },
];

async function main() {
  console.log('Insertando textos de práctica (sin borrar datos existentes)...\n');

  for (const texto of textos) {
    // Verificar si el texto ya existe
    const existing = await prisma.text.findFirst({
      where: { title: texto.title },
    });

    if (existing) {
      console.log(`⏭️  "${texto.title}" ya existe, saltando...`);
      continue;
    }

    await prisma.text.create({
      data: {
        title: texto.title,
        author: texto.author,
        level: texto.level,
        year: texto.year,
        content: texto.content,
        challenges: {
          create: texto.challenges.map(c => ({
            question: c.question,
            options: JSON.stringify(c.options),
            correctIdx: c.correctIdx,
          })),
        },
      },
    });

    console.log(`✅ "${texto.title}" — ${texto.challenges.length} preguntas de comprensión`);
  }

  console.log('\n¡Listo! Textos de práctica insertados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
