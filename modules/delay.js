import delay from 'delay'

import { ms } from '../aliases'

export default async value => await delay(ms(value))
