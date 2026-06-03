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