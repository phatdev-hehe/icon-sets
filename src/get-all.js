import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'

const atom = atomWithImmer({})

export const getAll = () => ({ ...useAtomValue(atom), set: useSetAtom(atom) })
