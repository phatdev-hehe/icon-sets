import { cn, Listbox, ListboxItem, ListboxSection } from '@nextui-org/react'
import { nanoid } from 'nanoid'
import { For } from 'react-haiku'

import { buildIcon, createCountLabel, has, JSZip, number, saveAs } from '../aliases'

export const createListboxSectionDownload = (icons, asListboxItem) => {
  const [firstIcon] = icons
  const isSamePrefix = has(firstIcon) && icons.every(icon => icon.prefix === firstIcon.prefix)
  const fileName = `${isSamePrefix ? firstIcon.iconSetName : createCountLabel(icons, 'icon')}.zip`

  const listboxItemDownload = {
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

  return asListboxItem ? listboxItemDownload : { Download: [listboxItemDownload] }
}

export default ({ sections }) => (
  <Listbox aria-label={nanoid()} variant='light'>
    {Object.entries(sections).map(([title, items], index) => (
      <ListboxSection key={nanoid()} showDivider={index !== number(sections) - 1} title={title}>
        {items.map(
          ({ color = 'primary', descriptions = [], isDisabled, isSelected, title, ...rest }) => {
            isSelected &&= !isDisabled

            const key = nanoid()

            return (
              <ListboxItem
                classNames={{ title: cn({ [`text-${color}`]: isSelected }) }}
                color={isSelected ? color : ''}
                description={
                  <For each={descriptions} render={description => <div>{description}</div>} />
                }
                isDisabled={isDisabled}
                key={key}
                textValue={key}
                {...rest}>
                {title}
              </ListboxItem>
            )
          }
        )}
      </ListboxSection>
    ))}
  </Listbox>
)
