import delay from './delay'

export const openObjectURL = async obj => {
  const url = URL.createObjectURL(obj)

  if (open(url)) {
    await delay('1h')

    URL.revokeObjectURL(url)
  }
}
