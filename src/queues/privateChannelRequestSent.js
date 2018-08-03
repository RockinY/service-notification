// @flow
const debug = require('debug')(
  'service-notification:queue:user-requested-join-private-channel'
);
import Raven from '../utils/raven';
import { getCommunityById } from '../models/community';
import { storeNotification } from '../models/notification';
import { storeUsersNotifications } from '../models/usersNotifications';
import {
  getOwnersInChannel,
  getModeratorsInChannel,
} from '../models/usersChannels';
import {
  getOwnersInCommunity,
  getModeratorsInCommunity,
} from '../models/usersCommunities';
import { getUsers } from '../models/user';
import { fetchPayload, createPayload } from '../utils/payloads';
import isEmail from 'validator/lib/isEmail';
import type { Job, PrivateChannelRequestJobData } from '../utils/types';

export default async (job: Job<PrivateChannelRequestJobData>) => {
  const { userId, channel } = job.data;
  debug(
    `new request to join a private channel from user ${userId} in channel ${
      channel.id
    }`
  );

  const [actor, context, entity] = await Promise.all([
    fetchPayload('USER', userId),
    fetchPayload('COMMUNITY', channel.communityId),
    createPayload('CHANNEL', channel),
  ]);

  const eventType = 'PRIVATE_CHANNEL_REQUEST_SENT';

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

  // get the owners of the channel
  const [
    ownersInCommunity,
    moderatorsInCommunity,
    ownersInChannel,
    moderatorsInChannel,
  ] = await Promise.all([
    getOwnersInCommunity(channel.communityId),
    getModeratorsInCommunity(channel.communityId),
    getOwnersInChannel(channel.id),
    getModeratorsInChannel(channel.id),
  ]);

  const uniqueRecipientIds = [
    ...ownersInCommunity,
    ...moderatorsInCommunity,
    ...ownersInChannel,
    ...moderatorsInChannel,
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
