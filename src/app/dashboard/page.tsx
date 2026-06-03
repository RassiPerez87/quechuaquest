'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getUserProgress, getAllLessons, buildPathNodes, getLevelLabel } from '@/lib/progress'
import type { UserProgress, Lesson, PathNode } from '@/lib/types'

const C = {
  cream:'#FEFAF5', brown:'#2A1E15', terra:'#C4763A',
  terral:'#F4E4D4', terrab:'#8B4E1F', terrag:'#FFF0E6',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56', greend:'#5DCAA5',
  purple:'#534AB7', purplel:'#EEEDFE', purpleb:'#3C3489', purpled:'#AFA9EC',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806', goldd:'#EF9F27',
  gray:'#B4B2A9', grayl:'#F1EFE8', grayb:'#888780', graybb:'#5F5E5A',
}

const LEVEL_ICON: Record<string,string> = {
  basico:'🌱', intermedio:'🏔️', avanzado:'🦅', maestria:'⭐',
}
const LEVEL_PAL: Record<string,{main:string;dark:string;light:string;glow:string;mid:string}> = {
  basico:    {main:C.green,  dark:C.greenb,  light:C.greenl,  glow:'rgba(29,158,117,0.4)',  mid:C.greend},
  intermedio:{main:C.purple, dark:C.purpleb, light:C.purplel, glow:'rgba(83,74,183,0.4)',   mid:C.purpled},
  avanzado:  {main:C.terra,  dark:C.terrab,  light:C.terral,  glow:'rgba(196,118,58,0.4)',  mid:'#F0997B'},
  maestria:  {main:C.brown,  dark:C.goldb,   light:C.goldl,   glow:'rgba(250,199,117,0.35)',mid:C.gold},
}

function shortId(id: string) {
  return id.replace('basico-','B-').replace('intermedio-','I-')
           .replace('avanzado-','A-').replace('maestria-','M-')
}

// ── Patrón andino ─────────────────────────────────────────────
function AndinoPattern() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60"
      style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',opacity:0.035,pointerEvents:'none'}}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="andino" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <polygon points="15,2 28,15 15,28 2,15" fill="none" stroke="#C4763A" strokeWidth="1"/>
          <polygon points="15,8 22,15 15,22 8,15" fill="#C4763A" opacity="0.5"/>
          <circle cx="0"  cy="0"  r="1.5" fill="#C4763A"/>
          <circle cx="30" cy="0"  r="1.5" fill="#C4763A"/>
          <circle cx="0"  cy="30" r="1.5" fill="#C4763A"/>
          <circle cx="30" cy="30" r="1.5" fill="#C4763A"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#andino)"/>
    </svg>
  )
}

// ── Decoraciones entre nodos ──────────────────────────────────
const DECOS = ['🌸','🦙','⛰️','☀️','🌺','🌿','✦']
function Deco({ idx }: { idx: number }) {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',opacity:0.45,padding:'1px 0'}}>
      <span style={{fontSize:14}}>{DECOS[idx % DECOS.length]}</span>
    </div>
  )
}

