import { buildIcon, has, JSZip, pluralize, saveAs } from '../aliases'

export default icons => {
  const [firstIcon] = icons
  const isSamePrefix = has(firstIcon) && icons.every(icon => icon.prefix === firstIcon.prefix)
  const fileName = `${isSamePrefix ? firstIcon.iconSetName : pluralize(icons, 'icon')}.zip`

  return {
    current: icons,
    download: {
      fileName,
      fn: () => {
        const zip = new JSZip()

        for (let icon of icons) {
          icon = buildIcon(icon)

          zip.file(icon.paths.svg[isSamePrefix ? 'default' : 'full'], icon.to.html)
        }

        saveAs(zip.generateAsync({ type: 'blob' }), fileName)
      }
    }
  }
}
