// @flow
import db from './db'
import axios from 'axios'
import querystring from 'querystring'
import { decrptstring } from '../utils/encryption'

export const getCommunitySettings = (id: string) => {
  return db
    .table('communitySettings')
    .getAll(id, { index: 'communityId' })
    .run()
    .then(data => {
      if (!data || data.length === 0) return null;
      return data[0];
    })
}
