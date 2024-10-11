import { without } from 'es-toolkit'
import { useLocalStorage } from 'react-haiku'

import { Icon, pluralize, toast } from '../aliases'

const initialValue = []

export default () => {
  const [state, setState] = useLocalStorage('bookmark-icons', initialValue)
  const has = icon => state.includes(icon.id)

  return {
    clear: () => {
      setState(initialValue)

      const currentToast = toast('Cleared all', {
        action: (
          <Icon
            name='rotate-180'
            onPress={() => {
              setState(state)
              currentToast.dismiss()
            }}
            tooltip='Undo'
          />
        ),
        description: pluralize(state, 'icon')
      })
    },
    current: state,
    has,
    toggle: icon => {
      const hasIcon = has(icon)

      setState(state => (hasIcon ? without(state, icon.id) : [...state, icon.id]))
      toast(hasIcon ? 'Bookmark removed' : 'Bookmark added')
    }
  }
}
