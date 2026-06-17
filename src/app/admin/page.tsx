"use client";

import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Panel de Administración</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2>Gestión de Usuarios</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Legajo</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Nombre</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Rol</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>admin</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Admin Demo</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>ADMIN</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                <button style={{ marginRight: '10px' }}>Editar</button>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>profesor</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Profe Demo</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>PROFESOR</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                <button style={{ marginRight: '10px' }}>Editar</button>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>alumno</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Alumno Demo</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>ALUMNO</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                <button style={{ marginRight: '10px' }}>Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
        <button style={{ marginTop: '20px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          + Crear Usuario
        </button>
      </section>
    </div>
  );
}
