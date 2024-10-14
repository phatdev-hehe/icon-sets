import { getIconContentCSS, getIconCSS, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils'
import { nanoid } from 'nanoid'

import { cache, has, mapObject } from '../aliases'

const paths = { css: undefined, json: undefined, svg: undefined, txt: undefined }

export default icon => {
  if (cache.has(icon.id)) return cache.get(icon.id)

  const svg = iconToSVG(icon.data)

  icon = {
    paths: mapObject(paths, fileType => {
      const fileName = `${icon.name}.${fileType}`

      return [fileType, { default: fileName, full: `[${icon.iconSetName}] ${fileName}` }]
    }),
    to: {
      css: getIconCSS(icon.data),
      dataUrl: getIconContentCSS(icon.data, svg.attributes).slice(31, -6),
      html: iconToHTML(replaceIDs(svg.body, nanoid()), svg.attributes)
    },
    ...icon
  }

  if (has(cache.set(icon.id, icon))) return icon
}
