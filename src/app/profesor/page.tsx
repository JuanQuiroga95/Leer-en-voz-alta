"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ViewMode = "general" | "curso" | "alumno";

// ────────────────────── Helpers ──────────────────────
function getLevelBadge(ppm: number | undefined) {
  if (!ppm) return { label: "Sin datos", color: "#a0aec0", bg: "#f0f0f0" };
  if (ppm < 100) return { label: "Crítico", color: "#c53030", bg: "#fed7d7" };
  if (ppm <= 181) return { label: "Medio", color: "#b7791f", bg: "#fefcbf" };
  return { label: "Avanzado", color: "#276749", bg: "#c6f6d5" };
}

function getProsodyStars(n: number) {
  return "⭐".repeat(n) + "☆".repeat(3 - n);
}

function avgOf(arr: number[]) {
  return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

// ────────────────────── Styles ──────────────────────
const S = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", padding: "30px 20px", fontFamily: '"Inter", -apple-system, sans-serif', color: "#e2e8f0" } as React.CSSProperties,
  container: { maxWidth: 1200, margin: "0 auto" } as React.CSSProperties,
  // Header
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, padding: "20px 28px", background: "rgba(30, 41, 59, 0.8)", borderRadius: 16, border: "1px solid rgba(148, 163, 184, 0.1)", backdropFilter: "blur(12px)" } as React.CSSProperties,
  headerTitle: { margin: 0, fontSize: 24, fontWeight: 800, color: "#f1f5f9" } as React.CSSProperties,
  headerSub: { margin: "4px 0 0", fontSize: 13, color: "#94a3b8" } as React.CSSProperties,
  logoutBtn: { padding: "8px 18px", background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s" } as React.CSSProperties,
  // Tabs
  tabBar: { display: "flex", gap: 4, marginBottom: 24, background: "rgba(30, 41, 59, 0.6)", borderRadius: 12, padding: 4, border: "1px solid rgba(148, 163, 184, 0.1)" } as React.CSSProperties,
  tab: (active: boolean) => ({ flex: 1, padding: "10px 16px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s", fontFamily: "inherit", background: active ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "transparent", color: active ? "#fff" : "#94a3b8" }) as React.CSSProperties,
  // Stat cards
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 } as React.CSSProperties,
  statCard: (accent: string) => ({ background: "rgba(30, 41, 59, 0.7)", borderRadius: 16, padding: "18px 20px", border: `1px solid rgba(148, 163, 184, 0.1)`, borderLeft: `4px solid ${accent}`, backdropFilter: "blur(8px)" }) as React.CSSProperties,
  statLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginTop: 4 },
  statSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  // Cards
  card: { background: "rgba(30, 41, 59, 0.7)", borderRadius: 16, padding: "24px", border: "1px solid rgba(148, 163, 184, 0.1)", marginBottom: 16, backdropFilter: "blur(8px)" } as React.CSSProperties,
  cardTitle: { fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 16 },
  // Table
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { padding: "10px 12px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 0.5, borderBottom: "1px solid rgba(148, 163, 184, 0.15)" },
  td: { padding: "12px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)", color: "#cbd5e1" },
  // Badge
  badge: (color: string, bg: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: bg }),
  // Clickable row
  clickRow: { cursor: "pointer", transition: "background 0.15s" } as React.CSSProperties,
  // Breadcrumb
  breadcrumb: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#94a3b8" } as React.CSSProperties,
  breadLink: { cursor: "pointer", color: "#60a5fa", fontWeight: 600, textDecoration: "none" as const },
  // Progress bar mini
  progressBar: (pct: number, color: string) => ({ width: 80, height: 6, background: "rgba(148,163,184,0.15)", borderRadius: 3, overflow: "hidden" as const, display: "inline-block" }),
  progressFill: (pct: number, color: string) => ({ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }),
  // Empty state
  empty: { padding: "40px 20px", textAlign: "center" as const, color: "#64748b", border: "2px dashed rgba(148, 163, 184, 0.15)", borderRadius: 16, fontSize: 14 },
  // Student detail header
  studentHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "20px 24px", background: "rgba(30, 41, 59, 0.7)", borderRadius: 16, border: "1px solid rgba(148, 163, 184, 0.1)" } as React.CSSProperties,
  studentAvatar: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", flexShrink: 0 } as React.CSSProperties,
  // Audio card
  audioCard: { background: "rgba(15, 23, 42, 0.5)", borderRadius: 12, padding: 16, border: "1px solid rgba(148, 163, 184, 0.08)", marginBottom: 12 } as React.CSSProperties,
};

