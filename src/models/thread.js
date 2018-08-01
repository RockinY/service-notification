// @flow
import db from './db'
import type { DBThread } from '../flowTypes'

export const getThreadById = (id: string): Promise<DBThread> => {
  return db
    .table('threads')
    .get(id)
    .run()
}