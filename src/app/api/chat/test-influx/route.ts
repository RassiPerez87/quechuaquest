import { trackCustomMetric } from '@/lib/influx'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Probando InfluxDB...')
    
    await trackCustomMetric(
      'test_connection',
      { proyecto: 'QuechuaQuest', test: 'true' },
      { value: 1, timestamp: Date.now() }
    )
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ InfluxDB conectado correctamente' 
    })
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}