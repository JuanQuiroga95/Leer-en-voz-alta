"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfesorPanel() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profesor/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.students) setStudents(data.students);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(255, 255, 255, 0.8)', padding: '20px 30px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '28px', fontWeight: 800 }}>Panel de Profesor</h1>
            <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>División 2° B · Universo Videla</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ff4b4b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px rgba(255, 75, 75, 0.4)', transition: 'all 0.2s' }}>
            Cerrar Sesión
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          
          <section style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '20px' }}>Mis Alumnos</h2>
            {loading ? (
              <p style={{ color: '#718096' }}>Cargando alumnos...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {students.map(s => (
                  <div key={s.id} style={{ padding: '15px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #667eea', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>{s.name}</div>
                    <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>Legajo: {s.legajo}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#2d3748', fontSize: '20px' }}>Audios Evaluados por IA</h2>
                <button style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                  + Asignar Texto
                </button>
              </div>

              {loading ? (
                <p style={{ color: '#718096' }}>Cargando revisiones...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {students.flatMap(s => s.progress).length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#a0aec0', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
                      No hay lecturas completadas todavía.
                    </div>
                  ) : (
                    students.map(s => 
                      s.progress.map((p: any) => (
                        <div key={p.id} style={{ padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '16px', color: '#2d3748' }}>{s.name}</div>
                              <div style={{ fontSize: '14px', color: '#718096' }}>Leyó: "{p.text.title}"</div>
                            </div>
                            <div style={{ background: '#ebf4ff', color: '#3182ce', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '18px' }}>
                              Nota IA: {p.aiScore}/100
                            </div>
                          </div>
                          
                          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                            <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: '5px' }}>Feedback del Profe Robot (IA):</div>
                            <div style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.5 }}>
                              {p.aiAnalysis?.feedback || "Sin feedback"}
                            </div>
                            {p.aiAnalysis?.omittedWords?.length > 0 && (
                              <div style={{ marginTop: '10px', fontSize: '13px', color: '#e53e3e' }}>
                                <strong>Palabras omitidas:</strong> {p.aiAnalysis.omittedWords.join(', ')}
                              </div>
                            )}
                            {p.aiAnalysis?.inventedWords?.length > 0 && (
                              <div style={{ marginTop: '5px', fontSize: '13px', color: '#dd6b20' }}>
                                <strong>Palabras inventadas:</strong> {p.aiAnalysis.inventedWords.join(', ')}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                              ▶ Escuchar Audio Original
                            </button>
                            <button style={{ flex: 1, padding: '10px', background: '#38a169', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                              Confirmar Nota
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
