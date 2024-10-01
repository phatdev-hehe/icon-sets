import { getIconContentCSS, getIconCSS, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils'
import mapObject from 'map-obj'
import { nanoid } from 'nanoid'

import { cache } from '../aliases'

export default icon => {
  const k = icon.id

  if (cache.has(k)) return cache.get(k)

  const svg = iconToSVG(icon.data)

  const v = {
    fileList: mapObject({ css: null, json: null, svg: null, txt: null }, fileType => [
      fileType,
      { default: `${icon.name}.${fileType}`, detail: `[${icon.setName}] ${icon.name}.${fileType}` }
    ]),
    to: {
      css: getIconCSS(icon.data),
      dataUrl: getIconContentCSS(icon.data, svg.attributes).slice(31, -6),
      html: iconToHTML(replaceIDs(svg.body, nanoid()), svg.attributes)
    },
    ...icon
  }

  cache.set(k, v)

  return v
}
