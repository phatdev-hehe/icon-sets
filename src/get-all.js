import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'

const atom = atomWithImmer({})

export default () => ({ ...useAtomValue(atom), set: useSetAtom(atom) })
