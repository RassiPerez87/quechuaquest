'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const C = {
  brown:'#2A1E15', terra:'#C4763A', terral:'#FFF0E6', terrab:'#8B4E1F',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56',
  purple:'#534AB7', purplel:'#EEEDFE', purpleb:'#3C3489',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806',
  gray:'#B4B2A9', grayl:'#F1EFE8', grayb:'#888780', graybb:'#5F5E5A',
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const WELCOME = `¡Allin p'unchaw! Soy **Yachaq**, tu asistente de quechua cochabambino.

Puedo ayudarte con:
• Traducir palabras y frases
• Explicar gramática y sufijos
• Conjugar verbos
• Cultura andina

¿Qué quieres aprender hoy?`

const SUGGESTIONS = [
  '¿Cómo se dice tomate?',
  '¿Qué significa allin?',
  'Enséñame a saludar',
  'Conjuga el verbo comer',
]

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
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '/lottie/Talking_maya_avatar.json',
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
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
        script.setAttribute('data-lottie', 'true')
        script.onload = initAnim
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', initAnim)
      }
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
        loadedRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current || !animRef.current) return
    try {
      if (isTalking) {
        animRef.current.goToAndPlay(0, true)
      } else {
        animRef.current.goToAndStop(0, true)
      }
    } catch (e) {}
  }, [isTalking])

  return (
    <div style={{
      width:'100%', height:'100%',
      background:`linear-gradient(135deg,${C.terral},${C.goldl})`,
    }}>
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
      // Pre-cargar voces
      window.speechSynthesis.getVoices()
    }
    return () => { synthRef.current?.cancel() }
  }, [])

  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    if (!synthRef.current) return
    synthRef.current.cancel()

    const clean = text.replace(/\*\*/g, '').replace(/•/g, '').replace(/\n/g, ' ').trim()
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = 'es-ES'
    utt.rate = 0.88
    utt.pitch = 1.05
    utt.volume = 1

    const setVoiceAndSpeak = () => {
      const voices = synthRef.current!.getVoices()
      // Voz femenina específica por nombre
      const spanishVoice = 
        voices.find(v => v.name === 'Microsoft Laura - Spanish (Spain)') ||
        voices.find(v => v.name === 'Microsoft Helena - Spanish (Spain)') ||
        voices.find(v => v.name === 'Microsoft Sabina - Spanish (Mexico)') ||
        voices.find(v => v.lang.startsWith('es'))
      if (spanishVoice) utt.voice = spanishVoice

      utt.onstart = () => onStart?.()
      utt.onend   = () => onEnd?.()
      utt.onerror = () => onEnd?.()
      synthRef.current!.speak(utt)
    }

    // Pequeño delay para que las voces estén cargadas
    setTimeout(setVoiceAndSpeak, 100)
  }, [])

  const stop = useCallback(() => { synthRef.current?.cancel() }, [])

  return { speak, stop }
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
    <div style={{ display:'flex', justifyContent: isUser?'flex-end':'flex-start', marginBottom:10, animation:'fadeUp 0.3s ease' }}>
      <div style={{
        maxWidth:'80%', padding:'10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? `linear-gradient(135deg,${C.terra},#E8943A)` : 'rgba(255,255,255,0.95)',
        color: isUser ? 'white' : C.brown,
        fontSize:13, lineHeight:1.6,
        border: isUser ? 'none' : `1px solid rgba(196,118,58,0.15)`,
        boxShadow:'0 2px 8px rgba(42,30,21,0.07)',
        backdropFilter:'blur(8px)', whiteSpace:'pre-wrap',
      }}>
        {renderText(msg.content)}
        <div style={{ fontSize:10, marginTop:4, opacity:0.6, textAlign: isUser?'right':'left', color: isUser?'rgba(255,255,255,0.8)':C.grayb }}>
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

