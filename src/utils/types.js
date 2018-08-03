import type {
  DBMessage,
  DBChannel
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

export type Queues = {
  
}