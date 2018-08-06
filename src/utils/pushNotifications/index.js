// @flow
const debug = require('debug')('service-notification:utils:send-push-notifications');
import { getSubscriptions } from '../../models/webPushSubscription';
import formatNotification from '../notificationToText';
import { sendWebPushNotification } from './sendWebPushNotification';
import type { DBNotificationsJoin } from '../types';

const sendPushNotifications = async (notification: DBNotificationsJoin) => {
  debug('send notification as web push notification');

  const [webPushSubscriptions = []] = await Promise.all(
    [
      getSubscriptions(notification.userId),
    ]
  );

  debug(
    `web push subscriptions: ${webPushSubscriptions.length}`
  );

  if (webPushSubscriptions.length === 0) {
    return;
  }

  const payload = formatNotification(notification, notification.userId);

  debug(`send push notifications`);
  const webPushNotifications = webPushSubscriptions.map(subscription => {
    return sendWebPushNotification(subscription, {
      tag: notification.id,
      ...payload,
    });
  });

  return Promise.all([...webPushNotifications]);
};

export default sendPushNotifications;
