/* eslint-disable */

import { LRUCache } from 'lru-cache'

export const cache = new LRUCache({ max: 1_000 })
export const locale = 'en-US'

export { default as is } from '@sindresorhus/is'
export { useCreation as createMemo, useUpdate as rerender } from 'ahooks'
export { default as has } from 'has-values'
export * as idb from 'idb-keyval'
export { default as mapObject, mapObjectSkip } from 'map-obj'
export { default as mime } from 'mime/lite'
export { default as ms } from 'ms'
export { default as equal } from 'react-fast-compare'
export { useFirstRender as useIsFirstRender } from 'react-haiku'
export { default as root } from 'react-shadow'
export { default as clone } from 'rfdc/default'
export { default as sortKeys } from 'sort-keys'

export { default as asyncContent } from './app/async-content'
export { default as buildIcon } from './app/build-icon'
export { default as buildIcons } from './app/build-icons'
export { default as bytes } from './app/bytes'
export { default as copy } from './app/copy'
export { default as createBlob } from './app/create-blob'
export { default as delay } from './app/delay'
export { default as EndlessIcons } from './app/endless-icons'
export { default as FilterIcons } from './app/filter-icons'
export { default as getAll } from './app/get-all'
export { default as getBookmarkIcons } from './app/get-bookmark-icons'
export { default as Grid } from './app/grid'
export { default as HoverCard } from './app/hover-card'
export { default as Icon } from './app/icon'
export { default as IconGroups } from './app/icon-groups'
export { default as JSZip } from './app/jszip'
export { default as Listbox } from './app/listbox'
export { default as MotionPluralize } from './app/motion-pluralize'
export { default as number } from './app/number'
export { default as openObjectURL } from './app/open-object-url'
export { default as Page } from './app/page'
export { default as pluralize } from './app/pluralize'
export * from './app/recently-viewed-icons'
export { default as relativeTime } from './app/relative-time'
export { default as saveAs } from './app/save-as'
export { default as SearchIcons } from './app/search-icons'
export { default as Theme } from './app/theme'
export { default as title } from './app/title'
export { default as toast } from './app/toast'
