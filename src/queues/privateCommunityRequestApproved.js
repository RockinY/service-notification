// @flow
const debug = require('debug')(
  'service-notification:queue:user-request-private-community-approved'
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
  PrivateCommunityRequestApprovedJobData,
} from '../utils/types';

export default async (job: Job<PrivateCommunityRequestApprovedJobData>) => {
  const { userId, communityId, moderatorId } = job.data;
  debug(`user request to join community ${communityId} approved`);

  const [actor, context] = await Promise.all([
    fetchPayload('USER', moderatorId),
    fetchPayload('COMMUNITY', communityId),
  ]);

  const eventType = 'PRIVATE_COMMUNITY_REQUEST_APPROVED';

  // construct a new notification record to either be updated or stored in the db
  const nextNotificationRecord = Object.assign(
    {},
    {
      event: eventType,
      actors: [actor],
      context,
      entities: [context],
    }
  );

  // update or store a record in the notifications table, returns a notification
  const updatedNotification = await storeNotification(nextNotificationRecord);

  const community = await getCommunityById(communityId);
  const recipients = await getUsers([userId]);

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
