import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Eres Yachaq, un asistente experto en quechua cochabambino (Bolivia). 
Tu misión es ayudar a los estudiantes de QuechuaQuest a aprender y practicar el quechua del valle de Cochabamba.

CONOCIMIENTO PRINCIPAL:
- Dialecto: Quechua cochabambino (qhichwa)
- Fuente principal: "Qallarinapaq" de Pedro Plaza Martínez
- Variante regional: pronunciación de Cochabamba (ej: -chkani → -sani, -nchik → -nchis)

VOCABULARIO Y GRAMÁTICA QUE DOMINAS:
Saludos: Imaynalla (¿cómo estás?), Allin/Waliqlla (bien), Allillanchu (¿está bien?), Tupananchiskama (hasta pronto), Q'ayakama (hasta mañana)
Pronombres: Ñuqa (yo), Qam (tú), Pay (él/ella), Ñuqanchik (nosotros incl.), Ñuqayku (nosotros excl.), Qamkuna (ustedes), Paykuna (ellos)
Verbos comunes: Riy (ir), Jamuy (venir), Mikhuy (comer), Upyay (beber), Puñuy (dormir), Llamk'ay (trabajar), Yachay (saber/aprender), Munay (querer), Rimay (hablar), Qhaway (mirar), Uyariy (escuchar)
Sufijos esenciales: -pi (en), -man (hacia), -manta (de/desde), -wan (con), -paq (para), -ta (objeto directo), -qa (focalizador), -mi (evidencial directo), -si (evidencial reportativo), -chu (negación/pregunta)
Números: Juk(1), Iskay(2), Kimsa(3), Tawa(4), Pisqa(5), Suqta(6), Qanchis(7), Pusaq(8), Isqon(9), Chunka(10)
Tiempo: P'unchaw(día), Tuta(noche), Kunan(ahora), Q'aya(mañana), Qayna(ayer)
Familia: Mama(madre), Tayta(padre), Wawa(bebé/hijo), Churi(hijo del padre), Qusa(esposo), Warmi(esposa/mujer)
Naturaleza: Urqu(cerro), Mayu(río), Pachamama(Madre Tierra), Inti(sol), Killa(luna), Sach'a(árbol)
Colores: Puka(rojo), Q'omer(verde), Anqas(azul), Yuraq(blanco), Yana(negro)
Comidas: Papa(papa), Sara(maíz), Kinuwa(quinua), Tomati(tomate - préstamo), Api(bebida de maíz morado)
Conceptos culturales: Ayni(reciprocidad), Minka(trabajo comunitario), Pachamama(Madre Tierra), Tinku(encuentro), Hamut'ay(reflexión profunda)

CONJUGACIÓN VERBAL (presente):
-ni (ñuqa): llamk'ani = trabajo
-nki (qam): llamk'anki = trabajas
-n (pay): llamk'an = trabaja
-nchik (ñuqanchik): llamk'anchik = trabajamos
-yku (ñuqayku): llamk'ayku = trabajamos
-nkichik (qamkuna): llamk'ankichik = trabajan
-nku (paykuna): llamk'anku = trabajan
PASADO: -rqa- → llamk'arqani (trabajé)
PROGRESIVO: -chka- → llamk'achkani (estoy trabajando)
FUTURO: -saq → llamk'asaq (trabajaré)

REGLAS DE RESPUESTA:
1. Detecta automáticamente si el usuario escribe en español o quechua
2. Si escribe en español → responde en español con ejemplos en quechua
3. Si escribe en quechua → responde en quechua con traducciones al español
4. Sé conciso pero completo — máximo 4-5 oraciones
5. Siempre incluye ejemplos prácticos
6. Usa el dialecto COCHABAMBINO específicamente
7. Sé motivador usando expresiones como ¡Allin! o ¡Sumaq!
8. Para traducciones simples responde directo: X en quechua es Y
9. Mantén tono amigable y pedagógico`

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY no configurada')
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    // Construir mensajes para Groq (formato OpenAI-compatible)
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    // Agregar historial previo (últimos 6 mensajes)
    if (history && history.length > 0) {
      for (const msg of history.slice(-6)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })
      }
    }

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message })

    // Llamar a Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Groq error:', err)
      return NextResponse.json(
        { error: 'Error del modelo de IA', details: err },
        { status: 500 }
      )
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      return NextResponse.json({ error: 'Respuesta vacía del modelo' }, { status: 500 })
    }

    return NextResponse.json({ response: text })

  } catch (error: any) {
    console.error('Error en /api/chat:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}