import { buildIcon, createCountLabel, has, JSZip, saveAs } from '../aliases'

export default icons => ({
  current: icons,
  download: {
    createListboxSection: () => {
      const [firstIcon] = icons
      const isSamePrefix = has(firstIcon) && icons.every(icon => icon.prefix === firstIcon.prefix)
      const fileName = `${isSamePrefix ? firstIcon.iconSetName : createCountLabel(icons, 'icon')}.zip`

      return {
        Download: [
          {
            isDisabled: !has(icons),
            onPress: () => {
              const zip = new JSZip()

              for (let icon of icons) {
                icon = buildIcon(icon)

                zip.file(icon.paths.svg[isSamePrefix ? 'default' : 'full'], icon.to.html)
              }

              saveAs(zip.generateAsync({ type: 'blob' }), fileName)
            },
            title: fileName
          }
        ]
      }
    }
  }
})