// ── Nodo CONTENIDO ────────────────────────────────────────────
function ContentNode({ node, side, onClick }: {
  node: PathNode; side:'left'|'right'|'center'; onClick:()=>void
}) {
  const [hov, setHov] = useState(false)
  const lesson = node.lesson!
  const isDone   = node.status === 'done'
  const isActive = node.status === 'active'
  const isLocked = node.status === 'locked'
  const p = LEVEL_PAL[lesson.level] ?? LEVEL_PAL.basico
  const size = isActive ? 72 : isDone ? 62 : 56

  return (
    <div style={{display:'flex',alignItems:'center',gap:12,
      flexDirection: side==='right' ? 'row-reverse' : 'row'}}
      onMouseEnter={() => !isLocked && setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Nodo circular */}
      <div style={{position:'relative',flexShrink:0}}>
        {isActive && (
          <div style={{position:'absolute',inset:-8,borderRadius:'50%',
            background:p.glow,animation:'pulseRing 2s ease-in-out infinite'}}/>
        )}
        <div onClick={isLocked ? undefined : onClick} style={{
          width:size, height:size, borderRadius:'50%', position:'relative', zIndex:1,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          transform: hov && !isLocked ? 'scale(1.14) translateY(-4px)' : 'scale(1)',
          border:'3px solid',
          ...(isDone   && {background:`linear-gradient(145deg,${p.main},${p.dark})`,borderColor:p.dark,boxShadow:`0 4px 14px ${p.glow}`}),
          ...(isActive && {background:`linear-gradient(145deg,${p.main},${p.mid})`,borderColor:p.dark,boxShadow:`0 6px 22px ${p.glow}`}),
          ...(isLocked && {background:'linear-gradient(145deg,#ECEAE4,#D8D6CE)',borderColor:'#C8C6BE'}),
        }}>
          <span style={{fontSize:isActive?22:isDone?18:16,lineHeight:1}}>
            {isLocked ? '🔒' : isDone ? '★' : LEVEL_ICON[lesson.level]}
          </span>
          <span style={{fontSize:8,fontWeight:800,marginTop:3,letterSpacing:'0.04em',
            color: isLocked ? '#B0AEA6' : 'rgba(255,255,255,0.9)'}}>
            {shortId(lesson.id)}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div onClick={isLocked ? undefined : onClick} style={{
        flex:1, maxWidth:200,
        background: isLocked ? C.grayl : isDone ? p.light : 'white',
        border:`1.5px solid ${isLocked ? '#D3D1C7' : p.mid}`,
        borderRadius:14, padding:'9px 12px',
        textAlign: side==='right' ? 'right' : 'left',
        cursor: isLocked ? 'default' : 'pointer',
        transition:'transform 0.2s, box-shadow 0.2s',
        transform: hov && !isLocked ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov && !isLocked ? `0 6px 18px ${p.glow}` : 'none',
        opacity: isLocked ? 0.6 : 1,
      }}>
        {/* Badge tipo */}
        <span style={{
          display:'inline-block',fontSize:9,padding:'2px 7px',borderRadius:20,
          fontWeight:800,marginBottom:4,
          background: isLocked ? '#D3D1C7' : '#E8E6F8',
          color: isLocked ? '#9B9892' : '#534AB7',
        }}>📖 CONTENIDO</span>
        <p style={{fontSize:12,fontWeight:800,color: isLocked ? C.grayb : C.brown,margin:'0 0 3px',lineHeight:1.3}}>
          {lesson.title_es || lesson.title}
        </p>
        {!isLocked && (
          <p style={{fontSize:10,color:C.graybb,margin:'0 0 5px',lineHeight:1.3}}>
            Diálogo · vocabulario · gramática
          </p>
        )}
        {isLocked && <p style={{fontSize:10,color:'#C8C6BE',margin:0}}>Bloqueado</p>}
        {!isLocked && (
          <span style={{
            fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:700,
            background: isDone ? p.dark : p.main, color:'#fff',
          }}>
            {isDone ? '✓ leído' : '● leer'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Nodo PRÁCTICA ─────────────────────────────────────────────
function PracticeNode({ node, side, onClick }: {
  node: PathNode; side:'left'|'right'|'center'; onClick:()=>void
}) {
  const [hov, setHov] = useState(false)
  const lesson = node.lesson!
  const isDone   = node.status === 'done'
  const isActive = node.status === 'active'
  const isLocked = node.status === 'locked'
  const p = LEVEL_PAL[lesson.level] ?? LEVEL_PAL.basico
  const size = isActive ? 68 : isDone ? 58 : 52

  // Colores especiales para nodo de práctica — más dorado/vibrante
  const practiceMain  = isDone ? C.goldb : isActive ? C.goldd : '#C8C6BE'
  const practiceBg    = isDone ? `linear-gradient(145deg,${C.goldd},${C.goldb})`
                       : isActive ? `linear-gradient(145deg,${C.gold},${C.goldd})`
                       : 'linear-gradient(145deg,#ECEAE4,#D8D6CE)'
  const practiceBorder = isDone ? C.goldb : isActive ? C.goldd : '#C8C6BE'
  const practiceGlow   = 'rgba(250,199,117,0.45)'

  return (
    <div style={{display:'flex',alignItems:'center',gap:12,
      flexDirection: side==='right' ? 'row-reverse' : 'row'}}
      onMouseEnter={() => !isLocked && setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{position:'relative',flexShrink:0}}>
        {isActive && (
          <div style={{position:'absolute',inset:-7,borderRadius:'50%',
            background:practiceGlow,animation:'pulseRing 2s ease-in-out infinite 0.3s'}}/>
        )}
        <div onClick={isLocked ? undefined : onClick} style={{
          width:size, height:size, borderRadius:'50%', position:'relative', zIndex:1,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          transform: hov && !isLocked ? 'scale(1.14) translateY(-4px)' : 'scale(1)',
          border:'3px solid', background: practiceBg, borderColor: practiceBorder,
          boxShadow: isLocked ? 'none' : `0 4px 14px ${practiceGlow}`,
          opacity: isLocked ? 0.55 : 1,
        }}>
          <span style={{fontSize:isActive?20:isDone?16:14,lineHeight:1}}>
            {isLocked ? '🔒' : isDone ? '⚡' : '🎯'}
          </span>
          <span style={{fontSize:8,fontWeight:800,marginTop:3,letterSpacing:'0.04em',
            color: isLocked ? '#B0AEA6' : isDone ? '#fff' : C.brown}}>
            {shortId(lesson.id)}
          </span>
        </div>
      </div>

      <div onClick={isLocked ? undefined : onClick} style={{
        flex:1, maxWidth:200,
        background: isLocked ? C.grayl : isDone ? C.goldl : 'white',
        border:`1.5px solid ${isLocked ? '#D3D1C7' : C.gold}`,
        borderRadius:14, padding:'9px 12px',
        textAlign: side==='right' ? 'right' : 'left',
        cursor: isLocked ? 'default' : 'pointer',
        transition:'transform 0.2s',
        transform: hov && !isLocked ? 'translateY(-3px)' : 'translateY(0)',
        opacity: isLocked ? 0.6 : 1,
      }}>
        <span style={{
          display:'inline-block',fontSize:9,padding:'2px 7px',borderRadius:20,
          fontWeight:800,marginBottom:4,
          background: isLocked ? '#D3D1C7' : '#FFF0C8',
          color: isLocked ? '#9B9892' : C.goldb,
        }}>⚡ PRÁCTICA</span>
        <p style={{fontSize:12,fontWeight:800,color: isLocked ? C.grayb : C.brown,margin:'0 0 3px',lineHeight:1.3}}>
          {lesson.title_es || lesson.title}
        </p>
        {!isLocked && (
          <>
            <p style={{fontSize:10,color:C.graybb,margin:'0 0 5px',lineHeight:1.3}}>
              12 ejercicios interactivos
            </p>
            <span style={{fontSize:9,padding:'2px 7px',borderRadius:20,fontWeight:700,
              background: isDone ? C.goldb : C.goldd,
              color: isDone ? '#fff' : C.brown}}>
              {isDone ? `✓ +${lesson.xp_reward} XP` : `+${lesson.xp_reward} XP`}
            </span>
          </>
        )}
        {isLocked && <p style={{fontSize:10,color:'#C8C6BE',margin:0}}>Lee el contenido primero</p>}
      </div>
    </div>
  )
}

// ── Tinku ─────────────────────────────────────────────────────
function TinkuNode({ node, onClick }: { node:PathNode; onClick:()=>void }) {
  const [hov, setHov] = useState(false)
  const isDone=node.status==='done', isActive=node.status==='active', isLocked=node.status==='locked'
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}
      onMouseEnter={() => !isLocked && setHov(true)}
      onMouseLeave={() => setHov(false)}>
      {/* Franjas wiphala */}
      <div style={{display:'flex',gap:5,width:'100%',maxWidth:320,justifyContent:'center'}}>
        {['#C4763A','#1D9E75','#534AB7','#1D9E75','#C4763A'].map((c,i)=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,background: isLocked ? '#D3D1C7' : c,opacity: isLocked ? 0.4 : 0.7}}/>
        ))}
      </div>
      <div onClick={isLocked ? undefined : onClick} style={{
        width:88,height:88,borderRadius:'50%',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        cursor: isLocked ? 'default' : 'pointer',
        transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov && !isLocked ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
        border:'3px solid',
        ...(isDone   && {background:`linear-gradient(145deg,${C.purple},${C.purpleb})`,borderColor:C.purpleb,boxShadow:'0 4px 16px rgba(83,74,183,0.35)'}),
        ...(isActive && {background:`linear-gradient(145deg,#7F77DD,${C.purple})`,borderColor:C.purpleb,boxShadow: hov ? '0 12px 30px rgba(83,74,183,0.5),0 0 0 8px #EEEDFE' : '0 5px 20px rgba(83,74,183,0.35),0 0 0 6px #EEEDFE'}),
        ...(isLocked && {background:'linear-gradient(145deg,#ECEAE4,#D8D6CE)',borderColor:'#C8C6BE',opacity:0.55}),
      }}>
        <span style={{fontSize:28,color: isLocked ? '#C8C6BE' : '#fff',lineHeight:1}}>◆</span>
        <span style={{fontSize:9,fontWeight:900,color: isLocked ? '#C8C6BE' : '#CECBF6',marginTop:4,letterSpacing:'0.06em'}}>TINKU</span>
      </div>
      <div onClick={isLocked ? undefined : onClick} style={{
        background: isLocked ? C.grayl : isDone ? '#F0EEF8' : C.purplel,
        border:`2px solid ${isLocked ? '#D3D1C7' : isDone ? C.purpled : C.purple}`,
        borderRadius:18,padding:'12px 18px',textAlign:'center',maxWidth:290,
        cursor: isLocked ? 'default' : 'pointer',
        transition:'transform 0.2s',
        transform: hov && !isLocked ? 'translateY(-3px)' : 'translateY(0)',
        opacity: isLocked ? 0.6 : 1,
      }}>
        <p style={{fontSize:14,fontWeight:900,color: isLocked ? C.grayb : C.purpleb,margin:'0 0 3px'}}>
          Tinku {node.tinkuNumber} — Checkpoint
        </p>
        <p style={{fontSize:11,color: isLocked ? C.grayb : '#7F77DD',margin:'0 0 8px'}}>
          15 preguntas mezcladas · todo lo aprendido
        </p>
        {!isLocked && (
          <span style={{
            display:'inline-block',fontSize:11,padding:'5px 14px',borderRadius:20,fontWeight:800,
            background: isDone ? C.purpleb : C.purple,color:'#fff',
            boxShadow: isDone ? 'none' : '0 3px 10px rgba(83,74,183,0.4)',
          }}>
            {isDone ? '✓ Superado' : '◆ ¡Pruébate ahora!'}
          </span>
        )}
      </div>
      <div style={{display:'flex',gap:5,width:'100%',maxWidth:320,justifyContent:'center'}}>
        {['#534AB7','#C4763A','#1D9E75','#C4763A','#534AB7'].map((c,i)=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,background: isLocked ? '#D3D1C7' : c,opacity: isLocked ? 0.3 : 0.6}}/>
        ))}
      </div>
    </div>
  )
}

