'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'

interface InsigniaModalProps {
  insignia?: any
  onClose: () => void
  onSave: (data: any) => void
}

const EMOJIS_DISPONIBLES = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫',
  '🎖️', '🏅', '👑', '💎', '💰', '🎯', '🔥', '⚡',
  '🌈', '🎨', '📚', '✏️', '📖', '🎓', '🧠', '💡'
]

export default function InsigniaModal({ insignia, onClose, onSave }: InsigniaModalProps) {
  const [formData, setFormData] = useState({
    nombre: insignia?.nombre || '',
    descripcion: insignia?.descripcion || '',
    icono: insignia?.icono || '🏆',
    condicion: insignia?.condicion || ''
  })

  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const newErrors: any = {}
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida'
    if (!formData.condicion.trim()) newErrors.condicion = 'La condición es requerida'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.2s ease'
    }}
    onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease'
      }}
      onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #FBC02D, #F57F17)',
          padding: 24,
          borderRadius: '24px 24px 0 0',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 50,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} color="white" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60,
              height: 60,
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {formData.icono}
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>
                {insignia ? '✏️ Editar Insignia' : '➕ Nueva Insignia'}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
                {insignia ? 'Modifica los detalles de la insignia' : 'Crea una nueva recompensa'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Selector de emoji */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 8
            }}>
              Ícono de la Insignia
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 8,
              padding: 16,
              background: '#FEFAF5',
              borderRadius: 12,
              border: '2px solid #F0E4D8'
            }}>
              {EMOJIS_DISPONIBLES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('icono', emoji)}
                  style={{
                    width: 40,
                    height: 40,
                    fontSize: 24,
                    background: formData.icono === emoji ? 'linear-gradient(135deg, #FBC02D, #F57F17)' : 'white',
                    border: formData.icono === emoji ? '2px solid #F57F17' : '2px solid #F0E4D8',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 6
            }}>
              Nombre de la Insignia *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Primer Paso"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${errors.nombre ? '#EF5350' : '#F0E4D8'}`,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5'
              }}
            />
            {errors.nombre && (
              <p style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 6
            }}>
              Descripción *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describe qué significa esta insignia..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${errors.descripcion ? '#EF5350' : '#F0E4D8'}`,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5',
                resize: 'vertical'
              }}
            />
            {errors.descripcion && (
              <p style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>
                {errors.descripcion}
              </p>
            )}
          </div>

          {/* Condición */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 6
            }}>
              Condición para obtenerla *
            </label>
            <input
              type="text"
              value={formData.condicion}
              onChange={(e) => handleChange('condicion', e.target.value)}
              placeholder="Ej: Completar 1 lección"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${errors.condicion ? '#EF5350' : '#F0E4D8'}`,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5'
              }}
            />
            {errors.condicion && (
              <p style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>
                {errors.condicion}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#9B8070', marginTop: 6 }}>
              💡 Ejemplos: "Completar 5 lecciones", "Alcanzar 100 XP", "Obtener racha de 3 días"
            </p>
          </div>

          {/* Preview */}
          <div style={{
            padding: 20,
            background: 'linear-gradient(135deg, #FFFBF0, #FFF8E1)',
            borderRadius: 16,
            border: '2px solid #FBC02D',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <p style={{ fontSize: 11, color: '#9B8070', marginBottom: 12, fontWeight: 600 }}>
              VISTA PREVIA
            </p>
            <div style={{
              width: 70,
              height: 70,
              margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #FBC02D, #F57F17)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              boxShadow: '0 4px 12px rgba(251,192,45,0.4)'
            }}>
              {formData.icono}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2A1E15', marginBottom: 4 }}>
              {formData.nombre || 'Nombre de la insignia'}
            </h3>
            <p style={{ fontSize: 12, color: '#6B3F2A', marginBottom: 8 }}>
              {formData.descripcion || 'Descripción de la insignia'}
            </p>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: 50,
              fontSize: 11,
              fontWeight: 700,
              color: '#C4763A'
            }}>
              {formData.condicion || 'Condición'}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 12,
                border: '2px solid #F0E4D8',
                background: 'white',
                color: '#6B3F2A',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #FBC02D, #F57F17)',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(251,192,45,0.4)'
              }}
            >
              <Save size={18} />
              {insignia ? 'Guardar Cambios' : 'Crear Insignia'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}