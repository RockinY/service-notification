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
    }, { returnChanges: true })
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

export const getNotifications = (notificationIds: Array<string>) => {
  return db
    .table('notifications')
    .getAll(...notificationIds)
    .eqJoin('id', db.table('usersNotifications'), { index: 'notificationId' })
    .without({ right: ['id'] })
    .zip()
    .run();
}

export const getNotification = (
  notificationId: string
): Promise<DBNotification> => {
  return db
    .table('notifications')
    .get(notificationId)
    .run();
}

const hasChanged = (field: string) => {
  return db
    .row('old_val')(field)
    .ne(db.row('new_val')(field))
}

const MODIFIED_AT_CHANGED = hasChanged('entityAddedAt')

export const listenToNewNotifications = (cb: Function): Function => {
  return db
    .table('usersNotifications')
    .changes({
      includeInitial: false,
    })
    .filter(newDocuments(db).or(MODIFIED_AT_CHANGED))('new_val')
    .eqJoin('notificationId', db.table('notifications'))
    .without({
      left: ['notificationId', 'createdAt', 'id', 'entityAddedAt'],
    })
    .zip()
    .filter(row => row('context')('type').ne('DIRECT_MESSAGE_THREAD'))
    .run({ cursor: true }, (err, cursor) => {
      if (err) throw err;
      cursor.each((err, data) => {
        if (err) throw err;
        // For some reason this can be called without data, in which case
        // we don't want to call the callback with it obviously
        if (!data) return;
        // Call the passed callback with the notification
        cb(data);
      });
    });
};

export const listenToNewDirectMessageNotifications = (
  cb: Function
): Function => {
  return db
    .table('usersNotifications')
    .changes({
      includeInitial: false,
    })
    .filter(newDocuments(db).or(MODIFIED_AT_CHANGED))('new_val')
    .eqJoin('notificationId', db.table('notifications'))
    .without({
      left: ['notificationId', 'createdAt', 'id', 'entityAddedAt'],
    })
    .zip()
    .filter(row => row('context')('type').eq('DIRECT_MESSAGE_THREAD'))
    .run({ cursor: true }, (err, cursor) => {
      if (err) throw err;
      cursor.each((err, data) => {
        if (err) throw err;
        // Call the passed callback with the notification
        cb(data);
      });
    });
};