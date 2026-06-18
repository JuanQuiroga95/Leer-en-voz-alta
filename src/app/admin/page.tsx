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
              <div style={{ fontSize: '14px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>Promedio Global</div>
              <div style={{ fontSize: '28px', color: '#2d3748', fontWeight: 800 }}>{stats?.avgPlatformScore || 0}/100</div>
            </div>
          </div>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <section style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Lecturas Completadas por División</h3>
              <div style={{ height: '250px' }}>
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

            <section style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Promedio Histórico de Notas</h3>
              <div style={{ height: '250px' }}>
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

        <section style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, color: '#2d3748', fontSize: '22px' }}>Gestión de Usuarios</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
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
