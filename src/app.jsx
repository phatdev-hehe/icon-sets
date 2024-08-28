// can kt??
// thua thieu keyword [async, await, new,...]
// ten bien, ham co y nghia [icons, allIcons,...]
// su dung `use.atom` de chua cac icons (neu dc)
// <DocVaHienThiIcons /> phai thoa cac dieu kien sau (0 icons, 1 icon, 2 icons)

// to chuc code :v
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

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
  useMouse,
  useRafInterval,
  useRafState,
  useSetState,
  useSize,
  useUpdate,
  useUpdateEffect
} from 'ahooks'
import { kebabCase } from 'change-case'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import * as _ from 'es-toolkit'
import { size } from 'es-toolkit/compat'
import { saveAs } from 'file-saver'
import { AnimatePresence, LazyMotion, domAnimation, m, useSpring } from 'framer-motion'
import Fuse from 'fuse.js'
import * as idb from 'idb-keyval'
import { formatNumber } from 'intl-number-helper'
import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'
import JSZip from 'jszip'
import { LRUCache } from 'lru-cache'
import mapObject, { mapObjectSkip } from 'map-obj'
import MotionNumber from 'motion-number/lazy'
import { nanoid } from 'nanoid'
import { ThemeProvider, useTheme } from 'next-themes'
import pluralize from 'pluralize'
import prettyBytes from 'pretty-bytes'
import { memo, useRef } from 'react'
import { For, useLocalStorage, useSingleEffect } from 'react-haiku'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { useAsync } from 'react-use'
import { VirtuosoGrid } from 'react-virtuoso'
import semver from 'semver'
import { Toaster, toast } from 'sonner'
import sortKeys from 'sort-keys'

import { dependencies } from '../package.json'

import collections from '/node_modules/@iconify/json/collections.json'

dayjs.extend(relativeTime)

const [atom, iconsCache] = [
  atomWithImmer({ allIcons: [], allIconSets: {}, hasData: false }),
  new LRUCache({ max: 1_000 })
]

