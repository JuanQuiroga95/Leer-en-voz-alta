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

  const [texts, setTexts] = useState<any[]>([]);
  const [activeText, setActiveText] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [scoreTotal, setScoreTotal] = useState(0);

  const { isRecording, audioBlob, audioUrl, startRecording, stopRecording, resetRecording: resetAudio } = useAudioRecorder();
  const router = useRouter();
  
  const currentScreen = screenHistory[screenHistory.length - 1];

  useEffect(() => {
    fetch('/api/alumno/texts')
      .then(res => res.json())
      .then(data => {
        if (data.texts) setTexts(data.texts);
      });
  }, []);

  const navigate = (id: Screen) => setScreenHistory((prev) => [...prev, id]);
  const goBack = () => { if (screenHistory.length > 1) setScreenHistory((prev) => prev.slice(0, -1)); };
  const goHome = () => setScreenHistory(["home"]);
  
  const goTexto = (text: any) => { 
    if (text.progress?.length > 0 && text.progress[0].status === "COMPLETADO") {
      alert("¡Ya completaste este texto!");
      return;
    }
    setActiveText(text);
    navigate("texto"); 
    resetGrabacion(); 
  };
  
  const goRetos = () => navigate("retos");
  const goTrofeo = () => navigate("trofeo");
  const goStats = () => navigate("stats");

  const iniciarGrabacion = () => {
    startRecording();
    setGrabando(true);
    setGrabSeg(0);
    grabTimerRef.current = setInterval(() => setGrabSeg((prev) => prev + 1), 1000);
  };

  const detenerGrabacion = () => {
    stopRecording();
    setGrabando(false);
    if (grabTimerRef.current) clearInterval(grabTimerRef.current);
    setAudioVisible(true);
  };

  const toggleGrabacion = () => !grabando ? iniciarGrabacion() : detenerGrabacion();
  const resetGrabacion = () => {
    resetAudio();
    setGrabando(false);
    if (grabTimerRef.current) clearInterval(grabTimerRef.current);
    setGrabSeg(0);
    setAudioVisible(false);
  };

  const handleEnviarRetos = async () => {
    if (audioBlob && activeText) {
      try {
        setAudioVisible(false);
        setGrabando(false);
        alert('Analizando tu lectura con el Profe Robot... por favor espera.');

        const formData = new FormData();
        formData.append('audio', audioBlob, `audio.webm`);
        formData.append('referenceText', activeText.content);

        const res = await fetch(`/api/ai/analyze-reading`, { method: 'POST', body: formData });
        const result = await res.json();
        
        if (!res.ok) {
          alert(`Error: ${result.error || 'No se pudo procesar el audio.'}`);
          setAudioVisible(true);
          return; // Detener flujo para no poner un cero
        }

        if (result.analysis) {
          setAiAnalysis(result.analysis);
          if (result.audioUrl) setAiAudioUrl(result.audioUrl);
          alert(`¡Análisis completado!\nFluidez: ${result.analysis.score}/100\nFeedback: ${result.analysis.feedback}`);
          goRetos();
        } else {
          alert("Error: El servidor no devolvió el análisis esperado.");
          setAudioVisible(true);
        }
      } catch (e) {
        console.error("Error al analizar el audio", e);
        alert("Hubo un error de conexión al enviar el audio. Intentá de nuevo.");
        setAudioVisible(true);
      }
    }
  };

  const formatTime = (seg: number) => `${Math.floor(seg / 60)}:${(seg % 60).toString().padStart(2, "0")}`;

  const [retosRespuestas, setRetosRespuestas] = useState<Record<string, boolean | null>>({});

  const responder = (retoId: string, correcta: boolean) => {
    setRetosRespuestas((prev) => ({ ...prev, [retoId]: correcta }));
  };

  const finalizarRetos = async () => {
    // Calcular puntaje
    const correctCount = Object.values(retosRespuestas).filter(r => r === true).length;
    const totalChallenges = activeText.challenges.length;
    const challengesScore = totalChallenges > 0 ? Math.round((correctCount / totalChallenges) * 100) : 0;
    const aiScore = aiAnalysis?.score || 0;
    const total = challengesScore + aiScore;
    setScoreTotal(total);

    await fetch('/api/alumno/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textId: activeText.id,
        aiScore,
        aiAnalysis,
        challengesScore,
        audioUrl: aiAudioUrl
      })
    });

    // Recargar textos para actualizar la lista
    fetch('/api/alumno/texts').then(res => res.json()).then(data => { if (data.texts) setTexts(data.texts); });

    goTrofeo();
  };

  const retosPendientes = activeText?.challenges || [];
  const todosRetosRespondidos = retosPendientes.length > 0 && retosPendientes.every((r: any) => retosRespuestas[r.id] !== undefined && retosRespuestas[r.id] !== null);

  const trofeosGanados = texts.filter(t => t.progress?.length > 0 && t.progress[0].status === "COMPLETADO").length;

  return (
    <>
      <div className="sim-label">📱 Simulador — Leer en Voz Alta · Universo Videla</div>

      <div className="device">
        <div className="topbar">
          <button className="back-btn" onClick={goBack} style={{ display: screenHistory.length > 1 ? "flex" : "none" }}>←</button>
          <div className="logo-text">📖 Leer en <span>Voz Alta</span></div>
          <div className="avatar" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }} title="Cerrar sesión">🚪</div>
        </div>

        {/* HOME */}
        <div className={`screen ${currentScreen === "home" ? "active" : ""}`} id="s-home">
          <div className="home-header">
            <div className="home-saludo">¡Bienvenido! 👋</div>
            <div className="home-nombre">Estudiante Demo</div>
            <div className="home-stats">
              <div className="stat-pill"><span className="num">{trofeosGanados}</span><span className="lbl">Textos leídos</span></div>
              <div className="stat-pill"><span className="num">{trofeosGanados}</span><span className="lbl">Trofeos</span></div>
              <div className="stat-pill"><span className="num">100%</span><span className="lbl">Retos ok</span></div>
            </div>
          </div>

          <div className="home-body">
            <div className="seccion-titulo">Mis logros</div>
            <div className="trofeos-strip">
              {trofeosGanados > 0 ? (
                <div className="trofeo-chip ganado"><span className="tro-emoji">🏆</span><div className="tro-nom">Primera Lectura</div></div>
              ) : (
                <div className="trofeo-chip bloqueado"><span className="tro-emoji">🏆</span><div className="tro-nom">Bloqueado</div></div>
              )}
            </div>

            <div className="seccion-titulo">Mis textos</div>

            {texts.map(t => {
              const completado = t.progress?.length > 0 && t.progress[0].status === "COMPLETADO";
              return (
                <div key={t.id} className="texto-card" onClick={() => goTexto(t)}>
                  <div className="tc-head">
                    <div className="tc-icono">{completado ? "🌙" : "🦁"}</div>
                    <div className="tc-info">
                      <div className="tc-titulo">{t.title}</div>
                      <div className="tc-autor">{t.author}</div>
                    </div>
                  </div>
                  <div className="tc-tags">
                    {completado ? (
                      <span className="tag completo">✓ Completado ({t.progress[0].score} pts)</span>
                    ) : (
                      <span className="tag pendiente">Pendiente</span>
                    )}
                    <span className="tag retos">{t.challenges.length} retos</span>
                  </div>
                  <div className="progreso-barra">
                    <div className="progreso-fill" style={{ width: completado ? "100%" : "0%" }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TEXTO */}
        <div className={`screen ${currentScreen === "texto" ? "active" : ""}`} id="s-texto">
          {activeText && (
            <>
              <div className="texto-hero">
                <div className="th-label">Lectura</div>
                <div className="th-titulo">{activeText.title}</div>
                <div className="th-autor">{activeText.author}</div>
                <div className="th-chips">
                  <span className="chip-white">{activeText.content.split(' ').length} palabras</span>
                  <span className="chip-white">{activeText.challenges.length} retos</span>
                </div>
              </div>

              <div className="texto-body">
                <div className="texto-contenido">{activeText.content}</div>

                <div className="grabadora">
                  <div className="grab-titulo">🎙️ Leé este texto en voz alta</div>
                  <button className={`grab-btn-mic ${grabando ? "grabando" : ""}`} onClick={toggleGrabacion} disabled={audioVisible}>
                    {grabando ? "⏹" : audioVisible ? "✓" : "🎙️"}
                  </button>
                  <div className={`grab-estado ${grabando ? "activo" : ""}`}>
                    {grabando ? `⏺ Grabando… ${formatTime(grabSeg)}` : audioVisible ? `Grabación lista (${formatTime(grabSeg)})` : "Listo para grabar"}
                  </div>

                  {audioVisible && (
                    <div className="audio-player visible">
                      {audioUrl && <audio src={audioUrl} controls style={{ width: '100%', height: '36px' }} />}
                    </div>
                  )}

                  {audioVisible && (
                    <>
                      <button className="btn-regrabar" onClick={resetGrabacion}>↺ Grabar de nuevo</button>
                      <button className="btn-enviar" onClick={handleEnviarRetos}>Continuar a los retos →</button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RETOS */}
        <div className={`screen ${currentScreen === "retos" ? "active" : ""}`} id="s-retos">
          {activeText && (
            <>
              <div className="retos-header">
                <h2>🎯 Retos de comprensión</h2>
                <p>{activeText.title} · {activeText.challenges.length} retos</p>
              </div>
              <div className="retos-body">
                {activeText.challenges.map((reto: any, index: number) => {
                  const opciones = JSON.parse(reto.options);
                  return (
                    <div key={reto.id} className="reto-card">
                      <div className="rc-num">Reto {index + 1} de {activeText.challenges.length}</div>
                      <div className="rc-pregunta">{reto.question}</div>
                      <div className="opciones">
                        {opciones.map((opc: string, idx: number) => {
                          const isSelectedAndCorrect = retosRespuestas[reto.id] === true && idx === reto.correctIdx;
                          const isSelectedAndWrong = retosRespuestas[reto.id] === false && idx !== reto.correctIdx;
                          return (
                            <div 
                              key={idx} 
                              className={`opcion ${isSelectedAndCorrect ? "correcta" : isSelectedAndWrong ? "incorrecta" : ""}`}
                              onClick={() => {
                                if (retosRespuestas[reto.id] === undefined || retosRespuestas[reto.id] === null) {
                                  responder(reto.id, idx === reto.correctIdx);
                                }
                              }}
                            >
                              {opc}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}

                {todosRetosRespondidos && (
                  <button className="btn-enviar" onClick={finalizarRetos} style={{ marginTop: 20 }}>
                    Finalizar y ver puntuación 🏆
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* TROFEO */}
        <div className={`screen ${currentScreen === "trofeo" ? "active" : ""}`} id="s-trofeo" style={{ display: currentScreen === "trofeo" ? "flex" : "none" }}>
          <div className="trofeo-anim">🏆</div>
          <div className="trofeo-titulo">¡Texto Completado!</div>
          <div className="trofeo-desc">Gracias a tu lectura ({aiAnalysis?.score || 0} pts) y tus respuestas, sumaste una gran puntuación.</div>
          <div className="trofeo-puntos">
            <div className="pts-num">+{scoreTotal}</div>
            <div className="pts-lbl">puntos totales</div>
          </div>
          <button className="btn-continuar" onClick={goHome}>Volver al Inicio →</button>
        </div>

      </div>
    </>
  );
}
