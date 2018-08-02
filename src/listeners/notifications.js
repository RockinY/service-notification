import {
  listenToNewNotifications,
  listenToNewDirectMessageNotifications
} from '../models/notification'
import { sendNotificationAsPushQueue } from '../utils/queues'