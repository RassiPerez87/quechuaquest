// lib/exportUtils.ts
// Utilidades para exportar datos a CSV

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  // Obtener las columnas del primer objeto
  const headers = Object.keys(data[0])
  
  // Crear el contenido CSV
  const csvContent = [
    // Encabezados
    headers.join(','),
    // Filas de datos
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escapar valores que contengan comas o comillas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportUsersToCSV(usuarios: any[]) {
  const exportData = usuarios.map(u => ({
    'Usuario': u.username || '',
    'Nombre Completo': u.full_name || '',
    'Email': u.email || '',
    'Rol': u.role || 'student',
    'XP': u.xp || 0,
    'Nivel': u.level || 1,
    'Lecciones Completadas': u.total_lessons_completed || 0,
    'Fecha Registro': u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES') : '',
    'Última Actividad': u.last_activity ? new Date(u.last_activity).toLocaleDateString('es-ES') : 'Nunca'
  }))

  exportToCSV(exportData, 'usuarios_quechuaquest')
}

export function exportLeccionesToCSV(lecciones: any[]) {
  const exportData = lecciones.map(l => ({
    'ID': l.id,
    'Título (Quechua)': l.title || '',
    'Título (Español)': l.title_es || '',
    'Nivel': l.level || '',
    'Orden': l.order || 0,
    'XP Recompensa': l.xp_reward || 0,
    'Descripción': l.description || '',
    'Estado': l.is_active ? 'Activa' : 'Inactiva'
  }))

  exportToCSV(exportData, 'lecciones_quechuaquest')
}

export function exportInsigniasToCSV(insignias: any[]) {
  const exportData = insignias.map(i => ({
    'ID': i.id,
    'Nombre': i.nombre || '',
    'Descripción': i.descripcion || '',
    'Condición': i.condicion || '',
    'Usuarios que la tienen': i.total_users || 0
  }))

  exportToCSV(exportData, 'insignias_quechuaquest')
}

// ── Helpers de fecha ──────────────────────────────────────────
function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function fmtDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Reporte individual de usuario ─────────────────────────────
export function exportReporteIndividual(
  usuario: any,
  lecciones: any[],
  sesiones: any[],
  insignias: any[]
) {
  const BOM = '\ufeff'
  const rows: string[][] = []

  rows.push(['REPORTE INDIVIDUAL — QuechuaQuest'])
  rows.push(['Generado el', new Date().toLocaleString('es-ES')])
  rows.push([])
  rows.push(['DATOS DEL USUARIO'])
  rows.push(['Usuario', usuario.username || ''])
  rows.push(['Nombre Completo', usuario.full_name || ''])
  rows.push(['Email', usuario.email || ''])
  rows.push(['Rol', usuario.role === 'admin' ? 'Administrador' : 'Estudiante'])
  rows.push(['Fecha de Registro', fmtDate(usuario.created_at)])
  rows.push(['Última Actividad', fmtDate(usuario.last_activity)])
  rows.push(['XP Total', String(usuario.xp || 0)])
  rows.push(['Nivel', String(usuario.level || 1)])
  rows.push(['Lecciones Completadas', String(usuario.total_lessons_completed || 0)])
  rows.push([])
  rows.push(['HISTORIAL DE LECCIONES'])
  rows.push(['Lección', 'Nivel', 'Estado', 'Progreso (%)', 'Fecha Completada'])
  lecciones.forEach((l: any) => {
    rows.push([
      l.title_es || l.title || 'Sin título',
      l.level || '',
      l.completado ? 'Completada' : 'En progreso',
      String(l.progreso || 0),
      fmtDate(l.completed_at)
    ])
  })
  rows.push([])
  rows.push(['HISTORIAL DE SESIONES DE EJERCICIO'])
  rows.push(['Lección', 'Fecha y Hora', 'Puntaje', 'Total Preguntas', 'Precisión (%)', 'XP Ganado', 'Resultado'])
  sesiones.forEach((s: any) => {
    const acc = s.accuracy || 0
    rows.push([
      s.lesson_title || s.lessons?.title_es || '',
      fmtDateTime(s.completed_at),
      String(s.score || 0),
      String(s.total || 0),
      String(acc),
      String(s.xp_gained || 0),
      acc >= 70 ? 'Aprobado' : 'Repaso necesario'
    ])
  })
  rows.push([])
  rows.push(['INSIGNIAS OBTENIDAS'])
  rows.push(['Insignia', 'Descripción', 'Fecha Obtenida'])
  insignias.forEach((i: any) => {
    rows.push([
      i.nombre || '',
      i.descripcion || '',
      fmtDate(i.earned_at)
    ])
  })

  const csv = rows.map(r => r.map(cell => {
    const s = String(cell)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }).join(',')).join('\n')

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_${usuario.username || 'usuario'}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportReporteGeneral(stats: any, topUsers: any[]) {
  const reporteData = [
    { Métrica: 'Total de Usuarios', Valor: stats?.total_students || 0 },
    { Métrica: 'Estudiantes Activos', Valor: stats?.active_students || 0 },
    { Métrica: 'Lecciones Totales', Valor: stats?.total_lessons || 0 },
    { Métrica: 'Ejercicios Totales', Valor: stats?.total_exercises || 0 },
    { Métrica: 'Insignias Disponibles', Valor: stats?.total_badges || 0 },
    { Métrica: 'Lecciones Completadas (Total)', Valor: stats?.total_lessons_completed || 0 },
    { Métrica: 'Promedio XP por Usuario', Valor: Math.round(stats?.avg_xp_per_user || 0) },
    { Métrica: 'Promedio Progreso', Valor: `${(stats?.avg_points_per_lesson || 0).toFixed(1)}%` },
    { Métrica: '', Valor: '' }, // Línea vacía
    { Métrica: 'TOP 5 USUARIOS', Valor: '' },
    ...topUsers.map((u, i) => ({
      Métrica: `${i + 1}. ${u.username}`,
      Valor: `${u.xp} XP - ${u.total_lessons_completed || 0} lecciones`
    }))
  ]

  exportToCSV(reporteData, 'reporte_general_quechuaquest')
}