// ── WIDGET PRINCIPAL ──────────────────────────────────────────
export default function YachaqWidget() {
  const [isOpen, setIsOpen]       = useState(false)
  const [messages, setMessages]   = useState<Message[]>([
    { role:'assistant', content:WELCOME, timestamp:new Date() }
  ])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [muted, setMuted]         = useState(false)
  const [hasNew, setHasNew]       = useState(false)
  const messagesEndRef             = useRef<HTMLDivElement>(null)
  const inputRef                   = useRef<HTMLInputElement>(null)
  const { speak, stop }            = useTTS()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, loading])

  // Hablar bienvenida al abrir por primera vez
  const hasSpokenWelcome = useRef(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setHasNew(false)
      // Hablar bienvenida solo la primera vez que se abre
      if (!hasSpokenWelcome.current && !muted) {
        hasSpokenWelcome.current = true
        const welcomeText = "¡Allin p'unchaw! Soy Yachaq, tu asistente de quechua cochabambino. ¿Qué quieres aprender hoy?"
        setTimeout(() => {
          speak(welcomeText, () => setIsTalking(true), () => setIsTalking(false))
        }, 800)
      }
    } else {
      stop()
      setIsTalking(false)
    }
  }, [isOpen, stop, muted, speak])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, { role:'user', content:trimmed, timestamp:new Date() }])
    setInput('')
    setLoading(true)
    stop()
    setIsTalking(false)

    try {
      const history = messages
        .filter(m => m.content !== WELCOME)
        .map(m => ({ role:m.role, content:m.content }))

      const res  = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ message:trimmed, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const reply: Message = { role:'assistant', content:data.response, timestamp:new Date() }
      setMessages(prev => [...prev, reply])
      if (!isOpen) setHasNew(true)

      if (!muted) {
        setTimeout(() => {
          speak(data.response, () => setIsTalking(true), () => setIsTalking(false))
        }, 300)
      }
    } catch {
      setMessages(prev => [...prev, {
        role:'assistant',
        content:'Pampachaway 😔 Tuve un problema. ¿Puedes intentar de nuevo?',
        timestamp:new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, isOpen, muted, speak, stop])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const toggleMute = () => {
    if (!muted) { stop(); setIsTalking(false) }
    setMuted(m => !m)
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.85) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(196,118,58,0.5)}70%{box-shadow:0 0 0 12px rgba(196,118,58,0)}}
        @keyframes talkRing{0%,100%{box-shadow:0 0 0 0 rgba(29,158,117,0.7)}50%{box-shadow:0 0 0 8px rgba(29,158,117,0)}}
        @keyframes fabBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes ringPulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.6);opacity:0}}
        @keyframes floatBadge{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>

      {isOpen && (
        <div style={{
          position:'fixed', bottom:92, right:20,
          width:370, height:600,
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

          {/* Header con avatar grande */}
          <div style={{
            background:`linear-gradient(180deg,${C.brown} 0%,#3A2818 100%)`,
            flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
            padding:'12px 16px 0',
            position:'relative',
          }}>
            {/* Botones arriba */}
            <div style={{display:'flex',justifyContent:'space-between',width:'100%',marginBottom:8}}>
              <button onClick={toggleMute} title={muted?'Activar audio':'Silenciar'} style={{
                background:'rgba(255,255,255,0.12)', border:'none', color:'white',
                width:32, height:32, borderRadius:'50%', cursor:'pointer',
                fontSize:15, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {muted ? '🔇' : '🔈'}
              </button>
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:15,fontWeight:800,color:'white',margin:0}}>Yachaq</p>
                <p style={{fontSize:10,margin:0,transition:'color 0.3s',
                  color: loading ? C.gold : isTalking ? C.green : 'rgba(255,255,255,0.55)'}}>
                  {loading ? '⏳ Pensando...' : isTalking ? '🗣️ Hablando...' : '● Asistente de quechua'}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} style={{
                background:'rgba(255,255,255,0.12)', border:'none', color:'white',
                width:32, height:32, borderRadius:'50%', cursor:'pointer',
                fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
            </div>

            {/* Avatar grande centrado */}
            <div style={{
              width:130, height:130, borderRadius:'50%', overflow:'hidden',
              border:`4px solid ${isTalking ? C.green : C.terra}`,
              transition:'border-color 0.4s, box-shadow 0.4s',
              boxShadow: isTalking
                ? `0 0 0 6px rgba(29,158,117,0.3), 0 8px 24px rgba(0,0,0,0.4)`
                : `0 0 0 0px rgba(196,118,58,0), 0 8px 24px rgba(0,0,0,0.3)`,
              marginBottom:-20, zIndex:2, position:'relative',
            }}>
              <LottieAvatar isTalking={isTalking}/>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex:1, overflowY:'auto', padding:'28px 14px 4px', display:'flex', flexDirection:'column' }}>
            {messages.map((msg,i) => <MessageBubble key={i} msg={msg}/>)}
            {loading && <TypingIndicator/>}
            <div ref={messagesEndRef}/>
          </div>

          {/* Sugerencias */}
          {messages.length <= 1 && !loading && (
            <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6 }}>
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  fontSize:11, padding:'5px 10px', borderRadius:20,
                  background:C.purplel, border:`1px solid #AFA9EC`,
                  color:C.purpleb, cursor:'pointer', fontWeight:600,
                  fontFamily:'Poppins,sans-serif',
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
              onKeyDown={handleKey} disabled={loading}
              placeholder="Pregunta en español o quechua..."
              style={{
                flex:1, padding:'10px 14px', borderRadius:50,
                border:`1.5px solid ${input ? C.terra : 'rgba(196,118,58,0.2)'}`,
                background:'white', fontSize:13, outline:'none',
                fontFamily:'Poppins,sans-serif', color:C.brown, transition:'border 0.2s',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width:40, height:40, borderRadius:'50%', flexShrink:0,
                background: input.trim()&&!loading ? `linear-gradient(135deg,${C.terra},#E8943A)` : '#D4C4B8',
                border:'none', cursor: input.trim()&&!loading ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, transition:'all 0.2s',
                boxShadow: input.trim()&&!loading ? '0 4px 12px rgba(196,118,58,0.4)' : 'none',
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* FAB llamativo */}
      {!isOpen && (
        <div style={{
          position:'fixed', bottom:20, right:20,
          zIndex:1001, display:'flex', flexDirection:'column',
          alignItems:'center', gap:6,
        }}>
          {/* Tooltip flotante */}
          <div style={{
            background:C.brown, color:C.gold,
            padding:'6px 12px', borderRadius:20,
            fontSize:11, fontWeight:700,
            fontFamily:'Poppins,sans-serif',
            whiteSpace:'nowrap',
            boxShadow:'0 4px 14px rgba(42,30,21,0.3)',
            animation:'floatBadge 2s ease-in-out infinite',
          }}>
            💬 ¡Pregúntame en quechua!
          </div>

          {/* Anillos de pulso */}
          <div style={{position:'relative', width:72, height:72}}>
            <div style={{
              position:'absolute', inset:-8,
              borderRadius:'50%',
              border:`2px solid rgba(196,118,58,0.3)`,
              animation:'ringPulse 2s ease-out infinite',
            }}/>
            <div style={{
              position:'absolute', inset:-4,
              borderRadius:'50%',
              border:`2px solid rgba(196,118,58,0.5)`,
              animation:'ringPulse 2s ease-out infinite 0.4s',
            }}/>

            {/* Botón principal */}
            <button
              onClick={() => setIsOpen(true)}
              style={{
                width:72, height:72, borderRadius:'50%',
                background:`linear-gradient(135deg,${C.terra},#E8943A)`,
                border:`3px solid white`,
                cursor:'pointer', padding:0, overflow:'hidden',
                boxShadow:'0 8px 28px rgba(196,118,58,0.6)',
                animation:'fabBounce 3s ease-in-out infinite',
                position:'relative', zIndex:2,
                transition:'transform 0.2s',
              }}
              title="Yachaq — Asistente de quechua"
              onMouseEnter={e => (e.currentTarget.style.transform='scale(1.12)')}
              onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
            >
              <LottieAvatar isTalking={false}/>
            </button>

            {/* Burbuja de notificación */}
            {hasNew && (
              <div style={{
                position:'absolute', top:0, right:0,
                width:18, height:18, borderRadius:'50%',
                background:'#E74C3C', border:'2.5px solid white',
                zIndex:3, animation:'popIn 0.3s ease',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, color:'white', fontWeight:900,
              }}>!</div>
            )}
          </div>
        </div>
      )}

      {/* Botón cerrar cuando está abierto */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position:'fixed', bottom:20, right:20,
            width:56, height:56, borderRadius:'50%',
            background:`linear-gradient(135deg,${C.brown},#4A3020)`,
            border:'none', cursor:'pointer', zIndex:1001,
            boxShadow:'0 4px 16px rgba(42,30,21,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, color:'white',
            transition:'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform='scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
        >✕</button>
      )}
    </>
  )
}