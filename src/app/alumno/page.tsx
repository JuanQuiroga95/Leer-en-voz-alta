"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { tokenizeText, matchWords, calculatePPM, getPerformanceLevel, getComprehensionLevel } from "@/lib/textMatcher";
import type { WordMatch } from "@/lib/textMatcher";
import { useRouter } from "next/navigation";

type Screen = "login" | "home" | "texto" | "retos" | "trofeo" | "stats";

const TIMER_PER_QUESTION = 30; // segundos por pregunta

export default function AlumnoPanel() {
  const [screenHistory, setScreenHistory] = useState<Screen[]>(["home"]);
  const [grabando, setGrabando] = useState(false);
  const [grabSeg, setGrabSeg] = useState(0);
  const [audioVisible, setAudioVisible] = useState(false);
  const grabTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tabs de modos
  const [activeTab, setActiveTab] = useState<"EVALUACION" | "PRACTICA">("EVALUACION");
  const [textsEvaluacion, setTextsEvaluacion] = useState<any[]>([]);
  const [textsPractica, setTextsPractica] = useState<any[]>([]);
  const [alumnoDetails, setAlumnoDetails] = useState<any>(null);

  const [activeText, setActiveText] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real-time word tracking
  const [wordMatches, setWordMatches] = useState<WordMatch[]>([]);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Comprehension timer
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(TIMER_PER_QUESTION);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isRecording, audioBlob, audioUrl, startRecording, stopRecording, resetRecording: resetAudio } = useAudioRecorder();
  const { isListening, isSupported: speechSupported, allWords, startListening, stopListening, resetRecognition } = useSpeechRecognition();
  const router = useRouter();
  
  const currentScreen = screenHistory[screenHistory.length - 1];

  const handleChangePassword = async () => {
    const newPass = prompt('Ingresá tu nueva contraseña (mínimo 4 caracteres):');
    if (newPass && newPass.trim().length >= 4) {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: newPass.trim() })
        });
        if (res.ok) alert('Contraseña cambiada exitosamente.');
        else alert('Error al cambiar contraseña.');
      } catch (e) {
        alert('Error de red.');
      }
    } else if (newPass !== null) {
      alert('Contraseña inválida. Debe tener al menos 4 caracteres.');
    }
  };

  const fetchTexts = () => {
    fetch('/api/alumno/texts')
      .then(res => res.json())
      .then(data => {
        if (data.evaluacion) setTextsEvaluacion(data.evaluacion);
        if (data.practica) setTextsPractica(data.practica);
        if (data.alumno) setAlumnoDetails(data.alumno);
      });
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  // ----- Real-time word matching -----
  useEffect(() => {
    if (!activeText || !grabando) return;
    const referenceWords = tokenizeText(activeText.content);
    const currentIdx = allWords.length;
    const matches = matchWords(referenceWords, allWords, currentIdx);
    setWordMatches(matches);

    // Auto-scroll to current word
    if (textContainerRef.current) {
      const activeWord = textContainerRef.current.querySelector('.word-pending');
      if (activeWord) {
        activeWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [allWords, activeText, grabando]);

  const goBack = () => {
    setScreenHistory(prev => {
      const next = [...prev];
      next.pop();
      return next;
    });
  };

  const navigateTo = (screen: Screen) => {
    setScreenHistory(prev => [...prev, screen]);
  };

  const goTexto = (t: any) => {
    setActiveText(t);
    setWordMatches([]);
    resetRecognition();
    navigateTo("texto");
  };

  const handleEnviarRetos = async () => {
    if (grabando) return;
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      if (audioBlob) {
        formData.append('audio', audioBlob, 'lectura.webm');
      }
      formData.append('textId', activeText.id);
      formData.append('referenceText', activeText.content);
      formData.append('readingTimeSeconds', grabSeg.toString());

      // Extract year from division (e.g. "3° 2da" -> 3), default 1
      let year = 1;
      if (alumnoDetails?.division) {
        const match = alumnoDetails.division.match(/^(\d+)°/);
        if (match) year = parseInt(match[1], 10);
      }
      formData.append('year', year.toString());
      
      const response = await fetch('/api/ai/analyze-reading', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Error en el análisis');
      
      const data = await response.json();
      setAiAnalysis(data.analysis);
      setAiAudioUrl(data.audioUrl);
      
      navigateTo("retos");
      // Start the timer for the first question
      startQuestionTimer();
    } catch (error) {
      console.error(error);
      alert('Hubo un error al analizar el audio.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ----- COMPREHENSION TIMER LOGIC -----
  const startQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setQuestionTimer(TIMER_PER_QUESTION);
    setQuestionAnswered(false);

    questionTimerRef.current = setInterval(() => {
      setQuestionTimer(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentQuestionIdx]); // Dependency helps avoid stale closures in setTimeout if needed

  const clearQuestionTimer = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
  };

  // Using refs to access latest state inside setTimeout to prevent React stale closure bugs
  const latestAnswersRef = useRef<Record<string, { correct: boolean; timedOut: boolean }>>({});
  const [retosRespuestas, setRetosRespuestas] = useState<Record<string, { correct: boolean; timedOut: boolean }>>({});

  useEffect(() => {
    latestAnswersRef.current = retosRespuestas;
  }, [retosRespuestas]);

  const handleTimeOut = useCallback(() => {
    setQuestionAnswered(true);
    const retoId = activeText?.challenges[currentQuestionIdx]?.id;
    if (!retoId) return;

    setRetosRespuestas(prev => ({
      ...prev,
      [retoId]: { correct: false, timedOut: true }
    }));

    setTimeout(() => {
      moveToNextQuestion(latestAnswersRef.current); // Pass the latest state explicitly
    }, 2000);
  }, [activeText, currentQuestionIdx]);

  const toggleGrabacion = () => {
    if (!grabando) {
      setAudioVisible(false);
      setGrabSeg(0);
      setGrabando(true);
      setWordMatches([]);
      startRecording();
      startListening();
      
      grabTimerRef.current = setInterval(() => {
        setGrabSeg(s => s + 1);
      }, 1000);
    } else {
      setGrabando(false);
      stopRecording();
      stopListening();
      if (grabTimerRef.current) clearInterval(grabTimerRef.current);
      setTimeout(() => setAudioVisible(true), 500);
    }
  };

  const resetGrabacion = () => {
    resetAudio();
    resetRecognition();
    setAudioVisible(false);
    setGrabSeg(0);
    setWordMatches([]);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const selectRetoOption = (retoId: string, isCorrect: boolean) => {
    if (questionAnswered) return;
    clearQuestionTimer();
    setQuestionAnswered(true);
    
    setRetosRespuestas(prev => ({
      ...prev,
      [retoId]: { correct: isCorrect, timedOut: false }
    }));
    
    setTimeout(() => {
      moveToNextQuestion(latestAnswersRef.current); // Use ref value for reliability
    }, 1500);
  };

  const moveToNextQuestion = (currentAnswers: Record<string, { correct: boolean; timedOut: boolean }>) => {
    if (!activeText) return;
    
    if (currentQuestionIdx < activeText.challenges.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      startQuestionTimer();
    } else {
      finalizarRetosWithAnswers(currentAnswers);
    }
  };

  const finalizarRetosWithAnswers = async (answers: Record<string, { correct: boolean; timedOut: boolean }>) => {
    const correctCount = Object.values(answers).filter(r => r.correct).length;
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
        mode: activeText.mode, // ENVIAMOS EL MODO
        aiScore,
        aiAnalysis,
        challengesScore,
        audioUrl: aiAudioUrl
      })
    });

    fetchTexts();
    navigateTo("trofeo");
  };

  const goTrofeo = () => navigateTo("trofeo");
  const goStats = () => navigateTo("stats");

  const resetPractice = async (progressId: string) => {
    if (confirm("¿Querés reiniciar esta lectura de práctica?")) {
      await fetch('/api/alumno/reset-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressId })
      });
      fetchTexts();
    }
  };

  const retosPendientes = activeText?.challenges || [];
  const currentReto = retosPendientes[currentQuestionIdx];

  // Las lecturas completadas se cuentan globalmente sumando ambas
  const trofeosGanados = [...textsEvaluacion, ...textsPractica].filter(t => t.progress?.length > 0 && t.progress[0].status === "COMPLETADO").length;

  // Timer visual helpers
  const timerPercent = (questionTimer / TIMER_PER_QUESTION) * 100;
  const timerColorClass = questionTimer > 15 ? 'safe' : questionTimer > 7 ? 'warning' : 'danger';

  // Census metrics helpers
  let alumnoYear = 1;
  if (alumnoDetails?.division) {
    const match = alumnoDetails.division.match(/^(\d+)°/);
    if (match) alumnoYear = parseInt(match[1], 10);
  }

  const ppm = aiAnalysis?.ppm || 0;
  const prosody = aiAnalysis?.prosody || 1;
  const perfData = aiAnalysis?.performanceLevel ? { level: aiAnalysis.performanceLevel } : getPerformanceLevel(ppm, alumnoYear);
  const performanceLevel = perfData.level;
  const correctAnswers = Object.values(retosRespuestas).filter(r => r.correct).length;
  const totalQuestions = retosPendientes.length;
  const comprehensionLevel = getComprehensionLevel(correctAnswers, totalQuestions);
  const performanceLevelColor = performanceLevel === 'Avanzado' ? '#2e8b57' : performanceLevel === 'Medio' ? '#e8a020' : '#c0392b';

  const currentTexts = activeTab === "EVALUACION" ? textsEvaluacion : textsPractica;

  return (
    <>
      <div className="sim-label">📱 Simulador — Leer en Voz Alta · Universo Videla</div>

      <div className="device">
        <div className="topbar">
          <button className="back-btn" onClick={goBack} style={{ display: screenHistory.length > 1 ? "flex" : "none" }}>←</button>
          <div className="logo-text">📖 Leer en <span>Voz Alta</span></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="avatar" onClick={handleChangePassword} title="Cambiar Contraseña">🔑</div>
            <div className="avatar" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }} title="Cerrar sesión">🚪</div>
          </div>
        </div>

        {/* HOME */}
        <div className={`screen ${currentScreen === "home" ? "active" : ""}`} id="s-home">
          <div className="home-header">
            <div className="home-saludo">¡Bienvenido! 👋</div>
            <div className="home-nombre">{alumnoDetails?.name || "Estudiante"}</div>
            <div className="home-stats">
              <div className="stat-pill"><span className="num">{trofeosGanados}</span><span className="lbl">Textos leídos</span></div>
              <div className="stat-pill"><span className="num">{trofeosGanados}</span><span className="lbl">Trofeos</span></div>
              <div className="stat-pill"><span className="num">100%</span><span className="lbl">Retos ok</span></div>
            </div>
          </div>

          <div className="home-body">
            <div className="tabs-container" style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.5)', padding: 6, borderRadius: 16 }}>
              <button 
                onClick={() => setActiveTab("EVALUACION")}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: activeTab === "EVALUACION" ? '#fb7185' : 'transparent', color: activeTab === "EVALUACION" ? '#fff' : '#64748b', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === "EVALUACION" ? '0 4px 10px rgba(244,63,94,0.3)' : 'none' }}>
                📝 Evaluación
              </button>
              <button 
                onClick={() => setActiveTab("PRACTICA")}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: activeTab === "PRACTICA" ? '#3b82f6' : 'transparent', color: activeTab === "PRACTICA" ? '#fff' : '#64748b', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === "PRACTICA" ? '0 4px 10px rgba(59,130,246,0.3)' : 'none' }}>
                🏋️ Práctica
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, textAlign: 'center', padding: '0 10px' }}>
              {activeTab === "EVALUACION" 
                ? "Estas lecturas cuentan para las estadísticas del profesor y solo él puede reiniciarlas." 
                : "Practicá todo lo que quieras. Estos puntajes no afectan tu promedio final."}
            </div>

            {currentTexts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                No tenés textos asignados en esta sección.
              </div>
            ) : (
              currentTexts.map(t => {
                const completado = t.progress?.length > 0 && t.progress[0].status === "COMPLETADO";
                return (
                  <div key={t.assignmentId} className="texto-card" style={{ borderLeft: `4px solid ${activeTab === 'EVALUACION' ? '#fb7185' : '#3b82f6'}` }}>
                    <div className="tc-head" onClick={() => !completado && goTexto(t)}>
                      <div className="tc-icono">{completado ? "🌙" : "🦁"}</div>
                      <div className="tc-info">
                        <div className="tc-titulo">{t.title}</div>
                        <div className="tc-autor">{t.author}</div>
                      </div>
                    </div>
                    <div className="tc-tags" onClick={() => !completado && goTexto(t)}>
                      {completado ? (
                        <span className="tag completo">✓ Completado ({t.progress[0].score} pts)</span>
                      ) : (
                        <span className="tag pendiente">Pendiente</span>
                      )}
                      <span className="tag retos">{t.challenges.length} retos</span>
                    </div>
                    {completado && activeTab === "PRACTICA" && (
                      <div style={{ marginTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10, textAlign: 'right' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); resetPractice(t.progress[0].id); }}
                          style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          ↻ Leer de nuevo
                        </button>
                      </div>
                    )}
                    <div className="progreso-barra" style={{ marginTop: completado && activeTab === "PRACTICA" ? 10 : 16 }}>
                      <div className="progreso-fill" style={{ width: completado ? "100%" : "0%", background: activeTab === "EVALUACION" ? '#fb7185' : '#3b82f6' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TEXTO - with real-time word tracking */}
        <div className={`screen ${currentScreen === "texto" ? "active" : ""}`} id="s-texto">
          {activeText && (
            <>
              <div className="texto-hero" style={{ background: activeText.mode === 'EVALUACION' ? 'linear-gradient(135deg, #f43f5e, #fb7185)' : 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                <div className="th-label">{activeText.mode === 'EVALUACION' ? 'Evaluación Oficial' : 'Modo Práctica'}</div>
                <div className="th-titulo">{activeText.title}</div>
                <div className="th-autor">{activeText.author}</div>
                <div className="th-chips">
                  <span className="chip-white">{activeText.content.split(' ').length} palabras</span>
                  <span className="chip-white">{activeText.challenges.length} retos</span>
                </div>
              </div>

              <div className="texto-body">
                {/* Word legend */}
                {grabando && (
                  <div className="word-legend">
                    <div className="word-legend-item"><div className="legend-dot green"></div> Correcto</div>
                    <div className="word-legend-item"><div className="legend-dot orange"></div> A mejorar</div>
                    <div className="word-legend-item"><div className="legend-dot red"></div> Incorrecto</div>
                    <div className="word-legend-item"><div className="legend-dot gray"></div> Pendiente</div>
                  </div>
                )}

                {/* Speech recognition badge */}
                {grabando && (
                  <div style={{ textAlign: 'center' }}>
                    <div className={`speech-badge ${isListening ? 'listening' : 'off'}`}>
                      {isListening ? '🎤 Escuchando tu voz...' : speechSupported ? '⏳ Iniciando...' : '⚠️ Sin reconocimiento en vivo'}
                    </div>
                  </div>
                )}

                {/* Text content with real-time word coloring */}
                <div className="texto-contenido-live" ref={textContainerRef}>
                  {wordMatches.length > 0 ? (
                    wordMatches.map((match, idx) => (
                      <span
                        key={idx}
                        className={`word word-${match.status}`}
                        title={match.spokenAs ? `Dijiste: "${match.spokenAs}"` : undefined}
                      >
                        {match.word}{' '}
                      </span>
                    ))
                  ) : (
                    <span>{activeText.content}</span>
                  )}
                </div>

                <div className="grabadora">
                  <div className="grab-titulo">🎙️ Leé este texto en voz alta</div>
                  <button className={`grab-btn-mic ${grabando ? "grabando" : ""}`} onClick={toggleGrabacion} disabled={audioVisible || isAnalyzing}>
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
                      <button className="btn-regrabar" onClick={resetGrabacion} disabled={isAnalyzing}>↺ Grabar de nuevo</button>
                      <button className="btn-enviar" onClick={handleEnviarRetos} disabled={isAnalyzing}>
                        {isAnalyzing ? "Analizando audio (IA)... ⏳" : "Continuar a los retos →"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RETOS - with timer and single question view */}
        <div className={`screen ${currentScreen === "retos" ? "active" : ""}`} id="s-retos">
          {activeText && (
            <>
              <div className="retos-header" style={{ background: activeText.mode === 'EVALUACION' ? 'linear-gradient(135deg, #f43f5e, #fb7185)' : 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                <h2>🎯 Retos de comprensión</h2>
                <p>{activeText.title} · {totalQuestions} retos · ⏱️ {TIMER_PER_QUESTION}s por pregunta</p>
              </div>

              <div className="retos-single-view">
                {/* Progress dots */}
                <div className="question-progress">
                  {retosPendientes.map((_: any, idx: number) => {
                    const status = idx < currentQuestionIdx ? 'done' : idx === currentQuestionIdx ? 'active' : 'pending';
                    return <div key={idx} className={`q-dot ${status}`}></div>;
                  })}
                </div>

                {/* Timer Bar */}
                <div className="timer-container">
                  <div className={`timer-bar ${timerColorClass}`} style={{ width: `${timerPercent}%` }}></div>
                  <div className="timer-text">{questionTimer}s</div>
                </div>

                {currentReto ? (
                  <div className="reto-card current">
                    <div className="reto-q-num">Pregunta {currentQuestionIdx + 1} de {totalQuestions}</div>
                    <div className="reto-q">{currentReto.question}</div>
                    
                    {questionAnswered && retosRespuestas[currentReto.id]?.timedOut && (
                      <div className="timeout-msg">⏰ ¡Se acabó el tiempo!</div>
                    )}

                    <div className="reto-options" style={{ pointerEvents: questionAnswered ? 'none' : 'auto', opacity: questionAnswered ? 0.7 : 1 }}>
                      {JSON.parse(currentReto.options).map((opt: string, i: number) => {
                        const isSelected = retosRespuestas[currentReto.id] !== undefined;
                        const isCorrectOption = i === currentReto.correctIdx;
                        // Muestra el color de la respuesta seleccionada solo cuando el usuario respondió
                        let optClass = "reto-opt";
                        if (isSelected) {
                          if (isCorrectOption) optClass += " correct";
                          else if (!retosRespuestas[currentReto.id].correct && i !== currentReto.correctIdx) {
                            // If this was the wrong answer picked (though we don't strictly track WHICH wrong answer was picked in state)
                            // We will just highlight correct green, and if we timed out, no red.
                            // If they clicked a wrong one, we just color the selected one red (but we don't have selectedIdx saved)
                            // For simplicity, we just show the correct one in green.
                          }
                        }
                        
                        return (
                          <button key={i} className={optClass} onClick={() => selectRetoOption(currentReto.id, i === currentReto.correctIdx)}>
                            <div className="opt-marker">{["A","B","C","D"][i] || "-"}</div>
                            <div className="opt-text">{opt}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Cargando retos...</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* TROFEO */}
        <div className={`screen ${currentScreen === "trofeo" ? "active" : ""}`} id="s-trofeo">
          <div className="trofeo-container">
            <div className="trofeo-glare"></div>
            <div className="trofeo-emoji">🏆</div>
            <div className="trofeo-titulo">¡Texto completado!</div>
            <div className="trofeo-sub">Sumaste {scoreTotal} puntos a tu cuenta.</div>
            <button className="btn-volver" onClick={goStats}>Ver mis resultados →</button>
          </div>
        </div>

        {/* STATS */}
        <div className={`screen ${currentScreen === "stats" ? "active" : ""}`} id="s-stats">
          <div className="stats-header">
            <h2>📈 Tu Rendimiento</h2>
            <p>Resultados del análisis de IA y comprensión.</p>
          </div>
          
          <div className="stats-body">
            {/* Censo Metrics Header */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Nivel de Desempeño (DGE)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: performanceLevelColor }}>
                {performanceLevel}
              </div>
            </div>

            {/* Grid of primary metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div className="stat-box">
                <div className="sb-label">PPM (Palabras/Min)</div>
                <div className="sb-val" style={{ color: '#2563eb' }}>{ppm}</div>
              </div>
              <div className="stat-box">
                <div className="sb-label">Prosodia</div>
                <div className="sb-val" style={{ color: '#8b5cf6', fontSize: 24 }}>
                  {"⭐".repeat(prosody)}{"☆".repeat(3 - prosody)}
                </div>
              </div>
              <div className="stat-box">
                <div className="sb-label">Comprensión</div>
                <div className="sb-val" style={{ color: '#10b981' }}>{correctAnswers}/{totalQuestions}</div>
                <div style={{ fontSize: 12, color: comprehensionLevel.color, marginTop: 4, fontWeight: 600 }}>Nivel: {comprehensionLevel.level}</div>
              </div>
              <div className="stat-box">
                <div className="sb-label">Precisión Lectora</div>
                <div className="sb-val" style={{ color: '#f59e0b' }}>{aiAnalysis?.score || 0}/100</div>
              </div>
            </div>

            {/* Error Breakdown */}
            {aiAnalysis && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Desglose de Errores (DGE)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Palabras omitidas</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>{aiAnalysis.omittedWords?.length || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Palabras sustituidas</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>{aiAnalysis.substitutedWords?.length || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Palabras inventadas</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>{aiAnalysis.inventedWords?.length || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Autocorrecciones</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>{aiAnalysis.selfCorrectedWords?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="stats-feedback">
              <div className="sf-title">Robot Profe dice:</div>
              <div className="sf-text">{aiAnalysis?.feedback || "¡Excelente trabajo! Seguí practicando así."}</div>
            </div>

            <button className="btn-volver" onClick={() => setScreenHistory(["home"])}>Volver al inicio</button>
          </div>
        </div>
      </div>
    </>
  );
}
