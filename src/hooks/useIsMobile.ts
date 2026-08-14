import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Solo se ejecuta en el cliente
    if (typeof window === 'undefined') return

    const handleResize = () => setIsMobile(window.innerWidth < breakpoint)
    
    // Llamar una vez al montar para establecer el valor inicial
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
