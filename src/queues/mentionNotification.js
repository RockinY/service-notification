// @flow
const debug = require('debug')('athena:queue:mention-notification');
import Raven from '../utils/raven';
import { toPlainText, toState } from '../utils/draft';
import truncate from '../utils/truncate';
import { fetchPayload } from '../utils/payloads';
import { storeNotification } from '../models/notification';
import { getChannelById } from '../models/channel';
import { getMessageById } from '../models/message';
import { getUserPermissionsInCommunity } from '../models/usersCommunities';
import { getCommunityById } from '../models/community';
import { getUsersThread } from '../models/usersThreads';
import { storeUsersNotifications } from '../models/usersNotifications';
import { getUserPermissionsInChannel } from '../models/usersChannels';
import { getThreadById } from '../models/thread';
import { getUserByUsername, getUserById } from '../models/user';
import type { Job, MentionNotificationJobData } from '../utils/types';

export default async ({ data }: Job<MentionNotificationJobData>) => {
  debug('mention job created');
  const { threadId, messageId, senderId, username, type: mentionType } = data;
  // if we have incomplete data
  if (!threadId || !senderId || !username) return;
  debug('all data required to process mention');

  // get the user who was mentioned
  const recipient = await getUserByUsername(username);

  // escape this whole notification quickly if the username doesn't exist
  if (!recipient) return;
  debug('recipient found for mention');

  // don't notifify of self-mentions
  if (recipient.id === senderId) return;
  debug('recipient does not equal sender');

  // permission check to make sure the user who was mentioned is allowed in this
  // channel
  // NOTE: this will only block notifications from going to people mentioned
  // in a private channel where the user is not a member. Users can still be
  // mentioned in public channels where they are not a member
  const thread = await getThreadById(threadId);

  // if for some reason no thread was found, or the thread was deleted
  // dont send any notification about the mention
  if (!thread || thread.deletedAt) return;

  const { isPrivate: channelIsPrivate } = await getChannelById(
    thread.channelId
  );
  const { isPrivate: communityIsPrivate } = await getCommunityById(
    thread.communityId
  );
  const {
    isBlocked: isBlockedInCommunity,
    isMember: isMemberInCommunity,
  } = await getUserPermissionsInCommunity(thread.communityId, recipient.id);
  const {
    isMember: isMemberInChannel,
    isBlocked: isBlockedInChannel,
  } = await getUserPermissionsInChannel(recipient.id, thread.channelId);

  if (
    isBlockedInCommunity ||
    isBlockedInChannel ||
    (channelIsPrivate && !isMemberInChannel) ||
    (communityIsPrivate && !isMemberInCommunity)
  ) {
    return;
  }

  // see if a usersThreads record exists. If it does, and notifications are muted, we
  // should not send an email. If the record doesn't exist, it means the person being
  // mentioned either didn't create the thread or hasn't interacted with the thread yet,
  // in which case they should receive a notification
  const usersThread = await getUsersThread(recipient.id, threadId);
  // if a record exists and the user doesn't want notifications for this thread, escape
  if (usersThread && !usersThread.receiveNotifications) return;

  // prepare data for the in-app notification

  const [actor, context] = await Promise.all([
    // get the thread author info
    fetchPayload('USER', senderId),
    // get the thread where the mention occured
    fetchPayload('THREAD', threadId),
  ]);

  // create a payload for the message if the mention was in a message
  // if there is no message id, return the thread info as the entity
  const entity =
    mentionType === 'message' && messageId
      ? await fetchPayload('MESSAGE', messageId)
      : context;

  // we handle mentions in threads vs messages differently in the client, so assign different event types
  const event = mentionType === 'thread' ? 'MENTION_THREAD' : 'MENTION_MESSAGE';

  // we don't care that much about buffering these kinds of notifications or aggregating them in any way, since these are super high signal
  const newNotification = Object.assign(
    {},
    {
      actors: [actor],
      event,
      context,
      entities: [entity],
    }
  );

  const [storedNotification] = await Promise.all([
    // create a new notification record to be displayed in-app
    storeNotification(newNotification)
  ]);

  return storeUsersNotifications(storedNotification.id, recipient.id);
};
