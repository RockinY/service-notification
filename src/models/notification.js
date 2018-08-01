// @flow
import db from './db'
import type { EventTypes, DBNotification } from '../flowTypes'
import { TIME_BUFFER } from '../queues/constants'
import { newDocuments } from '../utils/changeFeed'

export const checkForExistingNotification = (
  event: EventTypes,
  contextId: string
): Promise<?DBNotification> => {
  const now = new Date()
  const then = new Date(now.getTime() - TIME_BUFFER)
  return db
    .table('notifications')
    .getAll(contextId, { index: 'contextId' })
    .filter(notification => {
      return notification('event')
        .eq(event)
        .and(
          notification('mofifiedAt').during(
            db.ISO8601(then.toISOString()),
            db.now()
          )
        )
    })
    .run()
    .then(notifications => {
      if (!notifications || notifications.length === 0) return null
      return notifications[0]
    })
    .catch(err => {
      console.error(err)
      return null
    })
}

export const storeNotification = (
  notification: Object
): Promise<DBNotification> => {
  return db
    .table('notifications')
    .insert({
      ...notification,
      createdAt: new Date(),
      modifiedAt: new Date()
    })
    .run()
    .then(result => result.changes[0].new_val)
}

export const updateNotification = (
  notification: Object
): Promise<DBNotification> => {
  return db
    .table('notifications')
    .get(notification.id)
    .update({
      ...notification,
      modifiedAt: new Date()
    }, {
      returnChanges: true
    })
}