// @flow
import db from './db'
import type { DBUser } from '../flowTypes'

export const getUserById = (id: string): Promise<DBUser> => {
  return db
    .table('users')
    .get(id)
    .run()
}