// ── Hamut'ay ──────────────────────────────────────────────────
function HamutayNode({ node, onClick }: { node:PathNode; onClick:()=>void }) {
  const [hov, setHov] = useState(false)
  const isAvail = node.status !== 'locked'
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,
      padding:'10px 0',opacity: isAvail ? 1 : 0.35}}
      onMouseEnter={() => isAvail && setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{display:'flex',gap:10,justifyContent:'center',fontSize:15,opacity:0.65}}>
        <span>✦</span><span>✦</span><span>✦</span>
      </div>
      <div onClick={isAvail ? onClick : undefined} style={{
        width:96,height:96,borderRadius:'50%',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        cursor: isAvail ? 'pointer' : 'default',
        transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'scale(1.1) translateY(-5px)' : 'scale(1)',
        background:'linear-gradient(145deg,#3D2E20,#2A1E15)',
        border:`3px solid ${C.goldd}`,
        boxShadow: isAvail ? (hov ? `0 16px 40px rgba(42,30,21,0.5),0 0 0 10px ${C.goldl}` : `0 6px 24px rgba(42,30,21,0.3),0 0 0 6px ${C.goldl}`) : 'none',
      }}>
        <span style={{fontSize:32,color:C.gold,lineHeight:1}}>◉</span>
        <span style={{fontSize:8,fontWeight:900,color:C.gold,marginTop:4,letterSpacing:'0.06em'}}>HAMUT'AY</span>
      </div>
      <div onClick={isAvail ? onClick : undefined} style={{
        background: isAvail ? `linear-gradient(135deg,${C.goldl},#FFF4DC)` : C.grayl,
        border:`2px solid ${isAvail ? C.goldd : '#D3D1C7'}`,
        borderRadius:20,padding:'14px 22px',textAlign:'center',maxWidth:310,
        cursor: isAvail ? 'pointer' : 'default',
        transition:'transform 0.2s',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
      }}>
        <p style={{fontSize:15,fontWeight:900,color: isAvail ? C.goldb : C.grayb,margin:'0 0 3px'}}>Hamut'ay</p>
        <p style={{fontSize:11,color: isAvail ? '#854F0B' : C.grayb,margin:'0 0 10px'}}>
          Diagnóstico completo · 25 preguntas · perfil de habilidades
        </p>
        {isAvail && (
          <span style={{display:'inline-block',fontSize:12,padding:'6px 18px',borderRadius:20,
            fontWeight:800,background:C.brown,color:C.gold,boxShadow:'0 4px 14px rgba(42,30,21,0.3)'}}>
            ◉ Comenzar diagnóstico
          </span>
        )}
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'center',fontSize:15,opacity:0.65}}>
        <span>✦</span><span>✦</span><span>✦</span>
      </div>
    </div>
  )
}

