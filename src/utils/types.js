import type {
  DBMessage
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

export type Queues = {
  
}