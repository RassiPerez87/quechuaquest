'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const C = {
  brown:'#2A1E15', terra:'#C4763A', terral:'#FFF0E6', terrab:'#8B4E1F',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56',
  purple:'#534AB7', purplel:'#EEEDFE', purpleb:'#3C3489',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806',
  gray:'#B4B2A9', grayl:'#F1EFE8', grayb:'#888780', graybb:'#5F5E5A',
  red:'#E74C3C', redl:'#FDECEA',
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  pronunciationWord?: string
}

const WELCOME = `¡Allin p'unchaw! Soy **Yachaq**, tu asistente de quechua cochabambino.

Puedo ayudarte con:
• Traducir palabras y frases
• Explicar gramática y sufijos
• Practicar pronunciación 🎙️
• Cultura andina

¿Qué quieres aprender hoy?`

const SUGGESTIONS = [
  '¿Cómo se dice buenos días?',
  '¿Cómo se pronuncia Imaynalla?',
  '¿Qué significa allin?',
  'Enséñame a saludar',
]

// ── Extraer palabra a practicar ────────────────────────────────────
function extractPronunciationWord(text: string): string | null {
  // 1. «palabra» — formato obligatorio del prompt
  const m1 = text.match(/«([^»]{2,50})»/)
  if (m1) return m1[1].trim()

  // 2. Cualquier comilla angular después de "Te escucho"
  const m2 = text.match(/escucho[!.]?\s*["""']([A-Za-záéíóúñÁÉÍÓÚÑ'\s]{2,40})["""']/i)
  if (m2) return m2[1].trim()

  // 3. "decir/pronunciar: 'word'" o "decir/pronunciar \"word\""
  const m3 = text.match(/(?:decir|pronunciar|repetir)[:\s]+["""'\u00ab]([A-Za-záéíóúñÁÉÍÓÚÑ'\s]{2,40})["""'\u00bb]/i)
  if (m3) return m3[1].trim()

  // 4. Primera palabra en **negrita** de la respuesta (muy probable que sea la palabra quechua principal)
  const boldWords = [...text.matchAll(/\*\*([A-Za-záéíóúñÁÉÍÓÚÑ'\s]{2,40})\*\*/g)]
  if (boldWords.length > 0) return boldWords[0][1].trim()

  // 5. Palabra entre comillas dobles después de "se dice"
  const m5 = text.match(/se dice[:\s]+["""']([A-Za-záéíóúñÁÉÍÓÚÑ']{3,30})["""']/i)
  if (m5) return m5[1].trim()

  return null
}

function userWantsToPractice(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return (
    lower.includes('sí quiero') || lower.includes('si quiero') ||
    lower.includes('quiero practicar') || lower.includes('practiquemos') ||
    lower === 'sí' || lower === 'si' || lower === 'dale' ||
    lower.includes('claro') || lower.includes('ok') || lower.includes('vamos') ||
    (lower.includes('quiero') && lower.includes('pract'))
  )
}

// ── Limpiar texto para TTS ────────────────────────────────────
function cleanForTTS(text: string): string {
  return text
    .replace(/«([^»]+)»/g, '$1')
    // Quitar "i-ma-y-nal-la" (letras separadas por guiones entre comillas)
    .replace(/"[a-záéíóúñA-ZÁÉÍÓÚÑ']+(?:-[a-záéíóúñA-ZÁÉÍÓÚÑ']+){2,}"/g, '')
    // Quitar (x como "y" en "z") entero
    .replace(/\([^)]*\bcomo\b[^)]*\)/gi, '')
    .replace(/🎙️/g, '')
    .replace(/\*\*/g, '')
    .replace(/•/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── Avatar Lottie ─────────────────────────────────────────────
function LottieAvatar({ isTalking }: { isTalking: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef      = useRef<any>(null)
  const loadedRef    = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return
    const initAnim = () => {
      if (animRef.current || !containerRef.current) return
      const lottie = (window as any).lottie
      if (!lottie) return
      animRef.current = lottie.loadAnimation({
        container: containerRef.current, renderer: 'svg',
        loop: true, autoplay: false, path: '/lottie/Talking_maya_avatar.json',
      })
      animRef.current.addEventListener('DOMLoaded', () => {
        loadedRef.current = true
        animRef.current.goToAndStop(0, true)
      })
    }
    if ((window as any).lottie) {
      initAnim()
    } else {
      const existing = document.querySelector('script[data-lottie]')
      if (!existing) {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
        s.setAttribute('data-lottie', 'true')
        s.onload = initAnim
        document.head.appendChild(s)
      } else { existing.addEventListener('load', initAnim) }
    }
    return () => {
      if (animRef.current) { animRef.current.destroy(); animRef.current = null; loadedRef.current = false }
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current || !animRef.current) return
    try {
      if (isTalking) animRef.current.goToAndPlay(0, true)
      else animRef.current.goToAndStop(0, true)
    } catch {}
  }, [isTalking])

  return (
    <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,${C.terral},${C.goldl})` }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }}/>
    </div>
  )
}

// ── TTS ───────────────────────────────────────────────────────
function useTTS() {
  const synthRef = useRef<SpeechSynthesis | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      window.speechSynthesis.getVoices()
    }
    return () => { synthRef.current?.cancel() }
  }, [])

  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const clean = cleanForTTS(text)
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = 'es-ES'; utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1
    const go = () => {
      const voices = synthRef.current!.getVoices()
      const v =
        voices.find(v => v.name === 'Microsoft Laura - Spanish (Spain)') ||
        voices.find(v => v.name === 'Microsoft Helena - Spanish (Spain)') ||
        voices.find(v => v.name === 'Microsoft Sabina - Spanish (Mexico)') ||
        voices.find(v => v.lang.startsWith('es'))
      if (v) utt.voice = v
      utt.onstart = () => onStart?.()
      utt.onend   = () => onEnd?.()
      utt.onerror = () => onEnd?.()
      synthRef.current!.speak(utt)
    }
    setTimeout(go, 100)
  }, [])

  const stop = useCallback(() => { synthRef.current?.cancel() }, [])
  return { speak, stop }
}

// ── Speech Recognition ────────────────────────────────────────
function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported]     = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setSupported(!!SRC)
    }
  }, [])

  const startListening = useCallback(async (
    onResult: (text: string) => void,
    onErr: (msg: string) => void,
  ) => {
    if (typeof window === 'undefined') return
    const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SRC) { onErr('browser'); return }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      onErr('permission')
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const sr = new SRC()
    sr.lang = 'es-ES'
    sr.continuous = false
    sr.interimResults = false
    sr.maxAlternatives = 3

    sr.onstart  = () => setIsListening(true)
    sr.onend    = () => setIsListening(false)
    sr.onerror  = (e: any) => {
      setIsListening(false)
      if (e.error === 'no-speech') onErr('no-speech')
      else if (e.error !== 'aborted') onErr(e.error)
    }
    sr.onresult = (e: any) => {
      const best = e.results[0][0].transcript.trim()
      onResult(best)
    }

    recognitionRef.current = sr
    try { sr.start() } catch {}
  }, [])

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    setIsListening(false)
  }, [])

  return { isListening, supported, startListening, stopListening }
}

// ── Burbuja ───────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2,-2)}</strong>
        : <span key={i}>{p}</span>
    )
  return (
    <div style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:10, animation:'fadeUp 0.3s ease' }}>
      <div style={{
        maxWidth:'82%', padding:'10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? `linear-gradient(135deg,${C.terra},#E8943A)` : 'rgba(255,255,255,0.95)',
        color: isUser ? 'white' : C.brown,
        fontSize:13, lineHeight:1.6,
        border: isUser ? 'none' : `1px solid rgba(196,118,58,0.15)`,
        boxShadow:'0 2px 8px rgba(42,30,21,0.07)',
        backdropFilter:'blur(8px)', whiteSpace:'pre-wrap',
      }}>
        {renderText(msg.content)}
        <div style={{ fontSize:10, marginTop:5, opacity:0.55, textAlign:isUser?'right':'left', color:isUser?'rgba(255,255,255,0.8)':C.grayb }}>
          {msg.timestamp.toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
      <div style={{
        padding:'10px 16px', borderRadius:'18px 18px 18px 4px',
        background:'rgba(255,255,255,0.95)', border:`1px solid rgba(196,118,58,0.15)`,
        display:'flex', gap:5, alignItems:'center',
      }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:7, height:7, borderRadius:'50%', background:C.terra,
            animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
          }}/>
        ))}
      </div>
    </div>
  )
}

// ── Banner de práctica activa — diseño premium ────────────────
function SoundWaves({ active }: { active: boolean }) {
  const bars = [3, 6, 9, 7, 4, 8, 5, 10, 6, 3]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:24 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width:3, borderRadius:3,
          background:'rgba(255,255,255,0.8)',
          height: active ? `${h * 2.2}px` : `${Math.max(h * 0.6, 4)}px`,
          transition:'height 0.15s ease',
          animation: active ? `wave 0.8s ease-in-out ${i * 0.08}s infinite alternate` : 'none',
        }}/>
      ))}
    </div>
  )
}

