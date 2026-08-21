"use client";

/**
 * Informe imprimible.
 *
 * Se genera como página y no como PDF armado en el servidor a propósito: el
 * navegador ya sabe hacer "Imprimir → Guardar como PDF", en la compu y en el
 * celular, sin sumar dependencias pesadas ni tiempo de función en Vercel. El
 * profesor abre esto, imprime, y le manda el archivo a la familia.
 *
 * El CSS de impresión oculta la barra de acciones para que el papel salga limpio.
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const COLOR_TONO: Record<string, { borde: string; fondo: string; texto: string }> = {
  felicitacion: { borde: '#38a169', fondo: '#f0fff4', texto: '#276749' },
  aliento: { borde: '#3182ce', fondo: '#ebf8ff', texto: '#2c5282' },
  atencion: { borde: '#dd6b20', fondo: '#fffaf0', texto: '#9c4221' },
  'sin-datos': { borde: '#a0aec0', fondo: '#f7fafc', texto: '#4a5568' },
};

const ETIQUETA_TENDENCIA: Record<string, string> = {
  mejorando: '↑ Viene mejorando',
  sostenido: '→ Se mantiene estable',
  bajando: '↓ Bajó respecto del inicio',
  'sin-datos': 'Faltan lecturas para medir la evolución',
};

function Contenido() {
  const params = useSearchParams();
  const router = useRouter();
  const [datos, setDatos] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const tipo = params.get('tipo') || 'alumno';
  const userId = params.get('userId');
  const division = params.get('division');

  useEffect(() => {
    const qs = new URLSearchParams({ tipo });
    if (userId) qs.set('userId', userId);
    if (division) qs.set('division', division);

    fetch(`/api/profesor/reporte?${qs}`)
      .then(r => r.json())
      .then(d => (d.error ? setError(d.error) : setDatos(d)))
      .catch(() => setError('No se pudo cargar el reporte.'));
  }, [tipo, userId, division]);

  if (error) return <div style={{ padding: 40, color: '#c53030' }}>{error}</div>;
  if (!datos) return <div style={{ padding: 40, color: '#718096' }}>Preparando el informe…</div>;

  const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="hoja">
      <style>{`
        .hoja { max-width: 800px; margin: 0 auto; padding: 32px 24px 64px; font-family: system-ui, -apple-system, sans-serif; color: #2d3748; line-height: 1.6; }
        .acciones { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
        .acciones button { padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e0; background: white; font-size: 14px; }
        .acciones .principal { background: #3182ce; color: white; border-color: #3182ce; }
        .membrete { border-bottom: 2px solid #2d3748; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
        .membrete h1 { margin: 0; font-size: 20px; }
        .membrete .sub { color: #718096; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
        th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
        th { background: #f7fafc; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: #4a5568; }
        .cifras { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin: 20px 0; }
        .cifra { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .cifra .n { font-size: 24px; font-weight: 800; }
        .cifra .r { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: .4px; }
        .firma { margin-top: 48px; display: flex; gap: 60px; }
        .firma div { border-top: 1px solid #a0aec0; padding-top: 6px; font-size: 12px; color: #718096; flex: 1; }
        @media print {
          .acciones, .no-imprimir { display: none !important; }
          .hoja { padding: 0; max-width: none; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="acciones">
        <button className="principal" onClick={() => window.print()}>🖨️ Imprimir o guardar como PDF</button>
        <button onClick={() => router.push('/profesor')}>← Volver al panel</button>
      </div>

      <div className="membrete">
        <div>
          <h1>{tipo === 'alumno' ? 'Informe de Lectura' : tipo === 'curso' ? `Informe del curso ${datos.division}` : 'Informe general'}</h1>
          <div className="sub">Lectura en Movimiento · Universo Videla</div>
        </div>
        <div className="sub">Emitido el {hoy}</div>
      </div>

      {tipo === 'alumno' ? <InformeAlumno datos={datos} /> : <InformeGrupo datos={datos} tipo={tipo} />}
    </div>
  );
}

function InformeAlumno({ datos }: { datos: any }) {
  const { alumno, reporte, informe, anio } = datos;
  const c = COLOR_TONO[informe.tono] || COLOR_TONO['sin-datos'];

  return (
    <>
      <p style={{ margin: '0 0 20px' }}>
        <strong>Alumno/a:</strong> {alumno.name} &nbsp;·&nbsp;
        <strong>Curso:</strong> {alumno.division || 'sin curso'} &nbsp;·&nbsp;
        <strong>Legajo:</strong> {alumno.legajo}
      </p>

      <div style={{ border: `2px solid ${c.borde}`, background: c.fondo, borderRadius: 12, padding: '18px 20px' }}>
        <h2 style={{ margin: '0 0 10px', color: c.texto, fontSize: 18 }}>{informe.titulo}</h2>
        {informe.parrafos.map((p: string, i: number) => (
          <p key={i} style={{ margin: '0 0 10px' }}>{p}</p>
        ))}
      </div>

      <div className="cifras">
        <div className="cifra"><div className="r">Lecturas</div><div className="n">{reporte.lecturas}</div></div>
        <div className="cifra">
          <div className="r">Palabras por minuto</div>
          <div className="n">{reporte.ppmPromedio ?? '—'}</div>
          <div style={{ fontSize: 11, color: '#718096' }}>Se espera {reporte.objetivo.critico} para {anio || '—'}° año</div>
        </div>
        <div className="cifra"><div className="r">Comprensión</div><div className="n">{reporte.comprensionPromedio ?? '—'}</div></div>
        <div className="cifra"><div className="r">Nivel</div><div className="n" style={{ fontSize: 17 }}>{reporte.nivel ?? '—'}</div></div>
      </div>

      <p style={{ fontSize: 13, color: '#4a5568', margin: '0 0 20px' }}>
        <strong>Evolución:</strong> {ETIQUETA_TENDENCIA[reporte.tendencia]}
      </p>

      {reporte.detalle.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Detalle de las lecturas</h3>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Texto</th><th>Modo</th><th>PPM</th><th>Compr.</th></tr>
            </thead>
            <tbody>
              {reporte.detalle.map((l: any, i: number) => (
                <tr key={i}>
                  <td>{new Date(l.fecha).toLocaleDateString('es-AR')}</td>
                  <td>{l.titulo}</td>
                  <td>{l.modo === 'EVALUACION' ? 'Evaluación' : 'Práctica'}</td>
                  <td>{l.ppm ?? '—'}</td>
                  <td>{l.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="firma">
        <div>Firma del docente</div>
        <div>Firma del adulto responsable</div>
      </div>
    </>
  );
}

function InformeGrupo({ datos, tipo }: { datos: any; tipo: string }) {
  const { resumen, filas } = datos;
  return (
    <>
      <div className="cifras">
        <div className="cifra"><div className="r">Alumnos</div><div className="n">{resumen.alumnos}</div></div>
        <div className="cifra"><div className="r">Con lecturas</div><div className="n">{resumen.conLecturas}</div></div>
        <div className="cifra"><div className="r">Sin lecturas</div><div className="n">{resumen.sinLecturas}</div></div>
        <div className="cifra"><div className="r">PPM promedio</div><div className="n">{resumen.ppmPromedio ?? '—'}</div></div>
      </div>

      <p style={{ fontSize: 13, color: '#4a5568' }}>
        <strong>Distribución:</strong> {resumen.porNivel.Avanzado} en nivel avanzado ·{' '}
        {resumen.porNivel.Medio} en nivel medio · {resumen.porNivel['Crítico']} en nivel crítico.
        {resumen.sinLecturas > 0 && ` El promedio se calcula solo sobre los ${resumen.conLecturas} que registraron lecturas.`}
      </p>

      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            {tipo !== 'curso' && <th>Curso</th>}
            <th>Lecturas</th><th>PPM prom.</th><th>Objetivo</th><th>Compr.</th><th>Nivel</th><th>Evolución</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f: any) => (
            <tr key={f.id}>
              <td>{f.nombre}</td>
              {tipo !== 'curso' && <td>{f.division || '—'}</td>}
              <td>{f.lecturas}</td>
              <td>{f.ppmPromedio ?? '—'}</td>
              <td>{f.objetivo.critico}</td>
              <td>{f.comprensionPromedio ?? '—'}</td>
              <td>{f.nivel ?? '—'}</td>
              <td>{ETIQUETA_TENDENCIA[f.tendencia]?.replace(/^[↑↓→]\s*/, '') ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function ReportePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#718096' }}>Cargando…</div>}>
      <Contenido />
    </Suspense>
  );
}
