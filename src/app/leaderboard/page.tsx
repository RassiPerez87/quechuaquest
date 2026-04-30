'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const C = {
  brown:'#2A1E15', terra:'#C4763A', terral:'#FFF0E6', terrab:'#8B4E1F',
  green:'#1D9E75', greenl:'#E1F5EE', greenb:'#0F6E56',
  purple:'#534AB7', purplel:'#EEEDFE', purpleb:'#3C3489',
  gold:'#FAC775', goldl:'#FAEEDA', goldb:'#633806', goldd:'#EF9F27',
  gray:'#B4B2A9', grayl:'#F1EFE8', grayb:'#888780', graybb:'#5F5E5A',
}

const MEDALS = ['🥇','🥈','🥉']
const LEVEL_ICON: Record<string,string> = {
  basico:'🌱', intermedio:'🏔️', avanzado:'🦅', maestria:'⭐',
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [users, setUsers]   = useState<any[]>([])
  const [myId, setMyId]     = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank]   = useState<number|null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setMyId(user.id)

    // Obtener top 50 usuarios con más XP
    const { data: progresses } = await supabase
      .from('user_progress')
      .select('user_id, xp_total, streak_days, completed_lessons, current_level')
      .order('xp_total', { ascending: false })
      .limit(50)

    if (!progresses) { setLoading(false); return }

    // Obtener perfiles de esos usuarios
    const userIds = progresses.map(p => p.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds)

    const profileMap: Record<string,any> = {}
    profiles?.forEach(p => { profileMap[p.id] = p })

    const ranked = progresses.map((p, i) => ({
      ...p,
      profile: profileMap[p.user_id] ?? { full_name: 'Usuario', username: '' },
      rank: i + 1,
      lessonsN: p.completed_lessons?.length ?? 0,
    }))

    setUsers(ranked)
    const myRankFound = ranked.findIndex(u => u.user_id === user.id)
    setMyRank(myRankFound >= 0 ? myRankFound + 1 : null)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',fontFamily:'Poppins,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>🏆</div>
        <p style={{color:C.graybb,fontWeight:700,fontSize:14}}>Cargando ranking…</p>
      </div>
    </div>
  )

  const myUser = users.find(u => u.user_id === myId)

  return (
    <div style={{fontFamily:'Poppins,sans-serif',maxWidth:600,margin:'0 auto',padding:'4px 16px 80px'}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingTop:4}}>
        <button onClick={() => router.push('/dashboard')} style={{
          padding:'7px 14px',borderRadius:50,background:'rgba(255,255,255,0.88)',
          border:'1.5px solid #F4B885',color:'#6B3F2A',fontWeight:700,fontSize:12,
          cursor:'pointer',backdropFilter:'blur(8px)',flexShrink:0,
        }}>
          ← Volver
        </button>
        <div>
          <h1 style={{fontSize:20,fontWeight:900,color:C.brown,margin:0}}>Leaderboard 🏆</h1>
          <p style={{fontSize:12,color:C.graybb,margin:'2px 0 0'}}>Top de estudiantes de quechua</p>
        </div>
      </div>

      {/* Mi posición */}
      {myUser && myRank && (
        <div style={{
          padding:'14px 18px',borderRadius:18,marginBottom:16,
          background:`linear-gradient(135deg,${C.goldl},#FFF4DC)`,
          border:`2px solid ${C.goldd}`,
          animation:'fadeUp 0.4s ease',
        }}>
          <p style={{fontSize:11,fontWeight:800,color:C.goldb,margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            ✨ Tu posición
          </p>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{
              width:40,height:40,borderRadius:'50%',flexShrink:0,
              background:`linear-gradient(135deg,${C.terra},#D4A853)`,
              display:'flex',alignItems:'center',justifyContent:'center',
              color:'white',fontWeight:900,fontSize:17,
            }}>
              {myUser.profile?.full_name?.[0]?.toUpperCase()||'U'}
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:800,color:C.brown,margin:0}}>
                #{myRank} — {myUser.profile?.full_name || 'Tú'}
              </p>
              <p style={{fontSize:11,color:C.graybb,margin:'2px 0 0'}}>
                {LEVEL_ICON[myUser.current_level]} {myUser.lessonsN} lecciones · 🔥{myUser.streak_days} días
              </p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{fontSize:20,fontWeight:900,color:C.goldb,margin:0}}>{myUser.xp_total.toLocaleString()}</p>
              <p style={{fontSize:10,color:C.grayb,margin:'1px 0 0'}}>XP total</p>
            </div>
          </div>
        </div>
      )}

      {/* Podio top 3 */}
      {users.length >= 3 && (
        <div style={{
          display:'grid',gridTemplateColumns:'1fr 1.15fr 1fr',gap:8,
          marginBottom:16,alignItems:'flex-end',
          animation:'fadeUp 0.5s ease 0.05s both',
        }}>
          {/* #2 */}
          <div style={{
            padding:'16px 10px 14px',borderRadius:18,textAlign:'center',
            background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)',
            border:'1.5px solid #D3D1C7',
          }}>
            <div style={{fontSize:28,marginBottom:6}}>🥈</div>
            <div style={{
              width:42,height:42,borderRadius:'50%',margin:'0 auto 8px',
              background:`linear-gradient(135deg,#A0A0A0,#C0C0C0)`,
              display:'flex',alignItems:'center',justifyContent:'center',
              color:'white',fontWeight:900,fontSize:17,
            }}>
              {users[1]?.profile?.full_name?.[0]?.toUpperCase()||'U'}
            </div>
            <p style={{fontSize:12,fontWeight:800,color:C.brown,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {users[1]?.profile?.full_name?.split(' ')[0]||'Usuario'}
            </p>
            <p style={{fontSize:14,fontWeight:900,color:C.graybb,margin:0}}>
              {users[1]?.xp_total?.toLocaleString()} XP
            </p>
          </div>

          {/* #1 */}
          <div style={{
            padding:'20px 10px 16px',borderRadius:20,textAlign:'center',
            background:`linear-gradient(135deg,${C.goldl},#FFF4DC)`,
            border:`2px solid ${C.goldd}`,
            boxShadow:`0 6px 20px rgba(250,199,117,0.3)`,
          }}>
            <div style={{fontSize:34,marginBottom:6}}>🥇</div>
            <div style={{
              width:50,height:50,borderRadius:'50%',margin:'0 auto 8px',
              background:`linear-gradient(135deg,${C.goldd},${C.goldb})`,
              display:'flex',alignItems:'center',justifyContent:'center',
              color:'white',fontWeight:900,fontSize:20,
            }}>
              {users[0]?.profile?.full_name?.[0]?.toUpperCase()||'U'}
            </div>
            <p style={{fontSize:13,fontWeight:900,color:C.brown,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {users[0]?.profile?.full_name?.split(' ')[0]||'Usuario'}
            </p>
            <p style={{fontSize:16,fontWeight:900,color:C.goldb,margin:0}}>
              {users[0]?.xp_total?.toLocaleString()} XP
            </p>
          </div>

          {/* #3 */}
          <div style={{
            padding:'14px 10px 12px',borderRadius:18,textAlign:'center',
            background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)',
            border:'1.5px solid #D3D1C7',
          }}>
            <div style={{fontSize:26,marginBottom:6}}>🥉</div>
            <div style={{
              width:38,height:38,borderRadius:'50%',margin:'0 auto 8px',
              background:`linear-gradient(135deg,#CD7F32,#A0522D)`,
              display:'flex',alignItems:'center',justifyContent:'center',
              color:'white',fontWeight:900,fontSize:15,
            }}>
              {users[2]?.profile?.full_name?.[0]?.toUpperCase()||'U'}
            </div>
            <p style={{fontSize:11,fontWeight:800,color:C.brown,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {users[2]?.profile?.full_name?.split(' ')[0]||'Usuario'}
            </p>
            <p style={{fontSize:13,fontWeight:900,color:'#A0522D',margin:0}}>
              {users[2]?.xp_total?.toLocaleString()} XP
            </p>
          </div>
        </div>
      )}

      {/* Lista completa */}
      <div style={{
        background:'rgba(255,255,255,0.88)',backdropFilter:'blur(10px)',
        borderRadius:20,border:'1.5px solid rgba(196,118,58,0.15)',
        overflow:'hidden',animation:'fadeUp 0.5s ease 0.1s both',
      }}>
        {users.slice(3).map((u, i) => {
          const isMe = u.user_id === myId
          return (
            <div key={u.user_id} style={{
              display:'flex',alignItems:'center',gap:12,
              padding:'12px 16px',
              borderTop: i === 0 ? 'none' : '1px solid #F0E8E0',
              background: isMe ? C.terral : 'transparent',
            }}>
              <span style={{
                fontSize:13,fontWeight:800,color:C.grayb,
                minWidth:24,textAlign:'center',
              }}>
                {u.rank}
              </span>
              <div style={{
                width:36,height:36,borderRadius:'50%',flexShrink:0,
                background: isMe
                  ? `linear-gradient(135deg,${C.terra},#D4A853)`
                  : `linear-gradient(135deg,${C.purple},${C.purpleb})`,
                display:'flex',alignItems:'center',justifyContent:'center',
                color:'white',fontWeight:900,fontSize:15,
              }}>
                {u.profile?.full_name?.[0]?.toUpperCase()||'U'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{
                  fontSize:13,fontWeight:700,margin:0,
                  color: isMe ? C.terrab : C.brown,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                }}>
                  {u.profile?.full_name||'Usuario'} {isMe&&'(tú)'}
                </p>
                <p style={{fontSize:10,color:C.graybb,margin:'1px 0 0'}}>
                  {LEVEL_ICON[u.current_level]} {u.lessonsN} lecc. · 🔥{u.streak_days}
                </p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <p style={{fontSize:14,fontWeight:900,color: isMe ? C.terra : C.brown,margin:0}}>
                  {u.xp_total.toLocaleString()}
                </p>
                <p style={{fontSize:9,color:C.grayb,margin:'1px 0 0'}}>XP</p>
              </div>
            </div>
          )
        })}
        {users.length === 0 && (
          <div style={{padding:'40px',textAlign:'center',color:C.grayb,fontSize:13}}>
            Sé el primero en aparecer aquí 🦙
          </div>
        )}
      </div>
    </div>
  )
}