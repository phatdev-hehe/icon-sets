import { useAtom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'

const atom = atomWithImmer({})

export default () => {
  const [value, set] = useAtom(atom)

  return { ...value, set }
}
