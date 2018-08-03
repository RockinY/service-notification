import { toState, toPlainText } from '../../utils/draft'
import getMentions from '../../utils/getMentions'
import Raven from '../../utils/raven'
import { fetchPayload, createPayload } from '../../utils/payloads'
import { getDistinctActors } from '../../utils/actors'
import {
  storeNotification,
  updateNotification,
  checkForExistingNotification
} from '../../models/notification'
import {
  storeUsersNotifications,
  markUsersNotificationsAsNew
} from '../../models/usersNotifications'
import { getThreadNotificationUsers } from '../../models/usersThreads'
import { getUserPermissionsInChannel } from '../../models/usersChannels'
import { getUserPermissionsInCommunity } from '../../models/usersCommunities'
import { getUserById } from '../../models/user'
import { getMessageById } from '../../models/message'
import { sendMentionNotificationQueue } from '../../utils/queues'
import type { MessageNotificationJobData, Job } from '../../utils/types'
import type { DBMessage } from '../../flowTypes'

const debug = require('debug')('service-notification:queue:message-notification');

export default async (job: Job<MessageNotificationJobData>) => {
  const { message: incomingMessage } = job.data
  const { senderId: messageSenderId } = incomingMessage

  debug(
    `new job: message sent by ${messageSenderId} in thread #${
      incomingMessage.threadId
    }`
  )

  // Check to see if an existing notif exists by matching the 'event' type, with the context of the notification, within a certain time period.
  const existing = await checkForExistingNotification(
    'MESSAGE_CREATED',
    incomingMessage.threadId
  );

  // get the user who left the message
  const actor = await fetchPayload('USER', messageSenderId)

  // get the thread the message was left in
  const context = await fetchPayload('THREAD', incomingMessage.threadId)

  // create an entity payload with the message that was sent
  const entity = await createPayload('MESSAGE', incomingMessage)

  // Calculate actors
  // determine if there are previews actors we need to process seperately
  const previewsActors = existing ? existing.actors : []
  const actors = await getDistinctActors([...previewsActors, actor])

  // Calculate entities
  const previewsEntities = existing ? existing.entities : []
  const entities = [...previewsEntities, entity]

  // Create notification
  const newNotifcation = Object.assign({}, existing || {}, {
    actors,
    event: 'MESSAGE_CREATED',
    context,
    entities
  })

  const notification = existing
    ? await updateNotification(newNotifcation)
    : await storeNotification(newNotifcation)

  // determine who should get notified
  const recipients = await getThreadNotificationUsers(notification.context.id)

  // filter out the user who sent the message
  const filteredRecipients = recipients.filter(
    recipient => recipient.userId != messageSenderId
  )

  const thread = JSON.parse(context.payload)

  const permissionedRecipients = await Promise.all(
    filteredRecipients.map(async user => {
      const [channelPermissions, communityPermissions] = await Promise.all([
        getUserPermissionsInChannel(user.userId, thread.channelId)
        getUserPermissionsInCommunity(thread.communityId, user.userId)
      ])
      const isNotBlocked = !channelPermissions.isBlocked && !communityPermissions.isBlocked
      return isNotBlocked ? user : null
    })
  )

  // convert the message body to be checked for mentions
  const body = incomingMessage.messageType === 'draftjs'
    ? toPlainText(toState(JSON.parse(incomingMessage.content.body)))
    : incomingMessage.content.body

  // get mentions in the message
  let mentions = getMentions(body)
  // If the message quoted another message, send a mention notification to the author
  // of the quoted message
  if (typeof incomingMessage.parentId === 'string') {
    const parent = await getMessageById(incomingMessage.parentId)
    (parent: DBMessage)
    if (parent) {
      const parentAuthor = await getUserById(parent.senderId)
      if (
        parentAuthor &&
        parentAuthor.username &&
        mentions.indexOf(parentAuthor.username) < 0
      ) {
        mentions.push(parentAuthor.username)
      }
    }
  }
  if (mentions && mentions.length > 0) {
    mentions.forEach(username => {
      sendMentionNotificationQueue.add({
        messageId: incomingMessage.id,
        threadId: incomingMessage.threadId,
        senderId: incomingMessage.senderId,
        username: username,
        type: 'message',
      })
    })
  }

  // if a user was mentioned, they should only get the mention notification
  // and not get a new message notification, so remove them here
  const recipientsWithoutMentions = permissionedRecipients
    .filter(Boolean)
    .filter(r => r && mentions.indexOf(r.username) < 0)

  // if no more receipients are valid, escape the function
  if (!recipientsWithoutMentions || recipientsWithoutMentions.length === 0) {
    debug('No recipients for this message notification');
    return;
  }

  // get raw data
  const dbMethod = existing
    ? markUsersNotificationsAsNew
    : storeUsersNotifications

  // send each recipient a notification
  const formatAndBufferPromises = recipientsWithoutMentions.map(
    async recipient => {
      if (!recipient) {
        return Promise.resolve();
      }

      debug(
        'store/update notification in db'
      );
      return Promise.all([
        dbMethod(notification.id, recipient.userId),
      ]);
    }
  );

  return Promise.all(formatAndBufferPromises).catch(err => {
    debug('❌ Error in job:\n');
    debug(err);
    Raven.captureException(err);
  });
}
