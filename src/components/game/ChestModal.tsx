'use client'
// components/ChestModal.tsx
// QuechuaQuest - Modal animado del cofre de recompensas (Qollqa)
// Se muestra cuando el usuario gana insignias, alcanza milestones de racha, etc.

import { useState, useEffect } from 'react'
import type { ChestReward } from '@/hooks/useGameSystem'

// Partículas de confetti
function Confetti({ count = 40 }: { count?: number }) {
  const colors = ['#C4763A', '#D4A373', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6']
  const shapes = ['●', '■', '▲', '★', '♦']

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {Array.from({ length: count }, (_, i) => {
        const color = colors[i % colors.length]
        const shape = shapes[i % shapes.length]
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 1.5 + Math.random() * 1.5
        const size = 8 + Math.random() * 8

        return (
          <span
            key={i}
            className="absolute top-0 animate-[confettiFall_var(--dur)_var(--delay)_ease-in_forwards]"
            style={{
              left: `${left}%`,
              color,
              fontSize: `${size}px`,
              '--dur': `${duration}s`,
              '--delay': `${delay}s`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationFillMode: 'forwards',
              animation: `confettiFall ${duration}s ${delay}s ease-in forwards`,
            } as React.CSSProperties}
          >
            {shape}
          </span>
        )
      })}
    </div>
  )
}

// Animación del cofre (3 fases: cerrado → abriendo → abierto)
type ChestPhase = 'closed' | 'shaking' | 'opening' | 'open'

function AnimatedChest({ phase }: { phase: ChestPhase }) {
  const chests: Record<ChestPhase, string> = {
    closed:   '📦',
    shaking:  '📦',
    opening:  '🎁',
    open:     '🎊',
  }

  return (
    <div
      className={`
        text-8xl select-none transition-transform duration-300 mb-2
        ${phase === 'shaking' ? 'animate-[shake_0.3s_ease-in-out_infinite]' : ''}
        ${phase === 'opening' ? 'scale-125' : ''}
        ${phase === 'open' ? 'scale-150 animate-bounce' : ''}
      `}
      style={{
        filter: phase !== 'closed' ? 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))' : 'none',
        transition: 'all 0.4s ease'
      }}
    >
      {chests[phase]}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CHEST MODAL PRINCIPAL
// ═══════════════════════════════════════════════════════════
interface ChestModalProps {
  reward: ChestReward | null
  onClose: () => void
}

export function ChestModal({ reward, onClose }: ChestModalProps) {
  const [phase, setPhase] = useState<ChestPhase>('closed')
  const [showReward, setShowReward] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpCounter, setXpCounter] = useState(0)

  useEffect(() => {
    if (!reward) {
      setPhase('closed')
      setShowReward(false)
      setShowConfetti(false)
      setXpCounter(0)
      return
    }

    // Secuencia de animación
    const seq = async () => {
      setPhase('closed')
      setShowReward(false)
      await delay(300)

      setPhase('shaking')
      await delay(800)

      setPhase('opening')
      await delay(400)

      setPhase('open')
      setShowConfetti(true)
      await delay(200)
      setShowReward(true)

      // Animar XP counter
      if (reward.xpAmount && reward.xpAmount > 0) {
        const steps = 30
        const increment = reward.xpAmount / steps
        for (let i = 1; i <= steps; i++) {
          await delay(30)
          setXpCounter(Math.round(increment * i))
        }
      }
    }

    seq()
  }, [reward])

  if (!reward) return null

  const rewardColors: Record<ChestReward['type'], string> = {
    badge:            'from-purple-500 to-violet-600',
    xp:               'from-blue-500 to-cyan-500',
    streak_milestone: 'from-orange-500 to-amber-500',
    level_up:         'from-emerald-500 to-teal-600',
  }

  const gradient = rewardColors[reward.type]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 
                    flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-sm w-full overflow-hidden
                   shadow-2xl animate-in zoom-in-90 duration-300"
        style={{ minHeight: '400px' }}
      >
        {/* Fondo degradado superior */}
        <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-b ${gradient} opacity-10`} />

        {/* Confetti */}
        {showConfetti && <Confetti count={50} />}

        <div className="relative z-10 flex flex-col items-center p-8 pt-10">
          {/* Cofre animado */}
          <AnimatedChest phase={phase} />

          {/* Texto de apertura */}
          {!showReward && (
            <p className="text-stone-400 text-sm animate-pulse mt-2">
              {phase === 'closed' && 'Preparando tu recompensa...'}
              {phase === 'shaking' && '¡Algo está dentro!'}
              {phase === 'opening' && '¡Abriendo!'}
            </p>
          )}

          {/* Contenido de la recompensa */}
          {showReward && (
            <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500 mt-2">
              {/* Icono grande */}
              <div
                className="text-6xl mb-3 animate-bounce"
                style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))' }}
              >
                {reward.icon}
              </div>

              {/* Tipo de recompensa */}
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold 
                               text-white bg-gradient-to-r ${gradient} mb-3`}>
                {reward.type === 'badge'            && '✨ NUEVA INSIGNIA'}
                {reward.type === 'xp'               && '⚡ RECOMPENSA'}
                {reward.type === 'streak_milestone' && '🔥 HITO DE RACHA'}
                {reward.type === 'level_up'         && '🎯 NIVEL SUBIDO'}
              </div>

              {/* Título */}
              <h2 className="text-2xl font-black text-stone-800 mb-2 leading-tight">
                {reward.title}
              </h2>

              {/* Descripción */}
              <p className="text-stone-500 text-sm mb-4 leading-relaxed px-2">
                {reward.description}
              </p>

              {/* XP ganado */}
              {reward.xpAmount !== undefined && reward.xpAmount > 0 && (
                <div className="flex items-center justify-center gap-2 mb-5
                                bg-amber-50 border border-amber-200 rounded-2xl py-3 px-4">
                  <span className="text-2xl">⚡</span>
                  <div className="text-left">
                    <p className="text-xs text-amber-600 font-medium">XP Ganado</p>
                    <p className="text-2xl font-black text-amber-700">+{xpCounter}</p>
                  </div>
                </div>
              )}

              {/* Badge name (para insignias) */}
              {reward.type === 'badge' && reward.badgeName && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl py-2 px-4 mb-4">
                  <p className="text-purple-700 text-sm font-bold">{reward.badgeName}</p>
                </div>
              )}

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className={`w-full py-4 bg-gradient-to-r ${gradient} text-white 
                           font-black text-lg rounded-2xl hover:opacity-90 
                           transition-opacity shadow-lg active:scale-95`}
              >
                ¡Genial! 🎉
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click fuera cierra (solo si el reward ya se mostró) */}
      {showReward && (
        <div className="absolute inset-0 -z-10" onClick={onClose} />
      )}

      {/* CSS para animaciones custom */}
      
    </div>
  )
}

// Helper
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}