import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Este endpoint es llamado por Vercel Cron
export async function GET(request: Request) {
  try {
    // 1. Validar que tenemos las variables necesarias
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!supabaseUrl || !serviceRoleKey || !gmailUser || !gmailPass) {
      console.error('Faltan variables de entorno para el cron job.')
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Configurar nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    // 2. Obtener usuarios que necesitan un recordatorio
    // Para simplificar, buscamos en user_progress a quienes no hayan ganado XP hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: progressData, error: progressErr } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, streak_last_date')

    if (progressErr) throw progressErr

    // Filtramos los que no han practicado hoy
    const usersToRemind = (progressData || []).filter(p => {
      if (!p.streak_last_date) return true
      const lastDate = new Date(p.streak_last_date)
      return lastDate < today
    })

    if (usersToRemind.length === 0) {
      return NextResponse.json({ message: 'Todos los usuarios están al día.' })
    }

    const userIdsToRemind = usersToRemind.map(p => p.user_id)

    // 3. Obtener los emails de esos usuarios (solo posible con el service_role_key)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authErr) throw authErr

    const usersWithEmails = authData.users.filter(u => userIdsToRemind.includes(u.id) && u.email)

    if (usersWithEmails.length === 0) {
      return NextResponse.json({ message: 'No hay usuarios válidos para enviar correo.' })
    }

    // 4. Enviar los correos usando Nodemailer
    // Nota: Nodemailer envía uno por uno a diferencia de Resend, por lo que usamos Promise.all
    const emailPromises = usersWithEmails.map(user => {
      const username = user.user_metadata?.username || user.user_metadata?.full_name || 'Estudiante'
      
      const mailOptions = {
        from: `"QuechuaQuest" <${gmailUser}>`,
        to: user.email!,
        subject: '🔥 ¡Tu racha está en peligro en QuechuaQuest!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #FEFAF5; border-radius: 12px; border: 1px solid #F0E8E0;">
            <h1 style="color: #C4763A; font-size: 24px;">¡Hola, ${username}! 🦙</h1>
            <p style="color: #6B3F2A; font-size: 16px; line-height: 1.5;">
              Notamos que aún no has practicado quechua el día de hoy. ¡No dejes que tu racha de aprendizaje se rompa!
            </p>
            <p style="color: #6B3F2A; font-size: 16px; line-height: 1.5;">
              Solo te tomará 5 minutos completar una lección o repasar tu vocabulario.
            </p>
            <a href="https://quechuaquest.vercel.app/dashboard" style="display: inline-block; margin-top: 20px; padding: 14px 28px; background-color: #C4763A; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              Continuar mi aventura
            </a>
            <p style="margin-top: 30px; font-size: 12px; color: #9B8070;">
              El equipo de QuechuaQuest
            </p>
          </div>
        `
      }
      
      return transporter.sendMail(mailOptions)
    })

    await Promise.all(emailPromises)

    return NextResponse.json({ message: `Se enviaron ${emailPromises.length} recordatorios usando Gmail.` })

  } catch (error: any) {
    console.error('Error en cron job:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
