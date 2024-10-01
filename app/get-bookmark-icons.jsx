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
    has: icon => state.includes(icon.id),
    state,
    toggle(icon) {
      const isBookmarked = this.has(icon)

      toast(isBookmarked ? 'Bookmark removed' : 'Bookmark added')

      setState(state =>
        isBookmarked ? state.filter(iconId => iconId !== icon.id) : [...state, icon.id]
      )
    }
  }
}
