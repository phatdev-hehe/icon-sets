import JSZip from 'jszip'

import { mapObject, mapObjectSkip } from '../aliases'

JSZip.support = mapObject(JSZip.support, (key, value) => {
  if (['nodebuffer', 'nodestream'].includes(key)) return mapObjectSkip

  return [key, value]
})

export default JSZip
