import { Icon } from '@iconify/react'
import { Link } from '@nextui-org/react'

import HoverCard from './hover-card'

export const IconButton = ({ listbox, onPress, tooltip, ...rest }) => (
  <HoverCard {...{ listbox, tooltip }}>
    <Link className='size-8' onPress={onPress}>
      <Icon className='size-full cursor-pointer' {...rest} />
    </Link>
  </HoverCard>
)