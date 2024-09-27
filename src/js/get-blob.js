import mime from 'mime/lite'

export const getBlob = (blobParts, type) => new Blob(blobParts, { type: mime.getType(type) })
