import { JSZip, number, pluralize, saveAs, wrapIcon } from '../aliases'

export default icons => {
  const [firstIcon] = icons
  const hasSamePrefix = icons.every(icon => icon.prefix === firstIcon.prefix)

  return {
    count: number(icons),
    current: icons,
    download: {
      filename: `${hasSamePrefix && firstIcon ? firstIcon.setName : pluralize(icons, 'icon')}.zip`,
      get fn() {
        return () => {
          const zip = new JSZip()

          for (let icon of icons) {
            icon = wrapIcon(icon)

            zip.file(icon.filenames.svg[hasSamePrefix ? 'default' : 'detail'], icon.to.html)
          }

          saveAs(zip.generateAsync({ type: 'blob' }), this.filename)
        }
      }
    }
  }
}
