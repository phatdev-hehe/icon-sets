import { Icon } from '@iconify/react'
import { Link } from '@nextui-org/react'

import { has, HoverCard } from '../aliases'

export default ({ listbox, name, onPress, tooltip, ...rest }) => {
  rest = { icon: `line-md:${name}`, name, ...rest }

  if (has([listbox, onPress, tooltip]))
    return (
      <HoverCard {...{ listbox, tooltip }}>
        <Link className='size-8' onPress={onPress}>
          <Icon className='size-full cursor-pointer' {...rest} />
        </Link>
      </HoverCard>
    )

  return <Icon {...rest} />
}
