import { Listbox, ListboxItem, ListboxSection } from '@nextui-org/react'
import { nanoid } from 'nanoid'
import { For } from 'react-haiku'

import { number } from '../aliases'

export default ({ sections }) => (
  <Listbox aria-label={nanoid()} variant='light'>
    {Object.entries(sections).map(([title, items], index) => (
      <ListboxSection key={nanoid()} showDivider={index !== number(sections) - 1} title={title}>
        {items.map(
          ({ color = 'primary', descriptions = [], isDisabled, isSelected, title, ...rest }) => {
            isSelected &&= !isDisabled

            return (
              <ListboxItem
                classNames={{ title: isSelected && `text-${color}` }}
                color={isSelected ? color : ''}
                description={
                  <For each={descriptions} render={description => <div>{description}</div>} />
                }
                isDisabled={isDisabled}
                key={nanoid()}
                textValue={nanoid()}
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
