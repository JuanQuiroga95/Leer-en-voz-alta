"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [legajo, setLegajo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legajo, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
      } else {
        router.push(data.redirect);
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sim-label">📱 Simulador — Leer en Voz Alta · Universo Videla</div>
      <div className="device">
        <div className="screen active" id="s-login">
          <div className="login-logo">📖</div>
          <div className="login-titulo">
            Leer en<br />Voz Alta
          </div>
          <div className="login-sub">Universo Videla · E.S. N° 4-012</div>
          <form className="login-box" onSubmit={handleLogin}>
            <h3>Ingresá a tu cuenta</h3>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            <div className="campo">
              <label>Usuario (Legajo)</label>
              <input 
                type="text" 
                value={legajo}
                onChange={(e) => setLegajo(e.target.value)}
                placeholder="Ej. admin, profesor, alumno"
                required 
              />
            </div>
            <div className="campo">
              <label>Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                required 
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar →"}
            </button>
          </form>
          <div className="login-footer">Escuela Secundaria N° 4-012 "Ingeniero Ricardo Videla"</div>
        </div>
      </div>
    </>
  );
}
