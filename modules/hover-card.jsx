import { cn } from '@nextui-org/react'
import { Content, Portal, Root, Trigger } from '@radix-ui/react-hover-card'
import { useRafState } from 'ahooks'
import { AnimatePresence, m, useSpring } from 'framer-motion'
import { useRef } from 'react'

import { Listbox } from '../aliases'

export default ({ align = 'center', children, listbox, tooltip }) => {
  const [state, setState] = useRafState()
  const ref = useRef()

  const style = {
    transformOrigin: 'var(--radix-hover-card-content-transform-origin)',
    x: useSpring(0)
  }

  return (
    <Root closeDelay={200} onOpenChange={setState} openDelay={0}>
      <Trigger
        asChild
        className='!scale-100'
        onMouseMove={event => {
          const rect = event.target.getBoundingClientRect()

          if (align === 'center')
            return style.x.set((event.clientX - rect.left - rect.width / 2) / 4)

          const isStartAligned = align === 'start'
          const w = ref.current.getBoundingClientRect().width
          const x = event.clientX - rect[isStartAligned ? 'left' : 'right']
          const v = isStartAligned ? x - w : x + w

          style.x.set(((isStartAligned ? v > 0 : v < 0) ? v : x) / 4)
        }}>
        {children}
      </Trigger>
      <AnimatePresence>
        {state && (
          <Portal forceMount>
            <Content
              align={listbox ? 'start' : align}
              ref={ref}
              side={tooltip && 'top'}
              sideOffset={10}>
              <m.div
                animate={{ scale: [0.7, 1] }}
                className={cn({
                  'card text-sm': true,
                  'max-h-96 w-64 overflow-x-hidden p-2': listbox,
                  'px-2.5 py-1': tooltip
                })}
                exit={{ opacity: 0, scale: 0.7 }}
                style={style}>
                {tooltip ?? <Listbox sections={listbox} />}
              </m.div>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}
