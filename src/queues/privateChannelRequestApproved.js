// @flow
const debug = require('debug')(
  'athena:queue:user-request-private-channel-approved'
);
import Raven from '../utils/raven';
import { getCommunityById } from '../models/community';
import { storeNotification } from '../models/notification';
import { storeUsersNotifications } from '../models/usersNotifications';
import { getUsers } from '../models/user';
import { fetchPayload } from '../utils/payloads';
import isEmail from 'validator/lib/isEmail';
import type {
  Job,
  PrivateChannelRequestApprovedJobData,
} from '../utils/types';

export default async (job: Job<PrivateChannelRequestApprovedJobData>) => {
  const { userId, channelId, communityId, moderatorId } = job.data;
  debug(`user request to join channel ${channelId} approved`);

  const [actor, context, entity] = await Promise.all([
    fetchPayload('USER', moderatorId),
    fetchPayload('COMMUNITY', communityId),
    fetchPayload('CHANNEL', channelId),
  ]);

  const eventType = 'PRIVATE_CHANNEL_REQUEST_APPROVED';

  // construct a new notification record to either be updated or stored in the db
  const nextNotificationRecord = Object.assign(
    {},
    {
      event: eventType,
      actors: [actor],
      context,
      entities: [entity],
    }
  );

  // update or store a record in the notifications table, returns a notification
  const updatedNotification = await storeNotification(nextNotificationRecord);

  // get all the user data for the owners
  const recipients = await getUsers([userId]);

  // for each owner, create a notification for the app
  const usersNotificationPromises = recipients.map(recipient =>
    storeUsersNotifications(updatedNotification.id, recipient.id)
  );

  return await Promise.all([
    ...usersNotificationPromises, // update or store usersNotifications in-app
  ]).catch(err => {
    debug('❌ Error in job:\n');
    debug(err);
    Raven.captureException(err);
  });
};
