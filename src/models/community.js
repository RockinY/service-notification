// @flow
import db from './db'
import type { DBCommunity } from '../flowTypes'

export const getCommunityById = (id: string): Promise<DBCommunity> => {
  return db
    .table('communities')
    .get(id)
    .run()
}