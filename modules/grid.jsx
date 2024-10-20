import { Button, Card, CardFooter } from '@nextui-org/react'
import { useRafState } from 'ahooks'
import { noCase } from 'change-case'
import { sort } from 'fast-sort'
import { VirtuosoGrid } from 'react-virtuoso'

import {
  buildIcon,
  buildIcons,
  copy,
  createBlob,
  createCountLabel,
  equal,
  getAll,
  getBookmarkIcons,
  has,
  HoverCard,
  Icon,
  is,
  mapObject,
  MotionPluralize,
  number,
  openObjectURL,
  root,
  saveAs,
  useSearchPattern
} from '../aliases'

const CardFooterProps = { style: { height: '4rem' } }

const createVirtuosoGridProps = icons => {
  const className = 'flex-center text-foreground-500'

  return {
    components: {
      Footer: () => {
        if (has(icons)) return <div {...CardFooterProps} />

        return <div className={className}>No icons</div>
      },
      ScrollSeekPlaceholder: ({ index, ...style }) => {
        const icon = icons[index]

        return <div {...{ className, style }}>{icon.name.slice(0, 3)}</div>
      }
    },
    data: icons
  }
}

export default ({ footer, footerRight, icons, ...rest }) => {
  const [state, setState] = useRafState()
  const { setSearchPattern } = useSearchPattern()
  const all = getAll()
  const bookmarkIcons = getBookmarkIcons()

  if (icons.some(is.string)) icons = all.icons.filter(icon => icons.includes(icon.id))

  icons = buildIcons(has(state) ? sort(icons).by(state) : icons)

  return (
    <Card
      classNames={{
        base: 'h-full rounded-none',
        footer: 'absolute inset-x-0 bottom-0 rounded-none'
      }}
      isFooterBlurred>
      <VirtuosoGrid
        itemClassName='p-6'
        itemContent={(index, icon) => {
          icon = buildIcon(icon)

          return (
            <HoverCard
              listbox={{
                [`#${index + 1}`]: [
                  {
                    description: icon.iconSetName,
                    onPress: () => setSearchPattern(noCase(icon.name)),
                    title: icon.name
                  }
                ],
                Bookmark: [
                  {
                    onPress: () => bookmarkIcons.toggle(icon),
                    title: bookmarkIcons.has(icon) ? 'Remove' : 'Add'
                  },
                  {
                    isDisabled: !has(bookmarkIcons.current),
                    onPress: bookmarkIcons.clear,
                    title: 'Clear all'
                  }
                ],
                ...mapObject(icon.paths, (fileType, fileName) => {
                  fileName = fileName.full

                  let text

                  if (fileType === 'css') text = icon.to.css
                  if (fileType === 'json') text = JSON.stringify(icon.data, undefined, 2)
                  if (fileType === 'svg') text = icon.to.html
                  if (fileType === 'txt') text = icon.to.dataUrl

                  const blob = createBlob([text], fileName)

                  return [
                    createCountLabel(blob, fileType.toUpperCase(), false),
                    [
                      ['View', () => openObjectURL(blob)],
                      ['Copy', () => copy(text)],
                      ['Download', () => saveAs(blob, fileName)]
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
                    style={{
                      '--size': '2rem',
                      color: 'hsl(var(--nextui-foreground))',
                      height: 'var(--size)',
                      width: 'var(--size)'
                    }}
                  />
                  <style>{icon.to.css}</style>
                </root.div>
              </Button>
            </HoverCard>
          )
        }}
        listClassName='flex-center flex-wrap h-auto'
        scrollSeekConfiguration={{ enter: v => Math.abs(v) > 300, exit: v => v === 0 }}
        {...createVirtuosoGridProps(icons.current)}
        {...rest}
      />
      <CardFooter {...CardFooterProps}>
        {footer ?? (
          <div className='flex-center justify-between px-3'>
            <MotionPluralize count={icons.current} word='icon' />
            {footerRight ?? (
              <Icon
                listbox={{
                  ...mapObject(
                    {
                      Default: ['id', 'name', 'iconSetName', 'prefix'],
                      'Icon id': ['id'],
                      'Icon name': ['name'],
                      'Icon set id': ['prefix'],
                      'Icon set name': ['iconSetName']
                    },
                    (title, props) => [
                      title,
                      ['asc', 'desc'].map(order => {
                        const currentState = props.map(prop => ({ [order]: prop }))
                        const isSelected = equal(state, currentState)

                        return {
                          isDisabled: number(icons.current) < 2,
                          isSelected,
                          onPress: () => setState(!isSelected && currentState),
                          title: { asc: 'Ascending', desc: 'Descending' }[order]
                        }
                      })
                    ]
                  ),
                  ...icons.download.createListboxSection()
                }}
                name='arrows-vertical'
              />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
