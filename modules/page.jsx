import { NextUIProvider } from '@nextui-org/react'
import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useDeepCompareEffect, useMouse, useSize } from 'ahooks'
import { domAnimation, LazyMotion, m, useSpring } from 'framer-motion'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { useRef } from 'react'
import { Toaster } from 'sonner'

import { has, locale, Theme } from '../aliases'

const Providers = ({ children }) => (
  <LazyMotion features={domAnimation} strict>
    <ThemeProvider attribute='class' disableTransitionOnChange>
      <NextUIProvider locale={locale}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </NextUIProvider>
    </ThemeProvider>
  </LazyMotion>
)

const MotionStars = () => {
  const ref = useRef()
  const size = useSize(ref)
  const mouse = useMouse()
  const style = { x: useSpring(0), y: useSpring(0) }

  useDeepCompareEffect(() => {
    if (has(size)) {
      style.x.set(mouse.clientX / (size.width * 0.5))
      style.y.set(mouse.clientY / (size.height * 0.5))
    }
  }, [mouse])

  return (
    <m.div className='fixed inset-0 -z-10 hidden dark:block' {...{ ref, style }}>
      <Canvas>
        <Stars count={1000} depth={800} fade />
      </Canvas>
    </m.div>
  )
}

export default ({ children }) => (
  <Providers>
    {children}
    <MotionStars />
    <Theme render={({ resolvedTheme }) => <Toaster theme={resolvedTheme} />} />
  </Providers>
)
