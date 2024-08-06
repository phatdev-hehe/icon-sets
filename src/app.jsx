import useUrlState from '@ahooksjs/use-url-state'
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
  useCreation,
  useDebounceEffect,
  useDeepCompareEffect,
  useLocalStorageState,
  useRafInterval,
  useRafState,
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
import { memo, useEffect, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { VirtuosoGrid } from 'react-virtuoso'
import semver from 'semver'
import { Toaster, toast } from 'sonner'
import sortKeys from 'sort-keys'

import { dependencies } from '../package.json'

import collections from '/node_modules/@iconify/json/collections.json'

dayjs.extend(relativeTime)

const atom = atomWithImmer({ allIcons: [], allIconSets: {} })
const iconsCache = new LRUCache({ max: 500 })

const use = {
  get bookmarkIcons() {
    const [state, setState] = useLocalStorageState('bookmark-icons', {
      defaultValue: [],
      listenStorageChange: true
    })

    const isValidIconBookmark = (iconObject, icon) => _.isEqual(iconObject, stringToIcon(icon.id))
    const isIconBookmarked = icon => state.some(iconObject => isValidIconBookmark(iconObject, icon))

    return {
      bookmarkIcons: state,
      isIconBookmarked: isIconBookmarked,
      toggleIconBookmark: icon => {
        if (isIconBookmarked(icon)) {
          setState(state => state.filter(iconObject => !isValidIconBookmark(iconObject, icon)))
          toast('Bookmark removed')
        } else {
          setState(state => [...state, stringToIcon(icon.id)])
          toast('Bookmark added')
        }
      }
    }
  },
  copy: text => toast(copy(text) ? 'Copied!' : 'Copy failed'),
  count: value => {
    if (Array.isArray(value)) return value.length
    if (typeof value === 'object') return Object.keys(value).length

    return +value
  },
  get globalState() {
    const [globalState, setGlobalState] = useAtom(atom)

    return { globalState, setGlobalState }
  },
  iconSets: {
    clear: async (shouldClear = true) => {
      shouldClear && (await idb.clear())
      location.reload(true)
    },
    get estimateStorageUsage() {
      const [state, setState] = useRafState(0)

      useAsyncEffect(async () => setState((await navigator.storage.estimate()).usage), [])

      return prettyBytes(state)
    },
    get init() {
      const { setGlobalState } = use.globalState
      const [state, setState] = useRafState(true)

      useAsyncEffect(async (message = 'App') => {
        if (!window)
          return toast(message, {
            description: 'Browser not supported',
            duration: Number.POSITIVE_INFINITY
          })

        if ((await idb.get('version')) === 'not_found')
          return toast(message, {
            action: (
              <Button
                color='warning'
                onPress={async () => this.clear(await this.shouldUpdate())}
                size='sm'
                variant='bordered'>
                Relaunch
              </Button>
            ),
            description: 'Invalid data',
            duration: Number.POSITIVE_INFINITY
          })

        if (await this.shouldUpdate()) {
          const { currentToast } = use.toast(message, {
            description: (
              <>
                Downloading latest content
                <ScrollShadow className='h-96'>
                  <Comp.Listbox>
                    {{
                      '': Object.keys(this.module).map(key => {
                        const iconSet = collections[key]

                        return {
                          description: iconSet.author.name,
                          isDisabled: true,
                          title: iconSet.name
                        }
                      })
                    }}
                  </Comp.Listbox>
                </ScrollShadow>
              </>
            ),
            duration: Number.POSITIVE_INFINITY
          })

          await idb.clear()
          await idb.set('version', 'not_found')

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

            await idb.update('version', () => this.version)
            currentToast.update({ description: 'Please wait', duration: null })
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
          if (key === 'version') return mapObjectSkip

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

      return null
    },
    module: mapObject(import.meta.glob('/node_modules/@iconify/json/json/*'), (key, value) => {
      key = key.slice(33, -5)

      return key in collections ? [key, value] : mapObjectSkip
    }),
    shouldUpdate: async function () {
      return (
        (await idb.get('version')) !== this.version ||
        !_.isEqual(_.xor(Object.keys(collections), await idb.keys()), ['version'])
      )
    },
    version: semver.valid(semver.coerce(dependencies['@iconify/json']))
  },
  get id() {
    return nanoid()
  },
  parse: {
    icon: (icon, k = icon.id) => {
      if (iconsCache.has(k)) return iconsCache.get(k)

      const svg = iconToSVG(icon.data)

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
          dataUrl: getIconContentCSS(icon.data, svg.attributes).slice(31, -6),
          html: iconToHTML(replaceIDs(svg.body, use.id), svg.attributes)
        },
        ...icon
      }

      iconsCache.set(k, v)

      return v
    },
    unix: t => {
      useRafInterval(use.update, 60_000)

      return dayjs.unix(t).fromNow()
    }
  },
  pluralize: (value, word) => pluralize(word, use.count(value), true),
  get recentlyViewedIcons() {
    return [...iconsCache.values()]
  },
  save: {
    as: async (data, filename) => {
      const { currentToast } = use.toast(filename, {
        description: 'Preparing to download',
        duration: Number.POSITIVE_INFINITY
      })

      const promise = await Promise.all([data, filename])
      const download = () => saveAs(...promise)

      download()

      currentToast.update({
        action: (
          <Button color='primary' onPress={download} size='sm' variant='bordered'>
            Download
          </Button>
        ),
        description: 'Sent download link',
        duration: null
      })
    },
    iconsAs: function (icons, filename, pathType = 'default') {
      const zip = new JSZip()

      for (let icon of icons) {
        icon = use.parse.icon(icon)

        zip.file(icon.paths.svg[pathType], icon.to.html)
      }

      return this.as(zip.generateAsync({ type: 'blob' }), filename)
    }
  },
  toast: (message, data, id = toast(message, data)) => ({
    currentToast: { update: data => toast(message, { ...data, id }) }
  }),
  get update() {
    return useUpdate()
  }
}

const Comp = {
  EndlessIcons: ({ step = 100, sizes = _.range(step, 1_000 + step, step) }) => {
    const { globalState } = use.globalState
    const [state, setState] = useSetState({ icons: [], size: step })

    const loadMoreIcons = () =>
      setState(state => ({
        icons: [...state.icons, ..._.sampleSize(globalState.allIcons, state.size)]
      }))

    useEffect(loadMoreIcons, [])

    return (
      <Comp.IconGrid
        endReached={loadMoreIcons}
        footerRight={
          <Comp.IconButton
            dropdown={
              <Comp.Listbox>
                {{
                  [use.pluralize(sizes, 'size')]: sizes.map(size => ({
                    description: 'icons',
                    isActive: size === state.size,
                    onPress: () => setState({ size }),
                    title: size
                  }))
                }}
              </Comp.Listbox>
            }
            icon='line-md:arrow-align-right'
          />
        }
        icons={state.icons}
      />
    )
  },
  FilterIcons: iconSet => {
    const initialState = { category: false, theme: false }

    const [state, setState, isValidState = key => typeof state[key] === 'string'] =
      useSetState(initialState)

    iconSet = _.clone(iconSet)
    iconSet.themes = iconSet.prefixes ?? iconSet.suffixes

    iconSet.icons = iconSet.icons.filter(icon => {
      const isMatchingTheme = (theme = state.theme) =>
        icon.name[iconSet.prefixes ? 'startsWith' : 'endsWith'](
          iconSet.prefixes ? `${theme}-` : `-${theme}`
        )

      return (
        (!isValidState('category') || iconSet.categories?.[state.category]?.includes(icon.name)) &&
        (!isValidState('theme') ||
          (state.theme === ''
            ? !Object.keys(iconSet.themes).some(isMatchingTheme)
            : isMatchingTheme()))
      )
    })

    useDeepCompareEffect(
      () => setState(initialState),
      [iconSet.categories, iconSet.prefixes, iconSet.suffixes]
    )

    return (
      <Comp.IconGrid
        footerRight={
          iconSet.themes || iconSet.categories ? (
            <Comp.IconButton
              dropdown={
                <Comp.Listbox>
                  {{
                    ...(iconSet.themes && {
                      [use.pluralize(iconSet.themes, 'theme')]: Object.entries(iconSet.themes).map(
                        ([theme, title, isActive = state.theme === theme]) => ({
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
                          isActive: isActive,
                          onPress: () => setState({ category: !isActive && category }),
                          title: category
                        }
                      })
                    }),
                    Download: [
                      {
                        description: use.pluralize(iconSet.icons, 'icon'),
                        isDisabled: !use.count(iconSet.icons),
                        onPress: () => use.save.iconsAs(iconSet.icons, `${iconSet.name}.zip`),
                        title: `${iconSet.name}.zip`
                      }
                    ]
                  }}
                </Comp.Listbox>
              }
              icon={_.isEqual(state, initialState) ? 'line-md:filter' : 'line-md:filter-filled'}
            />
          ) : (
            <Comp.IconButton
              icon='line-md:arrow-small-down'
              onPress={() => use.save.iconsAs(iconSet.icons, `${iconSet.name}.zip`)}
              tooltip={`${iconSet.name}.zip`}
            />
          )
        }
        icons={iconSet.icons}
      />
    )
  },
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
            if (ref.current) {
              const rect = target.getBoundingClientRect()

              if (align === 'center') return setX(clientX - rect.left - rect.width / 2)

              const { width: contentWidth } = ref.current.getBoundingClientRect()
              const offsetX = clientX - rect[{ end: 'right', start: 'left' }[align]]
              const v = { end: offsetX + contentWidth, start: offsetX - contentWidth }[align]

              setX({ end: v < 0, start: v > 0 }[align] ? v : offsetX)
            }
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
  IconButton: ({ dropdown, onPress, tooltip, ...rest }) => (
    <Comp.HoverCard asDropdown={dropdown} asTooltip={tooltip} content={tooltip ?? dropdown}>
      <Link onPress={onPress}>
        <Icon className='size-8 cursor-pointer' {...rest} />
      </Link>
    </Comp.HoverCard>
  ),
  IconGrid: ({ footer, footerRight, icons, iconsFromStorage, ...props }) => {
    const { globalState } = use.globalState
    const { isIconBookmarked, toggleIconBookmark } = use.bookmarkIcons
    const [state, setState] = useState()

    if (iconsFromStorage)
      icons = iconsFromStorage.map(i =>
        globalState.allIconSets[i.prefix].icons.find(icon => icon.name === i.name)
      )

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
            icon = use.parse.icon(icon)

            return (
              <Comp.HoverCard
                asDropdown
                content={
                  <Comp.Listbox>
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
                        isDisabled: (title === 'Add') === isIconBookmarked(icon),
                        onPress: () => toggleIconBookmark(icon),
                        title: title
                      })),
                      ...mapObject(icon.paths, (fileType, path) => {
                        const text = {
                          css: icon.to.css,
                          json: JSON.stringify(icon.data, null, 2),
                          svg: icon.to.html,
                          txt: icon.to.dataUrl
                        }[fileType]

                        return [
                          fileType.toUpperCase(),
                          [
                            { onPress: () => use.copy(text), title: 'Copy' },
                            {
                              onPress: () => use.save.as(new Blob([text]), path.detail),
                              title: 'Download'
                            }
                          ]
                        ]
                      })
                    }}
                  </Comp.Listbox>
                }>
                <Button
                  isIconOnly
                  onPress={() => toggleIconBookmark(icon)}
                  radius='full'
                  size='lg'
                  variant='light'>
                  <div className='!size-8 text-foreground' css={css(icon.to.css.slice(10, -3))} />
                </Button>
              </Comp.HoverCard>
            )
          }}
          listClassName='flex-center flex-wrap h-auto'
          scrollSeekConfiguration={{ enter: v => Math.abs(v), exit: v => v === 0 }}
          {...props}
        />
        <CardFooter>
          {footer ?? (
            <div className='flex-center justify-between px-3 text-sm'>
              {use.pluralize(icons, 'icon')}
              {footerRight ?? (
                <Comp.IconButton
                  icon={state ? 'line-md:watch' : 'line-md:watch-off'}
                  onPress={() => setState(!state)}
                  tooltip={state ? 'Sorted' : 'Sort'}
                />
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    )
  },
  Listbox: ({ children: sections }) => (
    <Listbox aria-label={use.id} variant='light'>
      {Object.entries(sections).map(([title, items], index, data) => (
        <ListboxSection key={use.id} showDivider={index !== use.count(data) - 1} title={title}>
          {items.map(({ color = 'primary', descriptions = [], isActive, title, ...props }) => (
            <ListboxItem
              classNames={{ title: isActive && `text-${color}` }}
              color={isActive ? color : ''}
              description={descriptions.map(description => (
                <div key={use.id}>{description}</div>
              ))}
              key={use.id}
              textValue={use.id}
              {...props}>
              {title}
            </ListboxItem>
          ))}
        </ListboxSection>
      ))}
    </Listbox>
  ),
  Providers: ({ children }) => (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider attribute='class' disableTransitionOnChange>
        <NextUIProvider className='flex-center p-6'>
          <RouterProvider router={createBrowserRouter([{ element: children, path: '/' }])} />
        </NextUIProvider>
      </ThemeProvider>
    </LazyMotion>
  ),
  RecentlyViewedIcons: () => {
    useEffect(use.update, [])

    return (
      <Comp.IconGrid
        footerRight={
          <Comp.IconButton icon='line-md:round-360' onPress={use.update} tooltip='Refresh' />
        }
        icons={use.recentlyViewedIcons}
      />
    )
  },
  SearchIcons: memo(({ placeholder = 'Search' }) => {
    const { globalState } = use.globalState
    const fuse = useCreation(() => new Fuse(globalState.allIcons, { keys: ['name'], threshold: 0 }))
    const [state, setState] = useSetState({ icons: [], searchResults: [] })

    const isUnfiltered = (searchResults = state.searchResults) =>
      _.isEqual(searchResults, state.icons)

    const [{ search: searchPattern }, setSearchPattern] = useUrlState(
      { search: placeholder },
      { navigateMode: 'replace' }
    )

    let listboxSections = mapObject(globalState.allIconSets, (key, iconSet) => [
      iconSet.name,
      state.searchResults.filter(icon => icon.prefix === iconSet.prefix)
    ])

    listboxSections = mapObject(
      sortKeys(listboxSections, {
        compare: (a, b) => use.count(listboxSections[b]) - use.count(listboxSections[a])
      }),
      (iconSetName, icons) => [
        `${iconSetName} (${use.count(icons)})`,
        [
          {
            isDisabled: isUnfiltered(icons) || !use.count(icons),
            onPress: () => setState({ icons }),
            title: 'View'
          },
          {
            isDisabled: !use.count(icons),
            onPress: () => use.save.iconsAs(icons, `${iconSetName}.zip`),
            title: 'Download'
          }
        ]
      ]
    )

    useDebounceEffect(
      () => {
        const icons = fuse.search(kebabCase(searchPattern)).map(({ item }) => item)

        setState({ icons: icons, searchResults: icons })
      },
      [searchPattern],
      { wait: 300 }
    )

    return (
      <Comp.IconGrid
        footer={
          <Input
            autoFocus
            classNames={{
              inputWrapper: 'border-none',
              label: use.count(state.icons) && '!text-foreground-500'
            }}
            endContent={
              <Comp.IconButton
                dropdown={
                  <Comp.Listbox>
                    {{
                      [`All results (${use.count(state.searchResults)})`]: [
                        {
                          isDisabled: isUnfiltered(),
                          onPress: () => setState(state => ({ icons: state.searchResults })),
                          title: 'View'
                        },
                        {
                          isDisabled: !use.count(state.searchResults),
                          onPress: () =>
                            use.save.iconsAs(
                              state.searchResults,
                              `${use.pluralize(state.searchResults, 'icon')} found.zip`,
                              'detail'
                            ),
                          title: 'Download'
                        }
                      ],
                      ...listboxSections
                    }}
                  </Comp.Listbox>
                }
                icon={isUnfiltered() ? 'line-md:filter' : 'line-md:filter-filled'}
              />
            }
            isInvalid={!use.count(state.icons)}
            label={use.pluralize(state.icons, 'icon')}
            onValueChange={search => setSearchPattern({ search })}
            placeholder={placeholder}
            startContent={<Icon className='size-5' icon='line-md:search' />}
            value={searchPattern}
            variant='bordered'
          />
        }
        icons={state.icons}
      />
    )
  }),
  Theme: ({ children }) => children(useTheme())
}

export default () => {
  use.iconSets.init

  const { globalState } = use.globalState
  const { bookmarkIcons } = use.bookmarkIcons
  const [state, setState] = useState('Endless scrolling')

  return (
    <Comp.Providers>
      {globalState.hasData ? (
        <PanelGroup
          className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
          direction='horizontal'>
          <Panel className='py-2' defaultSize={24}>
            <Comp.Theme>
              {({ resolvedTheme, setTheme }) => (
                <Comp.Listbox>
                  {{
                    [use.iconSets.version]: [
                      ['Endless scrolling', 'Hehe'],
                      ['Bookmarks', use.pluralize(bookmarkIcons, 'icon')],
                      ['Recently viewed', use.pluralize(use.recentlyViewedIcons, 'icon')],
                      [
                        use.pluralize(globalState.allIconSets, 'icon set'),
                        use.pluralize(globalState.allIcons, 'icon')
                      ]
                    ].map(([title, description]) => ({
                      description: description,
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
                              use.parse.unix(iconSet.lastModified)
                            ],
                            isActive: state === iconSet.prefix,
                            onPress: () => setState(iconSet.prefix),
                            title: (
                              <div className={cn({ 'italic underline': iconSet.palette })}>
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
                        onPress: () => setTheme({ dark: 'light', light: 'dark' }[resolvedTheme]),
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
                        description: use.iconSets.estimateStorageUsage,
                        isActive: true,
                        onPress: use.iconSets.clear,
                        title: 'Clear cache'
                      }
                    ]
                  }}
                </Comp.Listbox>
              )}
            </Comp.Theme>
          </Panel>
          <PanelResizeHandle />
          <Panel>
            <PanelGroup direction='vertical'>
              <Panel>
                {state === 'Endless scrolling' && <Comp.EndlessIcons />}
                {state === use.pluralize(globalState.allIconSets, 'icon set') && (
                  <Comp.IconGrid icons={globalState.allIcons} />
                )}
                {state === 'Bookmarks' && <Comp.IconGrid iconsFromStorage={bookmarkIcons} />}
                {state === 'Recently viewed' && <Comp.RecentlyViewedIcons />}
                {Object.keys(globalState.allIconSets).includes(state) && (
                  <Comp.FilterIcons {...globalState.allIconSets[state]} />
                )}
              </Panel>
              <PanelResizeHandle />
              <Panel>
                <Comp.SearchIcons />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      ) : (
        <Spinner label='Loading…' />
      )}
      <Canvas className='!fixed inset-0 -z-10 hidden dark:block'>
        <Stars count={1_000} depth={700} fade />
      </Canvas>
      <Comp.Theme>
        {({ resolvedTheme }) => <Toaster pauseWhenPageIsHidden theme={resolvedTheme} />}
      </Comp.Theme>
    </Comp.Providers>
  )
}
