import { useLocalStorage } from 'react-haiku'

import { has, Icon, pluralize, toast } from '../aliases'

const initialValue = []

export default () => {
  const [state, setState] = useLocalStorage('bookmark-icons', initialValue)

  return {
    clear: () => {
      if (has(state)) {
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
      }
    },
    has: icon => state.some(currentIcon => currentIcon === icon.id),
    state,
    toggle: icon => {
      setState(state => {
        const hasIcon = this.has(icon)

        toast(hasIcon ? 'Bookmark removed' : 'Bookmark added')

        return hasIcon ? state.filter(currentIcon => currentIcon !== icon.id) : [...state, icon.id]
      })
    }
  }
}
