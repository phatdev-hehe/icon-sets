import { useLocalStorage } from 'react-haiku'

import toast from './toast'

export const getBookmarkIcons = () => {
  const [state, setState] = useLocalStorage('bookmark-icons', [])

  return {
    has: icon => state.some(currentIcon => currentIcon === icon.id),
    state,
    toggle(icon) {
      setState(state => {
        const hasIcon = this.has(icon)

        toast(hasIcon ? 'Bookmark removed' : 'Bookmark added')

        return hasIcon ? state.filter(currentIcon => currentIcon !== icon.id) : [...state, icon.id]
      })
    }
  }
}
