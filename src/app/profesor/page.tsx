"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfesorPanel() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Panel del Profesor</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2>Estudiantes Asignados</h2>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '12px' }}>
          <p>Alumno Demo - Legajo: alumno - División: 2° B</p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Audios Pendientes de Corrección</h2>
        <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '12px', border: '1px solid #ffeeba' }}>
          <p><strong>Alumno Demo</strong> leyó "El León y el Ratón"</p>
          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: '5px 0' }}>🤖 <strong>Análisis IA:</strong> Precisión 85% - Fluidez Media</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Omitió "carcajada" y dudó en "cazadores".</p>
          </div>
          <button style={{ marginTop: '15px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Escuchar y Evaluar
          </button>
        </div>
      </section>

      <section>
        <h2>Gestionar Textos y Retos</h2>
        <button style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          + Agregar Nuevo Cuento
        </button>
      </section>
    </div>
  );
}
