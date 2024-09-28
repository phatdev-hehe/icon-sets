import { Listbox, ListboxItem, ListboxSection } from '@nextui-org/react'
import { nanoid } from 'nanoid'
import { For } from 'react-haiku'

import { toNumber } from '../aliases'

export default ({ sections }) => (
  <Listbox aria-label={nanoid()} variant='light'>
    {Object.entries(sections).map(([title, items], index) => (
      <ListboxSection key={nanoid()} showDivider={index !== toNumber(sections) - 1} title={title}>
        {items.map(({ color = 'primary', descriptions = [], isActive, title, ...rest }) => (
          <ListboxItem
            classNames={{ title: isActive && `text-${color}` }}
            color={isActive ? color : ''}
            description={
              <For each={descriptions} render={description => <div>{description}</div>} />
            }
            key={nanoid()}
            textValue={nanoid()}
            {...rest}>
            {title}
          </ListboxItem>
        ))}
      </ListboxSection>
    ))}
  </Listbox>
)
