// @flow
const debug = require('debug')(
  'service-notification:queue:user-requested-join-private-community'
);
import Raven from '../utils/raven';
import { getCommunityById } from '../models/community';
import { storeNotification } from '../models/notification';
import { storeUsersNotifications } from '../models/usersNotifications';
import {
  getOwnersInCommunity,
  getModeratorsInCommunity,
} from '../models/usersCommunities';
import { getUsers } from '../models/user';
import { fetchPayload } from '../utils/payloads';
import type { Job, PrivateCommunityRequestJobData } from '../utils/types';

export default async (job: Job<PrivateCommunityRequestJobData>) => {
  const { userId, communityId } = job.data;
  debug(
    `new request to join a private community from user ${userId} in community ${communityId}`
  );

  const [actor, context] = await Promise.all([
    fetchPayload('USER', userId),
    fetchPayload('COMMUNITY', communityId),
  ]);

  const eventType = 'PRIVATE_COMMUNITY_REQUEST_SENT';

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

  // get the owners of the community
  const [ownersInCommunity, moderatorsInCommunity] = await Promise.all([
    getOwnersInCommunity(communityId),
    getModeratorsInCommunity(communityId),
  ]);

  const uniqueRecipientIds = [
    ...ownersInCommunity,
    ...moderatorsInCommunity,
  ].filter((item, i, ar) => ar.indexOf(item) === i);

  // get all the user data for the owners
  const recipientsWithUserData = await getUsers([...uniqueRecipientIds]);

  // for each owner, create a notification for the app
  const usersNotificationPromises = recipientsWithUserData.map(recipient =>
    storeUsersNotifications(updatedNotification.id, recipient.id)
  );

  return Promise.all([
    ...usersNotificationPromises, // update or store usersNotifications in-app
  ]).catch(err => {
    debug('❌ Error in job:\n');
    debug(err);
    Raven.captureException(err);
  });
};
