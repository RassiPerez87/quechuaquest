'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import YachaqWidget from '@/components/YachaqWidget'

const navItems = [
  { href: '/dashboard',  icon: '🏠', label: 'Inicio'      },
  { href: '/progreso',   icon: '📊', label: 'Mi Progreso' },
  { href: '/leaderboard',icon: '🏆', label: 'Leaderboard' },
]

// ── Fondo andino animado ──────────────────────────────────────
function AndinoBackground() {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:0,
      pointerEvents:'none', overflow:'hidden',
    }}>
      <style>{`
        @keyframes cloudL   {0%{transform:translateX(0)}100%{transform:translateX(110vw)}}
        @keyframes cloudR   {0%{transform:translateX(0)}100%{transform:translateX(-110vw)}}
        @keyframes treeSway {0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
        @keyframes sway1    {0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
        @keyframes sway2    {0%,100%{transform:rotate(2deg)}50%{transform:rotate(-3deg)}}
        @keyframes sway3    {0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
        @keyframes riverFlow{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-80}}
        @keyframes sunPulse {0%,100%{opacity:0.18}50%{opacity:0.28}}
        @keyframes birdFly  {0%{transform:translate(0,0)}40%{transform:translate(140px,-18px)}100%{transform:translate(0,0)}}
        @keyframes twinkle  {0%,100%{opacity:0.12}50%{opacity:0.28}}
      `}</style>
      <svg
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="abg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FEF3E2"/>
            <stop offset="40%"  stopColor="#FEFAF5"/>
            <stop offset="100%" stopColor="#F5EFE6"/>
          </linearGradient>
          <linearGradient id="amf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4A882" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#C4763A" stopOpacity="0.04"/>
          </linearGradient>
          <linearGradient id="amm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A5030" stopOpacity="0.16"/>
            <stop offset="100%" stopColor="#5A3820" stopOpacity="0.05"/>
          </linearGradient>
          <linearGradient id="amn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A2818" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#2A1E15" stopOpacity="0.03"/>
          </linearGradient>
          <linearGradient id="arv" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7ABFDF" stopOpacity="0"/>
            <stop offset="20%"  stopColor="#7ABFDF" stopOpacity="0.45"/>
            <stop offset="80%"  stopColor="#5A9FBF" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#5A9FBF" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="avg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D8A50" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#1D5A30" stopOpacity="0.04"/>
          </linearGradient>
          <linearGradient id="atc1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A7A30" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#2A5A20" stopOpacity="0.55"/>
          </linearGradient>
          <linearGradient id="atc2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A8A38" stopOpacity="0.65"/>
            <stop offset="100%" stopColor="#2D6A22" stopOpacity="0.5"/>
          </linearGradient>
          <linearGradient id="atc3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A6828" stopOpacity="0.68"/>
            <stop offset="100%" stopColor="#1A4A18" stopOpacity="0.48"/>
          </linearGradient>
          <pattern id="awp" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#C4763A" strokeWidth="0.8"/>
            <polygon points="20,9 27,20 20,31 13,20" fill="#C4763A"/>
          </pattern>
        </defs>

        <rect width="1400" height="900" fill="url(#abg)"/>

        {/* Sol */}
        <circle cx="1250" cy="100" r="80" fill="#FAC775" opacity="0.08" style={{animation:'sunPulse 5s ease-in-out infinite'}}/>
        <circle cx="1250" cy="100" r="52" fill="#FAC775" opacity="0.12" style={{animation:'sunPulse 5s ease-in-out infinite 1.5s'}}/>
        <circle cx="1250" cy="100" r="30" fill="#EF9F27" opacity="0.15"/>
        <g stroke="#FAC775" strokeWidth="2" opacity="0.09">
          <line x1="1250" y1="30" x2="1250" y2="14"/>
          <line x1="1250" y1="172" x2="1250" y2="188"/>
          <line x1="1178" y1="100" x2="1162" y2="100"/>
          <line x1="1322" y1="100" x2="1338" y2="100"/>
          <line x1="1199" y1="49" x2="1187" y2="37"/>
          <line x1="1301" y1="151" x2="1313" y2="163"/>
          <line x1="1301" y1="49" x2="1313" y2="37"/>
          <line x1="1199" y1="151" x2="1187" y2="163"/>
        </g>

        {/* Destellos */}
        <polygon points="120,55 123,63 131,63 125,68 127,76 120,71 113,76 115,68 109,63 117,63" fill="#FAC775" opacity="0.11" style={{animation:'twinkle 4s ease-in-out infinite'}}/>
        <polygon points="980,40 982,46 988,46 983,50 985,56 980,52 975,56 977,50 972,46 978,46" fill="#FAC775" opacity="0.09" style={{animation:'twinkle 6s ease-in-out infinite 2s'}}/>

        {/* Cordillera lejana */}
        <path d="M0,520 L80,420 L160,470 L250,355 L340,415 L430,315 L520,378 L615,300 L700,360 L790,285 L880,340 L970,270 L1060,322 L1150,258 L1240,305 L1320,262 L1400,290 L1400,900 L0,900Z" fill="url(#amf)"/>
        <path d="M430,315 L455,338 L480,322Z" fill="white" opacity="0.2"/>
        <path d="M790,285 L812,306 L834,293Z" fill="white" opacity="0.18"/>
        <path d="M1150,258 L1170,278 L1190,265Z" fill="white" opacity="0.18"/>
        <path d="M615,300 L634,318 L653,307Z" fill="white" opacity="0.16"/>

        {/* Cordillera media */}
        <path d="M0,600 L100,515 L210,558 L320,470 L440,535 L560,448 L670,508 L780,428 L890,485 L1000,408 L1100,462 L1200,390 L1300,438 L1400,405 L1400,900 L0,900Z" fill="url(#amm)"/>

        {/* Cordillera cercana */}
        <path d="M0,670 L130,590 L260,638 L390,565 L520,618 L650,548 L780,598 L910,535 L1040,582 L1160,525 L1280,568 L1400,535 L1400,900 L0,900Z" fill="url(#amn)"/>

        {/* Valle verde */}
        <path d="M0,720 Q175,698 350,714 Q525,698 700,716 Q875,698 1050,714 Q1225,698 1400,714 L1400,900 L0,900Z" fill="url(#avg)"/>

        {/* Río principal */}
        <path d="M-20,755 Q160,735 310,750 Q480,768 640,742 Q800,718 960,736 Q1120,752 1280,730 Q1355,720 1420,734" fill="none" stroke="url(#arv)" strokeWidth="12" strokeLinecap="round"/>
        <path d="M-20,751 Q160,731 310,746 Q480,764 640,738 Q800,714 960,732 Q1120,748 1280,726 Q1355,716 1420,730" fill="none" stroke="#C8E8F5" strokeWidth="3" strokeLinecap="round" opacity="0.28" strokeDasharray="16,10" style={{animation:'riverFlow 3.5s linear infinite'}}/>
        <ellipse cx="980" cy="736" rx="45" ry="6" fill="#FAC775" opacity="0.12" transform="rotate(-3,980,736)"/>

        {/* Riachuelo */}
        <path d="M0,808 Q120,793 240,802 Q380,814 520,798 Q660,784 790,797 Q920,810 1050,796 L1400,796" fill="none" stroke="#7ABFDF" strokeWidth="5" strokeLinecap="round" opacity="0.18"/>

        {/* Patrón wiphala sutil */}
        <rect width="1400" height="900" fill="url(#awp)" opacity="0.035"/>

        {/* ── ÁRBOLES IZQUIERDA ── */}
        <g transform="translate(30,600)" style={{transformOrigin:'18px 140px',animation:'treeSway 7s ease-in-out infinite'}}>
          <rect x="13" y="88" width="9" height="54" fill="#5A3820" opacity="0.4" rx="2"/>
          <ellipse cx="18" cy="66" rx="28" ry="34" fill="url(#atc1)" opacity="0.68"/>
          <ellipse cx="8"  cy="80" rx="18" ry="22" fill="url(#atc2)" opacity="0.52"/>
          <ellipse cx="30" cy="76" rx="17" ry="20" fill="url(#atc1)" opacity="0.48"/>
          <ellipse cx="18" cy="50" rx="15" ry="20" fill="url(#atc2)" opacity="0.58"/>
        </g>
        <g transform="translate(82,614)" style={{transformOrigin:'15px 126px',animation:'treeSway 9s ease-in-out infinite 2s'}}>
          <rect x="11" y="76" width="8" height="50" fill="#5A3820" opacity="0.36" rx="2"/>
          <ellipse cx="15" cy="58" rx="23" ry="28" fill="url(#atc2)" opacity="0.62"/>
          <ellipse cx="6"  cy="70" rx="15" ry="18" fill="url(#atc3)" opacity="0.48"/>
          <ellipse cx="26" cy="66" rx="14" ry="17" fill="url(#atc2)" opacity="0.52"/>
          <ellipse cx="15" cy="43" rx="13" ry="18" fill="url(#atc1)" opacity="0.57"/>
        </g>
        {/* Eucalipto izquierda */}
        <g transform="translate(138,578)" style={{transformOrigin:'12px 170px',animation:'treeSway 11s ease-in-out infinite 1s'}}>
          <rect x="8" y="58" width="8" height="112" fill="#6A4030" opacity="0.34" rx="2"/>
          <ellipse cx="12" cy="22" rx="15" ry="42" fill="url(#atc3)" opacity="0.62"/>
          <ellipse cx="5"  cy="36" rx="10" ry="28" fill="url(#atc2)" opacity="0.46"/>
          <ellipse cx="20" cy="30" rx="11" ry="32" fill="url(#atc3)" opacity="0.52"/>
          <ellipse cx="12" cy="10" rx="9" ry="20" fill="url(#atc1)" opacity="0.56"/>
        </g>
        <g transform="translate(192,596)" style={{transformOrigin:'20px 150px',animation:'treeSway 8s ease-in-out infinite 3s'}}>
          <rect x="15" y="82" width="9" height="68" fill="#5A3820" opacity="0.36" rx="2"/>
          <ellipse cx="20" cy="60" rx="26" ry="32" fill="url(#atc2)" opacity="0.6"/>
          <ellipse cx="9"  cy="74" rx="17" ry="20" fill="url(#atc3)" opacity="0.46"/>
          <ellipse cx="33" cy="70" rx="16" ry="19" fill="url(#atc1)" opacity="0.5"/>
          <ellipse cx="20" cy="44" rx="14" ry="20" fill="url(#atc2)" opacity="0.56"/>
        </g>
        <g transform="translate(244,608)" style={{transformOrigin:'14px 138px',animation:'treeSway 10s ease-in-out infinite 0.5s'}}>
          <rect x="10" y="78" width="7" height="60" fill="#5A3820" opacity="0.33" rx="2"/>
          <ellipse cx="14" cy="58" rx="21" ry="26" fill="url(#atc1)" opacity="0.57"/>
          <ellipse cx="5"  cy="70" rx="14" ry="17" fill="url(#atc2)" opacity="0.44"/>
          <ellipse cx="24" cy="66" rx="13" ry="18" fill="url(#atc3)" opacity="0.48"/>
          <ellipse cx="14" cy="43" rx="12" ry="18" fill="url(#atc1)" opacity="0.53"/>
        </g>

        {/* ── ÁRBOLES CENTRO-IZQUIERDA ── */}
        <g transform="translate(490,650)" style={{transformOrigin:'12px 110px',animation:'treeSway 9s ease-in-out infinite 2.5s'}}>
          <rect x="8" y="50" width="7" height="60" fill="#5A3820" opacity="0.28" rx="2"/>
          <ellipse cx="12" cy="34" rx="20" ry="24" fill="url(#atc2)" opacity="0.48"/>
          <ellipse cx="4"  cy="44" rx="13" ry="15" fill="url(#atc3)" opacity="0.36"/>
          <ellipse cx="21" cy="41" rx="12" ry="16" fill="url(#atc1)" opacity="0.4"/>
        </g>
        <g transform="translate(540,642)" style={{transformOrigin:'10px 118px',animation:'treeSway 11s ease-in-out infinite 1.8s'}}>
          <rect x="7" y="55" width="7" height="63" fill="#5A3820" opacity="0.28" rx="2"/>
          <ellipse cx="10" cy="37" rx="22" ry="25" fill="url(#atc3)" opacity="0.48"/>
          <ellipse cx="3"  cy="48" rx="14" ry="16" fill="url(#atc1)" opacity="0.36"/>
          <ellipse cx="19" cy="45" rx="13" ry="18" fill="url(#atc2)" opacity="0.42"/>
        </g>

        {/* ── ÁRBOLES CENTRO-DERECHA ── */}
        <g transform="translate(840,638)" style={{transformOrigin:'12px 122px',animation:'treeSway 9s ease-in-out infinite 2s'}}>
          <rect x="8" y="54" width="7" height="68" fill="#5A3820" opacity="0.28" rx="2"/>
          <ellipse cx="12" cy="36" rx="21" ry="25" fill="url(#atc2)" opacity="0.48"/>
          <ellipse cx="4"  cy="47" rx="14" ry="16" fill="url(#atc3)" opacity="0.36"/>
          <ellipse cx="21" cy="44" rx="13" ry="17" fill="url(#atc1)" opacity="0.4"/>
        </g>
        <g transform="translate(888,630)" style={{transformOrigin:'10px 130px',animation:'treeSway 12s ease-in-out infinite 0.8s'}}>
          <rect x="7" y="56" width="6" height="74" fill="#6A4030" opacity="0.3" rx="2"/>
          <ellipse cx="10" cy="18" rx="13" ry="40" fill="url(#atc3)" opacity="0.5"/>
          <ellipse cx="4"  cy="30" rx="9"  ry="26" fill="url(#atc2)" opacity="0.38"/>
          <ellipse cx="17" cy="25" rx="10" ry="30" fill="url(#atc3)" opacity="0.44"/>
        </g>

        {/* ── ÁRBOLES DERECHA ── */}
        <g transform="translate(1050,590)" style={{transformOrigin:'12px 170px',animation:'treeSway 11s ease-in-out infinite 1s'}}>
          <rect x="8" y="60" width="8" height="110" fill="#6A4030" opacity="0.32" rx="2"/>
          <ellipse cx="12" cy="24" rx="14" ry="40" fill="url(#atc3)" opacity="0.6"/>
          <ellipse cx="5"  cy="38" rx="9"  ry="26" fill="url(#atc2)" opacity="0.45"/>
          <ellipse cx="20" cy="32" rx="10" ry="30" fill="url(#atc3)" opacity="0.5"/>
        </g>
        <g transform="translate(1100,598)" style={{transformOrigin:'18px 152px',animation:'treeSway 8s ease-in-out infinite 1.5s'}}>
          <rect x="13" y="82" width="9" height="70" fill="#5A3820" opacity="0.35" rx="2"/>
          <ellipse cx="18" cy="60" rx="27" ry="33" fill="url(#atc2)" opacity="0.63"/>
          <ellipse cx="8"  cy="74" rx="18" ry="21" fill="url(#atc3)" opacity="0.48"/>
          <ellipse cx="30" cy="70" rx="17" ry="20" fill="url(#atc1)" opacity="0.5"/>
          <ellipse cx="18" cy="44" rx="15" ry="21" fill="url(#atc2)" opacity="0.58"/>
        </g>
        <g transform="translate(1156,610)" style={{transformOrigin:'14px 140px',animation:'treeSway 9s ease-in-out infinite 3s'}}>
          <rect x="10" y="80" width="7" height="60" fill="#5A3820" opacity="0.33" rx="2"/>
          <ellipse cx="14" cy="60" rx="22" ry="27" fill="url(#atc1)" opacity="0.6"/>
          <ellipse cx="5"  cy="72" rx="14" ry="18" fill="url(#atc2)" opacity="0.45"/>
          <ellipse cx="24" cy="68" rx="13" ry="18" fill="url(#atc3)" opacity="0.48"/>
          <ellipse cx="14" cy="44" rx="12" ry="18" fill="url(#atc1)" opacity="0.54"/>
        </g>
        <g transform="translate(1208,602)" style={{transformOrigin:'12px 158px',animation:'treeSway 10s ease-in-out infinite 0.5s'}}>
          <rect x="8" y="64" width="8" height="94" fill="#6A4030" opacity="0.32" rx="2"/>
          <ellipse cx="12" cy="20" rx="14" ry="46" fill="url(#atc3)" opacity="0.6"/>
          <ellipse cx="4"  cy="36" rx="9"  ry="30" fill="url(#atc2)" opacity="0.44"/>
          <ellipse cx="20" cy="30" rx="10" ry="34" fill="url(#atc3)" opacity="0.5"/>
        </g>
        <g transform="translate(1260,606)" style={{transformOrigin:'16px 144px',animation:'treeSway 7s ease-in-out infinite 2s'}}>
          <rect x="11" y="80" width="8" height="64" fill="#5A3820" opacity="0.32" rx="2"/>
          <ellipse cx="15" cy="58" rx="24" ry="30" fill="url(#atc2)" opacity="0.58"/>
          <ellipse cx="6"  cy="71" rx="16" ry="19" fill="url(#atc1)" opacity="0.44"/>
          <ellipse cx="26" cy="68" rx="15" ry="18" fill="url(#atc3)" opacity="0.47"/>
          <ellipse cx="15" cy="43" rx="13" ry="19" fill="url(#atc2)" opacity="0.53"/>
        </g>
        <g transform="translate(1314,616)" style={{transformOrigin:'13px 134px',animation:'treeSway 8s ease-in-out infinite 1.2s'}}>
          <rect x="9" y="78" width="8" height="56" fill="#5A3820" opacity="0.3" rx="2"/>
          <ellipse cx="13" cy="58" rx="22" ry="26" fill="url(#atc1)" opacity="0.55"/>
          <ellipse cx="5"  cy="70" rx="14" ry="17" fill="url(#atc3)" opacity="0.42"/>
          <ellipse cx="22" cy="66" rx="13" ry="17" fill="url(#atc2)" opacity="0.46"/>
          <ellipse cx="13" cy="43" rx="11" ry="17" fill="url(#atc1)" opacity="0.5"/>
        </g>
        <g transform="translate(1360,622)" style={{transformOrigin:'12px 128px',animation:'treeSway 9s ease-in-out infinite 0.8s'}}>
          <rect x="8" y="76" width="7" height="52" fill="#5A3820" opacity="0.28" rx="2"/>
          <ellipse cx="12" cy="56" rx="20" ry="25" fill="url(#atc2)" opacity="0.52"/>
          <ellipse cx="4"  cy="68" rx="13" ry="16" fill="url(#atc1)" opacity="0.38"/>
          <ellipse cx="20" cy="64" rx="12" ry="16" fill="url(#atc3)" opacity="0.43"/>
        </g>

        {/* Plantas kantuta */}
        <g transform="translate(320,672)" style={{transformOrigin:'0px 65px',animation:'sway2 6s ease-in-out infinite'}}>
          <line x1="0" y1="65" x2="0" y2="10" stroke="#2D6B3A" strokeWidth="2.5" opacity="0.35"/>
          <line x1="0" y1="46" x2="-13" y2="30" stroke="#2D6B3A" strokeWidth="1.5" opacity="0.28"/>
          <line x1="0" y1="36" x2="13" y2="22" stroke="#2D6B3A" strokeWidth="1.5" opacity="0.28"/>
          <ellipse cx="0" cy="7" rx="5" ry="11" fill="#C4763A" opacity="0.45"/>
          <ellipse cx="-13" cy="26" rx="4" ry="8" fill="#1D9E75" opacity="0.38" transform="rotate(12,-13,26)"/>
          <ellipse cx="13" cy="18" rx="4" ry="8" fill="#534AB7" opacity="0.34" transform="rotate(-15,13,18)"/>
        </g>

        {/* Totoras */}
        <g opacity="0.28">
          <line x1="720" y1="772" x2="717" y2="730" stroke="#2D6B3A" strokeWidth="2" style={{animation:'sway1 5s ease-in-out infinite'}}/>
          <ellipse cx="717" cy="726" rx="5" ry="10" fill="#3D2B1F" opacity="0.3" style={{animation:'sway1 5s ease-in-out infinite'}}/>
          <line x1="736" y1="768" x2="734" y2="730" stroke="#2D6B3A" strokeWidth="1.8" style={{animation:'sway2 6s ease-in-out infinite 1s'}}/>
          <ellipse cx="734" cy="726" rx="4" ry="9" fill="#3D2B1F" opacity="0.27" style={{animation:'sway2 6s ease-in-out infinite 1s'}}/>
          <line x1="750" y1="774" x2="748" y2="733" stroke="#2D6B3A" strokeWidth="2" style={{animation:'sway3 7s ease-in-out infinite 0.5s'}}/>
          <ellipse cx="748" cy="729" rx="5" ry="10" fill="#3D2B1F" opacity="0.28" style={{animation:'sway3 7s ease-in-out infinite 0.5s'}}/>
        </g>

        {/* Pasto/ichu */}
        <g opacity="0.24">
          <path d="M290,800 Q292,784 294,800" fill="none" stroke="#5A8A40" strokeWidth="1.5"/>
          <path d="M300,797 Q302,780 304,797" fill="none" stroke="#4A7A35" strokeWidth="1.2"/>
          <path d="M310,801 Q312,785 314,801" fill="none" stroke="#5A8A40" strokeWidth="1.2"/>
          <path d="M900,795 Q902,778 904,795" fill="none" stroke="#5A8A40" strokeWidth="1.5"/>
          <path d="M910,792 Q913,775 915,792" fill="none" stroke="#4A7A35" strokeWidth="1.2"/>
          <path d="M920,796 Q923,779 925,796" fill="none" stroke="#5A8A40" strokeWidth="1.2"/>
        </g>

        {/* NUBES */}
        <g style={{animation:'cloudL 32s linear infinite'}} opacity="0.7">
          <ellipse cx="-90" cy="138" rx="95" ry="28" fill="#FEF8EE" opacity="0.65"/>
          <ellipse cx="-48" cy="120" rx="65" ry="22" fill="#FFFAF5" opacity="0.7"/>
          <ellipse cx="-120" cy="132" rx="58" ry="20" fill="#FEF8EE" opacity="0.55"/>
          <ellipse cx="-75" cy="150" rx="80" ry="16" fill="#FFFBF2" opacity="0.45"/>
        </g>
        <g style={{animation:'cloudL 46s linear infinite 15s'}} opacity="0.55">
          <ellipse cx="-200" cy="85" rx="85" ry="24" fill="#FEF6E8" opacity="0.55"/>
          <ellipse cx="-155" cy="70" rx="58" ry="20" fill="#FFFAF5" opacity="0.58"/>
          <ellipse cx="-228" cy="82" rx="50" ry="18" fill="#FEF6E8" opacity="0.5"/>
        </g>
        <g style={{animation:'cloudL 26s linear infinite 8s'}} opacity="0.45">
          <ellipse cx="-320" cy="190" rx="62" ry="18" fill="#FFF3E0" opacity="0.48"/>
          <ellipse cx="-282" cy="180" rx="42" ry="15" fill="#FFFAF5" opacity="0.52"/>
        </g>
        <g style={{animation:'cloudR 52s linear infinite 22s'}} opacity="0.42">
          <ellipse cx="1500" cy="108" rx="100" ry="27" fill="#FEF8EE" opacity="0.48"/>
          <ellipse cx="1548" cy="92"  rx="68"  ry="22" fill="#FFFAF5" opacity="0.52"/>
        </g>

        {/* Cóndores */}
        <g style={{animation:'birdFly 24s ease-in-out infinite'}} opacity="0.18">
          <path d="M190,210 Q195,204 200,210" fill="none" stroke="#2A1E15" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M206,207 Q211,201 216,207" fill="none" stroke="#2A1E15" strokeWidth="1.8" strokeLinecap="round"/>
        </g>
        <g style={{animation:'birdFly 34s ease-in-out infinite 11s'}} opacity="0.15">
          <path d="M520,165 Q524,160 528,165" fill="none" stroke="#2A1E15" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M533,162 Q537,157 541,162" fill="none" stroke="#2A1E15" strokeWidth="1.5" strokeLinecap="round"/>
        </g>

        {/* Chakana */}
        <g opacity="0.065" fill="#C4763A" transform="translate(1310,24)">
          <rect x="12" y="0"  width="12" height="12"/>
          <rect x="24" y="0"  width="12" height="12"/>
          <rect x="0"  y="12" width="48" height="12"/>
          <rect x="12" y="24" width="24" height="12"/>
          <rect x="0"  y="36" width="48" height="12"/>
          <rect x="12" y="48" width="12" height="12"/>
          <rect x="24" y="48" width="12" height="12"/>
        </g>
      </svg>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile]       = useState<any>(null)
  const [progress, setProgress]     = useState<any>(null)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [pr, pg] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
      ])
      setProfile(pr.data)
      setProgress(pg.data)
    }
    load()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const streakDays = progress?.streak_days ?? profile?.streak_days ?? 0
  const xpTotal    = progress?.xp_total    ?? profile?.xp          ?? 0
  const completedN = progress?.completed_lessons?.length ?? 0
  const lvl        = progress?.current_level ?? profile?.level ?? 'basico'
  const levelLabel: Record<string,string> = {
    basico:'🌱 Básico', intermedio:'🏔️ Intermedio',
    avanzado:'🦅 Avanzado', maestria:'⭐ Maestría',
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => {
    const isExp = mobile || !collapsed
    return (
      <div style={{display:'flex',flexDirection:'column',height:'100%',fontFamily:'Poppins,sans-serif'}}>
        {/* LOGO */}
        <div style={{padding:'18px 14px 14px',display:'flex',alignItems:'center',justifyContent:isExp?'space-between':'center',borderBottom:'1px solid rgba(196,118,58,0.10)',minHeight:64}}>
          {isExp ? (
            <>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:26}}>🦙</span>
                <div>
                  <div style={{display:'flex',alignItems:'baseline'}}>
                    <span style={{fontWeight:900,fontSize:15,color:'#3D2B1F'}}>Quechua</span>
                    <span style={{fontWeight:900,fontSize:15,color:'#C4763A'}}>Quest</span>
                  </div>
                  <p style={{fontSize:9,fontWeight:700,color:'#D4A853',marginTop:-1}}>✦ APRENDE QUECHUA ✦</p>
                </div>
              </div>
              {!mobile && (
                <button onClick={() => setCollapsed(true)} style={{background:'#FFF0E6',border:'1.5px solid #F4B885',borderRadius:10,padding:'6px 8px',cursor:'pointer',color:'#C4763A',display:'flex',alignItems:'center'}}>
                  <ChevronLeft size={16}/>
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setCollapsed(false)} style={{background:'#FFF0E6',border:'1.5px solid #F4B885',borderRadius:10,padding:'8px',cursor:'pointer',color:'#C4763A',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <ChevronRight size={16}/>
            </button>
          )}
        </div>

        {/* USER CARD */}
        <div style={{margin:'12px 10px',padding:isExp?'14px':'10px 6px',borderRadius:16,background:'linear-gradient(135deg,rgba(255,240,230,0.92),rgba(255,248,230,0.92))',border:'1.5px solid #F4B885',backdropFilter:'blur(8px)'}}>
          {isExp ? (
            <>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#C4763A,#D4A853)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:18,flexShrink:0}}>
                  {profile?.full_name?.[0]?.toUpperCase()||'U'}
                </div>
                <div style={{minWidth:0}}>
                  <p style={{fontWeight:900,fontSize:13,color:'#3D2B1F',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name||'Usuario'}</p>
                  <p style={{fontSize:11,color:'#6B3F2A',margin:'2px 0 0'}}>{levelLabel[lvl]??'🌱 Básico'}</p>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-around',paddingTop:10,borderTop:'1px solid rgba(196,118,58,0.15)'}}>
                {[
                  {icon:'🔥',val:streakDays,lbl:'Racha',color:'#C4763A'},
                  {icon:'⚡',val:xpTotal,   lbl:'XP',   color:'#A07830'},
                  {icon:'📚',val:completedN,lbl:'Lecc.', color:'#1D9E75'},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:'center'}}>
                    <p style={{fontSize:13,fontWeight:900,color:s.color,margin:0}}>{s.icon} {s.val}</p>
                    <p style={{fontSize:10,color:'#6B3F2A',margin:'2px 0 0'}}>{s.lbl}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{textAlign:'center'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#C4763A,#D4A853)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:15,margin:'0 auto 6px'}}>
                {profile?.full_name?.[0]?.toUpperCase()||'U'}
              </div>
              <p style={{fontSize:12,fontWeight:900,color:'#C4763A',margin:0}}>🔥{streakDays}</p>
            </div>
          )}
        </div>

        {/* NAV */}
        <div style={{flex:1,padding:'4px 10px',display:'flex',flexDirection:'column',gap:2}}>
          {navItems.map(item=>{
            const isActive = pathname===item.href||pathname.startsWith(item.href+'/')
            return (
              <Link key={item.href} href={item.href} onClick={()=>mobile&&setMobileOpen(false)} style={{
                display:'flex',alignItems:'center',
                gap:isExp?10:0,justifyContent:isExp?'flex-start':'center',
                padding:isExp?'11px 14px':'12px 0',
                borderRadius:14,fontWeight:700,fontSize:14,
                textDecoration:'none',transition:'all 0.2s',
                background:isActive?'rgba(255,240,230,0.9)':'transparent',
                color:isActive?'#C4763A':'#6B3F2A',
                border:isActive?'1.5px solid rgba(196,118,58,0.25)':'1.5px solid transparent',
                backdropFilter:isActive?'blur(4px)':'none',
              }}>
                <span style={{fontSize:isExp?18:22}}>{item.icon}</span>
                {isExp&&<span>{item.label}</span>}
                {isExp&&isActive&&<ChevronRight size={13} style={{marginLeft:'auto',color:'#C4763A'}}/>}
              </Link>
            )
          })}
        </div>

        {/* BOTTOM */}
        <div style={{padding:'10px 10px 18px',borderTop:'1px solid rgba(196,118,58,0.10)'}}>
          <Link href="/ajustes" onClick={()=>mobile&&setMobileOpen(false)} style={{display:'flex',alignItems:'center',gap:isExp?10:0,justifyContent:isExp?'flex-start':'center',padding:isExp?'10px 14px':'11px 0',borderRadius:12,fontWeight:700,fontSize:14,textDecoration:'none',color:'#6B3F2A',marginBottom:2}}>
            <span style={{fontSize:isExp?18:22}}>⚙️</span>
            {isExp&&<span>Ajustes</span>}
          </Link>
          <button onClick={handleLogout} style={{width:'100%',display:'flex',alignItems:'center',gap:isExp?10:0,justifyContent:isExp?'flex-start':'center',padding:isExp?'10px 14px':'11px 0',borderRadius:12,fontWeight:700,fontSize:14,background:'none',border:'none',cursor:'pointer',color:'#B85C38'}}>
            <span style={{fontSize:isExp?18:22}}>🚪</span>
            {isExp&&<span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    )
  }

  const sidebarWidth = collapsed ? 76 : 240

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'Poppins,sans-serif',position:'relative'}}>
      {/* FONDO ANDINO — detrás de todo */}
      <AndinoBackground/>

      {/* SIDEBAR */}
      <aside style={{position:'fixed',top:0,left:0,height:'100vh',width:sidebarWidth,transition:'width 0.3s ease',background:'rgba(255,255,255,0.88)',backdropFilter:'blur(12px)',borderRight:'1px solid rgba(196,118,58,0.12)',boxShadow:'2px 0 20px rgba(61,43,31,0.06)',zIndex:40,overflowX:'hidden',overflowY:'auto'}}>
        <Sidebar/>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex'}}>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)'}} onClick={()=>setMobileOpen(false)}/>
          <aside style={{position:'relative',width:260,height:'100%',background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',zIndex:51,boxShadow:'4px 0 24px rgba(61,43,31,0.15)',overflowY:'auto'}}>
            <Sidebar mobile={true}/>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main style={{flex:1,marginLeft:sidebarWidth,transition:'margin-left 0.3s ease',minHeight:'100vh',display:'flex',flexDirection:'column',position:'relative',zIndex:1}}>
        {/* TOPBAR */}
        <div style={{position:'sticky',top:0,zIndex:30,background:'rgba(254,250,245,0.88)',backdropFilter:'blur(14px)',borderBottom:'1px solid rgba(196,118,58,0.12)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>setMobileOpen(true)} style={{background:'none',border:'none',cursor:'pointer',color:'#3D2B1F',padding:4,display:'flex'}}>
              <Menu size={22}/>
            </button>
            <span style={{fontSize:20}}>🦙</span>
            <span style={{fontWeight:900,color:'#C4763A',fontSize:16}}>QuechuaQuest</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{padding:'6px 14px',borderRadius:50,background:'rgba(255,240,230,0.9)',border:'1.5px solid #F4B885',fontSize:13,fontWeight:700,color:'#C4763A',backdropFilter:'blur(4px)'}}>
              🔥 {streakDays} días
            </div>
            <div style={{padding:'6px 14px',borderRadius:50,background:'rgba(250,238,218,0.9)',border:'1.5px solid #F0D080',fontSize:13,fontWeight:700,color:'#A07830',backdropFilter:'blur(4px)'}}>
              ⚡ {xpTotal} XP
            </div>
          </div>
        </div>
        {/* CONTENT */}
        <div style={{padding:'28px 24px',flex:1}}>
          {children}
        </div>
      </main>

      {/* YACHAQ — Asistente flotante de quechua */}
      <YachaqWidget />
    </div>
  )
}