function PracticeBanner({
  word, isListening, onPress, onStop, onCancel,
}: {
  word: string, isListening: boolean,
  onPress: () => void, onStop: () => void, onCancel: () => void,
}) {
  return (
    <div style={{
      margin:'0 10px 8px',
      borderRadius:20,
      overflow:'hidden',
      position:'relative',
      boxShadow: isListening
        ? '0 8px 32px rgba(231,76,60,0.35), 0 2px 8px rgba(0,0,0,0.1)'
        : '0 8px 24px rgba(42,30,21,0.18), 0 2px 6px rgba(0,0,0,0.08)',
      animation: isListening ? 'recordingPulse 1.2s ease-in-out infinite' : 'none',
    }}>
      {/* Fondo con gradiente */}
      <div style={{
        position:'absolute', inset:0,
        background: isListening
          ? `linear-gradient(135deg, #C0392B 0%, #E74C3C 50%, #C0392B 100%)`
          : `linear-gradient(135deg, ${C.terrab} 0%, ${C.terra} 60%, #D4854A 100%)`,
        transition:'background 0.4s ease',
      }}/>
      {/* Círculo decorativo de fondo */}
      <div style={{
        position:'absolute', right:-20, top:-20,
        width:100, height:100, borderRadius:'50%',
        background:'rgba(255,255,255,0.07)',
      }}/>
      <div style={{
        position:'absolute', right:30, bottom:-30,
        width:70, height:70, borderRadius:'50%',
        background:'rgba(255,255,255,0.05)',
      }}/>

      {/* Contenido */}
      <div style={{
        position:'relative', zIndex:1,
        padding:'12px 14px',
        display:'flex', alignItems:'center', gap:12,
      }}>

        {/* Botón micrófono circular */}
        <button
          onClick={isListening ? onStop : onPress}
          style={{
            width:48, height:48, borderRadius:'50%', flexShrink:0,
            background: isListening
              ? 'rgba(255,255,255,0.25)'
              : 'rgba(255,255,255,0.22)',
            border:'2px solid rgba(255,255,255,0.55)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
            boxShadow: isListening
              ? '0 0 0 4px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.2)'
              : '0 4px 12px rgba(0,0,0,0.15)',
            transition:'all 0.2s',
            fontSize:20,
          }}
          onMouseEnter={e => (e.currentTarget.style.transform='scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
        >
          {isListening
            ? <span style={{ width:14, height:14, borderRadius:2, background:'white', display:'block' }}/>
            : <span style={{ fontSize:22 }}>🎤</span>
          }
        </button>

        {/* Centro: label + palabra */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase',
            color:'rgba(255,255,255,0.75)', marginBottom:3,
          }}>
            {isListening ? 'Escuchando...' : 'Practica la pronunciación'}
          </div>
          <div style={{
            fontSize:16, fontWeight:900, color:'white',
            letterSpacing:0.3, lineHeight:1.2,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {word}
          </div>
          {/* Ondas de sonido */}
          <div style={{ marginTop:5 }}>
            <SoundWaves active={isListening}/>
          </div>
        </div>

        {/* Derecha: estado o controles */}
        {isListening ? (
          <div style={{
            flexShrink:0, display:'flex', flexDirection:'column',
            alignItems:'center', gap:4,
          }}>
            <div style={{
              width:10, height:10, borderRadius:'50%', background:'white',
              animation:'blink 0.6s ease-in-out infinite',
            }}/>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.8)', fontWeight:700, letterSpacing:0.5 }}>REC</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink:0 }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background:'rgba(255,255,255,0.2)',
              border:'2px solid rgba(255,255,255,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer',
              animation:'pulseGreen 2s ease-in-out infinite',
            }}
            onClick={onPress}
            >
              <span style={{ fontSize:14, marginLeft:2, color:'white' }}>▶</span>
            </div>

            <button
              onClick={onCancel}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(0,0,0,0.25)', border: 'none',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: 10,
                fontWeight: 'bold', outline: 'none'
              }}
              title="Cancelar práctica"
            >✕</button>
          </div>
        )}
      </div>

      {/* Hint inferior */}
      {!isListening && (
        <div style={{
          position:'relative', zIndex:1,
          borderTop:'1px solid rgba(255,255,255,0.12)',
          padding:'6px 14px',
          fontSize:10, color:'rgba(255,255,255,0.65)',
          fontWeight:500, letterSpacing:0.2,
        }}>
          Toca el micrófono o el botón ▶ y di la palabra en voz alta
        </div>
      )}
    </div>
  )
}


