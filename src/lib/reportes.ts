/**
 * reportes.ts
 * Cálculo de los reportes de lectura, separado de la ruta para poder probarlo.
 *
 * La parte delicada acá no son las cuentas sino el TONO. El reporte de un alumno
 * está pensado para que el profesor se lo mande a la familia, así que el texto
 * tiene que servir tanto para felicitar como para advertir sin lastimar a nadie.
 * De ahí que:
 *
 * - Nunca se compara al alumno con sus compañeros. Se lo compara con el objetivo
 *   de su año y consigo mismo (su propia evolución).
 * - No se usan las palabras "malo", "flojo" ni "problema". Una lectura por debajo
 *   del objetivo se describe como algo a acompañar, no como un defecto del chico.
 * - Siempre se nombra algo concreto que hizo bien, incluso en el peor caso: si no
 *   hay resultados buenos, se reconoce el haber participado.
 */

/** Objetivo de palabras por minuto por año, según el Censo de Fluidez de Mendoza. */
export const OBJETIVO_PPM: Record<number, { critico: number; avanzado: number }> = {
  1: { critico: 110, avanzado: 135 },
  2: { critico: 110, avanzado: 135 },
  3: { critico: 125, avanzado: 155 },
  4: { critico: 140, avanzado: 175 },
  5: { critico: 140, avanzado: 175 },
};

export function objetivoDelAnio(anio: number | null) {
  return OBJETIVO_PPM[anio ?? 1] ?? OBJETIVO_PPM[1];
}

export type Tendencia = 'mejorando' | 'sostenido' | 'bajando' | 'sin-datos';

export interface LecturaResumen {
  fecha: Date;
  titulo: string;
  modo: string;
  ppm: number | null;
  score: number | null;
  prosodia: number | null;
  nota: number | null;
}

export interface ReporteAlumno {
  lecturas: number;
  evaluaciones: number;
  practicas: number;
  ppmPromedio: number | null;
  ppmUltima: number | null;
  ppmMejor: number | null;
  comprensionPromedio: number | null;
  prosodiaPromedio: number | null;
  nivel: 'Crítico' | 'Medio' | 'Avanzado' | null;
  tendencia: Tendencia;
  objetivo: { critico: number; avanzado: number };
  detalle: LecturaResumen[];
}