// ── Neblina de nivel bloqueado ────────────────────────────────
function FogBanner({ level }: { level:string }) {
  const cfg: Record<string,{emoji:string;label:string}> = {
    intermedio:{emoji:'🏔️', label:'Intermedio'},
    avanzado:  {emoji:'🦅', label:'Avanzado'},
    maestria:  {emoji:'⭐', label:'Maestría'},
  }
  const c = cfg[level] ?? {emoji:'🔒', label:level}
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      gap:8, padding:'16px 20px', margin:'18px 0 6px',
      borderRadius:22, width:'100%',
      background:'linear-gradient(135deg,rgba(241,239,232,0.6),rgba(211,209,199,0.4))',
      border:'2px dashed #D3D1C7',
      backdropFilter:'blur(2px)',
    }}>
      <span style={{fontSize:28,opacity:0.35}}>{c.emoji}</span>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:13,fontWeight:900,color:'#C8C6BE',margin:0,textTransform:'uppercase',letterSpacing:'0.08em'}}>
          🔒 {c.label}
        </p>
        <p style={{fontSize:11,color:'#D3D1C7',margin:'3px 0 0'}}>
          Completa el nivel anterior para desbloquear
        </p>
      </div>
    </div>
  )
}

// ── Banner de nivel ───────────────────────────────────────────
function LevelBanner({ level, done }: { level:string; done:number }) {
  const cfg: Record<string,{bg:string;border:string;text:string;emoji:string;desc:string}> = {
    basico:    {bg:C.greenl,  border:C.greend,  text:C.greenb,  emoji:'🌱', desc:'Fundamentos del quechua'},
    intermedio:{bg:C.purplel, border:C.purpled, text:C.purpleb, emoji:'🏔️', desc:'Morfología y conversación'},
    avanzado:  {bg:C.terral,  border:'#F0997B', text:C.terrab,  emoji:'🦅', desc:'Expresión avanzada y cultura'},
    maestria:  {bg:C.goldl,   border:C.goldd,   text:C.goldb,   emoji:'⭐', desc:'Quechua cochabambino auténtico'},
  }
  const c = cfg[level] ?? cfg.basico
  return (
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'10px 18px',borderRadius:22,margin:'18px 0 6px',
      background:c.bg,border:`2px solid ${c.border}`,width:'100%',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:20}}>{c.emoji}</span>
        <div>
          <p style={{fontSize:12,fontWeight:900,color:c.text,margin:0,textTransform:'uppercase',letterSpacing:'0.08em'}}>
            {getLevelLabel(level)}
          </p>
          <p style={{fontSize:10,color:c.text,margin:0,opacity:0.7}}>{c.desc}</p>
        </div>
      </div>
      {done > 0 && (
        <span style={{fontSize:10,padding:'3px 10px',borderRadius:20,fontWeight:700,
          background:c.border,color:'#fff',opacity:0.9}}>
          {done} ✓
        </span>
      )}
    </div>
  )
}

