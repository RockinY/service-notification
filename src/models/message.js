// @flow
import db from './db'
import type { DBMessage } from '../flowTypes'

export const getMessageById = (id: string): Promise<DBMessage> => {
  return db
    .table('messages')
    .get(id)
    .run()
}