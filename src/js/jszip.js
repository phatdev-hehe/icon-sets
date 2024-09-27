import JSZip from 'jszip'
import mapObject, { mapObjectSkip } from 'map-obj'

JSZip.support = mapObject(JSZip.support, (key, value) => {
  if (['nodebuffer', 'nodestream'].includes(key)) return mapObjectSkip

  return [key, value]
})

export { JSZip }
