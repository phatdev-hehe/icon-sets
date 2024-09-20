// Code refactoring

// ko dat tham so nhu mot bien
// han che dung es-toolkit (con loi nhieu)
// neu ham goi di goi lai thi viet ra 1 bien duy nhat!
// kt keyword thieu (new, async - await,...)
// thay vi dung &&, || thi dung dieu kien if cho de hieu `if (true) a = b`
// cac dieu kien them khi xu ly icons (0 icons, 1 icon, 2 icons)

// khi cap nhat state thi viet `setState(state => state)`, luc nay state luon la gia tri moi
// https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state

// quy uoc dat ten tham so
// icon => (currentIcon) => currentIcon.name === icon.name
// neu nhu tham so ko biet dat ten thi (p1, p2,...)

// han che dung (destructuring assignment)
// vi (icon.name) de nhin hon (name)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

// API nen tra ve mot object
// const { bookmarkIcons } = use.modules
// bookmarkIcons.set, bookmarkIcons.get,...

// Code chay nhu the nao?
// ?? (ghi chu va giai thich)

// Codebase
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get

import useUrlState from '@ahooksjs/use-url-state'
import { Icon } from '@iconify/react'
import {
  getIconContentCSS,
  getIconCSS,
  iconToHTML,
  iconToSVG,
  parseIconSet,
  quicklyValidateIconSet,
  replaceIDs
} from '@iconify/utils'
import {
  Avatar,
  Button,
  Card,
  CardFooter,
  cn,
  Input,
  Link,
  Listbox,
  ListboxItem,
  ListboxSection,
  NextUIProvider,
  ScrollShadow,
  Spinner
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
import bytes from 'bytes'
import { kebabCase } from 'change-case'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import * as _ from 'es-toolkit'
import { size } from 'es-toolkit/compat'
import { sort } from 'fast-sort'
import { saveAs } from 'file-saver'
import { AnimatePresence, domAnimation, LazyMotion, m, useSpring } from 'framer-motion'
import Fuse from 'fuse.js'
import has from 'has-values'
import * as idb from 'idb-keyval'
import { formatNumber } from 'intl-number-helper'
import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'
import JSZip from 'jszip'
import { LRUCache } from 'lru-cache'
import mapObject, { mapObjectSkip } from 'map-obj'
import mime from 'mime/lite'
import MotionNumber from 'motion-number/lazy'
import { nanoid } from 'nanoid'
import { ThemeProvider, useTheme } from 'next-themes'
import pluralize from 'pluralize'
import { useRef } from 'react'
import {
  browserName,
  browserVersion,
  engineName,
  engineVersion,
  isBrowser,
  isDesktop,
  osName,
  osVersion
} from 'react-device-detect'
import isEqual from 'react-fast-compare'
import { For, useFirstRender, useLocalStorage, useSingleEffect, useWindowSize } from 'react-haiku'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import root from 'react-shadow'
import { useAsync, useLockBodyScroll } from 'react-use'
import { VirtuosoGrid } from 'react-virtuoso'
import semver from 'semver'
import { toast, Toaster } from 'sonner'
import sortKeys from 'sort-keys'

import pkg from '../package.json'

import collections from '/node_modules/@iconify/json/collections.json'

dayjs.extend(relativeTime)

JSZip.support = mapObject(JSZip.support, (key, value) =>
  ['nodebuffer', 'nodestream'].includes(key) ? mapObjectSkip : [key, value]
)

const [atom, cache, locale] = [
  atomWithImmer({ allIcons: null, allIconSets: null, hasData: null }),
  new LRUCache({ max: 1_000 }),
  'en-US'
]

const use = {
  async: fn => {
    const state = useAsync(fn)

    return state.loading ? 'Loading…' : state.error ? 'Loading error' : state.value
  },
  blob: (blobParts, path) => new Blob(blobParts, { type: mime.getType(path) }),
  bytes: value => bytes(value, { decimalPlaces: 1, unitSeparator: ' ' }),
  copy(text) {
    this.toast(copy(text) ? 'Copied' : 'Copy failed', {
      description: this.pluralize(text, 'character')
    })
  },
  icon(icon) {
    const k = icon.id

    if (cache.has(k)) return cache.get(k)

    const svg = iconToSVG(icon.data)

    const v = {
      filenames: mapObject({ css: null, json: null, svg: null, txt: null }, fileType => [
        fileType,
        {
          default: `${icon.name}.${fileType}`,
          detail: `[${icon.setName}] ${icon.name}.${fileType}`
        }
      ]),
      to: {
        css: getIconCSS(icon.data),
        dataUrl: getIconContentCSS(icon.data, svg.attributes).slice(31, -6),
        html: iconToHTML(replaceIDs(svg.body, this.id), svg.attributes)
      },
      ...icon
    }

    cache.set(k, v)

    return v
  },
  icons(icons) {
    const [firstIcon] = icons
    const hasSamePrefix = icons.every(icon => icon.prefix === firstIcon.prefix)

    return {
      count: size(icons),
      default: icons,
      download: {
        filename: `${hasSamePrefix && firstIcon ? firstIcon.setName : this.pluralize(icons, 'icon')}.zip`,
        get fn() {
          return () => {
            const zip = new JSZip()

            for (let icon of icons) {
              icon = use.icon(icon)

              zip.file(icon.filenames.svg[hasSamePrefix ? 'default' : 'detail'], icon.to.html)
            }

            use.saveAs(zip.generateAsync({ type: 'blob' }), this.filename)
          }
        }
      }
    }
  },
  get id() {
    return nanoid()
  },
  modules: {
    get atom() {
      return { ...useAtomValue(atom), set: useSetAtom(atom) }
    },
    get bookmarkIcons() {
      const [state, setState] = useLocalStorage('bookmark-icons', [])

      return {
        default: state,
        has: icon => state.some(currentIcon => currentIcon === icon.id),
        toggle(icon) {
          setState(state => {
            const hasIcon = this.has(icon)

            use.toast(hasIcon ? 'Bookmark removed' : 'Bookmark added')

            return hasIcon
              ? state.filter(currentIcon => currentIcon !== icon.id)
              : [...state, icon.id]
          })
        }
      }
    },
    iconSets: {
      clear: async (clear = true) => (clear && (await idb.clear())) || location.reload(),
      get get() {
        const { atom, isFirstRender, windowSize } = use.modules
        const [state, setState] = useRafState(true)

        useAsyncEffect(async () => {
          if (
            ![isFirstRender, isBrowser, isDesktop, ...Object.values(JSZip.support)].every(Boolean)
          ) {
            const section = (title, items) => ({
              [title]: items.map(([title, isSupported]) => ({
                description: isSupported ? 'Yes' : 'No',
                isDisabled: !isSupported,
                title
              }))
            })

            return use.toast('Your browser is not supported', {
              duration: Number.POSITIVE_INFINITY,
              listbox: {
                Info: [
                  { description: osVersion, title: osName },
                  { description: browserVersion, title: browserName },
                  { description: engineVersion, title: engineName },
                  { description: `${windowSize.width} x ${windowSize.height}`, title: 'Size' }
                ],
                ...section('Default', [
                  ['First render', isFirstRender],
                  ['Browser', isBrowser],
                  ['Desktop', isDesktop]
                ]),
                ...section(`JSZip ${JSZip.version}`, Object.entries(JSZip.support))
              }
            })
          }

          if (await this.version.isNotFound()) return await this.version.check()

          if (await this.version.isValid()) {
            if (await this.version.isOutdated()) await this.version.check()

            setState()
          } else {
            const toast = use.toast('Working on updates', {
              description: use.pluralize(collections, 'icon set'),
              duration: Number.POSITIVE_INFINITY,
              listbox: {
                '': Object.values(collections).map(iconSet => ({
                  description: iconSet.author.name,
                  title: iconSet.name
                }))
              }
            })

            await idb.clear()
            await idb.set('version', 'not_found')

            try {
              await Promise.all(
                Object.entries(import.meta.glob('/node_modules/@iconify/json/json/*')).map(
                  async ([iconSet, getIconSet]) => {
                    if (!(iconSet.slice(33, -5) in collections)) return

                    iconSet = quicklyValidateIconSet(await getIconSet())

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
                  }
                )
              )

              await idb.update('version', () => this.version.latest)
              ;(await this.version.isOutdated()) ? await this.version.check() : setState()
            } catch {
              await this.version.check()
            } finally {
              toast.dismiss
            }
          }
        }, [])

        useAsyncEffect(async () => {
          if (state) return

          const allIconSets = mapObject(Object.fromEntries(await idb.entries()), (key, iconSet) => {
            if (key === 'version') return mapObjectSkip

            iconSet.icons = Object.entries(iconSet.icons).map(([name, data]) => ({
              data,
              id: `${iconSet.prefix}:${name}`,
              name,
              prefix: iconSet.prefix,
              setName: iconSet.name
            }))

            return [key, iconSet]
          })

          atom.set(draft => {
            draft.allIcons = Object.values(allIconSets).flatMap(iconSet => iconSet.icons)
            draft.allIconSets = allIconSets
            draft.hasData = !state
          })
        }, [state])

        return null
      },
      get version() {
        const current = async () => await idb.get('version')
        const latest = semver.valid(semver.coerce(pkg.dependencies['@iconify/json']))

        const difference = async () => {
          const keys = _.difference(['version', ...Object.keys(collections)], await idb.keys())

          return mapObject(collections, (key, value) =>
            keys.includes(key) ? [key, value] : mapObjectSkip
          )
        }

        const isOutdated = async () => (await current()) !== latest || has(await difference())

        const check = async () =>
          use.toast('Version check', {
            duration: Number.POSITIVE_INFINITY,
            listbox: {
              [latest]: [
                { onPress: async () => this.clear(await isOutdated()), title: 'Update now' }
              ],
              'Missing icon sets': Object.values(await difference()).map(iconSet => ({
                description: iconSet.author.name,
                title: iconSet.name
              }))
            }
          })

        return {
          check,
          current,
          difference,
          isNotFound: async () => (await current()) === 'not_found',
          isOutdated,
          isValid: async () => semver.valid(await current()),
          latest
        }
      }
    },
    get isFirstRender() {
      return useFirstRender()
    },
    get recentlyViewedIcons() {
      return [...cache.values()]
    },
    get ref() {
      return useRef()
    },
    get rerender() {
      return useUpdate()
    },
    get spring() {
      return useSpring(0)
    },
    get windowCursor() {
      return useMouse()
    },
    get windowSize() {
      return useWindowSize()
    }
  },
  number: value => (typeof value === 'number' ? value : size(value)),
  openObjectURL: obj => {
    const url = URL.createObjectURL(obj)

    if (open(url)) URL.revokeObjectURL(url)
  },
  pluralize(value, word, pretty) {
    value = this.number(value)

    return `${pretty ? `${formatNumber(value, locale, 's')} ` : ''}${pluralize(word, value, !pretty)}`
  },
  relativeTime(t) {
    const { rerender } = use.modules

    useRafInterval(rerender, 60_000)

    return dayjs.unix(t).fromNow()
  },
  async saveAs(data, filename) {
    const toast = this.toast(filename, {
      description: 'Preparing to download',
      duration: Number.POSITIVE_INFINITY
    })

    data = await data

    const download = () => saveAs(data, filename)

    download()

    toast.update({
      action: (
        <Comp.IconButton icon='line-md:arrow-small-down' onPress={download} tooltip='Download' />
      ),
      description: this.bytes(data.size)
    })
  },
  toast: (message, data = {}) => {
    const parseData = ({ description, duration, listbox, ...rest }) => ({
      description: (
        <>
          {description}
          {listbox && (
            <ScrollShadow className='max-h-96' style={{ color: 'initial' }}>
              <Comp.Listbox sections={listbox} />
            </ScrollShadow>
          )}
        </>
      ),
      dismissible: duration !== Number.POSITIVE_INFINITY,
      duration,
      ...rest
    })

    const id = toast(message, parseData(data))

    return {
      get dismiss() {
        return toast.dismiss(id)
      },
      update: data => toast(message, { ...parseData(data), id })
    }
  }
}

const Comp = {
  EndlessIcons: () => {
    const size = 100
    const sizes = _.range(size, 1_000 + size, size)
    const { atom } = use.modules
    const [state, setState] = useSetState({ icons: [], size })

    const fetchMoreIcons = () =>
      setState(state => ({
        icons: [...state.icons, ..._.sampleSize(atom.allIcons, state.size)]
      }))

    useSingleEffect(fetchMoreIcons)

    return (
      <Comp.IconGrid
        endReached={fetchMoreIcons}
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
    const initialState = { category: null, variant: null }
    const [state, setState] = useSetState(initialState)
    const isSelected = key => typeof state[key] === 'string'

    iconSet = structuredClone(iconSet)
    iconSet.variants = iconSet.prefixes ?? iconSet.suffixes ?? {}
    iconSet.has = { categories: has(iconSet.categories), variants: has(iconSet.variants) }

    iconSet.icons = use.icons(
      iconSet.icons.filter(icon => {
        const matchesVariant = (variant = state.variant) =>
          icon.name[iconSet.prefixes ? 'startsWith' : 'endsWith'](
            iconSet.prefixes ? `${variant}-` : `-${variant}`
          )

        return (
          (!isSelected('category') || iconSet.categories?.[state.category]?.includes(icon.name)) &&
          (!isSelected('variant') ||
            (state.variant === ''
              ? !Object.keys(iconSet.variants).some(matchesVariant)
              : matchesVariant()))
        )
      })
    )

    useDeepCompareEffect(
      () => setState(initialState),
      [iconSet.categories, iconSet.prefixes, iconSet.suffixes]
    )

    return (
      <Comp.IconGrid
        footerRight={
          (iconSet.has.variants || iconSet.has.categories || null) && (
            <Comp.IconButton
              icon={isEqual(state, initialState) ? 'line-md:filter' : 'line-md:filter-filled'}
              listbox={{
                ...(iconSet.has.variants && {
                  [use.pluralize(iconSet.variants, 'variant')]: Object.entries(
                    iconSet.variants
                  ).map(([variant, title, isActive = state.variant === variant]) => ({
                    isActive,
                    onPress: () => setState({ variant: !isActive && variant }),
                    title
                  }))
                }),
                ...(iconSet.has.categories && {
                  [use.pluralize(iconSet.categories, 'category')]: Object.keys(
                    iconSet.categories
                  ).map(category => {
                    const isActive = state.category === category

                    return {
                      isActive,
                      onPress: () => setState({ category: !isActive && category }),
                      title: category
                    }
                  })
                }),
                Download: [
                  {
                    isDisabled: !iconSet.icons.count,
                    onPress: iconSet.icons.download.fn,
                    title: iconSet.icons.download.filename
                  }
                ]
              }}
            />
          )
        }
        icons={iconSet.icons.default}
      />
    )
  },
  HoverCard: ({ align = 'center', children, listbox, tooltip }) => {
    const [state, setState] = useRafState()
    const { ref, spring: x } = use.modules
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
                    x
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
  IconGrid: ({ footer, footerRight, icons, ...rest }) => {
    const { atom, bookmarkIcons } = use.modules
    const [state, setState] = useRafState()

    if (icons.some(icon => typeof icon === 'string'))
      icons = atom.allIcons.filter(icon => icons.includes(icon.id))

    if (state) icons = sort(icons).by(state)

    icons = use.icons(icons)

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
            Footer: () =>
              icons.count ? (
                <div style={{ height: 'var(--footer-height)' }} />
              ) : (
                <div className='flex-center text-foreground-500'>No icons</div>
              ),
            ScrollSeekPlaceholder: ({ index, ...style }) => {
              const icon = icons.default[index]

              return (
                <div className='flex-center' style={style}>
                  <Avatar classNames={{ base: 'bg-background' }} name={icon.name} size='lg' />
                </div>
              )
            }
          }}
          data={icons.default}
          itemClassName='p-6'
          itemContent={(index, icon) => {
            icon = use.icon(icon)

            return (
              <Comp.HoverCard
                listbox={{
                  [`#${index + 1}`]: [
                    {
                      description: icon.setName,
                      onPress: () => use.copy(icon.id),
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
                    const text = {
                      css: icon.to.css,
                      json: JSON.stringify(icon.data, null, 2),
                      svg: icon.to.html,
                      txt: icon.to.dataUrl
                    }[fileType]

                    const blob = use.blob([text], fileType)

                    return [
                      `${fileType.toUpperCase()} (${use.bytes(blob.size)})`,
                      [
                        ['View', () => use.openObjectURL(blob)],
                        ['Copy', () => use.copy(text)],
                        ['Download', () => use.saveAs(blob, filename.detail)]
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
              </Comp.HoverCard>
            )
          }}
          listClassName='flex-center flex-wrap h-auto'
          scrollSeekConfiguration={{ enter: v => Math.abs(v) > 300, exit: v => v === 0 }}
          {...rest}
        />
        <CardFooter style={{ height: 'var(--footer-height)' }}>
          {footer ?? (
            <div className='flex-center justify-between px-3'>
              <Comp.MotionPluralize value={icons.count} word='icon' />
              {footerRight ?? (
                <Comp.IconButton
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
  },
  Listbox: ({ sections }) => (
    <Listbox aria-label={use.id} variant='light'>
      {Object.entries(sections).map(([title, items], index) => (
        <ListboxSection key={use.id} showDivider={index !== size(sections) - 1} title={title}>
          {items.map(({ color = 'primary', descriptions = [], isActive, title, ...rest }) => (
            <ListboxItem
              classNames={{ title: isActive && `text-${color}` }}
              color={isActive ? color : ''}
              description={
                <For each={descriptions} render={description => <div>{description}</div>} />
              }
              key={use.id}
              textValue={use.id}
              {...rest}>
              {title}
            </ListboxItem>
          ))}
        </ListboxSection>
      ))}
    </Listbox>
  ),
  MotionPluralize: ({ value, word }) => {
    const [state, setState] = useRafState(0)

    useDeepCompareEffect(() => setState(use.number(value)), [value])

    return (
      <Comp.HoverCard tooltip={use.pluralize(state, word)}>
        <span>
          <MotionNumber
            format={{ compactDisplay: 'short', notation: 'compact' }}
            locales={locale}
            value={state}
          />
          {` ${pluralize(word, state)}`}
        </span>
      </Comp.HoverCard>
    )
  },
  Providers: ({ children }) => (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider attribute='class' disableTransitionOnChange>
        <NextUIProvider className='flex-center p-6' locale={locale}>
          <BrowserRouter>
            <Routes>
              <Route element={children} path='/' />
            </Routes>
          </BrowserRouter>
        </NextUIProvider>
      </ThemeProvider>
    </LazyMotion>
  ),
  RecentlyViewedIcons: () => {
    const { recentlyViewedIcons, rerender } = use.modules
    const [state, setState] = useRafState()

    useSingleEffect(rerender)

    return (
      <Comp.IconGrid
        footerRight={
          <Comp.IconButton
            icon='line-md:round-360'
            onPress={() => setState(state => !state)}
            tooltip='Reload'
          />
        }
        icons={useCreation(() => recentlyViewedIcons, [state])}
      />
    )
  },
  SearchIcons: () => {
    const placeholder = 'Search'
    const initialValue = { default: [], download: {} }
    const { atom } = use.modules
    const fuse = useCreation(() => new Fuse(atom.allIcons, { keys: ['name'], threshold: 0 }))
    const [state, setState] = useSetState({ filteredIcons: initialValue, icons: initialValue })

    const [{ search: searchPattern }, setSearchPattern] = useUrlState(
      { search: placeholder },
      { navigateMode: 'replace' }
    )

    const listbox = useCreation(() => {
      const listbox = mapObject(atom.allIconSets, (key, iconSet) => [
        iconSet.name,
        state.icons.default.filter(icon => icon.prefix === iconSet.prefix)
      ])

      return sortKeys(listbox, { compare: (a, b) => size(listbox[b]) - size(listbox[a]) })
    }, [state.icons])

    useDebounceEffect(
      () => {
        const icons = use.icons(fuse.search(kebabCase(searchPattern)).map(({ item }) => item))

        setState({ filteredIcons: icons, icons })
      },
      [searchPattern],
      { wait: 300 }
    )

    return (
      <Comp.IconGrid
        footer={
          <Input
            autoFocus
            classNames={{ inputWrapper: 'border-none', label: '!text-foreground-500' }}
            endContent={
              <Comp.IconButton
                icon='line-md:watch'
                listbox={{
                  [`All results (${state.icons.count})`]: [
                    {
                      isDisabled: isEqual(...Object.values(state)),
                      onPress: () => setState(state => ({ filteredIcons: state.icons })),
                      title: 'View'
                    },
                    {
                      isDisabled: !state.icons.count,
                      onPress: state.icons.download.fn,
                      title: 'Download'
                    }
                  ],
                  ...mapObject(listbox, (iconSetName, icons) => {
                    icons = use.icons(icons)

                    return [
                      `${iconSetName} (${icons.count})`,
                      [
                        {
                          isDisabled:
                            isEqual(icons.default, state.filteredIcons.default) || !icons.count,
                          onPress: () => setState({ filteredIcons: icons }),
                          title: 'View'
                        },
                        { isDisabled: !icons.count, onPress: icons.download.fn, title: 'Download' }
                      ]
                    ]
                  })
                }}
              />
            }
            label={<Comp.MotionPluralize value={state.filteredIcons.count} word='icon' />}
            onValueChange={search => setSearchPattern({ search })}
            placeholder={placeholder}
            startContent={<Icon className='size-5' icon='line-md:search' />}
            value={searchPattern}
            variant='bordered'
          />
        }
        icons={state.filteredIcons.default}
      />
    )
  },
  Stars: () => {
    const { ref, spring: x, spring: y, windowCursor } = use.modules
    const size = useSize(ref)

    useUpdateEffect(() => {
      x.set(windowCursor.clientX / (size.width * 0.5))
      y.set(windowCursor.clientY / (size.height * 0.5))
    }, [windowCursor.clientX, windowCursor.clientY])

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
  const { atom, bookmarkIcons, iconSets, recentlyViewedIcons } = use.modules
  const [state, setState] = useRafState(0)

  iconSets.get
  useLockBodyScroll(true)

  return (
    <Comp.Providers>
      {atom.hasData ? (
        <PanelGroup
          className='card !~w-[50rem]/[66rem] lg:~lg:!~h-[50rem]/[38rem]'
          direction='horizontal'>
          <Panel className='py-2' defaultSize={25} maxSize={25}>
            <Comp.Theme
              render={({ resolvedTheme, setTheme }) => (
                <Comp.Listbox
                  sections={{
                    [use.async(iconSets.version.current)]: [
                      [
                        use.pluralize(atom.allIconSets, 'icon set'),
                        use.pluralize(atom.allIcons, 'icon', true)
                      ],
                      ['Endless scrolling', 'Hehe'],
                      ['Bookmarks', use.pluralize(bookmarkIcons.default, 'icon', true)],
                      ['Recently viewed', use.pluralize(recentlyViewedIcons, 'icon', true)]
                    ].map(([title, description], index) => ({
                      description,
                      isActive: state === index,
                      onPress: () => setState(index),
                      title
                    })),
                    ...sortKeys(
                      mapObject(
                        Object.groupBy(Object.values(atom.allIconSets), ({ category }) => category),
                        (category, iconSets) => [
                          `${category} (${size(iconSets)})`,
                          sort(iconSets)
                            .asc('name')
                            .map(iconSet => ({
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
                        description: use.bytes(use.async(() => navigator.storage.estimate()).usage),
                        isActive: true,
                        onPress: iconSets.clear,
                        title: 'Clear data'
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
                {state === 2 && <Comp.IconGrid icons={bookmarkIcons.default} />}
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
          <Toaster
            className='z-auto'
            theme={resolvedTheme}
            toastOptions={{
              classNames: {
                content: 'w-full',
                default: 'card justify-between gap-4',
                description: 'text-foreground-500',
                title: 'line-clamp-1'
              }
            }}
          />
        )}
      />
    </Comp.Providers>
  )
}
