import { ScrollShadow } from '@nextui-org/react'
import { toast } from 'sonner'

import { has, is, Listbox, ms } from '../aliases'

export default (message, data) => {
  const id = toast(message, parseData(data))

  return {
    dismiss: () => toast.dismiss(id),
    update: data => toast(message, { ...parseData(data), id })
  }
}

const parseData = ({ action, description, duration, listbox, ...rest } = {}) => {
  duration ??= ms(has(action) ? '6s' : '4s')

  return {
    action,
    description: (
      <>
        {description}
        {has(listbox) && (
          <ScrollShadow className='max-h-96' style={{ color: 'initial' }}>
            <Listbox sections={listbox} />
          </ScrollShadow>
        )}
      </>
    ),
    dismissible: !is.infinite(duration),
    duration,
    ...rest
  }
}
