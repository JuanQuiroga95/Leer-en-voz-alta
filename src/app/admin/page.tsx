"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Estados del modal de edición/creación
  const [editUser, setEditUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', legajo: '', division: '', role: 'ALUMNO', password: '' });
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [seedingCenso, setSeedingCenso] = useState<string | null>(null);

  // ── Borrado de datos ──
  type TipoDato = { clave: string; nombre: string; detalle: string; destructivo: boolean };
  const [purgaOpciones, setPurgaOpciones] = useState<{ tipos: TipoDato[]; palabraConfirmacion: string; divisiones: string[]; alumnos: any[] } | null>(null);
  const [purgaAlcance, setPurgaAlcance] = useState<'global' | 'division' | 'alumno'>('alumno');
  const [purgaDivision, setPurgaDivision] = useState('');
  const [purgaUserId, setPurgaUserId] = useState('');
  const [purgaTipos, setPurgaTipos] = useState<string[]>([]);
  const [purgaModo, setPurgaModo] = useState<'TODAS' | 'EVALUACION' | 'PRACTICA'>('TODAS');
  const [purgaPreview, setPurgaPreview] = useState<any>(null);
  const [purgaConfirmacion, setPurgaConfirmacion] = useState('');
  const [purgaOcupado, setPurgaOcupado] = useState(false);

  const purgaNecesitaPalabra = purgaAlcance !== 'alumno';

  // Cualquier cambio invalida la vista previa: nunca se borra segun un conteo viejo.
  const cambiarPurga = (fn: () => void) => { fn(); setPurgaPreview(null); setPurgaConfirmacion(''); };

  const purgaCuerpo = () => ({
    alcance: purgaAlcance,
    division: purgaAlcance === 'division' ? purgaDivision : undefined,
    userId: purgaAlcance === 'alumno' ? purgaUserId : undefined,
    tipos: purgaTipos,
    modo: purgaModo,
  });

  const purgaListaParaSimular =
    purgaTipos.length > 0 &&
    (purgaAlcance === 'global' ||
      (purgaAlcance === 'division' && !!purgaDivision) ||
      (purgaAlcance === 'alumno' && !!purgaUserId));

  const handleSimularPurga = async () => {
    setPurgaOcupado(true);
    setPurgaPreview(null);
    try {
      const res = await fetch('/api/admin/purgar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...purgaCuerpo(), simular: true }),
      });
      const data = await res.json();
      if (res.ok) setPurgaPreview(data);
      else alert(data.error || 'No se pudo calcular qué se borraría');
    } catch {
      alert('Error de conexión');
    } finally {
      setPurgaOcupado(false);
    }
  };

  const handleBorrarDatos = async () => {
    const total = Object.values(purgaPreview?.resumen || {}).reduce((a: number, b: any) => a + b, 0);
    const donde = purgaAlcance === 'global' ? 'TODO EL SISTEMA'
      : purgaAlcance === 'division' ? `el curso ${purgaDivision}`
      : purgaOpciones?.alumnos.find(a => a.id === purgaUserId)?.name || 'el alumno';
    if (!confirm(`Se van a borrar ${total} registros de ${donde}.

Esto NO se puede deshacer. ¿Continuar?`)) return;

    setPurgaOcupado(true);
    try {
      const res = await fetch('/api/admin/purgar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...purgaCuerpo(), simular: false, confirmacion: purgaConfirmacion }),
      });
      const data = await res.json();
      if (res.ok) {
        const detalle = Object.entries(data.resumen)
          .filter(([, v]) => (v as number) > 0)
          .map(([k, v]) => `${v} ${k}`)
          .join(', ');
        alert(`Listo. Se borró: ${detalle || 'nada, no había datos'}.`);
        setPurgaPreview(null);
        setPurgaConfirmacion('');
        fetchData();
      } else {
        alert(data.error || 'No se pudieron borrar los datos');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setPurgaOcupado(false);
    }
  };

  const [colecciones, setColecciones] = useState<{ clave: string; nombre: string; descripcion: string; total: number; yaCargados: number }[]>([]);

  const fetchPurgaOpciones = () => {
    fetch('/api/admin/purgar')
      .then(r => r.json())
      .then(d => { if (d.tipos) setPurgaOpciones(d); })
      .catch(() => { /* el panel sigue siendo usable sin esto */ });
  };

  const fetchColecciones = () => {
    fetch('/api/admin/seed-censo')
      .then(r => r.json())
      .then(d => { if (d.colecciones) setColecciones(d.colecciones); })
      .catch(() => { /* el panel sigue siendo usable sin esto */ });
  };

  const fetchData = () => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      });
      
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    fetchColecciones();
    fetchPurgaOpciones();
  }, []);

  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'ALUMNO').length;
  const totalTeachers = users.filter(u => u.role === 'PROFESOR').length;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleEditClick = (u: any) => {
    setEditUser(u);
    setIsCreating(false);
    setFormData({ name: u.name, legajo: u.legajo, division: u.division || '', role: u.role, password: '' });
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setFormData({ name: '', legajo: '', division: '', role: 'ALUMNO', password: '' });
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('¿Estás seguro de que querés borrar este usuario? Esta acción no se puede deshacer.')) {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Error al borrar');
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (isCreating) {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          alert("Usuario creado correctamente. La contraseña por defecto es 123456.");
          setIsCreating(false);
          fetchData();
        } else alert("Error al crear");
      } else {
        const res = await fetch('/api/admin/users/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editUser.id, ...formData })
        });
        if (res.ok) {
          alert("Usuario actualizado correctamente");
          setEditUser(null);
          fetchData();
        } else alert("Error al actualizar");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,nombre,division,rol\nJuan Quiroga,2° 1ra,ALUMNO\nMaria Perez,3° 2da,ALUMNO\nCarlos Docente,,PROFESOR";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_usuarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCSV(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const usersToCreate = [];
      // skip header if present
      const startIdx = lines[0].toLowerCase().includes('nombre') ? 1 : 0;
      
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 1 && cols[0]) {
          usersToCreate.push({
            name: cols[0],
            division: cols[1] || '',
            role: cols[2] ? cols[2].toUpperCase() : 'ALUMNO'
          });
        }
      }

      if (usersToCreate.length > 0) {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: usersToCreate })
          });
          const data = await res.json();
          if (res.ok) {
            alert(`Se crearon ${data.count} usuarios correctamente con contraseña por defecto '123456'. Los legajos se generaron automáticamente.`);
            fetchData();
          } else {
            alert('Error al importar CSV');
          }
        } catch (err) {
          alert('Error de conexión');
        }
      }
      setUploadingCSV(false);
      // clear input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleSeedTextos = async (set: string, nombre: string) => {
    if (!confirm(`Se van a cargar los textos de "${nombre}" y quedarán disponibles en la pestaña Práctica de cada curso. ¿Continuar?`)) return;

    setSeedingCenso(set);
    try {
      const res = await fetch('/api/admin/seed-censo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensaje);
        fetchColecciones();
      } else {
        alert(data.error || 'Error al cargar los textos');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setSeedingCenso(null);
    }
  };

  const sTitulo: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#718096', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.4 };
  const sInput: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 10, fontSize: 14 };

  return (
    <div className="panel-page">
      <div className="panel-shell">
        <header className="panel-header">
          <div>
            <h1>Panel de Administración</h1>
            <p>Sistema Lectura en Movimiento · Universo Videla</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ff4b4b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px rgba(255, 75, 75, 0.4)', transition: 'all 0.2s' }}>
            Cerrar Sesión
          </button>
        </header>

        <div className="panel-stats">
          <div className="panel-stat">
            <div className="panel-stat-icon">👥</div>
            <div>
              <div className="panel-stat-label">Total Alumnos</div>
              <div className="panel-stat-value">{totalStudents}</div>
            </div>
          </div>
          <div className="panel-stat">
            <div className="panel-stat-icon">👨‍🏫</div>
            <div>
              <div className="panel-stat-label">Total Profesores</div>
              <div className="panel-stat-value">{totalTeachers}</div>
            </div>
          </div>
          <div className="panel-stat">
            <div className="panel-stat-icon">📊</div>
            <div>
              <div className="panel-stat-label">Promedio Global</div>
              <div className="panel-stat-value">{stats?.avgPlatformScore || 0}/100</div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="panel-charts">
            <section className="panel-card">
              <h3>Lecturas Completadas por División</h3>
              <div className="panel-chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.readingsByDivision}>
                    <XAxis dataKey="name" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="completados" fill="#667eea" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel-card">
              <h3>Promedio Histórico de Notas</h3>
              <div className="panel-chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="promedio" stroke="#38a169" strokeWidth={3} dot={{ r: 4, fill: '#38a169', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        <section className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h2>Biblioteca de Textos</h2>
              <p style={{ margin: '6px 0 0 0', color: '#718096', fontSize: '14px' }}>
                Colecciones listas para cargar. Se agregan a la pestaña Práctica del año que corresponde y no se duplican si ya estaban.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16, marginTop: 16 }}>
            {colecciones.map(c => {
              const cargando = seedingCenso === c.clave;
              const completa = c.yaCargados === c.total;
              return (
                <div key={c.clave} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2d3748' }}>{c.nombre}</div>
                    <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{c.descripcion}</div>
                  </div>
                  <div style={{ fontSize: 13, color: completa ? '#2f855a' : '#b7791f', fontWeight: 600 }}>
                    {completa ? `✓ ${c.total} textos cargados` : `${c.yaCargados} de ${c.total} cargados`}
                  </div>
                  <button
                    onClick={() => handleSeedTextos(c.clave, c.nombre)}
                    disabled={seedingCenso !== null || completa}
                    style={{ padding: '10px 16px', background: completa ? '#e2e8f0' : seedingCenso !== null ? '#a0aec0' : 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)', color: completa ? '#718096' : 'white', border: 'none', borderRadius: 10, cursor: completa ? 'default' : seedingCenso !== null ? 'wait' : 'pointer', fontWeight: 600 }}
                  >
                    {cargando ? 'Cargando…' : completa ? 'Ya está cargada' : `Cargar ${c.total} textos`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel-card" style={{ borderTop: '3px solid #e53e3e' }}>
          <div className="panel-toolbar">
            <div>
              <h2>Borrar Datos</h2>
              <p style={{ margin: '6px 0 0 0', color: '#718096', fontSize: '14px' }}>
                Para dejar todo en cero antes de arrancar de verdad. Siempre se ve primero qué se va a borrar. No se puede deshacer.
              </p>
            </div>
          </div>

          {!purgaOpciones ? (
            <div style={{ color: '#a0aec0', fontSize: 14, marginTop: 16 }}>Cargando opciones…</div>
          ) : (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Paso 1: a quién */}
              <div>
                <div style={sTitulo}>1 · ¿De quién?</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    ['alumno', 'Un alumno'],
                    ['division', 'Un curso'],
                    ['global', 'Todo el sistema'],
                  ] as const).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      onClick={() => cambiarPurga(() => setPurgaAlcance(valor))}
                      style={{
                        padding: '8px 16px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14,
                        border: purgaAlcance === valor ? '2px solid #e53e3e' : '1px solid #e2e8f0',
                        background: purgaAlcance === valor ? '#fff5f5' : 'white',
                        color: purgaAlcance === valor ? '#c53030' : '#4a5568',
                      }}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>

                {purgaAlcance === 'division' && (
                  <select value={purgaDivision} onChange={e => cambiarPurga(() => setPurgaDivision(e.target.value))} style={sInput}>
                    <option value="">Elegí un curso…</option>
                    {purgaOpciones.divisiones.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                {purgaAlcance === 'alumno' && (
                  <select value={purgaUserId} onChange={e => cambiarPurga(() => setPurgaUserId(e.target.value))} style={sInput}>
                    <option value="">Elegí un alumno…</option>
                    {purgaOpciones.alumnos.map(a => (
                      <option key={a.id} value={a.id}>{a.name} · {a.division || 'sin curso'}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Paso 2: qué */}
              <div>
                <div style={sTitulo}>2 · ¿Qué datos?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 10 }}>
                  {purgaOpciones.tipos.map(t => {
                    const elegido = purgaTipos.includes(t.clave);
                    return (
                      <label key={t.clave} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10, cursor: 'pointer',
                        border: elegido ? '2px solid #e53e3e' : '1px solid #e2e8f0',
                        background: elegido ? '#fff5f5' : 'white',
                      }}>
                        <input
                          type="checkbox"
                          checked={elegido}
                          onChange={() => cambiarPurga(() => setPurgaTipos(prev =>
                            prev.includes(t.clave) ? prev.filter(x => x !== t.clave) : [...prev, t.clave]
                          ))}
                          style={{ marginTop: 3 }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#2d3748', fontSize: 14 }}>{t.nombre}</div>
                          <div style={{ fontSize: 12, color: '#718096', marginTop: 3 }}>{t.detalle}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {purgaTipos.some(t => ['lecturas', 'audios', 'analisisIA', 'devoluciones'].includes(t)) && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 13, color: '#4a5568', fontWeight: 600 }}>Aplicar solo a:</label>
                    <select value={purgaModo} onChange={e => cambiarPurga(() => setPurgaModo(e.target.value as typeof purgaModo))} style={sInput}>
                      <option value="TODAS">Todas las lecturas</option>
                      <option value="EVALUACION">Solo las evaluaciones</option>
                      <option value="PRACTICA">Solo las prácticas</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Paso 3: ver y confirmar */}
              <div>
                <div style={sTitulo}>3 · Revisar y borrar</div>
                <button
                  onClick={handleSimularPurga}
                  disabled={!purgaListaParaSimular || purgaOcupado}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontWeight: 600, border: '1px solid #cbd5e0',
                    background: !purgaListaParaSimular || purgaOcupado ? '#edf2f7' : 'white',
                    color: !purgaListaParaSimular ? '#a0aec0' : '#2d3748',
                    cursor: !purgaListaParaSimular || purgaOcupado ? 'default' : 'pointer',
                  }}
                >
                  {purgaOcupado && !purgaPreview ? 'Calculando…' : 'Ver qué se va a borrar'}
                </button>

                {purgaPreview && (() => {
                  const filas = Object.entries(purgaPreview.resumen).filter(([, v]) => (v as number) > 0);
                  const total = Object.values(purgaPreview.resumen).reduce((a: number, b) => a + (b as number), 0);
                  const nombreDe = (k: string) => purgaOpciones.tipos.find(t => t.clave === k)?.nombre || k;
                  const faltaPalabra = purgaNecesitaPalabra && purgaConfirmacion !== purgaOpciones.palabraConfirmacion;

                  return (
                    <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: '#fff5f5', border: '1px solid #feb2b2' }}>
                      {total === 0 ? (
                        <div style={{ color: '#718096', fontSize: 14 }}>
                          {purgaPreview.mensaje || 'No hay nada para borrar con esas opciones.'}
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, color: '#c53030', marginBottom: 10 }}>
                            Se van a borrar {total} registros
                            {purgaPreview.alumnos !== null && ` de ${purgaPreview.alumnos} alumno${purgaPreview.alumnos === 1 ? '' : 's'}`}
                          </div>
                          <ul style={{ margin: '0 0 12px 0', paddingLeft: 20, color: '#4a5568', fontSize: 14 }}>
                            {filas.map(([k, v]) => <li key={k}><strong>{v as number}</strong> · {nombreDe(k)}</li>)}
                          </ul>

                          {purgaNecesitaPalabra && (
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ fontSize: 13, color: '#4a5568' }}>
                                Escribí <strong>{purgaOpciones.palabraConfirmacion}</strong> para confirmar:
                              </label>
                              <input
                                value={purgaConfirmacion}
                                onChange={e => setPurgaConfirmacion(e.target.value)}
                                placeholder={purgaOpciones.palabraConfirmacion}
                                style={{ ...sInput, borderColor: '#feb2b2' }}
                              />
                            </div>
                          )}

                          <button
                            onClick={handleBorrarDatos}
                            disabled={purgaOcupado || faltaPalabra}
                            style={{
                              padding: '12px 24px', borderRadius: 10, fontWeight: 700, border: 'none', color: 'white',
                              background: purgaOcupado || faltaPalabra ? '#fc8181' : '#e53e3e',
                              cursor: purgaOcupado || faltaPalabra ? 'default' : 'pointer',
                            }}
                          >
                            {purgaOcupado ? 'Borrando…' : `Borrar ${total} registros definitivamente`}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </section>

        <section className="panel-card panel-card-lg">
          <div className="panel-toolbar">
            <h2>Gestión de Usuarios</h2>
            <div className="panel-toolbar-actions">
              <button onClick={handleDownloadTemplate} style={{ padding: '10px 16px', background: '#edf2f7', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
                Descargar Plantilla CSV
              </button>
              <label style={{ padding: '10px 16px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'inline-block' }}>
                {uploadingCSV ? 'Subiendo...' : '📤 Subir CSV'}
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingCSV} />
              </label>
              <button onClick={handleCreateClick} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)' }}>
                + Crear Usuario
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Cargando usuarios...</div>
          ) : (
            <div className="panel-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr style={{ color: '#a0aec0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 600 }}>Usuario</th>
                    <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 600 }}>Legajo</th>
                    <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 600 }}>Rol</th>
                    <th style={{ padding: '0 20px', textAlign: 'center', fontWeight: 600 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderRadius: '12px', transition: 'transform 0.2s' }}>
                      <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px' }}>
                        <div style={{ fontWeight: 600, color: '#2d3748' }}>{u.name}</div>
                        {u.division && <div style={{ fontSize: '12px', color: '#718096' }}>División: {u.division}</div>}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#4a5568' }}>{u.legajo}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 700,
                          background: u.role === 'ADMIN' ? '#fed7d7' : u.role === 'PROFESOR' ? '#feebc8' : '#c6f6d5',
                          color: u.role === 'ADMIN' ? '#c53030' : u.role === 'PROFESOR' ? '#c05621' : '#2f855a'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                        <button onClick={() => handleEditClick(u)} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '8px', color: '#4a5568', cursor: 'pointer', fontWeight: 500, marginRight: '8px' }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeleteClick(u.id)} style={{ background: '#fed7d7', border: 'none', padding: '6px 16px', borderRadius: '8px', color: '#c53030', cursor: 'pointer', fontWeight: 500 }}>
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {(editUser || isCreating) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>{isCreating ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#718096', textTransform: 'uppercase' }}>Nombre Completo</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#718096', textTransform: 'uppercase' }}>Legajo {isCreating && '(Auto)'}</label>
                  <input value={formData.legajo} onChange={e => setFormData({...formData, legajo: e.target.value})} placeholder={isCreating ? 'Se genera solo si está vacío' : ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#718096', textTransform: 'uppercase' }}>División</label>
                  <select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }}>
                    <option value="">Sin división</option>
                    <optgroup label="1° Año">
                      <option value="1° 1ra">1° 1ra</option><option value="1° 2da">1° 2da</option><option value="1° 3ra">1° 3ra</option><option value="1° 4ta">1° 4ta</option><option value="1° 5ta">1° 5ta</option>
                    </optgroup>
                    <optgroup label="2° Año">
                      <option value="2° 1ra">2° 1ra</option><option value="2° 2da">2° 2da</option><option value="2° 3ra">2° 3ra</option><option value="2° 4ta">2° 4ta</option><option value="2° 5ta">2° 5ta</option>
                    </optgroup>
                    <optgroup label="3° Año">
                      <option value="3° 1ra">3° 1ra</option><option value="3° 2da">3° 2da</option><option value="3° 3ra">3° 3ra</option><option value="3° 4ta">3° 4ta</option><option value="3° 5ta">3° 5ta</option>
                    </optgroup>
                    <optgroup label="4° Año">
                      <option value="4° 1ra">4° 1ra</option><option value="4° 2da">4° 2da</option><option value="4° 3ra">4° 3ra</option><option value="4° 4ta">4° 4ta</option>
                    </optgroup>
                    <optgroup label="5° Año">
                      <option value="5° 1ra">5° 1ra</option><option value="5° 2da">5° 2da</option><option value="5° 3ra">5° 3ra</option><option value="5° 4ta">5° 4ta</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#718096', textTransform: 'uppercase' }}>Rol</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }}>
                  <option value="ALUMNO">Alumno</option>
                  <option value="PROFESOR">Profesor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#718096', textTransform: 'uppercase' }}>
                  {isCreating ? 'Contraseña (Opcional)' : 'Nueva Contraseña (Opcional)'}
                </label>
                <input type="password" placeholder={isCreating ? "Por defecto: 123456" : "Dejar en blanco para no cambiar"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => { setEditUser(null); setIsCreating(false); }} style={{ flex: 1, padding: '12px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>{isCreating ? 'Crear' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
