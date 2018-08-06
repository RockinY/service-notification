// @flow
import sendWebPush from './webPush';
import { removeSubscription } from '../../models/webPushSubscription';

const debug = require('debug')('service-notification:utils:web-push');

export const sendWebPushNotification = (
  subscription: any,
  payload: Object | string,
  options?: ?Object
): Promise<?Object> => {
  return sendWebPush(subscription, payload, options).catch(err => {
    if (err.statusCode === 410 && err.endpoint) {
      debug(`old subscription found (${err.endpoint}), removing`, err);
      return removeSubscription(err.endpoint);
    }
  });
};
