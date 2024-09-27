import { LRUCache } from 'lru-cache'

export const cache = new LRUCache({ max: 1_000 })
