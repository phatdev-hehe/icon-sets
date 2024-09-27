import { saveAs } from 'file-saver'

import bytes from './bytes'
import { IconButton } from './icon-button'
import toast from './toast'

export default async (data, filename) => {
  const currentToast = toast(filename, {
    description: 'Preparing to download',
    duration: Number.POSITIVE_INFINITY
  })

  data = await data

  const download = () => saveAs(data, filename)

  download()

  currentToast.update({
    action: <IconButton icon='line-md:arrow-small-down' onPress={download} tooltip='Download' />,
    description: bytes(data.size)
  })
}
