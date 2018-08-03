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


export type Queues = {
  
}