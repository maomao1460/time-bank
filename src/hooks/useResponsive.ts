import { useState, useEffect } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export function useResponsive(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)

    return () => {
      window.removeEventListener('resize', checkBreakpoint)
    }
  }, [])

  return breakpoint
}

export function useIsMobile(): boolean {
  return useResponsive() === 'mobile'
}

export function useIsTablet(): boolean {
  return useResponsive() === 'tablet'
}

export function useIsDesktop(): boolean {
  return useResponsive() === 'desktop'
}
