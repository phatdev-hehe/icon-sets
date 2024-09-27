import copy from 'copy-to-clipboard'

import pluralize from './pluralize'
import toast from './toast'

export default text =>
  toast(copy(text) ? 'Copied' : 'Copy failed', { description: pluralize(text, 'character') })
