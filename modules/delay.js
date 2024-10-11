import delay from 'delay'

import { ms } from '../aliases'

export default async val => await delay(ms(val))
