import { mime } from '../aliases'

export default (blobParts, type) => new Blob(blobParts, { type: mime.getType(type) })
