import type {
  DBMessage,
  DBChannel,
  DBReaction,
  DBThread,
  DBThreadReaction,
  DBNotificationsJoin
} from '../flowTypes'

export type Job<JobData> = {|
  id: string,
  data: JobData,
  remove: () => Promise<void>,
  finished: () => Promise<void>,
|}

export type DirectMessageNotificationJobData = {
  message: DBMessage,
  userId: string,
}

export type CommunityNotificationJobData = {
  communityId: string,
  userId: string,
}

export type ChannelNotificationJobData = {
  channel: DBChannel,
  userId: string,
};

export type CommunityNotificationJobData = {
  communityId: string,
  userId: string,
};

export type DirectMessageNotificationJobData = {
  message: DBMessage,
  userId: string,
};

export type MentionNotificationJobData = {
  messageId?: string, // This is only set if it's a message mention notification
  threadId: string, // This is always set, no matter if it's a message or thread mention notification
  senderId: string,
  username: ?string,
  type: 'message' | 'thread',
};

export type PrivateChannelRequestApprovedJobData = {
  userId: string,
  channelId: string,
  communityId: string,
  moderatorId: string,
};

export type PrivateChannelRequestJobData = {
  userId: string,
  channel: DBChannel,
};

export type PrivateCommunityRequestApprovedJobData = {
  userId: string,
  communityId: string,
  moderatorId: string,
};

export type PrivateCommunityRequestJobData = {
  userId: string,
  communityId: string,
};

export type ReactionNotificationJobData = {
  reaction: DBReaction,
  userId: string,
};

export type ThreadReactionNotificationJobData = {
  threadReaction: DBThreadReaction,
  userId: string,
};

export type UserThreadLastSeenJobData = {
  threadId: string,
  userId: string,
  timestamp: number | Date,
};

export type ThreadNotificationJobData = { thread: DBThread };

export type PushNotificationsJobData = {
  // This gets passed a join of the userNotification and the notification record
  notification: DBNotificationsJoin,
};

export type Queues = {
  
}