// ── WIDGET PRINCIPAL ──────────────────────────────────────────
export default function YachaqWidget() {
  const [isOpen,    setIsOpen]    = useState(false)
  const [messages,  setMessages]  = useState<Message[]>([
    { role:'assistant', content:WELCOME, timestamp:new Date() }
  ])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [muted,     setMuted]     = useState(false)
  const [hasNew,    setHasNew]    = useState(false)

  // Pronunciación: la palabra activa que el usuario debe practicar
  const [practiceWord, setPracticeWord] = useState<string | null>(null)
  const [pronLoading,  setPronLoading]  = useState(false)
  // Ref para persistir la última palabra conocida (para cuando la IA no la repite)
  const lastWordRef = useRef<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const { speak, stop } = useTTS()
  const { isListening, supported, startListening, stopListening } = useSpeechRecognition()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, loading, pronLoading, practiceWord])

  const hasSpokenWelcome = useRef(false)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setHasNew(false)
      if (!hasSpokenWelcome.current && !muted) {
        hasSpokenWelcome.current = true
        setTimeout(() => {
          speak("¡Allin p'unchaw! Soy Yachaq. ¿Qué quieres aprender hoy?",
            () => setIsTalking(true), () => setIsTalking(false))
        }, 800)
      }
    } else {
      stop(); stopListening(); setIsTalking(false); setPracticeWord(null)
    }
  }, [isOpen, stop, stopListening, muted, speak])

  // ── Iniciar escucha de pronunciación ──────────────────────
  const startPractice = useCallback((word: string) => {
    if (isListening) return
    stop(); setIsTalking(false)
    setPracticeWord(word)
    lastWordRef.current = word

    startListening(
      async (spoken: string) => {
        setPracticeWord(null)
        setPronLoading(true)

        // Mostrar lo que dijo el usuario
        setMessages(prev => [...prev, {
          role: 'user',
          content: `🎤 "${spoken}"`,
          timestamp: new Date(),
        }])

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: spoken,
              history: [],
              pronunciationCheck: true,
              targetWord: word,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)

          // Intentar extraer nueva palabra, si no, mantener la misma
          const newWord = extractPronunciationWord(data.response) ?? word
          lastWordRef.current = newWord

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            pronunciationWord: newWord, // Para mostrar botones de seguir practicando
          }])
          if (!isOpen) setHasNew(true)

          // Hablar respuesta (pero NO reactivar el banner automáticamente)
          if (!muted) {
            setTimeout(() => speak(
              data.response,
              () => setIsTalking(true),
              () => setIsTalking(false)
            ), 300)
          }

        } catch {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Pampachaway 😔 No pude evaluar. ¿Lo intentamos de nuevo?',
            timestamp: new Date(),
            pronunciationWord: word, // Para mostrar botones en caso de fallo
          }])
        } finally {
          setPronLoading(false)
        }
      },
      (errMsg: string) => {
        if (errMsg === 'no-speech') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🎤 No escuché nada. Pulsa el micrófono e intenta decir **"${word}"** más cerca.`,
            timestamp: new Date(),
          }])
          // Mantener el banner activo
          setPracticeWord(word)
        } else if (errMsg === 'permission') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ Necesito permiso de micrófono. Haz clic en el ícono 🔒 de la barra del navegador y permite el micrófono.',
            timestamp: new Date(),
          }])
          setPracticeWord(null)
        } else if (errMsg === 'browser') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ Tu navegador no soporta el micrófono. Por favor usa Chrome o Edge.',
            timestamp: new Date(),
          }])
          setPracticeWord(null)
        } else {
          // Otro error — mantener el banner por si acaso
          setPracticeWord(word)
        }
      },
    )
  }, [isListening, isOpen, muted, speak, startListening, stop])

  // ── Enviar mensaje de texto normal ────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading || pronLoading) return

    setMessages(prev => [...prev, { role:'user', content:trimmed, timestamp:new Date() }])
    setInput('')
    setLoading(true)
    stop(); stopListening(); setIsTalking(false); setPracticeWord(null)

    try {
      const history = messages
        .filter(m => m.content !== WELCOME)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ message:trimmed, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Extraer palabra a practicar de la respuesta
      const detectedWord = extractPronunciationWord(data.response)
      const wantsPractice = userWantsToPractice(trimmed)

      // La palabra activa: detectada en esta respuesta, o la última conocida si el usuario aceptó practicar
      let activeWord: string | null = null
      if (detectedWord) {
        activeWord = detectedWord
        lastWordRef.current = detectedWord
      } else if (wantsPractice && lastWordRef.current) {
        // El usuario quiere practicar — usar la última palabra
        activeWord = lastWordRef.current
      } else if (lastWordRef.current) {
        // Cualquier respuesta — siempre ofrecer practicar la última palabra conocida
        activeWord = lastWordRef.current
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }])
      if (!isOpen) setHasNew(true)

      if (!muted) {
        setTimeout(() => speak(
          data.response,
          () => setIsTalking(true),
          () => {
            setIsTalking(false)
            // Mostrar banner de práctica al terminar de hablar
            if (activeWord) setTimeout(() => setPracticeWord(activeWord), 500)
          }
        ), 300)
      } else if (activeWord) {
        setTimeout(() => setPracticeWord(activeWord), 400)
      }
    } catch {
      setMessages(prev => [...prev, {
        role:'assistant', content:'Pampachaway 😔 Tuve un problema. ¿Puedes intentar de nuevo?', timestamp:new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, pronLoading, isOpen, muted, speak, stop, stopListening])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const isBusy   = loading || pronLoading || isListening
  const showBanner = practiceWord && !loading && !pronLoading

  return (
    <>
      {isOpen && (
        <div style={{
          position:'fixed', bottom:92, right:20,
          width:370, height:620,
          borderRadius:26,
          background:'rgba(254,250,245,0.97)',
          backdropFilter:'blur(20px)',
          border:`1.5px solid rgba(196,118,58,0.2)`,
          boxShadow:'0 24px 64px rgba(42,30,21,0.28)',
          display:'flex', flexDirection:'column',
          zIndex:1000,
          animation:'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          overflow:'hidden', fontFamily:'Poppins,sans-serif',
        }}>

          {/* Header */}
          <div style={{
            background:`linear-gradient(180deg,${C.brown} 0%,#3A2818 100%)`,
            flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
            padding:'12px 16px 0',
          }}>
            <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:8}}>
              <button onClick={() => { if (!muted) { stop(); setIsTalking(false) }; setMuted(m=>!m) }}
                style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {muted ? '🔇' : '🔈'}
              </button>
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:15, fontWeight:800, color:'white', margin:0}}>Yachaq</p>
                <p style={{fontSize:10, margin:0, transition:'color 0.3s',
                  color: loading||pronLoading ? C.gold : isListening ? C.red : isTalking ? C.green : 'rgba(255,255,255,0.55)'}}>
                  {loading||pronLoading ? '⏳ Pensando...' : isListening ? '🎤 Escuchando...' : isTalking ? '🗣️ Hablando...' : '● Asistente de quechua'}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)}
                style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{
              width:130, height:130, borderRadius:'50%', overflow:'hidden',
              border:`4px solid ${isListening ? C.red : isTalking ? C.green : C.terra}`,
              transition:'border-color 0.4s, box-shadow 0.4s',
              boxShadow: isListening
                ? `0 0 0 8px rgba(231,76,60,0.25), 0 8px 24px rgba(0,0,0,0.4)`
                : isTalking
                ? `0 0 0 8px rgba(29,158,117,0.25), 0 8px 24px rgba(0,0,0,0.4)`
                : `0 0 0 0px rgba(196,118,58,0), 0 8px 24px rgba(0,0,0,0.3)`,
              marginBottom:-20, zIndex:2, position:'relative',
            }}>
              <LottieAvatar isTalking={isTalking || isListening}/>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex:1, overflowY:'auto', padding:'28px 14px 4px', display:'flex', flexDirection:'column' }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg}/>)}
            
            {/* Botones de respuesta rápida para seguir practicando */}
            {!loading && !pronLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].pronunciationWord && (
              <div style={{
                display: 'flex',
                gap: 8,
                padding: '8px 4px',
                alignSelf: 'center',
                marginBottom: 8
              }}>
                <button
                  onClick={() => {
                    const word = messages[messages.length - 1].pronunciationWord!
                    // Limpiar el estado de práctica del último mensaje para ocultar los botones
                    setMessages(prev => {
                      const copy = [...prev]
                      if (copy.length > 0) {
                        const last = { ...copy[copy.length - 1] }
                        delete last.pronunciationWord
                        copy[copy.length - 1] = last
                      }
                      return copy
                    })
                    // Iniciar la práctica
                    startPractice(word)
                  }}
                  style={{
                    fontSize: 11, padding: '6px 12px', borderRadius: 20,
                    background: C.greenl, border: `1.5px solid ${C.green}`,
                    color: C.greenb, cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(29,158,117,0.15)'
                  }}
                >
                  Sí, practicar de nuevo 🎙️
                </button>
                <button
                  onClick={() => {
                    // Limpiar el estado de práctica del último mensaje para ocultar los botones
                    setMessages(prev => {
                      const copy = [...prev]
                      if (copy.length > 0) {
                        const last = { ...copy[copy.length - 1] }
                        delete last.pronunciationWord
                        copy[copy.length - 1] = last
                      }
                      return copy
                    })
                    // Agregar un mensaje confirmando que continuamos
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: '¡Allin! Entendido, continuemos con el chat. ¿Qué más te gustaría saber?',
                      timestamp: new Date()
                    }])
                  }}
                  style={{
                    fontSize: 11, padding: '6px 12px', borderRadius: 20,
                    background: C.grayl, border: `1.5px solid ${C.gray}`,
                    color: C.graybb, cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s'
                  }}
                >
                  No, continuar chateando 💬
                </button>
              </div>
            )}

            {(loading || pronLoading) && <TypingIndicator/>}
            <div ref={messagesEndRef}/>
          </div>

          {/* ── BANNER DE PRÁCTICA ── aparece justo encima del input */}
          {showBanner && (
            <PracticeBanner
              word={practiceWord!}
              isListening={isListening}
              onPress={() => startPractice(practiceWord!)}
              onStop={() => { stopListening(); setPracticeWord(practiceWord) }}
              onCancel={() => setPracticeWord(null)}
            />
          )}

          {/* Sugerencias */}
          {messages.length <= 1 && !loading && !showBanner && (
            <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6 }}>
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  fontSize:11, padding:'5px 10px', borderRadius:20,
                  background:C.purplel, border:`1px solid #AFA9EC`,
                  color:C.purpleb, cursor:'pointer', fontWeight:600, fontFamily:'Poppins,sans-serif',
                }}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding:'10px 12px', borderTop:`1px solid rgba(196,118,58,0.12)`,
            display:'flex', gap:8, alignItems:'center', flexShrink:0,
            background:'rgba(255,255,255,0.7)', backdropFilter:'blur(10px)',
          }}>
            <input
              ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} disabled={isBusy}
              placeholder={showBanner ? `O escribe aquí...` : 'Pregunta en español o quechua...'}
              style={{
                flex:1, padding:'10px 14px', borderRadius:50,
                border:`1.5px solid ${input ? C.terra : 'rgba(196,118,58,0.2)'}`,
                background:'white', fontSize:13, outline:'none',
                fontFamily:'Poppins,sans-serif', color:C.brown, transition:'border 0.2s',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isBusy || !input.trim()}
              style={{
                width:40, height:40, borderRadius:'50%', flexShrink:0,
                background: !isBusy && input.trim() ? `linear-gradient(135deg,${C.terra},#E8943A)` : '#D4C4B8',
                border:'none', cursor: !isBusy && input.trim() ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, transition:'all 0.2s',
                boxShadow: !isBusy && input.trim() ? '0 4px 12px rgba(196,118,58,0.4)' : 'none',
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* FAB */}
      {!isOpen && (
        <div style={{ position:'fixed', bottom:20, right:20, zIndex:1001, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{
            background:C.brown, color:C.gold, padding:'6px 12px', borderRadius:20,
            fontSize:11, fontWeight:700, fontFamily:'Poppins,sans-serif', whiteSpace:'nowrap',
            boxShadow:'0 4px 14px rgba(42,30,21,0.3)', animation:'floatBadge 2s ease-in-out infinite',
          }}>
            💬 ¡Pregúntame en quechua!
          </div>
          <div style={{position:'relative', width:72, height:72}}>
            <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:`2px solid rgba(196,118,58,0.3)`, animation:'ringPulse 2s ease-out infinite' }}/>
            <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`2px solid rgba(196,118,58,0.5)`, animation:'ringPulse 2s ease-out infinite 0.4s' }}/>
            <button
              onClick={() => setIsOpen(true)}
              style={{
                width:72, height:72, borderRadius:'50%',
                background:`linear-gradient(135deg,${C.terra},#E8943A)`,
                border:`3px solid white`, cursor:'pointer', padding:0, overflow:'hidden',
                boxShadow:'0 8px 28px rgba(196,118,58,0.6)',
                animation:'fabBounce 3s ease-in-out infinite',
                position:'relative', zIndex:2, transition:'transform 0.2s',
              }}
              title="Yachaq — Asistente de quechua"
              onMouseEnter={e => (e.currentTarget.style.transform='scale(1.12)')}
              onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
            >
              <LottieAvatar isTalking={false}/>
            </button>
            {hasNew && (
              <div style={{
                position:'absolute', top:0, right:0, width:18, height:18, borderRadius:'50%',
                background:'#E74C3C', border:'2.5px solid white', zIndex:3,
                animation:'popIn 0.3s ease', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, color:'white', fontWeight:900,
              }}>!</div>
            )}
          </div>
        </div>
      )}

      {/* Botón cerrar */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position:'fixed', bottom:20, right:20, width:56, height:56, borderRadius:'50%',
            background:`linear-gradient(135deg,${C.brown},#4A3020)`,
            border:'none', cursor:'pointer', zIndex:1001,
            boxShadow:'0 4px 16px rgba(42,30,21,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, color:'white', transition:'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform='scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
        >✕</button>
      )}

      <style>{`
        @keyframes pulseGreen {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.8; transform:scale(1.1); }
        }
        @keyframes recordingPulse {
          0%,100% { transform:scale(1); box-shadow:0 8px 32px rgba(231,76,60,0.35); }
          50% { transform:scale(1.01); box-shadow:0 12px 40px rgba(231,76,60,0.55); }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50% { opacity:0.1; }
        }
        @keyframes wave {
          0% { transform:scaleY(0.4); }
          100% { transform:scaleY(1.0); }
        }
      `}</style>
    </>
  )
}