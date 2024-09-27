import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useDeepCompareEffect, useMouse, useSize } from 'ahooks'
import { m, useSpring } from 'framer-motion'
import has from 'has-values'
import { useRef } from 'react'

export default () => {
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
        <Stars count={1_000} depth={800} fade />
      </Canvas>
    </m.div>
  )
}
