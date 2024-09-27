import { cn } from '@nextui-org/react'
import * as HoverCard from '@radix-ui/react-hover-card'
import { useRafState } from 'ahooks'
import { AnimatePresence, m, useSpring } from 'framer-motion'
import { useRef } from 'react'

import Listbox from './listbox'

export default ({ align = 'center', children, listbox, tooltip }) => {
  const [state, setState] = useRafState()
  const ref = useRef()
  const x = useSpring(0)
  const setX = v => x.set(v / 4)

  return (
    <HoverCard.Root closeDelay={200} onOpenChange={setState} openDelay={0}>
      <HoverCard.Trigger
        asChild
        className='!scale-100'
        onMouseMove={({ clientX, target }) => {
          if (ref.current) {
            const rect = target.getBoundingClientRect()

            if (align === 'center') return setX(clientX - rect.left - rect.width / 2)

            const w = ref.current.getBoundingClientRect().width
            const x = clientX - rect[{ end: 'right', start: 'left' }[align]]
            const v = { end: x + w, start: x - w }[align]

            setX({ end: v < 0, start: v > 0 }[align] ? v : x)
          }
        }}>
        {children}
      </HoverCard.Trigger>
      <AnimatePresence>
        {state && (
          <HoverCard.Portal forceMount>
            <HoverCard.Content
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
                style={{ transformOrigin: 'var(--radix-hover-card-content-transform-origin)', x }}>
                {tooltip ?? <Listbox sections={listbox} />}
              </m.div>
            </HoverCard.Content>
          </HoverCard.Portal>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  )
}
