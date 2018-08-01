// @flow
export type EntityTypes =
  | 'REACTION'
  | 'THREAD_REACTION'
  | 'MESSAGE'
  | 'THREAD'
  | 'CHANNEL'
  | 'COMMUNITY'
  | 'USER'
  | 'DIRECT_MESSAGE_THREAD'

export type EventTypes =
  | 'REACTION_CREATED'
  | 'THREAD_REACTION_CREATED'
  | 'MESSAGE_CREATED'
  | 'THREAD_CREATED'
  | 'THREAD_EDITED'
  | 'CHANNEL_CREATED'
  | 'DIRECT_MESSAGE_THREAD_CREATED'
  | 'USER_JOINED_COMMUNITY'
  | 'USER_REQUESTED_TO_JOIN_PRIVATE_CHANNEL'
  | 'USER_APPROVED_TO_JOIN_PRIVATE_CHANNEL'
  | 'THREAD_LOCKED_BY_OWNER'
  | 'THREAD_DELETED_BY_OWNER'
  | 'COMMUNITY_INVITATION'

export type DBMessage = {
  content: {
    body: string
  },
  id: string,
  messageType: 'text' | 'media' | 'draftjs',
  senderId: string,
  deletedAt?: Date,
  deletedBy?: string,
  threadId: string,
  threadType: 'story' | 'directMessageThread',
  timestamp: Date,
  parentId?: string
}

type DBThreadAttachment = {
  attachmentType: 'photoPreview',
  data: {
    name: string,
    type: string,
    url: string
  }
}

type DBThreadEdits = {
  attachments?: {
    photos: Array<DBThreadAttachment>
  },
  content: {
    body?: any,
    title: string
  },
  timestamp: Date
}

export type DBThread = {
  id: string,
  channelId: string,
  communityId: string,
  content: {
    body?: any,
    title: string
  },
  createdAt: Date,
  creatorId: string,
  isPublished: boolean,
  isLocked: boolean,
  lockedBy?: string,
  lockedAt?: Date,
  lastActive: Date,
  modifiedAt?: Date,
  deletedAt?: string,
  deletedBy: ?string,
  attachments?: Array<DBThreadAttachment>,
  edits?: Array<DBThreadEdits>,
  watercooler?: boolean,
  type: string
}

export type DBChannel = {
  communityId: string,
  createdAt: Date,
  deletedAt?: Date,
  description: string,
  id: string,
  isDefault: boolean,
  isPrivate: boolean,
  name: string,
  slug: string,
  archivedAt?: Date
}

export type DBCommunity = {
  coverPhoto: string,
  createdAt: Date,
  description: string,
  id: string,
  name: string,
  profilePhoto: string,
  slug: string,
  website?: ?string,
  deletedAt?: Date,
  pinnedThreadId?: string,
  watercoolerId?: string,
  creatorId: string,
  administratorEmail: ?string,
  hasAnalytics: boolean,
  hasPrioritySupport: boolean,
  stripeCustomerId: ?string,
  pendingAdministratorEmail?: string,
  ossVerified?: boolean,
  isPrivate: boolean
}

export type DBUser = {
  id: string,
  email?: string,
  createdAt: Date,
  name: string,
  coverPhoto: string,
  profilePhoto: string,
  providerId?: ?string,
  githubProviderId?: ?string,
  githubUsername?: ?string,
  username: ?string,
  timezone?: ?number,
  isOnline?: boolean,
  lastSeen?: ?Date,
  description?: ?string,
  website?: ?string,
  modifiedAt: ?Date,
  bannedAt: ?Date
}

export type DBDirectMessageThread = {
  createdAt: Date,
  id: string,
  name?: string,
  threadLastActive: Date
}