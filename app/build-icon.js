import { getIconContentCSS, getIconCSS, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils'
import { nanoid } from 'nanoid'

import { cache, has, mapObject } from '../aliases'

const fileList = { css: null, json: null, svg: null, txt: null }

export default icon => {
  const k = icon.id

  if (cache.has(k)) return cache.get(k)

  const svg = iconToSVG(icon.data)

  const v = {
    fileList: mapObject(fileList, fileType => [
      fileType,
      { default: `${icon.name}.${fileType}`, full: `[${icon.setName}] ${icon.name}.${fileType}` }
    ]),
    to: {
      css: getIconCSS(icon.data),
      dataUrl: getIconContentCSS(icon.data, svg.attributes).slice(31, -6),
      html: iconToHTML(replaceIDs(svg.body, nanoid()), svg.attributes)
    },
    ...icon
  }

  if (has(cache.set(k, v))) return v
}
