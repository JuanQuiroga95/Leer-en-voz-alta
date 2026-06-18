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

  const [texts, setTexts] = useState<any[]>([]);
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

  useEffect(() => {
    fetch('/api/alumno/texts')
      .then(res => res.json())
      .then(data => {
        if (data.texts) setTexts(data.texts);
      });
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
      const currentWordEl = textContainerRef.current.querySelector('.word-current');
      if (currentWordEl) {
        currentWordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [allWords, activeText, grabando]);

  // ----- Comprehension question timer -----
  useEffect(() => {
    if (currentScreen !== 'retos') return;
    if (!activeText?.challenges?.length) return;
    if (currentQuestionIdx >= activeText.challenges.length) return;
    if (questionAnswered) return;

    setQuestionTimer(TIMER_PER_QUESTION);

    const timer = setInterval(() => {
      setQuestionTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Tiempo agotado — marcar como incorrecta y avanzar
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    questionTimerRef.current = timer;
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIdx, currentScreen, questionAnswered]);

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
  
  const goRetos = () => {
    setCurrentQuestionIdx(0);
    setQuestionAnswered(false);
    setRetosRespuestas({});
    navigate("retos");
  };
  const goTrofeo = () => navigate("trofeo");

  const iniciarGrabacion = () => {
    startRecording();
    if (speechSupported) {
      startListening();
    }
    setGrabando(true);
    setGrabSeg(0);
    setWordMatches([]);
    grabTimerRef.current = setInterval(() => setGrabSeg((prev) => prev + 1), 1000);
  };

  const detenerGrabacion = () => {
    stopRecording();
    stopListening();
    setGrabando(false);
    if (grabTimerRef.current) clearInterval(grabTimerRef.current);
    setAudioVisible(true);

    // Marcar remaining pending words as wrong (not reached)
    if (activeText) {
      const referenceWords = tokenizeText(activeText.content);
      const finalMatches = matchWords(referenceWords, allWords);
      setWordMatches(finalMatches);
    }
  };

  const toggleGrabacion = () => !grabando ? iniciarGrabacion() : detenerGrabacion();
  const resetGrabacion = () => {
    resetAudio();
    resetRecognition();
    setGrabando(false);
    if (grabTimerRef.current) clearInterval(grabTimerRef.current);
    setGrabSeg(0);
    setAudioVisible(false);
    setWordMatches([]);
    setAiAnalysis(null);
    setAiAudioUrl(null);
  };

  const handleEnviarRetos = async () => {
    if (audioBlob && activeText) {
      try {
        setAudioVisible(false);
        setGrabando(false);
        setIsAnalyzing(true);
        navigate("trofeo"); // Go to trophy screen to show loading

        const formData = new FormData();
        formData.append('audio', audioBlob, `audio.webm`);
        formData.append('referenceText', activeText.content);
        formData.append('readingTimeSeconds', grabSeg.toString());

        const res = await fetch(`/api/ai/analyze-reading`, { method: 'POST', body: formData });
        const result = await res.json();
        
        if (!res.ok) {
          alert(`Error: ${result.error || 'No se pudo procesar el audio.'}`);
          setIsAnalyzing(false);
          goBack();
          setAudioVisible(true);
          return;
        }

        if (result.analysis) {
          setAiAnalysis(result.analysis);
          if (result.audioUrl) setAiAudioUrl(result.audioUrl);
          setIsAnalyzing(false);
          goRetos();
        } else {
          alert("Error: El servidor no devolvió el análisis esperado.");
          setIsAnalyzing(false);
          goBack();
          setAudioVisible(true);
        }
      } catch (e) {
        console.error("Error al analizar el audio", e);
        alert("Hubo un error de conexión al enviar el audio. Intentá de nuevo.");
        setIsAnalyzing(false);
        goBack();
        setAudioVisible(true);
      }
    }
  };

  const formatTime = (seg: number) => `${Math.floor(seg / 60)}:${(seg % 60).toString().padStart(2, "0")}`;

  const [retosRespuestas, setRetosRespuestas] = useState<Record<string, { correct: boolean; timedOut: boolean }>>({});

  const responder = (retoId: string, correct: boolean) => {
    if (retosRespuestas[retoId]) return; // Already answered
    const updatedAnswers = { ...retosRespuestas, [retoId]: { correct, timedOut: false } };
    setRetosRespuestas(updatedAnswers);
    setQuestionAnswered(true);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    // Auto advance after 1.5s (pass updatedAnswers to avoid stale closure)
    setTimeout(() => {
      advanceQuestion(updatedAnswers);
    }, 1500);
  };

  const handleTimeout = useCallback(() => {
    if (!activeText?.challenges?.length) return;
    const currentChallenge = activeText.challenges[currentQuestionIdx];
    if (!currentChallenge) return;
    if (retosRespuestas[currentChallenge.id]) return;

    const updatedAnswers = {
      ...retosRespuestas,
      [currentChallenge.id]: { correct: false, timedOut: true }
    };
    setRetosRespuestas(updatedAnswers);
    setQuestionAnswered(true);

    // Try to vibrate
    if (navigator.vibrate) navigator.vibrate(200);

    // Auto advance after 1.5s (pass updatedAnswers to avoid stale closure)
    setTimeout(() => {
      advanceQuestion(updatedAnswers);
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeText, currentQuestionIdx, retosRespuestas]);

  const advanceQuestion = (answers: Record<string, { correct: boolean; timedOut: boolean }>) => {
    if (!activeText?.challenges?.length) return;
    if (currentQuestionIdx < activeText.challenges.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setQuestionAnswered(false);
    } else {
      // All questions answered, finalize with the complete answers
      finalizarRetosWithAnswers(answers);
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
        aiScore,
        aiAnalysis,
        challengesScore,
        audioUrl: aiAudioUrl
      })
    });

    // Recargar textos
    fetch('/api/alumno/texts').then(res => res.json()).then(data => { if (data.texts) setTexts(data.texts); });

    goTrofeo();
  };

  const retosPendientes = activeText?.challenges || [];
  const currentReto = retosPendientes[currentQuestionIdx];

  const trofeosGanados = texts.filter(t => t.progress?.length > 0 && t.progress[0].status === "COMPLETADO").length;

  // Timer visual helpers
  const timerPercent = (questionTimer / TIMER_PER_QUESTION) * 100;
  const timerColorClass = questionTimer > 15 ? 'safe' : questionTimer > 7 ? 'warning' : 'danger';

  // Census metrics helpers
  const ppm = aiAnalysis?.ppm || 0;
  const prosody = aiAnalysis?.prosody || 1;
  const performanceLevel = aiAnalysis?.performanceLevel || (ppm < 100 ? 'Crítico' : ppm <= 181 ? 'Medio' : 'Avanzado');
  const correctAnswers = Object.values(retosRespuestas).filter(r => r.correct).length;
  const totalQuestions = retosPendientes.length;
  const comprehensionLevel = getComprehensionLevel(correctAnswers, totalQuestions);

  const performanceLevelColor = performanceLevel === 'Avanzado' ? '#2e8b57' : performanceLevel === 'Medio' ? '#e8a020' : '#c0392b';

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

        {/* TEXTO - with real-time word tracking */}
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

        {/* RETOS - with timer and single question view */}
        <div className={`screen ${currentScreen === "retos" ? "active" : ""}`} id="s-retos">
          {activeText && (
            <>
              <div className="retos-header">
                <h2>🎯 Retos de comprensión</h2>
                <p>{activeText.title} · {totalQuestions} retos · ⏱️ {TIMER_PER_QUESTION}s por pregunta</p>
              </div>

              <div className="retos-single-view">
                {/* Progress dots */}
                <div className="question-progress">
                  {retosPendientes.map((_: any, idx: number) => {
                    const retoId = retosPendientes[idx]?.id;
                    const answer = retosRespuestas[retoId];
                    let dotClass = '';
                    if (idx === currentQuestionIdx) dotClass = 'active';
                    else if (answer?.correct) dotClass = 'answered';
                    else if (answer?.timedOut) dotClass = 'timeout';
                    else if (answer && !answer.correct) dotClass = 'wrong';
                    return <div key={idx} className={`q-dot ${dotClass}`}></div>;
                  })}
                </div>

                {/* Timer */}
                {currentReto && !retosRespuestas[currentReto.id] && (
                  <div className="timer-container">
                    <div className="timer-header">
                      <div className="timer-label">Tiempo restante</div>
                      <div className={`timer-seconds ${timerColorClass}`}>
                        {questionTimer}s
                      </div>
                    </div>
                    <div className="timer-bar">
                      <div
                        className={`timer-bar-fill ${timerColorClass}`}
                        style={{ width: `${timerPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Current question */}
                {currentReto && (
                  <div className="reto-card-single" key={`q-${currentQuestionIdx}`}>
                    <div className="rc-num">Pregunta {currentQuestionIdx + 1} de {totalQuestions}</div>
                    <div className="rc-pregunta">{currentReto.question}</div>
                    
                    {retosRespuestas[currentReto.id]?.timedOut ? (
                      <div className="reto-timeout-overlay">
                        <div className="timeout-icon">⏰</div>
                        <div className="timeout-msg">¡Se acabó el tiempo!</div>
                      </div>
                    ) : (
                      <div className="opciones">
                        {JSON.parse(currentReto.options).map((opc: string, idx: number) => {
                          const answer = retosRespuestas[currentReto.id];
                          let className = 'opcion';
                          if (answer) {
                            if (idx === currentReto.correctIdx) className += ' correcta';
                            else if (!answer.correct && idx !== currentReto.correctIdx) className += ' incorrecta';
                          }
                          return (
                            <div
                              key={idx}
                              className={className}
                              onClick={() => {
                                if (!retosRespuestas[currentReto.id]) {
                                  responder(currentReto.id, idx === currentReto.correctIdx);
                                }
                              }}
                            >
                              {opc}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* TROFEO - with census metrics */}
        <div className={`screen ${currentScreen === "trofeo" ? "active" : ""}`} id="s-trofeo" style={{ display: currentScreen === "trofeo" ? "flex" : "none" }}>
          {isAnalyzing ? (
            <div className="analysis-loading">
              <div className="analysis-spinner"></div>
              <div className="analysis-loading-text">
                🤖 El Profe Robot está analizando<br/>tu lectura...
              </div>
            </div>
          ) : (
            <>
              <div className="trofeo-anim">🏆</div>
              <div className="trofeo-titulo">¡Texto Completado!</div>
              <div className="trofeo-desc">
                {aiAnalysis?.feedback || 'Gracias a tu lectura y tus respuestas, sumaste una gran puntuación.'}
              </div>

              {/* Census metrics */}
              <div className="census-results">
                <div className="census-card">
                  <div className="census-label">Palabras por Minuto</div>
                  <div className="census-value">{ppm}</div>
                  <div className="census-level-badge" style={{ background: `${performanceLevelColor}30`, color: performanceLevelColor }}>
                    {performanceLevel}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="census-card" style={{ flex: 1 }}>
                    <div className="census-label">Prosodia</div>
                    <div className="prosody-stars">
                      {[1, 2, 3].map(n => (
                        <span key={n}>{n <= prosody ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                    <div className="census-sublabel">
                      {prosody === 3 ? 'Alta' : prosody === 2 ? 'Media' : 'Baja'}
                    </div>
                  </div>

                  <div className="census-card" style={{ flex: 1 }}>
                    <div className="census-label">Comprensión</div>
                    <div className="census-value" style={{ fontSize: '20px' }}>
                      {correctAnswers}/{totalQuestions}
                    </div>
                    <div className="census-level-badge" style={{ background: `${comprehensionLevel.color}30`, color: comprehensionLevel.color }}>
                      {comprehensionLevel.level}
                    </div>
                  </div>
                </div>

                <div className="census-card">
                  <div className="census-label">Fluidez (IA)</div>
                  <div className="census-value">{aiAnalysis?.score || 0}<span style={{ fontSize: '14px', color: '#a8d4f5' }}>/100</span></div>
                </div>

                {/* Word analysis summary */}
                {aiAnalysis && (
                  <div className="census-card">
                    <div className="census-label">Detalle de lectura</div>
                    <div className="word-analysis-summary">
                      {aiAnalysis.omittedWords?.length > 0 && (
                        <div className="was-item wrong">
                          {aiAnalysis.omittedWords.length} omitidas
                        </div>
                      )}
                      {aiAnalysis.substitutedWords?.length > 0 && (
                        <div className="was-item close">
                          {aiAnalysis.substitutedWords.length} sustituidas
                        </div>
                      )}
                      {aiAnalysis.inventedWords?.length > 0 && (
                        <div className="was-item wrong">
                          {aiAnalysis.inventedWords.length} inventadas
                        </div>
                      )}
                      {aiAnalysis.selfCorrectedWords?.length > 0 && (
                        <div className="was-item correct">
                          {aiAnalysis.selfCorrectedWords.length} autocorregidas ✓
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="trofeo-puntos">
                <div className="pts-num">+{scoreTotal}</div>
                <div className="pts-lbl">puntos totales</div>
              </div>
              <button className="btn-continuar" onClick={goHome}>Volver al Inicio →</button>
            </>
          )}
        </div>

      </div>
    </>
  );
}
