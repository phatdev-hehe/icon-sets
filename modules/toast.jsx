import { ScrollShadow } from '@nextui-org/react'
import { toast } from 'sonner'

import { has, is, Listbox, ms } from '../aliases'

const formatData = data => {
  if (!has(data)) return

  // eslint-disable-next-line prefer-const
  let { action, description, duration, listbox, ...rest } = data

  duration ??= ms(has(action) ? '7s' : '4s')

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

export default (message, data) => {
  const toastId = has([message, data]) && toast(message, formatData(data))

  return {
    dismiss: id => toast.dismiss(id === 'all' ? undefined : toastId),
    update: data => toast(message, { ...formatData(data), id: toastId })
  }
}
