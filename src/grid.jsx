import { Button, Card, CardFooter } from '@nextui-org/react'
import { useRafState } from 'ahooks'
import { sort } from 'fast-sort'
import mapObject from 'map-obj'
import isEqual from 'react-fast-compare'
import root from 'react-shadow'
import { VirtuosoGrid } from 'react-virtuoso'

import {
  bytes,
  copy,
  createBlob,
  getAll,
  getBookmarkIcons,
  HoverCard,
  IconButton,
  is,
  MotionPluralize,
  openObjectURL,
  saveAs,
  wrapIcon,
  wrapIcons
} from '../aliases'

const getFooter = icons => () => {
  if (icons.count) return <div style={{ height: 'var(--footer-height)' }} />

  return <div className='flex-center text-foreground-500'>No icons</div>
}

const getScrollSeekPlaceholder =
  icons =>
  ({ index, ...style }) => (
    <div className='flex-center text-foreground-500' style={style}>
      {icons.current[index].name.slice(0, 3)}
    </div>
  )

export default ({ footer, footerRight, icons, ...rest }) => {
  const all = getAll()
  const [state, setState] = useRafState()
  const bookmarkIcons = getBookmarkIcons()

  if (icons.some(is.string)) icons = all.icons.filter(icon => icons.includes(icon.id))

  if (state) icons = sort(icons).by(state)

  icons = wrapIcons(icons)

  return (
    <Card
      classNames={{
        base: 'h-full rounded-none bg-background text-sm',
        footer: 'absolute inset-x-0 bottom-0 rounded-none'
      }}
      isFooterBlurred
      style={{ '--footer-height': '4rem' }}>
      <VirtuosoGrid
        components={{
          Footer: getFooter(icons),
          ScrollSeekPlaceholder: getScrollSeekPlaceholder(icons)
        }}
        data={icons.current}
        itemClassName='p-6'
        itemContent={(index, icon) => {
          icon = wrapIcon(icon)

          return (
            <HoverCard
              listbox={{
                [`#${index + 1}`]: [
                  {
                    description: icon.setName,
                    onPress: () => copy(icon.name),
                    title: icon.name
                  }
                ],
                [bookmarkIcons.has(icon) ? 'Bookmarked' : 'Bookmark']: ['Add', 'Remove'].map(
                  title => ({
                    isDisabled: (title === 'Add') === bookmarkIcons.has(icon),
                    onPress: () => bookmarkIcons.toggle(icon),
                    title
                  })
                ),
                ...mapObject(icon.filenames, (fileType, filename) => {
                  filename = filename.detail

                  const text = {
                    css: icon.to.css,
                    json: JSON.stringify(icon.data, null, 2),
                    svg: icon.to.html,
                    txt: icon.to.dataUrl
                  }[fileType]

                  const blob = createBlob([text], filename)

                  return [
                    `${fileType.toUpperCase()} (${bytes(blob.size)})`,
                    [
                      ['View', () => openObjectURL(blob)],
                      ['Copy', () => copy(text)],
                      ['Download', () => saveAs(blob, filename)]
                    ].map(([title, onPress]) => ({ onPress, title }))
                  ]
                })
              }}>
              <Button
                isIconOnly
                onPress={() => bookmarkIcons.toggle(icon)}
                radius='full'
                size='lg'
                variant='light'>
                <root.div mode='closed'>
                  <span
                    className='icon'
                    style={{ color: 'hsl(var(--nextui-foreground))', scale: '2' }}
                  />
                  <style>{icon.to.css}</style>
                </root.div>
              </Button>
            </HoverCard>
          )
        }}
        listClassName='flex-center flex-wrap h-auto'
        scrollSeekConfiguration={{ enter: v => Math.abs(v) > 300, exit: v => v === 0 }}
        {...rest}
      />
      <CardFooter style={{ height: 'var(--footer-height)' }}>
        {footer ?? (
          <div className='flex-center justify-between px-3'>
            <MotionPluralize value={icons.count} word='icon' />
            {footerRight ?? (
              <IconButton
                icon='line-md:arrows-vertical'
                listbox={{
                  ...mapObject(
                    {
                      Default: ['id', 'name', 'setName', 'prefix'],
                      Id: ['id'],
                      Name: ['name'],
                      'Set name': ['setName'],
                      'Set prefix': ['prefix']
                    },
                    (title, keys) => [
                      title,
                      ['asc', 'desc'].map(order => {
                        const value = keys.map(key => ({ [order]: key }))
                        const isActive = isEqual(value, state)

                        return {
                          isActive,
                          isDisabled: icons.count < 2,
                          onPress: () => setState(!isActive && value),
                          title: { asc: 'Ascending', desc: 'Descending' }[order]
                        }
                      })
                    ]
                  ),
                  Download: [
                    {
                      isDisabled: !icons.count,
                      onPress: icons.download.fn,
                      title: icons.download.filename
                    }
                  ]
                }}
              />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
