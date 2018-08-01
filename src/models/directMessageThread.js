// @flow
import db from './db'
import type { DBDirectMessageThread } from '../flowTypes'

export const getDirectMessageThreadById = (id: string): Promise<DBDirectMessageThread> => {
  return db
    .table('directMessageThreads')
    .get(id)
    .run()
}