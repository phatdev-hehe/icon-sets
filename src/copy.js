import copy from 'copy-to-clipboard'

import { pluralize, toast } from '../aliases'

export default text =>
  toast(copy(text) ? 'Copied' : 'Copy failed', { description: pluralize(text, 'character') })
