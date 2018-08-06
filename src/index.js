// @flow
import './utils/dotenv'
import createWorker from './utils/createWorker'

// Job processors
import processMessageNotification from './queues/newMessageInThread'
import processMentionNotification from './queues/mentionNotification'
import processDirectMessageNotification from './queues/directMessageNotification'
import processReactionNotification from './queues/reactionNotification'
import processThreadReactionNotification from './queues/threadReactionNotification'
import processChannelNotification from './queues/channelNotification'
import processCommunityNotification from './queues/communityNotification'
import processThreadNotification from './queues/threadNotification'
import trackUserThreadLastSeen from './queues/trackUserThreadLastSeen'
import processUserRequestedJoinPrivateChannel from './queues/privateChannelRequestSent'
import processUserRequestPrivateChannelApproved from './queues/privateChannelRequestApproved'
import processUserRequestedJoinPrivateCommunity from './queues/privateCommunityRequestSent'
import processUserRequestPrivateCommunityApproved from './queues/privateCommunityRequestApproved'
import processPushNotifications from './queues/sendPushNotifications'

import startNotificationsListener from './listeners/notifications'
import {
  MESSAGE_NOTIFICATION,
  MENTION_NOTIFICATION,
  DIRECT_MESSAGE_NOTIFICATION,
  REACTION_NOTIFICATION,
  THREAD_REACTION_NOTIFICATION,
  CHANNEL_NOTIFICATION,
  COMMUNITY_NOTIFICATION,
  THREAD_NOTIFICATION,
  PRIVATE_CHANNEL_REQUEST_SENT,
  PRIVATE_CHANNEL_REQUEST_APPROVED,
  PRIVATE_COMMUNITY_REQUEST_SENT,
  PRIVATE_COMMUNITY_REQUEST_APPROVED,
  TRACK_USER_LAST_SEEN,
  SEND_PUSH_NOTIFICATIONS
} from './queues/constants';

const debug = require('debug')('service-notification')

const PORT = process.env.PORT || 3003

debug('Notification processing worker, is starting...');
debug('Logging with debug enabled!');
debug('');

const server = createWorker({
  [MESSAGE_NOTIFICATION]: processMessageNotification,
  [MENTION_NOTIFICATION]: processMentionNotification,
  [DIRECT_MESSAGE_NOTIFICATION]: processDirectMessageNotification,
  [REACTION_NOTIFICATION]: processReactionNotification,
  [THREAD_REACTION_NOTIFICATION]: processThreadReactionNotification,
  [CHANNEL_NOTIFICATION]: processChannelNotification,
  [COMMUNITY_NOTIFICATION]: processCommunityNotification,
  [THREAD_NOTIFICATION]: processThreadNotification,
  [TRACK_USER_LAST_SEEN]: trackUserThreadLastSeen,
  [PRIVATE_CHANNEL_REQUEST_SENT]: processUserRequestedJoinPrivateChannel,
  [PRIVATE_CHANNEL_REQUEST_APPROVED]: processUserRequestPrivateChannelApproved,
  [PRIVATE_COMMUNITY_REQUEST_SENT]: processUserRequestedJoinPrivateCommunity,
  [PRIVATE_COMMUNITY_REQUEST_APPROVED]: processUserRequestPrivateCommunityApproved,
  [SEND_PUSH_NOTIFICATIONS]: processPushNotifications,
});

startNotificationsListener();

debug(
  `🗄 Queues open for business ${(process.env.NODE_ENV === 'production' &&
    // $FlowIssue
    `at ${process.env.REDIS_URL}:${process.env.REDIS_PORT}`) ||
    'locally'}`
);

// $FlowIssue
server.listen(PORT, 'localhost', () => {
  debug(
    `💉 Healthcheck server running at ${server.address().address}:${
      server.address().port
    }`
  );
});