const use = {
  async: (fn, initialValue) => useAsync(fn).value ?? initialValue,
  get atom() {
    return { atom: useAtomValue(atom), setAtom: useSetAtom(atom) }
  },
  get bookmarkIcons() {
    const [state, setState] = useLocalStorage('bookmark-icons', [])
    const isIconBookmarked = icon => state.some(iconObject => _.isEqual(icon.to.object, iconObject))

    return {
      bookmarkIcons: state,
      isIconBookmarked: isIconBookmarked,
      toggleIconBookmark: icon => {
        setState(state =>
          isIconBookmarked(icon)
            ? state.filter(iconObject => !_.isEqual(icon.to.object, iconObject))
            : [...state, icon.to.object]
        )

        this.toast(isIconBookmarked(icon) ? 'Bookmark removed' : 'Bookmark added')
      }
    }
  },
  copy: function (text) {
    this.toast(copy(text) ? 'Copied' : 'Copy failed', {
      description: this.pluralize(text, 'character')
    })
  },
  count: value => (value === +value ? value : size(value)),
  iconSets: {
    clear: async (clear = true) => {
      clear && (await idb.clear())
      location.reload()
    },
    get init() {
      const { setAtom } = use.atom
      const [state, setState] = useRafState(true)

      useAsyncEffect(async () => {
        if (!window)
          return use.toast('Browser not supported', { duration: Number.POSITIVE_INFINITY })

        if (await this.version.isNotFound())
          return use.toast('Invalid data', {
            action: (
              <Comp.IconButton
                icon='line-md:rotate-270'
                onPress={async () => this.clear(await this.version.isOutdated())}
                tooltip='Try again'
              />
            ),
            duration: Number.POSITIVE_INFINITY
          })

        if (await this.version.isValid()) {
          ;(await this.version.isOutdated()) &&
            use.toast('New update found', {
              action: (
                <Comp.IconButton
                  icon='line-md:arrow-small-down'
                  onPress={this.clear}
                  tooltip='Update'
                />
              ),
              duration: Number.POSITIVE_INFINITY
            })

          setState()
        } else {
          const { currentToast } = use.toast('Working on updates', {
            description: (
              <>
                {use.pluralize(this.module, 'icon set')}
                <ScrollShadow className='h-96'>
                  <Comp.Listbox
                    sections={{
                      '': Object.keys(this.module).map(key => {
                        const iconSet = collections[key]

                        return {
                          description: iconSet.author.name,
                          isDisabled: true,
                          title: iconSet.name
                        }
                      })
                    }}
                  />
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

            await idb.update('version', () => this.version.latest)
            currentToast.dismiss
            setState(await this.version.isOutdated())
          } catch {
            currentToast.update({
              action: (
                <Comp.IconButton
                  icon='line-md:rotate-270'
                  onPress={this.clear}
                  tooltip='Try again'
                />
              ),
              description: null,
              title: 'Update failed'
            })
          }
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

        setAtom(draft => {
          draft.allIcons = Object.values(allIconSets).flatMap(({ icons }) => icons)
          draft.allIconSets = allIconSets
          draft.hasData = true
        })
      }, [state])

      return null
    },
    module: mapObject(import.meta.glob('/node_modules/@iconify/json/json/*'), (key, value) => {
      key = key.slice(33, -5)

      return key in collections ? [key, value] : mapObjectSkip
    }),
    version: {
      current: async () => await idb.get('version'),
      isNotFound: async function () {
        return (await this.current()) === 'not_found'
      },
      isOutdated: async function () {
        return !(
          (await this.current()) === this.latest &&
          _.isEqual(_.xor(Object.keys(collections), await idb.keys()), ['version'])
        )
      },
      isValid: async function () {
        return semver.valid(await this.current())
      },
      latest: semver.valid(semver.coerce(dependencies['@iconify/json']))
    }
  },
  get id() {
    return nanoid()
  },
  parseIcon: function (icon, k = icon.id) {
    if (iconsCache.has(k)) return iconsCache.get(k)

    const svg = iconToSVG(icon.data)

    const v = {
      filenames: mapObject({ css: {}, json: {}, svg: {}, txt: {} }, fileType => [
        fileType,
        {
          default: `${icon.name}.${fileType}`,
          detail: `[${icon.setName}] ${icon.name}.${fileType}`
        }
      ]),
      to: {
        css: getIconCSS(icon.data),
        dataUrl: getIconContentCSS(icon.data, svg.attributes).slice(31, -6),
        html: iconToHTML(replaceIDs(svg.body, this.id), svg.attributes),
        object: stringToIcon(icon.id)
      },
      ...icon
    }

    iconsCache.set(k, v)

    return v
  },
  pluralize: function (value, word, pretty) {
    value = this.count(value)

    return `${pretty ? `${formatNumber(value, 'en-us', 's')} ` : ''}${pluralize(word, value, !pretty)}`
  },
  get recentlyViewedIcons() {
    return [...iconsCache.values()]
  },
  relativeTime: function (t) {
    useRafInterval(this.update, 60_000)

    return dayjs.unix(t).fromNow()
  },
  saveAs: async function (getData, filename) {
    const { currentToast } = this.toast(filename, {
      action: <Comp.IconButton icon='line-md:loading-loop' tooltip='Preparing to download' />,
      duration: Number.POSITIVE_INFINITY
    })

    const [data, download] = [await getData, () => saveAs(data, filename)]

    download()

    currentToast.update({
      action: (
        <Comp.IconButton icon='line-md:arrow-small-down' onPress={download} tooltip='Download' />
      ),
      duration: null
    })
  },
  saveIconsAs: function (icons, filename, iconNameType = 'default') {
    const zip = new JSZip()

    for (let icon of icons) {
      icon = this.parseIcon(icon)

      zip.file(icon.filenames.svg[iconNameType], icon.to.html)
    }

    return this.saveAs(zip.generateAsync({ type: 'blob' }), filename)
  },
  get spring() {
    return useSpring(0)
  },
  toast: (message, data, id = toast(message, data)) => ({
    currentToast: {
      get dismiss() {
        return toast.dismiss(id)
      },
      update: data => toast(message, { ...data, id })
    }
  }),
  get update() {
    return useUpdate()
  }
}

const Comp = {
  EndlessIcons: ({ step = 100, sizes = _.range(step, 1_000 + step, step) }) => {
    const { atom } = use.atom
    const [state, setState] = useSetState({ icons: [], size: step })

    const loadMoreIcons = () =>
      setState(state => ({
        icons: [...state.icons, ..._.sampleSize(atom.allIcons, state.size)]
      }))

    useSingleEffect(loadMoreIcons)

    return (
      <Comp.IconGrid
        endReached={loadMoreIcons}
        footerRight={
          <Comp.IconButton
            icon='line-md:arrow-align-right'
            listbox={{
              [use.pluralize(sizes, 'size')]: sizes.map(size => ({
                description: 'icons',
                isActive: size === state.size,
                onPress: () => setState({ size }),
                title: size
              }))
            }}
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

    iconSet = structuredClone(iconSet)
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
          (iconSet.themes || iconSet.categories) && (
            <Comp.IconButton
              icon={_.isEqual(state, initialState) ? 'line-md:filter' : 'line-md:filter-filled'}
              listbox={{
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
                    onPress: () => use.saveIconsAs(iconSet.icons, `${iconSet.name}.zip`),
                    title: `${iconSet.name}.zip`
                  }
                ]
              }}
            />
          )
        }
        icons={iconSet.icons}
      />
    )
  },
  HoverCard: ({ align = 'center', children, listbox, tooltip }) => {
    const [state, setState] = useRafState()
    const ref = useRef()
    const [x, setX] = [use.spring, v => x.set(v / 4)]

    return (
      <HoverCard.Root closeDelay={200} onOpenChange={setState} openDelay={0}>
        <HoverCard.Trigger
          asChild
          className='!scale-100'
          onMouseMove={({ clientX, target }) => {
            if (ref.current) {
              const rect = target.getBoundingClientRect()

              if (align === 'center') return setX(clientX - rect.left - rect.width / 2)

              const [w, x, v] = [
                ref.current.getBoundingClientRect().width,
                clientX - rect[{ end: 'right', start: 'left' }[align]],
                { end: x + w, start: x - w }[align]
              ]

              setX({ end: v < 0, start: v > 0 }[align] ? v : x)
            }
          }}>
          {children}
        </HoverCard.Trigger>
        <AnimatePresence>
          {state && (
            <HoverCard.Portal forceMount>
              <HoverCard.Content
                align={listbox ? 'start' : align}
                ref={ref}
                side={tooltip && 'top'}
                sideOffset={10}>
                <m.div
                  animate={{ scale: [0.7, 1] }}
                  className={cn({
                    'card text-sm': true,
                    'max-h-96 w-64 overflow-x-hidden p-2': listbox,
                    'px-2.5 py-1': tooltip
                  })}
                  exit={{ opacity: 0, scale: 0.7 }}
                  style={{
                    transformOrigin: 'var(--radix-hover-card-content-transform-origin)',
                    x: x
                  }}>
                  {tooltip ?? <Comp.Listbox sections={listbox} />}
                </m.div>
              </HoverCard.Content>
            </HoverCard.Portal>
          )}
        </AnimatePresence>
      </HoverCard.Root>
    )
  },
  IconButton: ({ listbox, onPress, tooltip, ...rest }) => (
    <Comp.HoverCard {...{ listbox, tooltip }}>
      <Link className='size-8' onPress={onPress}>
        <Icon className='size-full cursor-pointer' {...rest} />
      </Link>
    </Comp.HoverCard>
  ),
  IconGrid: ({ footer, footerRight, iconNames, icons, ...props }) => {
    const { atom } = use.atom
    const { isIconBookmarked, toggleIconBookmark } = use.bookmarkIcons
    const [state, setState] = useRafState()

    if (iconNames)
      icons = iconNames.map(i =>
        atom.allIconSets[i.prefix].icons.find(icon => icon.name === i.name)
      )

    if (state) icons = _.orderBy(icons, ...state)

    const isSameIconSet = icons.every(icon => icons[0].setName === icon.setName)
    const filename = `${isSameIconSet && use.count(icons) ? icons[0].setName : use.pluralize(icons, 'icon')}.zip`

    return (
      <Card
        classNames={{
          base: 'h-full rounded-none bg-background text-sm',
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
                <div className='flex-center text-foreground-500'>No icons</div>
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
              <Comp.HoverCard
                listbox={{
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
                  [isIconBookmarked(icon) ? 'Bookmarked' : 'Bookmark']: ['Add', 'Remove'].map(
                    title => ({
                      isDisabled: (title === 'Add') === isIconBookmarked(icon),
                      onPress: () => toggleIconBookmark(icon),
                      title: title
                    })
                  ),
                  ...mapObject(icon.filenames, (fileType, filename) => {
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
                          onPress: () => use.saveAs(new Blob([text]), filename.detail),
                          title: 'Download'
                        }
                      ]
                    ]
                  })
                }}>
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
            <div className='flex-center justify-between px-3'>
              <Comp.MotionPluralize value={icons} word='icon' />
              {footerRight ?? (
                <Comp.IconButton
                  icon='line-md:arrows-vertical'
                  listbox={{
                    ...mapObject(
                      {
                        'All attributes': ['id', 'name', 'setName'],
                        'Icon id': ['id'],
                        'Icon name': ['name'],
                        'Set name': ['setName']
                      },
                      (title, keys) => [
                        title,
                        ['asc', 'desc'].map(order => {
                          const b = [keys, [order]]
                          const isActive = _.isEqual(state, b)

                          return {
                            isActive: isActive,
                            isDisabled: !use.count(icons) || use.count(icons) === 1,
                            onPress: () => setState(!isActive && b),
                            title: { asc: 'Ascending', desc: 'Descending' }[order]
                          }
                        })
                      ]
                    ),
                    Download: [
                      {
                        isDisabled: !use.count(icons),
                        onPress: () =>
                          use.saveIconsAs(icons, filename, isSameIconSet ? 'default' : 'detail'),
                        title: filename
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
  },
  Listbox: ({ sections }) => (
    <Listbox aria-label={use.id} variant='light'>
      {Object.entries(sections).map(([title, items], index) => (
        <ListboxSection key={use.id} showDivider={index !== use.count(sections) - 1} title={title}>
          {items.map(({ color = 'primary', descriptions = [], isActive, title, ...props }) => (
            <ListboxItem
              classNames={{ title: isActive && `text-${color}` }}
              color={isActive ? color : ''}
              description={
                <For each={descriptions} render={description => <div>{description}</div>} />
              }
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
  MotionPluralize: ({ value, word }) => {
    const [state, setState] = useRafState(0)

    useDeepCompareEffect(() => setState(use.count(value)), [value])

    return (
      <Comp.HoverCard tooltip={use.pluralize(state, word)}>
        <span>
          <MotionNumber
            after={() => ` ${pluralize(word, state)}`}
            format={{ compactDisplay: 'short', notation: 'compact' }}
            locales='en-us'
            value={state}
          />
        </span>
      </Comp.HoverCard>
    )
  },
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
    useSingleEffect(use.update)

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
    const { atom } = use.atom
    const fuse = useCreation(() => new Fuse(atom.allIcons, { keys: ['name'], threshold: 0 }))
    const [state, setState] = useSetState({ icons: [], searchResults: [] })

    const [{ search: searchPattern }, setSearchPattern] = useUrlState(
      { search: placeholder },
      { navigateMode: 'replace' }
    )

    const listbox = useCreation(() => {
      const listbox = mapObject(atom.allIconSets, (key, iconSet) => [
        iconSet.name,
        state.searchResults.filter(icon => icon.prefix === iconSet.prefix)
      ])

      return sortKeys(listbox, { compare: (a, b) => use.count(listbox[b]) - use.count(listbox[a]) })
    }, [state.searchResults])

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
                icon='line-md:watch'
                listbox={{
                  [`All results (${use.count(state.searchResults)})`]: [
                    {
                      isDisabled: _.isEqual(...Object.values(state)),
                      onPress: () => setState(state => ({ icons: state.searchResults })),
                      title: 'View'
                    },
                    {
                      isDisabled: !use.count(state.searchResults),
                      onPress: () =>
                        use.saveIconsAs(
                          state.searchResults,
                          `${use.pluralize(state.searchResults, 'icon')} found.zip`,
                          'detail'
                        ),
                      title: 'Download'
                    }
                  ],
                  ...mapObject(listbox, (iconSetName, icons) => [
                    `${iconSetName} (${use.count(icons)})`,
                    [
                      {
                        isDisabled: _.isEqual(icons, state.icons) || !use.count(icons),
                        onPress: () => setState({ icons }),
                        title: 'View'
                      },
                      {
                        isDisabled: !use.count(icons),
                        onPress: () => use.saveIconsAs(icons, `${iconSetName}.zip`),
                        title: 'Download'
                      }
                    ]
                  ])
                }}
              />
            }
            isInvalid={!use.count(state.icons)}
            label={<Comp.MotionPluralize value={state.icons} word='icon' />}
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
  Stars: () => {
    const ref = useRef()
    const size = useSize(ref)
    const mouse = useMouse()
    const [x, y] = [use.spring, use.spring]

    useUpdateEffect(() => {
      x.set(mouse.clientX / (size.width * 0.5))
      y.set(mouse.clientY / (size.height * 0.5))
    }, [mouse.clientX, mouse.clientY])

    return (
      <m.div className='fixed inset-0 -z-10 hidden dark:block' ref={ref} style={{ x, y }}>
        <Canvas>
          <Stars count={1_000} depth={800} fade />
        </Canvas>
      </m.div>
    )
  },
  Theme: ({ render }) => render(useTheme())
}

export default () => {
  use.iconSets.init

  const { atom } = use.atom
  const { bookmarkIcons } = use.bookmarkIcons
  const [state, setState] = useRafState(0)

  return (
    <Comp.Providers>
      {atom.hasData ? (
        <PanelGroup
          className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
          direction='horizontal'>
          <Panel className='py-2' defaultSize={24}>
            <Comp.Theme
              render={({ resolvedTheme, setTheme }) => (
                <Comp.Listbox
                  sections={{
                    [use.async(use.iconSets.version.current, 0)]: [
                      [
                        use.pluralize(atom.allIconSets, 'icon set'),
                        use.pluralize(atom.allIcons, 'icon', true)
                      ],
                      ['Endless scrolling', 'Hehe'],
                      ['Bookmarks', use.pluralize(bookmarkIcons, 'icon', true)],
                      ['Recently viewed', use.pluralize(use.recentlyViewedIcons, 'icon', true)]
                    ].map(([title, description], index) => ({
                      description: description,
                      isActive: state === index,
                      onPress: () => setState(index),
                      title: title
                    })),
                    ...sortKeys(
                      mapObject(
                        Object.groupBy(Object.values(atom.allIconSets), ({ category }) => category),
                        (category, iconSets) => [
                          `${category} (${use.count(iconSets)})`,
                          _.orderBy(iconSets, ['name'], ['asc']).map(iconSet => ({
                            descriptions: [
                              iconSet.author,
                              iconSet.license,
                              use.pluralize(iconSet.icons, 'icon', true),
                              use.relativeTime(iconSet.lastModified)
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
                        description: prettyBytes(
                          use.async(() => navigator.storage.estimate(), { usage: 0 }).usage
                        ),
                        isActive: true,
                        onPress: use.iconSets.clear,
                        title: 'Clear cache'
                      }
                    ]
                  }}
                />
              )}
            />
          </Panel>
          <PanelResizeHandle />
          <Panel>
            <PanelGroup direction='vertical'>
              <Panel>
                {state === 0 && <Comp.IconGrid icons={atom.allIcons} />}
                {state === 1 && <Comp.EndlessIcons />}
                {state === 2 && <Comp.IconGrid iconNames={bookmarkIcons} />}
                {state === 3 && <Comp.RecentlyViewedIcons />}
                {atom.allIconSets[state] && <Comp.FilterIcons {...atom.allIconSets[state]} />}
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
      <Comp.Stars />
      <Comp.Theme
        render={({ resolvedTheme }) => (
          <Toaster className='z-auto' pauseWhenPageIsHidden theme={resolvedTheme} />
        )}
      />
    </Comp.Providers>
  )
}
