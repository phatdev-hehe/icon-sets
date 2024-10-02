import copy from 'copy-to-clipboard'

import { toast } from '../aliases'

export default text => toast(copy(text) ? 'Copied' : 'Copy failed')
