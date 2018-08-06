import {
  listenToNewNotifications,
  listenToNewDirectMessageNotifications
} from '../models/notification'
import { sendNotificationAsPushQueue } from '../utils/queues'

const sendDeduplicatedPushNotification = notification => {
  // Over write the default jobId to ensure the job is unique on multiple instance running
  sendNotificationAsPushQueue.add(
    { notification },
    { jobId: `notification-${notification.id}-${notification.userId}-${notification.modifiedAt}`}
  );
};

export default () => {
  listenToNewNotifications(sendDeduplicatedPushNotification);
  listenToNewDirectMessageNotifications(sendDeduplicatedPushNotification);
};