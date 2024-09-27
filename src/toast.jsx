import { ScrollShadow } from '@nextui-org/react'
import has from 'has-values'
import { toast } from 'sonner'

import Listbox from './listbox'

export default (message, data = {}) => {
  const id = toast(message, parseData(data))

  return {
    get dismiss() {
      return toast.dismiss(id)
    },
    update: data => toast(message, { ...parseData(data), id })
  }
}

const parseData = ({ description, duration, listbox, ...rest }) => ({
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
  dismissible: duration !== Number.POSITIVE_INFINITY,
  duration,
  ...rest
})
