import { cn } from '@nextui-org/react'
import { Content, Portal, Root, Trigger } from '@radix-ui/react-hover-card'
import { useRafState } from 'ahooks'
import { AnimatePresence, m, useSpring } from 'framer-motion'
import { useRef } from 'react'

import { Listbox } from '../aliases'

const align = 'center'

export default ({ children, listbox, tooltip }) => {
  const [state, setState] = useRafState()
  const ref = useRef()

  const style = {
    transformOrigin: 'var(--radix-hover-card-content-transform-origin)',
    updateX(v) {
      this.x.set(v / 4)
    },
    x: useSpring(0)
  }

  return (
    <Root closeDelay={200} onOpenChange={setState} openDelay={0}>
      <Trigger
        asChild
        className='!scale-100'
        onMouseMove={event => {
          const rect = event.target.getBoundingClientRect()

          if (align === 'center') return style.updateX(event.clientX - rect.left - rect.width / 2)

          const w = ref.current.getBoundingClientRect().width
          const x = event.clientX - rect[{ end: 'right', start: 'left' }[align]]
          const v = { end: x + w, start: x - w }[align]

          style.updateX({ end: v < 0, start: v > 0 }[align] ? v : x)
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
