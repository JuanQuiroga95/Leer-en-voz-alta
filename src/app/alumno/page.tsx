"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useRouter } from "next/navigation";

type Screen = "login" | "home" | "texto" | "retos" | "trofeo" | "stats";

export default function AlumnoPanel() {
  const [screenHistory, setScreenHistory] = useState<Screen[]>(["home"]);
  const [grabando, setGrabando] = useState(false);
  const [grabSeg, setGrabSeg] = useState(0);
  const [audioVisible, setAudioVisible] = useState(false);
  const grabTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isRecording, audioBlob, audioUrl, startRecording, stopRecording, resetRecording: resetAudio } = useAudioRecorder();
  const router = useRouter();
  
  const currentScreen = screenHistory[screenHistory.length - 1];

  const navigate = (id: Screen) => {
    setScreenHistory((prev) => [...prev, id]);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      setScreenHistory((prev) => prev.slice(0, -1));
    }
  };

  const goHome = () => setScreenHistory(["login", "home"]);
  const goTexto = () => { navigate("texto"); resetGrabacion(); };
  const goRetos = () => navigate("retos");
  const goTrofeo = () => navigate("trofeo");
  const goStats = () => navigate("stats");

  const iniciarGrabacion = () => {
    startRecording();
    setGrabando(true);
    setGrabSeg(0);
    grabTimerRef.current = setInterval(() => {
      setGrabSeg((prev) => prev + 1);
    }, 1000);
  };

  const detenerGrabacion = () => {
    stopRecording();
    setGrabando(false);
    if (grabTimerRef.current) clearInterval(grabTimerRef.current);
    setAudioVisible(true);
  };

  const toggleGrabacion = () => {
    if (!grabando) iniciarGrabacion();
    else detenerGrabacion();
  };

  const resetGrabacion = () => {
    resetAudio();
    setGrabando(false);
    if (grabTimerRef.current) clearInterval(grabTimerRef.current);
    setGrabSeg(0);
    setAudioVisible(false);
  };

  const handleEnviarRetos = async () => {
    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, `audio_${Date.now()}.webm`);
        // We will pass the audio blob as body for Vercel Blob directly or through FormData
        // Wait, Vercel Blob route expects the raw body if we use `request.body`.
        await fetch(`/api/upload?filename=audio_${Date.now()}.webm`, { 
          method: 'POST', 
          body: audioBlob 
        });
      } catch (e) {
        console.error("Failed to upload audio", e);
      }
    }
    goRetos();
  };

  const formatTime = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Retos State
  const [retosRespuestas, setRetosRespuestas] = useState<Record<string, boolean | null>>({
    reto1: null,
    reto2: null,
  });

  const responder = (reto: string, correcta: boolean) => {
    setRetosRespuestas((prev) => ({ ...prev, [reto]: correcta }));
  };

  return (
    <>
      <div className="sim-label">📱 Simulador — Leer en Voz Alta · Universo Videla</div>

      <div className="device">
        <div className="topbar">
          <button
            className="back-btn"
            onClick={goBack}
            style={{ display: screenHistory.length > 1 ? "flex" : "none" }}
          >
            ←
          </button>
          <div className="logo-text">
            📖 Leer en <span>Voz Alta</span>
          </div>
          <div className="avatar" onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }} title="Cerrar sesión">
            🚪
          </div>
        </div>

        {/* HOME */}
        <div className={`screen ${currentScreen === "home" ? "active" : ""}`} id="s-home">
          <div className="home-header">
            <div className="home-saludo">¡Bienvenida de vuelta! 👋</div>
            <div className="home-nombre">Valentina Rodríguez · 2° B</div>
            <div className="home-stats">
              <div className="stat-pill"><span className="num">7</span><span className="lbl">Textos leídos</span></div>
              <div className="stat-pill"><span className="num">3</span><span className="lbl">Trofeos</span></div>
              <div className="stat-pill"><span className="num">85%</span><span className="lbl">Retos ok</span></div>
            </div>
          </div>

          <div className="home-body">
            <div className="seccion-titulo">Mis logros</div>
            <div className="trofeos-strip">
              <div className="trofeo-chip ganado"><span className="tro-emoji">🌱</span><div className="tro-nom">Semilla Lectora</div></div>
              <div className="trofeo-chip ganado"><span className="tro-emoji">📄</span><div className="tro-nom">Primera Página</div></div>
              <div className="trofeo-chip ganado"><span className="tro-emoji">🔊</span><div className="tro-nom">Voz Clara</div></div>
              <div className="trofeo-chip bloqueado"><span className="tro-emoji">📖</span><div className="tro-nom">En Marcha</div></div>
              <div className="trofeo-chip bloqueado"><span className="tro-emoji">⭐</span><div className="tro-nom">Reto Superado</div></div>
              <div className="trofeo-chip bloqueado"><span className="tro-emoji">🏅</span><div className="tro-nom">Libro Físico</div></div>
            </div>

            <div className="seccion-titulo">Mis textos</div>

            <div className="texto-card" onClick={goTexto}>
              <div className="tc-head">
                <div className="tc-icono">🦁</div>
                <div className="tc-info">
                  <div className="tc-titulo">"El León y el Ratón"</div>
                  <div className="tc-autor">Esopo — Fábula</div>
                </div>
              </div>
              <div className="tc-tags">
                <span className="tag pendiente">Pendiente</span>
                <span className="tag retos">5 retos</span>
                <span className="tag libro">📚 Libro físico</span>
              </div>
              <div className="progreso-barra"><div className="progreso-fill" style={{ width: "0%" }}></div></div>
            </div>

            <div className="texto-card" onClick={() => alert("Texto en progreso — continuá desde donde dejaste.")}>
              <div className="tc-head">
                <div className="tc-icono">🌊</div>
                <div className="tc-info">
                  <div className="tc-titulo">"La tormenta perfecta"</div>
                  <div className="tc-autor">Texto de divulgación</div>
                </div>
              </div>
              <div className="tc-tags">
                <span className="tag iniciado">En progreso</span>
                <span className="tag retos">4 retos</span>
              </div>
              <div className="progreso-barra"><div className="progreso-fill" style={{ width: "60%" }}></div></div>
            </div>

            <div className="texto-card" onClick={() => alert("¡Texto completado! Ya obtuviste el trofeo por este texto.")}>
              <div className="tc-head">
                <div className="tc-icono">🌙</div>
                <div className="tc-info">
                  <div className="tc-titulo">"El aleph"</div>
                  <div className="tc-autor">Jorge Luis Borges — Cuento</div>
                </div>
              </div>
              <div className="tc-tags">
                <span className="tag completo">✓ Completado</span>
                <span className="tag retos">6 retos</span>
              </div>
              <div className="progreso-barra"><div className="progreso-fill" style={{ width: "100%" }}></div></div>
            </div>
          </div>

          <nav className="nav-bottom">
            <button className="nav-item active">
              <span className="nav-ico">📖</span><span className="nav-lbl">Mis textos</span>
            </button>
            <button className="nav-item" onClick={goStats}>
              <span className="nav-ico">📊</span><span className="nav-lbl">Mi progreso</span>
            </button>
            <button className="nav-item">
              <span className="nav-ico">🏆</span><span className="nav-lbl">Trofeos</span>
            </button>
          </nav>
        </div>

        {/* TEXTO */}
        <div className={`screen ${currentScreen === "texto" ? "active" : ""}`} id="s-texto">
          <div className="texto-hero">
            <div className="th-label">Fábula · Lectura 1</div>
            <div className="th-titulo">"El León y el Ratón"</div>
            <div className="th-autor">Esopo</div>
            <div className="th-chips">
              <span className="chip-white">120 palabras</span>
              <span className="chip-white">5 retos</span>
              <span className="chip-white">📚 Libro físico</span>
            </div>
          </div>

          <div className="texto-body">
            <div className="texto-contenido">
              Un día, un pequeño ratón corrió sobre el cuerpo dormido de un poderoso león y lo despertó. El león lo atrapó con su enorme garra y rugió: <em>"¡Serás mi almuerzo!"</em><br /><br />
              El ratón, temblando, suplicó: <em>"¡Por favor, perdóname! Algún día te podré ayudar."</em> El león soltó una carcajada, pero lo dejó libre.<br /><br />
              Días después, unos cazadores atraparon al león con una red. El ratón escuchó sus rugidos y corrió hasta él. Con sus pequeños dientes cortó la red y liberó al rey de la selva.<br /><br />
              <strong>Moraleja:</strong> <em>Los actos de bondad nunca se pierden, y el más pequeño puede ayudar al más grande.</em>
            </div>

            <div className="grabadora">
              <div className="grab-titulo">🎙️ Leé este texto en voz alta</div>
              <div className="grab-sub">Presioná el micrófono para comenzar a grabarte</div>
              <button
                className={`grab-btn-mic ${grabando ? "grabando" : ""}`}
                onClick={toggleGrabacion}
                disabled={audioVisible}
              >
                {grabando ? "⏹" : audioVisible ? "✓" : "🎙️"}
              </button>
              <div className={`grab-estado ${grabando ? "activo" : ""}`}>
                {grabando ? `⏺ Grabando… ${formatTime(grabSeg)}` : audioVisible ? `Grabación lista (${formatTime(grabSeg)})` : "Listo para grabar"}
              </div>

              {audioVisible && (
                <div className="audio-player visible">
                  {audioUrl ? (
                    <audio src={audioUrl} controls style={{ width: '100%', height: '36px' }} />
                  ) : (
                    <>
                      <button className="play-btn">▶</button>
                      <div className="audio-barra"><div className="audio-fill" style={{ width: "0%" }}></div></div>
                      <span className="audio-tiempo">{formatTime(grabSeg)}</span>
                    </>
                  )}
                </div>
              )}

              {audioVisible && (
                <>
                  <button className="btn-regrabar" onClick={resetGrabacion}>
                    ↺ Grabar de nuevo
                  </button>
                  <button className="btn-enviar" onClick={handleEnviarRetos}>
                    Continuar a los retos →
                  </button>
                </>
              )}
            </div>
          </div>

          <nav className="nav-bottom">
            <button className="nav-item active"><span className="nav-ico">📖</span><span className="nav-lbl">Leyendo</span></button>
            <button className="nav-item" onClick={goHome}><span className="nav-ico">🏠</span><span className="nav-lbl">Inicio</span></button>
          </nav>
        </div>

        {/* RETOS */}
        <div className={`screen ${currentScreen === "retos" ? "active" : ""}`} id="s-retos">
          <div className="retos-header">
            <h2>🎯 Retos de comprensión</h2>
            <p>"El León y el Ratón" · 5 retos</p>
          </div>
          <div className="retos-body">
            {/* Reto 1 */}
            <div className="reto-card">
              <div className="rc-num">Reto 1 de 5 · Comprensión literal</div>
              <div className="rc-pregunta">¿Por qué el león perdonó al ratón al principio?</div>
              <div className="opciones">
                <div
                  className={`opcion ${retosRespuestas.reto1 === false ? "incorrecta" : ""}`}
                  onClick={() => responder("reto1", false)}
                >
                  Porque tenía miedo del ratón
                </div>
                <div
                  className={`opcion ${retosRespuestas.reto1 === true ? "correcta" : ""}`}
                  onClick={() => responder("reto1", true)}
                >
                  Porque le causó gracia la promesa del ratón
                </div>
                <div
                  className={`opcion ${retosRespuestas.reto1 === false ? "incorrecta" : ""}`}
                  onClick={() => responder("reto1", false)}
                >
                  Porque no tenía hambre
                </div>
              </div>
              {retosRespuestas.reto1 !== null && (
                <div className={`feedback-msg ${retosRespuestas.reto1 ? "bien" : "mal"}`}>
                  {retosRespuestas.reto1 ? "¡Correcto! El león se rio." : "Incorrecto. Revisá el texto."}
                </div>
              )}
            </div>

            {/* Reto 2 */}
            <div className="reto-card">
              <div className="rc-num">Reto 2 de 5 · Inferencia</div>
              <div className="rc-pregunta">¿Qué nos enseña la moraleja sobre las relaciones entre personas?</div>
              <div className="opciones">
                <div
                  className={`opcion ${retosRespuestas.reto2 === false ? "incorrecta" : ""}`}
                  onClick={() => responder("reto2", false)}
                >
                  Que los poderosos siempre ganan
                </div>
                <div
                  className={`opcion ${retosRespuestas.reto2 === true ? "correcta" : ""}`}
                  onClick={() => responder("reto2", true)}
                >
                  Que la bondad se devuelve y nadie es demasiado pequeño
                </div>
              </div>
              {retosRespuestas.reto2 !== null && (
                <div className={`feedback-msg ${retosRespuestas.reto2 ? "bien" : "mal"}`}>
                  {retosRespuestas.reto2 ? "¡Muy bien deducido!" : "Piénsalo de nuevo."}
                </div>
              )}
            </div>

            {retosRespuestas.reto1 && retosRespuestas.reto2 && (
              <button className="btn-enviar" onClick={goTrofeo} style={{ marginTop: 20 }}>
                Ver Resultados 🎉
              </button>
            )}
          </div>

          <nav className="nav-bottom">
            <button className="nav-item active"><span className="nav-ico">🎯</span><span className="nav-lbl">Retos</span></button>
            <button className="nav-item" onClick={goHome}><span className="nav-ico">🏠</span><span className="nav-lbl">Inicio</span></button>
          </nav>
        </div>

        {/* TROFEO */}
        <div className={`screen ${currentScreen === "trofeo" ? "active" : ""}`} id="s-trofeo" style={{ display: currentScreen === "trofeo" ? "flex" : "none" }}>
          <div className="trofeo-anim">🔊</div>
          <div className="trofeo-titulo">¡Nuevo trofeo!</div>
          <div className="trofeo-subtitulo">Desbloqueaste</div>
          <div className="trofeo-nom">Voz Clara</div>
          <div className="trofeo-desc">Completaste tu primera grabación de lectura en voz alta. ¡Ese es el primer paso para leer cada vez mejor!</div>
          <div className="trofeo-puntos">
            <div className="pts-num">+50</div>
            <div className="pts-lbl">puntos lectores</div>
          </div>
          <button className="btn-continuar" onClick={goHome}>Volver al Inicio →</button>
        </div>

        {/* ESTADISTICAS */}
        <div className={`screen ${currentScreen === "stats" ? "active" : ""}`} id="s-stats">
          <div className="stats-header">
            <h2>📊 Panel de moderación</h2>
            <p>Rol: Bibliotecaria · 2° año — Todos los grupos</p>
          </div>
          <div className="stats-body">
            <div className="stat-card">
              <h3>Progreso por división — 2° año</h3>
              <div className="stat-row">
                <span className="sr-nombre">2° A</span>
                <div className="sr-barra"><div className="sr-fill" style={{ width: "78%" }}></div></div>
                <span className="sr-pct">78%</span>
              </div>
              <div className="stat-row">
                <span className="sr-nombre">2° B</span>
                <div className="sr-barra"><div className="sr-fill" style={{ width: "62%" }}></div></div>
                <span className="sr-pct">62%</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>Estudiantes — grabaciones pendientes de revisión</h3>
              <div className="alumno-row">
                <div className="alumno-ava">👧</div>
                <div><div className="alumno-nombre">Valentina Rodríguez</div><div className="alumno-nivel">2° B · "El León..."</div></div>
                <div className="alumno-trofeos">🎙️ Revisar</div>
              </div>
              <div className="alumno-row">
                <div className="alumno-ava">👦</div>
                <div><div className="alumno-nombre">Mateo Fernández</div><div className="alumno-nivel">2° A · "La tormenta..."</div></div>
                <div className="alumno-trofeos">🎙️ Revisar</div>
              </div>
            </div>
          </div>

          <nav className="nav-bottom">
            <button className="nav-item" onClick={goHome}><span className="nav-ico">🏠</span><span className="nav-lbl">Inicio</span></button>
            <button className="nav-item active"><span className="nav-ico">📊</span><span className="nav-lbl">Estadísticas</span></button>
          </nav>
        </div>
      </div>
    </>
  );
}
