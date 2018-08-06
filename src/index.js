// @flow
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
import processUserRequestedToJoinPrivateChannel from './queues/privateChannelRequestSent'
import processUserRequestPrivateChannelApproved from './queues/privateChannelRequestApproved'
import processUserRequestedJoinPrivateCommunity from './queues/privateCommunityRequestSent'
import processUserRequestPrivateCommunityApproved from './queues/privateCommunityRequestApproved'

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
} from './queues/constants';

const debug = require('debug')('service-notification')
