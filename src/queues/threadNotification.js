// @flow
const debug = require('debug')('service-notification:queue:new-thread-notification');
import Raven from '../utils/raven';
import axios from 'axios';
import getMentions from '../utils/getMentions';
import { toPlainText, toState } from '../utils/draft';
import { getUserById, getUsers } from '../models/user';
import { getCommunityById } from '../models/community';
import { getMembersInChannelWithNotifications } from '../models/usersChannels';
import { sendMentionNotificationQueue } from '../utils/queues';
import type { Job, ThreadNotificationJobData } from '../utils/types';
import { getChannelSettings } from '../models/channelSettings';
import { getChannelById } from '../models/channel';
import { getCommunitySettings } from '../models/communitySettings';
import { truncateString } from '../utils/truncateString';
import { decryptString } from '../utils/encryption';

export default async (job: Job<ThreadNotificationJobData>) => {
  const { thread: incomingThread } = job.data;
  debug(`new job for a thread by ${incomingThread.creatorId}`);

  const [channelSlackSettings, communitySlackSettings] = await Promise.all([
    getChannelSettings(incomingThread.channelId),
    getCommunitySettings(incomingThread.communityId),
  ]);

  // get the members in the channel who should receive notifications
  const recipients = await getMembersInChannelWithNotifications(
    incomingThread.channelId
  );

  // get all the user data for the members
  const recipientsWithUserData = await getUsers([...recipients]);

  // filter out the post author
  const filteredRecipients = recipientsWithUserData.filter(
    r => r.id !== incomingThread.creatorId
  );

  const plainTextBody = incomingThread.content.body
    ? toPlainText(toState(JSON.parse(incomingThread.content.body)))
    : '';
  // see if anyone was mentioned in the thread
  const mentions = getMentions(plainTextBody);
  // if people were mentioned in the thread, let em know
  if (mentions && mentions.length > 0) {
    mentions.forEach(username => {
      sendMentionNotificationQueue.add({
        threadId: incomingThread.id, // thread where the mention happened
        senderId: incomingThread.creatorId, // user who created the mention
        username: username,
        type: 'thread',
      });
    });
  }

  return
};
