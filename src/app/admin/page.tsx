"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
        setLoading(false);
      });
  }, []);

  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'ALUMNO').length;
  const totalTeachers = users.filter(u => u.role === 'PROFESOR').length;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(255, 255, 255, 0.8)', padding: '20px 30px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1a202c', fontSize: '28px', fontWeight: 800 }}>Panel de Administración</h1>
            <p style={{ margin: '5px 0 0 0', color: '#718096' }}>Sistema Leer en Voz Alta · Universo Videla</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ff4b4b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px rgba(255, 75, 75, 0.4)', transition: 'all 0.2s' }}>
            Cerrar Sesión
          </button>
        </header>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '40px' }}>👥</div>
            <div>
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Total Alumnos</div>
              <div style={{ fontSize: '28px', color: '#2d3748', fontWeight: 800 }}>{totalStudents}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '40px' }}>👨‍🏫</div>
            <div>
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Total Profesores</div>
              <div style={{ fontSize: '28px', color: '#2d3748', fontWeight: 800 }}>{totalTeachers}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '40px' }}>📊</div>
            <div>
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Usuarios Totales</div>
              <div style={{ fontSize: '28px', color: '#2d3748', fontWeight: 800 }}>{totalUsers}</div>
            </div>
          </div>
        </div>

        <section style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#2d3748', fontSize: '22px' }}>Gestión de Usuarios</h2>
            <button onClick={() => alert("Para crear usuarios rápidamente podés usar el script de Seed o crear un formulario acá pronto.")} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)' }}>
              + Crear Usuario
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Cargando usuarios...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                        <button style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '8px', color: '#4a5568', cursor: 'pointer', fontWeight: 500 }}>
                          Editar
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
    </div>
  );
}
