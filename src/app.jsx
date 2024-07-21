// Ko lam dc :v

// [Icons.Card] Them chuc nang `Restart animation` cho moi icon
// neu nhu logic co dung `hook` thi lam them 2 tasks sau
// VirtuosoGrid.itemContent={(index, data) => data}
// VirtuosoGrid.components.Item = ({ children: icon, 'data-index': index }) => {}
// https://github.com/search?q=repo%3Aiconify%2Ficonify%20restartAnimation&type=code
// https://www.npmjs.com/package/style-to-js

// [Icons.Endless] bi nhap nhay footer khi `endReached` dc goi??

// [use.bookmarks().deletedBookmarks] them chuc nang khoi phuc nhung icons da xoa ?????????
// https://ahooks.js.org/hooks/use-previous/
// https://es-toolkit.slash.page/reference/array/union.html
// https://es-toolkit.slash.page/reference/array/difference.html
// <Icon icon='line-md:backup-restore' />

import { css } from '@emotion/react'
import { Icon } from '@iconify/react'
import {
  getIconCSS,
  getIconContentCSS,
  iconToHTML,
  iconToSVG,
  parseIconSet,
  quicklyValidateIconSet,
  replaceIDs,
  stringToIcon
} from '@iconify/utils'
import {
  Avatar,
  Button,
  Card,
  CardFooter,
  Input,
  Link,
  Listbox,
  ListboxItem,
  ListboxSection,
  NextUIProvider,
  ScrollShadow,
  Spinner,
  cn
} from '@nextui-org/react'
import * as HoverCard from '@radix-ui/react-hover-card'
import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  useAsyncEffect,
  useBoolean,
  useCreation,
  useDebounceFn,
  useDeepCompareEffect,
  useLocalStorageState,
  useRafInterval,
  useSetState,
  useUpdate
} from 'ahooks'
import { kebabCase } from 'change-case'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import * as _ from 'es-toolkit'
import { saveAs } from 'file-saver'
import { AnimatePresence, LazyMotion, domAnimation, m, useSpring } from 'framer-motion'
import Fuse from 'fuse.js'
import * as idb from 'idb-keyval'
import { useAtom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'
import JSZip from 'jszip'
import { LRUCache } from 'lru-cache'
import mapObject, { mapObjectSkip } from 'map-obj'
import { nanoid } from 'nanoid'
import { ThemeProvider, useTheme } from 'next-themes'
import pluralize from 'pluralize'
import prettyBytes from 'pretty-bytes'
import { memo, useEffect, useId, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { VirtuosoGrid } from 'react-virtuoso'
import semver from 'semver'
import { Toaster, toast } from 'sonner'
import sortKeys from 'sort-keys'

import { dependencies } from '../package.json'

import collections from '/node_modules/@iconify/json/collections.json'

dayjs.extend(relativeTime)

const globalState = atomWithImmer({ allIconSets: {}, allIcons: [] })
const iconsCache = new LRUCache({ max: 500 })

const use = {
  bookmarks: () => {
    const [state, setState] = useLocalStorageState('bookmarks', {
      defaultValue: [],
      listenStorageChange: true
    })

    const isBookmarked = icon => state.some(a => _.isEqual(a, stringToIcon(icon.id)))

    return {
      bookmarkedIcons: state,
      isBookmarked: isBookmarked,
      toggleBookmark: icon => {
        if (isBookmarked(icon)) {
          setState(state => state.filter(a => !_.isEqual(a, stringToIcon(icon.id))))
          toast('Bookmark removed')
        } else {
          setState(state => [...state, stringToIcon(icon.id)])
          toast('Bookmark added')
        }
      }
    }
  },
  count: data => {
    if (Array.isArray(data)) return data.length
    if (typeof data === 'object') return Object.keys(data).length

    return Number(data)
  },
  currentToast: (message, data, id = toast(message, data)) => ({
    currentToast: { update: data => toast(message, { ...data, id }) }
  }),
  globalState: () => {
    const [state, setState] = useAtom(globalState)

    return { globalState: state, setGlobalState: setState }
  },
  parseIcon: icon => {
    if (iconsCache.has(icon.id)) return iconsCache.get(icon.id)

    const { attributes, body } = iconToSVG(icon.data)

    const v = {
      paths: mapObject({ css: {}, json: {}, svg: {}, txt: {} }, fileType => [
        fileType,
        {
          default: `${icon.name}.${fileType}`,
          detail: `[${icon.setName}] ${icon.name}.${fileType}`
        }
      ]),
      to: {
        css: getIconCSS(icon.data),
        dataUrl: getIconContentCSS(icon.data, attributes).slice(31, -6),
        html: iconToHTML(replaceIDs(body, nanoid()), attributes)
      },
      ...icon
    }

    iconsCache.set(icon.id, { isCached: true, ...v })

    return v
  },
  pluralize: function (count, word) {
    return pluralize(word, this.count(count), true)
  },
  saveAs: async function (data, filename) {
    const { currentToast } = this.currentToast(filename, {
      description: 'Preparing to download',
      duration: Number.POSITIVE_INFINITY
    })

    const file = await Promise.all([data, filename])

    saveAs(...file)

    currentToast.update({
      action: (
        <Button color='primary' onPress={() => saveAs(...file)} size='sm' variant='bordered'>
          Download
        </Button>
      ),
      description: 'Sent download link',
      duration: undefined
    })
  },
  saveIconsAs: function (icons, filename, pathType = 'detail') {
    const zip = new JSZip()

    for (let icon of icons) {
      icon = this.parseIcon(icon)

      zip.file(icon.paths.svg[pathType], icon.to.html)
    }

    return this.saveAs(zip.generateAsync({ type: 'blob' }), filename)
  },
  unix: t => {
    useRafInterval(useUpdate(), 60_000)

    return dayjs.unix(t).fromNow()
  }
}

const iconSets = {
  clear: async () => {
    await idb.clear()
    location.reload(true)
  },
  init: function () {
    const { setGlobalState } = use.globalState()
    const [state, setState] = useState(true)

    useAsyncEffect(async (message = 'App') => {
      if (!(window.indexedDB && window.Blob))
        return toast(message, {
          description: 'Browser not supported',
          duration: Number.POSITIVE_INFINITY
        })

      if (await this.shouldUpdate()) {
        const { currentToast } = use.currentToast(message, {
          description: (
            <>
              Downloading latest content
              <ScrollShadow className='h-96'>
                <My.Listbox>
                  {{
                    '': Object.keys(this.module).map(key => {
                      const iconSet = collections[key]

                      return {
                        description: use.pluralize(iconSet.total, 'icon'),
                        isDisabled: true,
                        title: iconSet.name
                      }
                    })
                  }}
                </My.Listbox>
              </ScrollShadow>
            </>
          ),
          duration: Number.POSITIVE_INFINITY
        })

        await idb.clear()

        try {
          await Promise.all(
            Object.values(this.module).map(async getIconSet => {
              const iconSet = quicklyValidateIconSet(await getIconSet())

              if (!iconSet) throw error

              parseIconSet(iconSet, (name, data) => {
                iconSet.icons[name] = data
              })

              await idb.set(iconSet.prefix, {
                author: iconSet.info.author.name,
                categories: iconSet.categories,
                category: iconSet.info.category ?? 'Uncategorized',
                icons: iconSet.icons,
                lastModified: iconSet.lastModified,
                license: iconSet.info.license.title,
                name: iconSet.info.name,
                palette: iconSet.info.palette,
                prefix: iconSet.prefix,
                prefixes: iconSet.prefixes,
                suffixes: iconSet.suffixes
              })
            })
          )

          await idb.set('VERSION', this.version)
          currentToast.update({ description: 'Please wait', duration: undefined })
          setState(await this.shouldUpdate())
        } catch {
          currentToast.update({
            action: (
              <Button color='warning' onPress={this.clear} size='sm' variant='bordered'>
                Try again
              </Button>
            ),
            description: 'An error occurred'
          })
        }
      } else {
        toast(message, { description: 'No update required' })
        setState()
      }
    }, [])

    useAsyncEffect(async () => {
      if (state) return

      const allIconSets = mapObject(Object.fromEntries(await idb.entries()), (key, iconSet) => {
        if (key === 'VERSION') return mapObjectSkip

        iconSet.icons = Object.entries(iconSet.icons).map(([name, data]) => ({
          data: data,
          id: `${iconSet.prefix}:${name}`,
          name: name,
          prefix: iconSet.prefix,
          setName: iconSet.name
        }))

        return [key, iconSet]
      })

      setGlobalState(draft => {
        draft.allIconSets = allIconSets
        draft.allIcons = Object.values(allIconSets).flatMap(({ icons }) => icons)
        draft.hasData = true
      })
    }, [state])
  },
  module: mapObject(import.meta.glob('/node_modules/@iconify/json/json/*'), (key, value) => {
    key = key.slice(33, -5)

    return key in collections ? [key, value] : mapObjectSkip
  }),
  shouldUpdate: async function async() {
    return (await idb.get('VERSION')) !== this.version
  },
  storageUsage: () => {
    const [state, setState] = useState(0)

    useAsyncEffect(async () => setState((await navigator.storage.estimate()).usage), [])

    return prettyBytes(state)
  },
  version: semver.valid(semver.coerce(dependencies['@iconify/json']))
}

const Icons = {
  Card: ({ children: icons, footer, ...props }) => {
    const { isBookmarked, toggleBookmark } = use.bookmarks()
    const [state, { toggle }] = useBoolean(true)

    if (state) icons = _.orderBy(icons, ['name'], ['asc'])

    return (
      <Card
        classNames={{
          base: 'h-full rounded-none bg-background',
          footer: 'absolute inset-x-0 bottom-0 h-[--footer-height] rounded-none'
        }}
        isFooterBlurred
        style={{ '--footer-height': '4rem' }}>
        <VirtuosoGrid
          className='overflow-hidden'
          components={{
            Footer: () =>
              use.count(icons) ? (
                <div className='h-[--footer-height]' />
              ) : (
                <div className='flex-center text-sm text-foreground-500'>No icons</div>
              ),
            ScrollSeekPlaceholder: ({ height, index, width }) => {
              const icon = icons[index]

              return (
                <div className='flex-center' style={{ height, width }}>
                  <Avatar classNames={{ base: 'bg-background' }} name={icon.name} size='lg' />
                </div>
              )
            }
          }}
          data={icons}
          itemClassName='p-6'
          itemContent={(index, icon) => {
            icon = use.parseIcon(icon)

            return (
              <My.HoverCard
                asDropdown
                content={
                  <My.Listbox>
                    {{
                      [`#${index + 1}`]: [
                        {
                          description: icon.setName,
                          onPress: () => {
                            const url = URL.createObjectURL(
                              new Blob([icon.to.html], { type: 'image/svg+xml' })
                            )

                            open(url)
                            URL.revokeObjectURL(url)
                          },
                          title: icon.name
                        }
                      ],
                      Bookmark: ['Add', 'Remove'].map(title => ({
                        isDisabled: (title === 'Add') === isBookmarked(icon),
                        onPress: () => toggleBookmark(icon),
                        title: title
                      })),
                      ...mapObject(icon.paths, (fileType, path) => {
                        const text = {
                          css: icon.to.css,
                          json: JSON.stringify(icon.data, undefined, 2),
                          svg: icon.to.html,
                          txt: icon.to.dataUrl
                        }[fileType]

                        return [
                          { txt: 'Data URL' }[fileType] ?? fileType.toUpperCase(),
                          [
                            {
                              onPress: () => copy(text) && toast('Copied!'),
                              title: 'Copy'
                            },
                            {
                              onPress: () => use.saveAs(new Blob([text]), path.detail),
                              title: 'Download'
                            }
                          ]
                        ]
                      })
                    }}
                  </My.Listbox>
                }>
                <Button
                  isIconOnly
                  onPress={() => toggleBookmark(icon)}
                  radius='full'
                  size='lg'
                  variant='light'>
                  <div className='!size-8 text-foreground' css={css(icon.to.css.slice(10, -3))} />
                </Button>
              </My.HoverCard>
            )
          }}
          listClassName='flex-center flex-wrap h-auto'
          scrollSeekConfiguration={{ enter: x => Math.abs(x), exit: x => x === 0 }}
          {...props}
        />
        <CardFooter>
          {footer ?? (
            <div className='card__footer'>
              {use.pluralize(icons, 'icon')}
              <My.IconButton icon={state ? 'line-md:watch' : 'line-md:watch-off'} onPress={toggle}>
                {`${state ? 'Sorted' : 'Sort'} ${use.pluralize(icons, 'icon')}`}
              </My.IconButton>
            </div>
          )}
        </CardFooter>
      </Card>
    )
  },
  Endless: () => {
    const step = 100
    const sizes = _.range(step, 10_000 + step, step)
    const { globalState } = use.globalState()
    const [state, setState] = useSetState({ icons: [], size: step })

    const endReached = () =>
      setState(state => ({
        icons: [...state.icons, ..._.sampleSize(globalState.allIcons, state.size)]
      }))

    useEffect(endReached, [])

    return (
      <Icons.Card
        endReached={endReached}
        footer={
          <div className='card__footer'>
            {use.pluralize(state.icons, 'icon')}
            <My.IconButton
              dropdown={
                <My.Listbox>
                  {{
                    'Icons per page': sizes.map(size => ({
                      description: 'icons',
                      isActive: size === state.size,
                      onPress: () => setState({ size }),
                      title: size
                    }))
                  }}
                </My.Listbox>
              }
              icon='line-md:arrow-align-right'
            />
          </div>
        }>
        {state.icons}
      </Icons.Card>
    )
  },
  Filter: iconSet => {
    iconSet = _.clone(iconSet)
    const initialState = { category: undefined, theme: undefined }

    const [state, setState, validState = key => typeof state[key] === 'string'] =
      useSetState(initialState)

    const themes = iconSet.prefixes || iconSet.suffixes
    const selectedCount = use.count(Object.keys(state).filter(validState))

    iconSet.icons = iconSet.icons.filter(icon => {
      const isMatchingTheme = (theme = state.theme) =>
        icon.name[iconSet.prefixes ? 'startsWith' : 'endsWith'](
          iconSet.prefixes ? `${theme}-` : `-${theme}`
        )

      const a =
        !iconSet.categories ||
        !validState('category') ||
        iconSet.categories[state.category]?.includes(icon.name)

      const b =
        !themes ||
        !validState('theme') ||
        (state.theme === '' ? !Object.keys(themes).some(isMatchingTheme) : isMatchingTheme())

      return a && b
    })

    useDeepCompareEffect(() => {
      if (state !== initialState) setState(initialState)
    }, [iconSet.categories, iconSet.prefixes, iconSet.suffixes])

    return (
      <Icons.Card
        footer={
          <div className='card__footer'>
            {use.pluralize(iconSet.icons, 'icon')}
            {themes || iconSet.categories ? (
              <My.IconButton
                dropdown={
                  <My.Listbox>
                    {{
                      ...(themes && {
                        [use.pluralize(themes, 'theme')]: Object.entries(themes).map(
                          ([theme, title, isActive = state.theme === theme]) => ({
                            description: isActive && 'Deselect',
                            isActive: isActive,
                            onPress: () => setState({ theme: !isActive && theme }),
                            title: title
                          })
                        )
                      }),
                      ...(iconSet.categories && {
                        [use.pluralize(iconSet.categories, 'category')]: Object.keys(
                          iconSet.categories
                        ).map(category => {
                          const isActive = state.category === category

                          return {
                            description: isActive && 'Deselect',
                            isActive: isActive,
                            onPress: () => setState({ category: !isActive && category }),
                            title: category
                          }
                        })
                      }),
                      [use.pluralize(iconSet.icons, 'icon')]: [
                        {
                          description: `${iconSet.name}.zip`,
                          isDisabled: !use.count(iconSet.icons),
                          onPress: () =>
                            use.saveIconsAs(iconSet.icons, `${iconSet.name}.zip`, 'default'),
                          title: 'Download'
                        }
                      ]
                    }}
                  </My.Listbox>
                }
                icon={selectedCount ? 'line-md:filter-filled' : 'line-md:filter'}
              />
            ) : (
              <My.IconButton
                icon='line-md:arrow-small-down'
                onPress={() => use.saveIconsAs(iconSet.icons, `${iconSet.name}.zip`, 'default')}>
                {`${iconSet.name}.zip`}
              </My.IconButton>
            )}
          </div>
        }>
        {iconSet.icons}
      </Icons.Card>
    )
  },
  Search: memo(({ placeholder = 'Search' }) => {
    const { globalState } = use.globalState()
    const [state, setState] = useState([])
    const fuse = useCreation(() => new Fuse(globalState.allIcons, { keys: ['name'], threshold: 0 }))

    const { run: setDebounceState } = useDebounceFn(
      input => setState(fuse.search(kebabCase(input)).map(({ item }) => item)),
      { wait: 300 }
    )

    useEffect(() => setDebounceState(placeholder), [])

    return (
      <Icons.Card
        footer={
          <div className='card__footer'>
            <Input
              autoFocus
              classNames={{
                inputWrapper: 'border-none',
                label: use.count(state) && '!text-foreground-500'
              }}
              isInvalid={!use.count(state)}
              label={use.pluralize(state, 'icon')}
              onValueChange={setDebounceState}
              placeholder={placeholder}
              startContent={<Icon className='size-5' icon='line-md:search' />}
              variant='bordered'
            />
            {!!use.count(state) && (
              <My.IconButton
                dropdown={
                  <My.Listbox>
                    {{
                      Default: [
                        {
                          description: 'Search results',
                          onPress: () =>
                            use.saveIconsAs(state, `${use.pluralize(state, 'icon')}.zip`),
                          title: use.pluralize(state, 'icon')
                        }
                      ],
                      [use.pluralize(
                        _.groupBy(state, icon => icon.prefix),
                        'icon set'
                      )]: Object.values(globalState.allIconSets).map(iconSet => {
                        const icons = state.filter(icon => icon.prefix === iconSet.prefix)

                        return {
                          description: use.pluralize(icons, 'icon'),
                          isDisabled: !use.count(icons),
                          onPress: () => use.saveIconsAs(icons, `${iconSet.name}.zip`, 'default'),
                          title: iconSet.name
                        }
                      })
                    }}
                  </My.Listbox>
                }
                icon='line-md:arrow-small-down'
              />
            )}
          </div>
        }>
        {state}
      </Icons.Card>
    )
  })
}

const My = {
  HoverCard: ({ align = 'center', asDropdown, asTooltip, children, content }) => {
    const [state, setState] = useState()
    const ref = useRef()
    const x = useSpring(0)
    const setX = v => x.set(v / 4)

    return (
      <HoverCard.Root closeDelay={200} onOpenChange={setState} openDelay={0}>
        <HoverCard.Trigger
          asChild
          className='!scale-100'
          onMouseMove={({ clientX, target }) => {
            if (!ref.current) return

            const rect = target.getBoundingClientRect()

            if (align === 'center') return setX(clientX - rect.left - rect.width / 2)

            const contentWidth = ref.current.getBoundingClientRect().width
            const offsetX = clientX - rect[{ end: 'right', start: 'left' }[align]]

            const hoverOffset = { end: offsetX + contentWidth, start: offsetX - contentWidth }[
              align
            ]

            setX({ end: hoverOffset < 0, start: hoverOffset > 0 }[align] ? hoverOffset : offsetX)
          }}>
          {children}
        </HoverCard.Trigger>
        <AnimatePresence>
          {state && (
            <HoverCard.Portal forceMount>
              <HoverCard.Content
                align={asDropdown ? 'start' : align}
                ref={ref}
                side={asTooltip && 'top'}
                sideOffset={10}>
                <m.div
                  animate={{ scale: [0.7, 1] }}
                  className={cn({
                    card: true,
                    'max-h-[25rem] w-[16rem] overflow-hidden overflow-y-auto p-2': asDropdown,
                    'px-2.5 py-1 text-sm': asTooltip
                  })}
                  exit={{ opacity: 0, scale: 0.7 }}
                  style={{
                    transformOrigin: 'var(--radix-hover-card-content-transform-origin)',
                    x: x
                  }}>
                  {content}
                </m.div>
              </HoverCard.Content>
            </HoverCard.Portal>
          )}
        </AnimatePresence>
      </HoverCard.Root>
    )
  },
  IconButton: ({ children: content, dropdown, onPress, ...rest }) => (
    <My.HoverCard asDropdown={dropdown} asTooltip={content} content={content ?? dropdown}>
      <Link onPress={onPress}>
        <Icon className='size-8 cursor-pointer' {...rest} />
      </Link>
    </My.HoverCard>
  ),
  Listbox: ({ children: sections }) => (
    <Listbox aria-label={useId()} variant='light'>
      {Object.entries(sections).map(([title, items], index, data) => (
        <ListboxSection key={useId()} showDivider={index !== use.count(data) - 1} title={title}>
          {items.map(({ color = 'primary', descriptions = [], isActive, title, ...props }) => (
            <ListboxItem
              classNames={{ title: isActive && `text-${color}` }}
              color={isActive ? color : ''}
              description={descriptions.map(description => (
                <div key={useId()}>{description}</div>
              ))}
              key={useId()}
              textValue={useId()}
              {...props}>
              {title}
            </ListboxItem>
          ))}
        </ListboxSection>
      ))}
    </Listbox>
  ),
  Theme: ({ children }) => children(useTheme())
}

export default () => {
  const { globalState } = use.globalState()
  const { bookmarkedIcons } = use.bookmarks()
  const [state, setState] = useState('Endless scrolling')

  iconSets.init()

  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider attribute='class' disableTransitionOnChange>
        <NextUIProvider className='flex-center p-6'>
          {globalState.hasData ? (
            <PanelGroup
              className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
              direction='horizontal'>
              <Panel className='py-2' defaultSize={24}>
                <My.Theme>
                  {({ resolvedTheme, setTheme }) => (
                    <My.Listbox>
                      {{
                        [iconSets.version]: [
                          ['Endless scrolling', ['Hehe']],
                          ['Bookmarks', [use.pluralize(bookmarkedIcons, 'icon')]],
                          [
                            use.pluralize(globalState.allIconSets, 'icon set'),
                            [
                              use.pluralize(globalState.allIcons, 'icon'),
                              use.unix(
                                _.maxBy(
                                  Object.values(globalState.allIconSets),
                                  ({ lastModified }) => lastModified
                                ).lastModified
                              )
                            ]
                          ]
                        ].map(([title, descriptions]) => ({
                          descriptions: descriptions,
                          isActive: state === title,
                          onPress: () => setState(title),
                          title: title
                        })),
                        ...sortKeys(
                          mapObject(
                            _.groupBy(
                              Object.values(globalState.allIconSets),
                              ({ category }) => category
                            ),
                            (category, iconSets) => [
                              `${category} (${use.count(iconSets)})`,
                              _.orderBy(iconSets, ['name'], ['asc']).map(iconSet => ({
                                descriptions: [
                                  iconSet.author,
                                  iconSet.license,
                                  use.pluralize(iconSet.icons, 'icon'),
                                  use.unix(iconSet.lastModified)
                                ],
                                isActive: state === iconSet.prefix,
                                onPress: () => setState(iconSet.prefix),
                                title: (
                                  <div className={cn(iconSet.palette && 'italic underline')}>
                                    {iconSet.name}
                                  </div>
                                )
                              }))
                            ]
                          )
                        ),
                        Settings: [
                          {
                            description: 'Toggle theme',
                            onPress: () =>
                              setTheme({ dark: 'light', light: 'dark' }[resolvedTheme]),
                            title: { dark: 'Dark', light: 'Light' }[resolvedTheme]
                          },
                          {
                            description: 'View source code',
                            href: 'https://github.com/phatdev-hehe/icon-sets',
                            target: 'blank',
                            title: 'GitHub'
                          },
                          {
                            color: 'warning',
                            description: iconSets.storageUsage(),
                            isActive: true,
                            onPress: iconSets.clear,
                            title: 'Clear cache'
                          }
                        ]
                      }}
                    </My.Listbox>
                  )}
                </My.Theme>
              </Panel>
              <PanelResizeHandle />
              <Panel>
                <PanelGroup direction='vertical'>
                  <Panel>
                    {state === 'Endless scrolling' && <Icons.Endless />}
                    {state === use.pluralize(globalState.allIconSets, 'icon set') && (
                      <Icons.Card>{globalState.allIcons}</Icons.Card>
                    )}
                    {state === 'Bookmarks' && (
                      <Icons.Card>
                        {bookmarkedIcons.map(bookmarkedIcon =>
                          globalState.allIconSets[bookmarkedIcon.prefix].icons.find(
                            icon => icon.name === bookmarkedIcon.name
                          )
                        )}
                      </Icons.Card>
                    )}
                    {Object.keys(globalState.allIconSets).includes(state) && (
                      <Icons.Filter {...globalState.allIconSets[state]} />
                    )}
                  </Panel>
                  <PanelResizeHandle />
                  <Panel>
                    <Icons.Search />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          ) : (
            <Spinner label='Loading…' />
          )}
        </NextUIProvider>
        <Canvas className='!fixed inset-0 -z-10 hidden dark:block'>
          <Stars count={1_000} depth={700} fade />
        </Canvas>
        <My.Theme>
          {({ resolvedTheme }) => <Toaster pauseWhenPageIsHidden theme={resolvedTheme} />}
        </My.Theme>
      </ThemeProvider>
    </LazyMotion>
  )
}