function promedio(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

export function nivelPorPpm(ppm: number | null, anio: number | null): ReporteAlumno['nivel'] {
  if (ppm === null) return null;
  const o = objetivoDelAnio(anio);
  if (ppm < o.critico) return 'Crítico';
  if (ppm <= o.avanzado) return 'Medio';
  return 'Avanzado';
}

/**
 * Compara el promedio de las primeras lecturas contra el de las últimas.
 *
 * Hacen falta al menos 4 para decir algo: con dos o tres, un día flojo se ve
 * como una caída y eso, en un informe que leen los padres, no es honesto.
 */
export function calcularTendencia(ppmEnOrden: number[]): Tendencia {
  const xs = ppmEnOrden.filter(n => typeof n === 'number' && n > 0);
  if (xs.length < 4) return 'sin-datos';

  const mitad = Math.floor(xs.length / 2);
  const primeras = promedio(xs.slice(0, mitad))!;
  const ultimas = promedio(xs.slice(-mitad))!;
  const cambio = (ultimas - primeras) / primeras;

  if (cambio >= 0.08) return 'mejorando';
  if (cambio <= -0.08) return 'bajando';
  return 'sostenido';
}

export function armarReporteAlumno(lecturas: LecturaResumen[], anio: number | null): ReporteAlumno {
  const ordenadas = [...lecturas].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  const ppms = ordenadas.map(l => l.ppm).filter((n): n is number => typeof n === 'number' && n > 0);
  const scores = ordenadas.map(l => l.score).filter((n): n is number => typeof n === 'number');
  const prosodias = ordenadas.map(l => l.prosodia).filter((n): n is number => typeof n === 'number' && n > 0);

  const ppmPromedio = promedio(ppms);

  return {
    lecturas: ordenadas.length,
    evaluaciones: ordenadas.filter(l => l.modo === 'EVALUACION').length,
    practicas: ordenadas.filter(l => l.modo === 'PRACTICA').length,
    ppmPromedio,
    ppmUltima: ppms.length ? ppms[ppms.length - 1] : null,
    ppmMejor: ppms.length ? Math.max(...ppms) : null,
    comprensionPromedio: promedio(scores),
    prosodiaPromedio: prosodias.length
      ? Math.round((prosodias.reduce((a, b) => a + b, 0) / prosodias.length) * 10) / 10
      : null,
    nivel: nivelPorPpm(ppmPromedio, anio),
    tendencia: calcularTendencia(ppms),
    objetivo: objetivoDelAnio(anio),
    detalle: [...ordenadas].reverse(),
  };
}

/**
 * Redacta el informe para la familia.
 *
 * Devuelve el texto en párrafos y un tono, que la pantalla usa para el color del
 * encabezado. El tono NO es una calificación del chico: dice si el mensaje es
 * para celebrar, para acompañar o para pedir ayuda en casa.
 */
export type Tono = 'felicitacion' | 'aliento' | 'atencion' | 'sin-datos';

export function redactarInforme(
  nombre: string,
  r: ReporteAlumno,
  anio: number | null
): { tono: Tono; titulo: string; parrafos: string[] } {
  const primerNombre = nombre.split(/\s+/)[0];
  const curso = anio ? `${anio}° año` : 'su año';

  if (r.lecturas === 0) {
    return {
      tono: 'sin-datos',
      titulo: 'Todavía no hay lecturas registradas',
      parrafos: [
        `${primerNombre} todavía no registró lecturas en la plataforma, así que por ahora no podemos informar sobre su fluidez lectora.`,
        'Los invitamos a acompañarlo para que pueda hacer sus primeras lecturas. Alcanza con unos minutos por día: la práctica sostenida es lo que más mejora la fluidez.',
      ],
    };
  }

  const parrafos: string[] = [];
  const p = r.ppmPromedio;
  const o = r.objetivo;

  // Lo que hizo. Siempre se abre reconociendo el trabajo, no el resultado.
  parrafos.push(
    `Durante este período, ${primerNombre} realizó ${r.lecturas} ${r.lecturas === 1 ? 'lectura' : 'lecturas'} en voz alta` +
    `${r.evaluaciones > 0 ? `, de las cuales ${r.evaluaciones} ${r.evaluaciones === 1 ? 'fue una evaluación' : 'fueron evaluaciones'}` : ''}.`
  );

  let tono: Tono;
  let titulo: string;

  if (p === null) {
    tono = 'aliento';
    titulo = 'Seguimos acompañando el proceso';
    parrafos.push(
      `Sus lecturas todavía no arrojaron una medición de velocidad. Vamos a seguir trabajando para poder darles información más precisa.`
    );
  } else if (p > o.avanzado) {
    tono = 'felicitacion';
    titulo = '¡Felicitaciones!';
    parrafos.push(
      `Su velocidad de lectura es de ${p} palabras por minuto, por encima de lo esperado para ${curso}, que es de ${o.avanzado}. ` +
      `Esto muestra un manejo muy sólido de la lectura en voz alta.`
    );
    parrafos.push(
      `Los felicitamos por el acompañamiento en casa. Para seguir creciendo, sugerimos proponerle textos más extensos o de mayor complejidad, y darle espacio para leerle a la familia.`
    );
  } else if (p >= o.critico) {
    tono = 'aliento';
    titulo = 'Va por buen camino';
    parrafos.push(
      `Su velocidad de lectura es de ${p} palabras por minuto. Para ${curso} se espera un piso de ${o.critico}, así que ${primerNombre} está dentro de lo esperado y en camino a alcanzar los ${o.avanzado} que marcan el nivel avanzado.`
    );
    parrafos.push(
      `Lo que más ayuda en esta etapa es la constancia: leer en voz alta unos minutos por día, en un momento tranquilo, hace una diferencia grande a lo largo del año.`
    );
  } else {
    tono = 'atencion';
    titulo = 'Necesitamos acompañarlo entre todos';
    parrafos.push(
      `Su velocidad de lectura es de ${p} palabras por minuto, por debajo de las ${o.critico} esperadas para ${curso}. ` +
      `Queremos compartirles esto a tiempo, porque es justamente cuando más se puede hacer.`
    );
    parrafos.push(
      `Esto no habla de la capacidad de ${primerNombre}, sino de que necesita más práctica de la que está teniendo. La lectura en voz alta mejora mucho y bastante rápido cuando se sostiene un ratito por día.`
    );
    parrafos.push(
      `Les pedimos que lo acompañen leyendo juntos diez o quince minutos diarios, con textos que le resulten interesantes. Desde la escuela vamos a reforzar el trabajo y les iremos contando cómo evoluciona.`
    );
  }

  // La evolución propia importa más que el número suelto.
  if (r.tendencia === 'mejorando') {
    parrafos.push(`Queremos destacar además que su velocidad viene mejorando respecto de sus primeras lecturas. Ese progreso es el mejor indicador de que el esfuerzo está dando resultado.`);
  } else if (r.tendencia === 'bajando') {
    parrafos.push(`Notamos que sus últimas lecturas fueron algo más lentas que las primeras. Puede deberse a textos más difíciles o a menos práctica en las últimas semanas; lo vamos a seguir de cerca.`);
  }

  if (r.comprensionPromedio !== null) {
    const c = r.comprensionPromedio;
    parrafos.push(
      c >= 70
        ? `En comprensión obtuvo un promedio de ${c} sobre 100: no solo lee, también entiende lo que lee, que es lo más importante.`
        : `En comprensión obtuvo un promedio de ${c} sobre 100. Conversar sobre lo leído —preguntarle de qué se trataba, qué le pareció— es una de las formas más simples y efectivas de mejorar este aspecto.`
    );
  }

  return { tono, titulo, parrafos };
}

/** Fecha en formato argentino, para los informes. */
export function fechaCorta(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Arma un CSV. Escapa comillas y separa con punto y coma, que es lo que espera Excel en español. */
export function armarCsv(encabezados: string[], filas: (string | number | null)[][]): string {
  const celda = (v: string | number | null) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [encabezados, ...filas].map(f => f.map(celda).join(';')).join('\r\n');
}
