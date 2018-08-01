// @flow
import db from './db'
import type { DBChannel } from '../flowTypes'

export const getChannelById = (id: string): Promise<DBChannel> => {
  return db
    .table('channels')
    .get(id)
    .run()
}