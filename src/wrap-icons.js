import { JSZip, pluralize, saveAs, wrapIcon } from '../aliases'

export default icons => {
  const [firstIcon] = icons
  const isSamePrefix = icons.every(icon => icon.prefix === firstIcon.prefix)
  const filename = `${isSamePrefix && firstIcon ? firstIcon.setName : pluralize(icons, 'icon')}.zip`

  return {
    current: icons,
    download: {
      filename,
      fn() {
        const zip = new JSZip()

        for (let icon of icons) {
          icon = wrapIcon(icon)

          zip.file(icon.fileList.svg[isSamePrefix ? 'default' : 'detail'], icon.to.html)
        }

        saveAs(zip.generateAsync({ type: 'blob' }), filename)
      }
    }
  }
}
