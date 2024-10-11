import { buildIcon, JSZip, pluralize, saveAs } from '../aliases'

export default icons => {
  const [firstIcon] = icons
  const isSamePrefix = firstIcon && icons.every(icon => icon.prefix === firstIcon.prefix)
  const filename = `${isSamePrefix ? firstIcon.setName : pluralize(icons, 'icon')}.zip`

  return {
    current: icons,
    download: {
      filename,
      fn: () => {
        const zip = new JSZip()

        for (let icon of icons) {
          icon = buildIcon(icon)

          zip.file(icon.paths.svg[isSamePrefix ? 'default' : 'full'], icon.to.html)
        }

        saveAs(zip.generateAsync({ type: 'blob' }), filename)
      }
    }
  }
}