export default function ProfesorPanel() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("general");
  const [profesor, setProfesor] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [texts, setTexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchDashboard = () => {
    setLoading(true);
    fetch("/api/profesor/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.profesor) setProfesor(data.profesor);
        if (data.students) setStudents(data.students);
        if (data.divisions) setDivisions(data.divisions);
        if (data.texts) setTexts(data.texts);
        setLoading(false);
      });
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const resetProgress = async (progressId: string) => {
    if (confirm("¿Estás seguro que querés borrar este registro? El alumno tendrá que leer el texto de nuevo.")) {
      await fetch("/api/profesor/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId }),
      });
      fetchDashboard();
    }
  };

  // ── Computed data ──
  const allProgress = students.flatMap((s) => s.progress || []);
  const studentsWithProgress = students.filter((s) => s.progress?.length > 0);

  const studentsByDivision = (div: string) => students.filter((s) => s.division === div);

  const divisionStats = (div: string) => {
    const s = studentsByDivision(div);
    const prog = s.flatMap((st) => st.progress || []);
    const ppmValues = prog.map((p: any) => p.aiAnalysis?.ppm).filter(Boolean);
    const fluidezValues = prog.map((p: any) => p.aiScore || 0);
    const compValues = prog.map((p: any) => (p.score || 0) - (p.aiScore || 0));
    return {
      total: s.length,
      withProgress: s.filter((st) => st.progress?.length > 0).length,
      readings: prog.length,
      avgPpm: avgOf(ppmValues),
      avgFluidez: avgOf(fluidezValues),
      avgComprension: avgOf(compValues),
    };
  };

  const studentStats = (student: any) => {
    const prog = student.progress || [];
    const ppmValues = prog.map((p: any) => p.aiAnalysis?.ppm).filter(Boolean);
    const fluidezValues = prog.map((p: any) => p.aiScore || 0);
    const compValues = prog.map((p: any) => (p.score || 0) - (p.aiScore || 0));
    const prosodyValues = prog.map((p: any) => p.aiAnalysis?.prosody).filter(Boolean);
    return {
      readings: prog.length,
      avgPpm: avgOf(ppmValues),
      avgFluidez: avgOf(fluidezValues),
      avgComprension: avgOf(compValues),
      avgProsody: prosodyValues.length > 0 ? Math.round(avgOf(prosodyValues)) : 0,
      lastPpm: ppmValues[0] || 0,
    };
  };

  // Navigation helpers
  const goGeneral = () => { setView("general"); setSelectedDivision(null); setSelectedStudent(null); };
  const goCurso = (div: string) => { setView("curso"); setSelectedDivision(div); setSelectedStudent(null); };
  const goAlumno = (student: any) => { setView("alumno"); setSelectedStudent(student); };

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <header style={S.header}>
          <div>
            <h1 style={S.headerTitle}>📊 Panel Docente</h1>
            <p style={S.headerSub}>{profesor?.name || "Profesor"} · Universo Videla</p>
          </div>
          <button onClick={handleLogout} style={S.logoutBtn}>Cerrar Sesión</button>
        </header>

        {/* Tab Bar */}
        <div style={S.tabBar}>
          <button style={S.tab(view === "general")} onClick={goGeneral}>📋 Vista General</button>
          <button style={S.tab(view === "curso")} onClick={() => { if (divisions.length > 0) goCurso(selectedDivision || divisions[0]); }}>🏫 Por Curso</button>
          <button style={S.tab(view === "alumno")} onClick={() => {}} disabled={!selectedStudent}>👤 Por Alumno</button>
        </div>

        {loading ? (
          <div style={{ ...S.card, textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ color: "#94a3b8" }}>Cargando datos del panel...</div>
          </div>
        ) : (
          <>
            {/* ═══════════ VISTA GENERAL ═══════════ */}
            {view === "general" && (
              <>
                {/* Stats globales */}
                <div style={S.statsRow}>
                  <div style={S.statCard("#3b82f6")}>
                    <div style={S.statLabel}>Total Alumnos</div>
                    <div style={S.statValue}>{students.length}</div>
                    <div style={S.statSub}>en {divisions.length} {divisions.length === 1 ? 'curso' : 'cursos'}</div>
                  </div>
                  <div style={S.statCard("#8b5cf6")}>
                    <div style={S.statLabel}>Lecturas Completadas</div>
                    <div style={S.statValue}>{allProgress.length}</div>
                    <div style={S.statSub}>{studentsWithProgress.length} alumnos activos</div>
                  </div>
                  <div style={S.statCard("#10b981")}>
                    <div style={S.statLabel}>PPM Promedio</div>
                    <div style={S.statValue}>{avgOf(allProgress.map((p: any) => p.aiAnalysis?.ppm).filter(Boolean))}</div>
                    <div style={S.statSub}>palabras/minuto</div>
                  </div>
                  <div style={S.statCard("#f59e0b")}>
                    <div style={S.statLabel}>Fluidez Promedio</div>
                    <div style={S.statValue}>{avgOf(allProgress.map((p: any) => p.aiScore || 0))}/100</div>
                    <div style={S.statSub}>score IA</div>
                  </div>
                </div>

                {/* Tabla de cursos */}
                <div style={S.card}>
                  <div style={S.cardTitle}>Cursos</div>
                  {divisions.length === 0 ? (
                    <div style={S.empty}>No hay cursos con alumnos registrados.</div>
                  ) : (
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Curso</th>
                          <th style={S.th}>Alumnos</th>
                          <th style={S.th}>Lecturas</th>
                          <th style={S.th}>PPM Prom.</th>
                          <th style={S.th}>Fluidez</th>
                          <th style={S.th}>Comprensión</th>
                          <th style={S.th}>Nivel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {divisions.map((div) => {
                          const ds = divisionStats(div);
                          const level = getLevelBadge(ds.avgPpm || undefined);
                          return (
                            <tr key={div} style={S.clickRow} onClick={() => goCurso(div)}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              <td style={{ ...S.td, fontWeight: 700, color: "#f1f5f9" }}>📚 {div}</td>
                              <td style={S.td}>{ds.total}</td>
                              <td style={S.td}>{ds.readings}</td>
                              <td style={S.td}>{ds.avgPpm > 0 ? ds.avgPpm : "—"}</td>
                              <td style={S.td}>
                                {ds.avgFluidez > 0 ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={S.progressBar(ds.avgFluidez, "#3b82f6")}>
                                      <div style={S.progressFill(ds.avgFluidez, "#3b82f6")}></div>
                                    </div>
                                    {ds.avgFluidez}%
                                  </div>
                                ) : "—"}
                              </td>
                              <td style={S.td}>
                                {ds.avgComprension > 0 ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={S.progressBar(ds.avgComprension, "#10b981")}>
                                      <div style={S.progressFill(ds.avgComprension, "#10b981")}></div>
                                    </div>
                                    {ds.avgComprension}%
                                  </div>
                                ) : "—"}
                              </td>
                              <td style={S.td}><span style={S.badge(level.color, level.bg)}>{level.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Últimas lecturas */}
                <div style={S.card}>
                  <div style={S.cardTitle}>Últimas Lecturas</div>
                  {allProgress.length === 0 ? (
                    <div style={S.empty}>No hay lecturas completadas todavía.</div>
                  ) : (
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Alumno</th>
                          <th style={S.th}>Curso</th>
                          <th style={S.th}>Texto</th>
                          <th style={S.th}>Fluidez</th>
                          <th style={S.th}>Comprensión</th>
                          <th style={S.th}>PPM</th>
                          <th style={S.th}>Nivel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.flatMap((s) =>
                          (s.progress || []).map((p: any) => {
                            const ppm = p.aiAnalysis?.ppm;
                            const level = getLevelBadge(ppm);
                            const comp = (p.score || 0) - (p.aiScore || 0);
                            return (
                              <tr key={p.id} style={S.clickRow}
                                  onClick={() => goAlumno(s)}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                <td style={{ ...S.td, fontWeight: 600, color: "#f1f5f9" }}>{s.name}</td>
                                <td style={S.td}>{s.division || "—"}</td>
                                <td style={S.td}>{p.text?.title || "—"}</td>
                                <td style={S.td}>{p.aiScore || 0}/100</td>
                                <td style={S.td}>{comp}/100</td>
                                <td style={S.td}>{ppm || "—"}</td>
                                <td style={S.td}><span style={S.badge(level.color, level.bg)}>{level.label}</span></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ═══════════ VISTA POR CURSO ═══════════ */}
            {view === "curso" && selectedDivision && (
              <>
                {/* Breadcrumb */}
                <div style={S.breadcrumb}>
                  <span style={S.breadLink} onClick={goGeneral}>Vista General</span>
                  <span>›</span>
                  <span>{selectedDivision}</span>
                </div>

                {/* Division selector */}
                {divisions.length > 1 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    {divisions.map((div) => (
                      <button key={div} onClick={() => goCurso(div)}
                        style={{ padding: "6px 16px", borderRadius: 8, border: selectedDivision === div ? "2px solid #3b82f6" : "1px solid rgba(148,163,184,0.2)", background: selectedDivision === div ? "rgba(59,130,246,0.15)" : "rgba(30,41,59,0.5)", color: selectedDivision === div ? "#60a5fa" : "#94a3b8", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                        {div}
                      </button>
                    ))}
                  </div>
                )}

                {/* Stats del curso */}
                {(() => {
                  const ds = divisionStats(selectedDivision);
                  const level = getLevelBadge(ds.avgPpm || undefined);
                  return (
                    <div style={S.statsRow}>
                      <div style={S.statCard("#3b82f6")}>
                        <div style={S.statLabel}>Alumnos</div>
                        <div style={S.statValue}>{ds.total}</div>
                        <div style={S.statSub}>{ds.withProgress} con lecturas</div>
                      </div>
                      <div style={S.statCard("#10b981")}>
                        <div style={S.statLabel}>PPM Promedio</div>
                        <div style={S.statValue}>{ds.avgPpm > 0 ? ds.avgPpm : "—"}</div>
                        <div style={S.statSub}><span style={S.badge(level.color, level.bg)}>{level.label}</span></div>
                      </div>
                      <div style={S.statCard("#8b5cf6")}>
                        <div style={S.statLabel}>Fluidez Promedio</div>
                        <div style={S.statValue}>{ds.avgFluidez}/100</div>
                      </div>
                      <div style={S.statCard("#f59e0b")}>
                        <div style={S.statLabel}>Comprensión Prom.</div>
                        <div style={S.statValue}>{ds.avgComprension}/100</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tabla de alumnos del curso */}
                <div style={S.card}>
                  <div style={S.cardTitle}>Alumnos de {selectedDivision}</div>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Alumno</th>
                        <th style={S.th}>Legajo</th>
                        <th style={S.th}>Lecturas</th>
                        <th style={S.th}>PPM Prom.</th>
                        <th style={S.th}>Fluidez</th>
                        <th style={S.th}>Comprensión</th>
                        <th style={S.th}>Prosodia</th>
                        <th style={S.th}>Nivel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsByDivision(selectedDivision).map((s) => {
                        const ss = studentStats(s);
                        const level = getLevelBadge(ss.avgPpm || undefined);
                        return (
                          <tr key={s.id} style={S.clickRow}
                              onClick={() => goAlumno(s)}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ ...S.td, fontWeight: 700, color: "#f1f5f9" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                                  {s.name?.charAt(0)?.toUpperCase()}
                                </div>
                                {s.name}
                              </div>
                            </td>
                            <td style={S.td}>{s.legajo}</td>
                            <td style={S.td}>{ss.readings}</td>
                            <td style={S.td}>{ss.avgPpm > 0 ? ss.avgPpm : "—"}</td>
                            <td style={S.td}>
                              {ss.avgFluidez > 0 ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={S.progressBar(ss.avgFluidez, "#3b82f6")}>
                                    <div style={S.progressFill(ss.avgFluidez, "#3b82f6")}></div>
                                  </div>
                                  {ss.avgFluidez}%
                                </div>
                              ) : "—"}
                            </td>
                            <td style={S.td}>
                              {ss.avgComprension > 0 ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={S.progressBar(ss.avgComprension, "#10b981")}>
                                    <div style={S.progressFill(ss.avgComprension, "#10b981")}></div>
                                  </div>
                                  {ss.avgComprension}%
                                </div>
                              ) : "—"}
                            </td>
                            <td style={S.td}>{ss.avgProsody > 0 ? getProsodyStars(ss.avgProsody) : "—"}</td>
                            <td style={S.td}><span style={S.badge(level.color, level.bg)}>{level.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ═══════════ VISTA POR ALUMNO ═══════════ */}
            {view === "alumno" && selectedStudent && (
              <>
                {/* Breadcrumb */}
                <div style={S.breadcrumb}>
                  <span style={S.breadLink} onClick={goGeneral}>Vista General</span>
                  <span>›</span>
                  {selectedStudent.division && (
                    <>
                      <span style={S.breadLink} onClick={() => goCurso(selectedStudent.division)}>{selectedStudent.division}</span>
                      <span>›</span>
                    </>
                  )}
                  <span>{selectedStudent.name}</span>
                </div>

                {/* Student header */}
                <div style={S.studentHeader}>
                  <div style={S.studentAvatar}>
                    {selectedStudent.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>{selectedStudent.name}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                      Legajo: {selectedStudent.legajo} · {selectedStudent.division || "Sin curso"}
                    </div>
                  </div>
                </div>

                {/* Stats del alumno */}
                {(() => {
                  const ss = studentStats(selectedStudent);
                  const level = getLevelBadge(ss.avgPpm || undefined);
                  return (
                    <div style={S.statsRow}>
                      <div style={S.statCard("#3b82f6")}>
                        <div style={S.statLabel}>Lecturas</div>
                        <div style={S.statValue}>{ss.readings}</div>
                      </div>
                      <div style={S.statCard("#10b981")}>
                        <div style={S.statLabel}>PPM Promedio</div>
                        <div style={S.statValue}>{ss.avgPpm > 0 ? ss.avgPpm : "—"}</div>
                        <div style={S.statSub}><span style={S.badge(level.color, level.bg)}>{level.label}</span></div>
                      </div>
                      <div style={S.statCard("#8b5cf6")}>
                        <div style={S.statLabel}>Fluidez</div>
                        <div style={S.statValue}>{ss.avgFluidez}/100</div>
                      </div>
                      <div style={S.statCard("#f59e0b")}>
                        <div style={S.statLabel}>Comprensión</div>
                        <div style={S.statValue}>{ss.avgComprension}/100</div>
                      </div>
                      <div style={S.statCard("#ec4899")}>
                        <div style={S.statLabel}>Prosodia</div>
                        <div style={{ ...S.statValue, fontSize: 22 }}>{ss.avgProsody > 0 ? getProsodyStars(ss.avgProsody) : "—"}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Historial de lecturas */}
                <div style={S.card}>
                  <div style={S.cardTitle}>Historial de Lecturas</div>
                  {(selectedStudent.progress || []).length === 0 ? (
                    <div style={S.empty}>Este alumno no tiene lecturas completadas.</div>
                  ) : (
                    (selectedStudent.progress || []).map((p: any) => {
                      const ppm = p.aiAnalysis?.ppm;
                      const prosody = p.aiAnalysis?.prosody;
                      const level = getLevelBadge(ppm);
                      const comp = (p.score || 0) - (p.aiScore || 0);
                      return (
                        <div key={p.id} style={S.audioCard}>
                          {/* Header de la lectura */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                                📖 {p.text?.title || "Texto"}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                {new Date(p.updatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                              </div>
                            </div>
                            <span style={S.badge(level.color, level.bg)}>{level.label}</span>
                          </div>

                          {/* Métricas */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                            <div style={{ background: "rgba(59,130,246,0.1)", padding: "8px 12px", borderRadius: 10, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Fluidez</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa" }}>{p.aiScore || 0}</div>
                            </div>
                            <div style={{ background: "rgba(16,185,129,0.1)", padding: "8px 12px", borderRadius: 10, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Comprensión</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#34d399" }}>{comp}</div>
                            </div>
                            <div style={{ background: "rgba(139,92,246,0.1)", padding: "8px 12px", borderRadius: 10, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>PPM</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>{ppm || "—"}</div>
                            </div>
                            <div style={{ background: "rgba(236,72,153,0.1)", padding: "8px 12px", borderRadius: 10, textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Prosodia</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: "#f472b6", marginTop: 2 }}>{prosody ? getProsodyStars(prosody) : "—"}</div>
                            </div>
                          </div>

                          {/* Feedback IA */}
                          {p.aiAnalysis?.feedback && (
                            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: 12, borderRadius: 10, marginBottom: 12, border: "1px solid rgba(148,163,184,0.08)" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase" }}>Feedback del Profe Robot</div>
                              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{p.aiAnalysis.feedback}</div>
                            </div>
                          )}

                          {/* Errores detallados */}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                            {p.aiAnalysis?.omittedWords?.length > 0 && (
                              <div style={{ fontSize: 12, color: "#fca5a5", background: "rgba(239,68,68,0.1)", padding: "4px 10px", borderRadius: 8 }}>
                                <strong>{p.aiAnalysis.omittedWords.length}</strong> omitidas
                              </div>
                            )}
                            {p.aiAnalysis?.substitutedWords?.length > 0 && (
                              <div style={{ fontSize: 12, color: "#fbbf24", background: "rgba(245,158,11,0.1)", padding: "4px 10px", borderRadius: 8 }}>
                                <strong>{p.aiAnalysis.substitutedWords.length}</strong> sustituidas
                              </div>
                            )}
                            {p.aiAnalysis?.inventedWords?.length > 0 && (
                              <div style={{ fontSize: 12, color: "#fca5a5", background: "rgba(239,68,68,0.1)", padding: "4px 10px", borderRadius: 8 }}>
                                <strong>{p.aiAnalysis.inventedWords.length}</strong> inventadas
                              </div>
                            )}
                            {p.aiAnalysis?.selfCorrectedWords?.length > 0 && (
                              <div style={{ fontSize: 12, color: "#6ee7b7", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 8 }}>
                                <strong>{p.aiAnalysis.selfCorrectedWords.length}</strong> autocorregidas ✓
                              </div>
                            )}
                          </div>

                          {/* Audio + acciones */}
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            {p.audioUrl ? (
                              <audio src={p.audioUrl} controls style={{ flex: 1, height: 36, borderRadius: 8 }} />
                            ) : (
                              <div style={{ flex: 1, padding: 8, background: "rgba(239,68,68,0.1)", color: "#fca5a5", borderRadius: 8, fontSize: 12, textAlign: "center" }}>Audio no disponible</div>
                            )}
                            <button onClick={() => resetProgress(p.id)} style={{ padding: "8px 14px", background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", fontFamily: "inherit" }}>
                              ↻ Reiniciar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
