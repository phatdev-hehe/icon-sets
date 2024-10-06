import { getIconContentCSS, getIconCSS, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils'
import { nanoid } from 'nanoid'

import { cache, has, mapObject } from '../aliases'

const paths = { css: undefined, json: undefined, svg: undefined, txt: undefined }

export default icon => {
  const k = icon.id

  if (cache.has(k)) return cache.get(k)

  const svg = iconToSVG(icon.data)

  const v = {
    paths: mapObject(paths, fileType => [
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
