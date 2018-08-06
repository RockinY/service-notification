// @flow
const debug = require('debug')('service-notification:queue:send-push-notifications');
import sendPushNotifications from '../utils/pushNotifications';
import Raven from '../utils/raven';
import type { Job, PushNotificationsJobData } from '../utils/types';

export default async (job: Job<PushNotificationsJobData>) => {
  const { data: { notification } } = job;

  try {
    return sendPushNotifications(notification);
  } catch (err) {
    debug('❌ Error in job:\n');
    debug(err);
    Raven.captureException(err);
  }
};
