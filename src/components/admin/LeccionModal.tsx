'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

interface LeccionModalProps {
  leccion?: any
  onClose: () => void
  onSave: (data: any) => void
}

export default function LeccionModal({ leccion, onClose, onSave }: LeccionModalProps) {
  const [formData, setFormData] = useState({
    title: leccion?.title || '',
    title_es: leccion?.title_es || '',
    level: leccion?.level || 'basico',
    order: leccion?.order || 1,
    xp_reward: leccion?.xp_reward || 20,
    description: leccion?.description || '',
    is_active: leccion?.is_active ?? true
  })

  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const newErrors: any = {}
    
    if (!formData.title.trim()) newErrors.title = 'El título en quechua es requerido'
    if (!formData.title_es.trim()) newErrors.title_es = 'El título en español es requerido'
    if (formData.order < 1) newErrors.order = 'El orden debe ser mayor a 0'
    if (formData.xp_reward < 1) newErrors.xp_reward = 'El XP debe ser mayor a 0'

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
          background: 'linear-gradient(135deg, #7B1FA2, #9C27B0)',
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

          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>
            {leccion ? '✏️ Editar Lección' : '➕ Nueva Lección'}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            {leccion ? 'Modifica los detalles de la lección' : 'Crea una nueva lección de Quechua'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Título en Quechua */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 6
            }}>
              Título en Quechua *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ej: Napaykunaqa"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${errors.title ? '#EF5350' : '#F0E4D8'}`,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5'
              }}
            />
            {errors.title && (
              <p style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Título en Español */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 6
            }}>
              Título en Español *
            </label>
            <input
              type="text"
              value={formData.title_es}
              onChange={(e) => handleChange('title_es', e.target.value)}
              placeholder="Ej: Saludos básicos"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${errors.title_es ? '#EF5350' : '#F0E4D8'}`,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5'
              }}
            />
            {errors.title_es && (
              <p style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>
                {errors.title_es}
              </p>
            )}
          </div>

          {/* Nivel y Orden */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 20
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#2A1E15',
                marginBottom: 6
              }}>
                Nivel *
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleChange('level', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #F0E4D8',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'Poppins, sans-serif',
                  background: '#FEFAF5',
                  cursor: 'pointer'
                }}
              >
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#2A1E15',
                marginBottom: 6
              }}>
                Orden *
              </label>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${errors.order ? '#EF5350' : '#F0E4D8'}`,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'Poppins, sans-serif',
                  background: '#FEFAF5'
                }}
              />
            </div>
          </div>

          {/* XP Reward */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#2A1E15',
              marginBottom: 6
            }}>
              Recompensa de XP *
            </label>
            <input
              type="number"
              min="1"
              value={formData.xp_reward}
              onChange={(e) => handleChange('xp_reward', parseInt(e.target.value))}
              placeholder="20"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${errors.xp_reward ? '#EF5350' : '#F0E4D8'}`,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5'
              }}
            />
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
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción breve de la lección..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #F0E4D8',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                background: '#FEFAF5',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Estado */}
          <div style={{
            marginBottom: 24,
            padding: 16,
            background: '#FEFAF5',
            borderRadius: 12,
            border: '2px solid #F0E4D8'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                style={{
                  width: 20,
                  height: 20,
                  cursor: 'pointer'
                }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1E15' }}>
                  Lección activa
                </p>
                <p style={{ fontSize: 11, color: '#9B8070' }}>
                  Los estudiantes podrán acceder a esta lección
                </p>
              </div>
            </label>
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
                background: 'linear-gradient(135deg, #7B1FA2, #9C27B0)',
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
                boxShadow: '0 4px 12px rgba(123,31,162,0.3)'
              }}
            >
              <Save size={18} />
              {leccion ? 'Guardar Cambios' : 'Crear Lección'}
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