import { without } from 'es-toolkit'
import { useLocalStorage } from 'react-haiku'

import { Icon, pluralize, toast } from '../aliases'

const initialValue = []

export default () => {
  const [state, setState] = useLocalStorage('bookmark-icons', initialValue)

  return {
    clear: () => {
      setState(initialValue)

      const currentToast = toast('Cleared all', {
        action: (
          <Icon
            name='rotate-180'
            onPress={() => {
              currentToast.dismiss()
              setState(state)
            }}
            tooltip='Undo'
          />
        ),
        description: pluralize(state, 'icon')
      })
    },
    current: state,
    has: icon => state.includes(icon.id),
    toggle(icon) {
      const isBookmarked = this.has(icon)

      toast(isBookmarked ? 'Bookmark removed' : 'Bookmark added')
      setState(state => (isBookmarked ? without(state, icon.id) : [...state, icon.id]))
    }
  }
}
