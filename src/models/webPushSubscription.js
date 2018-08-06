// @flow
import db from './db'

const debug = require('debug')('api:models:webPushSubscription');

export type WebPushSubscription = {
  keys: {
    p256dh: string,
    auth: string,
  },
  endpoint: string,
};

export const storeSubscription = (
  subscription: WebPushSubscription,
  userId: string
) => {
  debug(
    `store subscription for user#${userId}, endpoint ${subscription.endpoint}`
  );
  return db
    .table('webPushSubscriptions')
    .insert({
      ...subscription,
      userId,
    })
    .run();
};

export const getSubscriptions = (userId: string) => {
  debug(`get subscriptions for user#${userId}`);
  return db
    .table('webPushSubscriptions')
    .getAll(userId, { index: 'userId' })
    .run();
};

export const removeSubscription = (endpoint: string) => {
  debug(`remove subscription ${endpoint}`);
  return db
    .table('webPushSubscriptions')
    .getAll(endpoint, { index: 'endpoint' })
    .delete()
    .run();
};