// ── Conector del sendero ──────────────────────────────────────
function PathLine({ done, short }: { done:boolean; short?:boolean }) {
  const h = short ? 4 : 7
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'2px 0'}}>
      {[0,1,short?null:2].filter(x=>x!==null).map((i) => (
        <div key={i} style={{
          width:3,height:h,borderRadius:2,
          background: done ? `rgba(29,158,117,${1-(i as number)*0.22})` : `rgba(180,178,169,${0.5-(i as number)*0.1})`,
          transition:'background 0.4s',
        }}/>
      ))}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile]   = useState<any>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [nodes, setNodes]       = useState<PathNode[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const [pr, pg, ls] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      getUserProgress(user.id),
      getAllLessons(),
    ])
    setProfile(pr.data)
    setProgress(pg)
    if (pg && ls.length > 0) setNodes(buildPathNodes(ls, pg))
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',fontFamily:'Poppins,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:52,marginBottom:14,animation:'bounce 1s ease infinite'}}>🦙</div>
        <p style={{color:C.graybb,fontSize:14,fontWeight:600}}>Cargando tu sendero…</p>
      </div>
    </div>
  )

  const streakDays   = progress?.streak_days ?? profile?.streak_days ?? 0
  const xpTotal      = progress?.xp_total    ?? profile?.xp          ?? 0
  const completedN   = progress?.completed_lessons?.length ?? 0
  const currentLevel = progress?.current_level ?? profile?.level ?? 'basico'
  const firstName    = profile?.full_name?.split(' ')[0] ?? 'amigo'

  // Posiciones zigzag — 5 posiciones que se repiten
  // Ahora con más variación porque hay más nodos
  const SIDES: Array<'left'|'right'|'center'|'left'|'right'> = ['right','center','left','center','right']
  const DECO_EVERY = 3  // deco cada N conectores
  let nodeIdx = 0
  let lastLevel = ''
  const doneByLevel: Record<string,number> = {}
  const lockedLevels = new Set<string>()
  
  nodes.forEach(n => {
    if (n.type==='lesson' && n.status==='done' && n.lesson) {
      doneByLevel[n.lesson.level] = (doneByLevel[n.lesson.level]??0) + 1
    }
  })
  
  // Detectar niveles donde TODOS los nodos están bloqueados
  const levelNodes: Record<string,string[]> = {}
  nodes.forEach(n => {
    if (n.type==='lesson' && n.lesson) {
      if (!levelNodes[n.lesson.level]) levelNodes[n.lesson.level] = []
      levelNodes[n.lesson.level].push(n.status)
    }
  })
  Object.entries(levelNodes).forEach(([level, statuses]) => {
    if (statuses.every(s => s === 'locked') && level !== 'basico') {
      lockedLevels.add(level)
    }
  })
  
  // Contador de nodos mostrados por nivel (para limitar nodos en niveles con neblina)
  const shownByLevel: Record<string,number> = {}

  return (
    <div style={{fontFamily:'Poppins,sans-serif',maxWidth:580,margin:'0 auto',padding:'4px 16px 100px',position:'relative'}}>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <AndinoPattern/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        

        {/* Saludo */}
        <div style={{marginBottom:20,paddingTop:4,animation:'fadeSlideUp 0.4s ease'}}>
          <h1 style={{fontSize:24,fontWeight:900,color:C.brown,marginBottom:3,lineHeight:1.2}}>
            ¡Allin p'unchaw, {firstName}! 🦙
          </h1>
          <p style={{color:C.graybb,fontSize:13,margin:0}}>
            Tu sendero del quechua cochabambino
          </p>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:28,animation:'fadeSlideUp 0.5s ease'}}>
          <div style={{padding:'13px 14px',borderRadius:16,background:'#FFF0E6',border:'1.5px solid #F4B885'}}>
            <p style={{fontSize:10,color:C.graybb,margin:'0 0 2px',fontWeight:700}}>🔥 Racha</p>
            <p style={{fontSize:22,fontWeight:900,color:C.terra,margin:0,lineHeight:1}}>
              {streakDays}<span style={{fontSize:11,fontWeight:600}}> días</span>
            </p>
          </div>
          <div style={{padding:'13px 14px',borderRadius:16,background:C.goldl,border:`1.5px solid ${C.gold}`}}>
            <p style={{fontSize:10,color:C.graybb,margin:'0 0 2px',fontWeight:700}}>⚡ XP</p>
            <p style={{fontSize:22,fontWeight:900,color:C.goldb,margin:0,lineHeight:1}}>{xpTotal.toLocaleString()}</p>
          </div>
          <div style={{padding:'13px 14px',borderRadius:16,background:C.greenl,border:`1.5px solid ${C.green}`}}>
            <p style={{fontSize:10,color:C.graybb,margin:'0 0 2px',fontWeight:700}}>📚 Nivel</p>
            <p style={{fontSize:14,fontWeight:900,color:C.greenb,margin:0,lineHeight:1.2}}>{getLevelLabel(currentLevel)}</p>
            <p style={{fontSize:9,color:C.greenb,margin:'3px 0 0',opacity:0.8}}>{completedN} lecciones</p>
          </div>
        </div>

        {/* Leyenda pequeña */}
        <div style={{
          display:'flex',alignItems:'center',gap:12,justifyContent:'center',
          marginBottom:20,padding:'8px 16px',borderRadius:12,
          background:'white',border:`1px solid ${C.grayl}`,fontSize:11,color:C.graybb,
        }}>
          <span>📖 = Contenido</span>
          <span style={{color:C.grayl}}>|</span>
          <span>⚡ = Práctica</span>
          <span style={{color:C.grayl}}>|</span>
          <span>◆ = Tinku</span>
        </div>

        {/* Sendero */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'stretch',gap:0}}>
          {nodes.map((node, index) => {
            const parts: React.ReactNode[] = []
            const prevDone = index > 0 && nodes[index-1]?.status === 'done'
            const delay = `${Math.min(index * 0.03, 0.8)}s`

            // Banner de nivel
            if (node.type === 'lesson' && node.subtype === 'content' && node.lesson?.level !== lastLevel) {
              lastLevel = node.lesson!.level
              const isLevelLocked = node.status === 'locked'
              // Si el primer nodo del nivel está bloqueado → neblina
              if (isLevelLocked && lastLevel !== 'basico') {
                parts.push(
                  <FogBanner key={`fog-${lastLevel}`} level={lastLevel}/>
                )
              } else {
                parts.push(
                  <LevelBanner key={`banner-${lastLevel}`} level={lastLevel} done={doneByLevel[lastLevel]??0}/>
                )
              }
            }

            // Conector + decoración ocasional
            if (index > 0) {
              const isContentToPractice = node.subtype === 'practice'  // conector corto
              const showDeco = !isContentToPractice && nodeIdx % DECO_EVERY === 1
              parts.push(
                <div key={`conn-${index}`} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
                  <PathLine done={prevDone} short={isContentToPractice}/>
                  {showDeco && <Deco idx={nodeIdx}/>}
                  {showDeco && <PathLine done={prevDone} short/>}
                </div>
              )
            }

            // Nodo
            const side = SIDES[nodeIdx % 5]
            const justif = side==='left' ? 'flex-start' : side==='right' ? 'flex-end' : 'center'
            const animStyle: React.CSSProperties = {
              animation:`fadeSlideUp 0.35s ease ${delay} both`,
              display:'flex', justifyContent:justif,
            }

            if (node.type === 'lesson') {
              nodeIdx++
              if (node.subtype === 'content') {
                parts.push(
                  <div key={`content-${node.lesson!.id}`} style={animStyle}>
                    <ContentNode node={node} side={side}
                      onClick={() => router.push(`/lecciones/${node.lesson!.id}`)}/>
                  </div>
                )
              } else {
                // practice — mismo lado que su contenido
                const practiceSide = SIDES[(nodeIdx-1) % 5]
                const pJustif = practiceSide==='left' ? 'flex-start' : practiceSide==='right' ? 'flex-end' : 'center'
                parts.push(
                  <div key={`practice-${node.lesson!.id}`}
                    style={{...animStyle, justifyContent:pJustif}}>
                    <PracticeNode node={node} side={practiceSide}
                      onClick={() => router.push(`/lecciones/${node.lesson!.id}?fase=ejercicios`)}/>
                  </div>
                )
              }
            } else if (node.type === 'tinku') {
              nodeIdx++
              parts.push(
                <div key={`tinku-${node.tinkuNumber}`}
                  style={{...animStyle, justifyContent:'center'}}>
                  <TinkuNode node={node}
                    onClick={() => router.push(`/evaluaciones?tipo=tinku&num=${node.tinkuNumber}`)}/>
                </div>
              )
            } else if (node.type === 'hamutay') {
              parts.push(
                <div key="hamutay" style={{...animStyle, justifyContent:'center'}}>
                  <HamutayNode node={node}
                    onClick={() => router.push('/evaluaciones?tipo=hamutay')}/>
                </div>
              )
            }

            return <React.Fragment key={index}>{parts}</React.Fragment>
          })}
        </div>

        {/* Leyenda final */}
        <div style={{
          display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',
          marginTop:40,paddingTop:20,borderTop:`1.5px solid ${C.grayl}`,
        }}>
          {[
            {bg:`linear-gradient(135deg,${C.green},${C.greenb})`,label:'Completado'},
            {bg:`linear-gradient(135deg,${C.terra},${C.terrab})`,label:'En curso'},
            {bg:'linear-gradient(135deg,#D8D6CE,#C8C6BE)',label:'Bloqueado'},
            {bg:`linear-gradient(135deg,${C.purple},${C.purpleb})`,label:'Tinku'},
            {bg:`linear-gradient(135deg,${C.brown},#3D2E20)`,label:"Hamut'ay"},
          ].map(({bg,label})=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.graybb}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:bg,flexShrink:0}}/>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}