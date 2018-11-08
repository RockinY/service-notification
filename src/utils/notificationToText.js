import sentencify from './sentencify';
import sortByDate from './sortByDate';
import { toState, toPlainText } from './draft';

const sortThreads = (entities, currentUser) => {
  // filter out the current user's threads
  let threads = entities.filter(
    thread => thread.payload.creatorId !== currentUser.id
  );
  // create an array of payloads
  threads = threads && threads.map(thread => thread.payload);
  // sort the threads by created at date
  threads = threads && sortByDate(threads, 'createdAt', 'desc');
  return threads;
};

export const parseActors = (actors, currentUser) => {
  const filteredActors = actors
    .filter(actor => actor.id !== currentUser.id)
    .reverse();
  return sentencify(filteredActors.map(({ payload }) => payload.name));
};

const EVENT_VERB = {
  MESSAGE_CREATED: '回复了你',
  REACTION_CREATED: '给你点赞',
  CHANNEL_CREATED: '已经成功创建',
  USER_JOINED_COMMUNITY: '加入了社区',
  MENTION_MESSAGE: '提到了你',
  MENTION_THREAD: '提到了你',
  THREAD_REACTION_CREATED: '给你点赞',
};

const contextToString = (context, currentUser) => {
  switch (context.type) {
    case 'SLATE':
    case 'THREAD': {
      const payload = context.payload;
      const isCreator = payload.creatorId === currentUser.id;
      const str = isCreator ? '对你的帖子' : '';
      return `${str}${payload.content.title}`;
    }
    case 'DIRECT_MESSAGE_THREAD': {
      return '在对话中';
    }
    case 'THREAD_REACTION': {
      return '在你的帖子里';
    }
    case 'MESSAGE':
      return '在你的消息里';
    case 'COMMUNITY':
      return `在社区${context.payload.name}里`
    case 'CHANNEL':
      return `在频道${context.payload.name}里`
    default:
      return;
  }
};

const parsePayload = input => ({
  ...input,
  payload: JSON.parse(input.payload),
});

const parseEntityPayload = entities => entities.map(parsePayload);

// Turns out this isn't super slow! 😱 https://esbench.com/bench/5966ab9999634800a03489f6
// Runs ~600k ops/s, which is way fast enough
const removeUndefinedProperties = obj => JSON.parse(JSON.stringify(obj));

const parseNotification = notification => {
  return {
    actors: notification.actors && parseEntityPayload(notification.actors),
    context: notification.context && parsePayload(notification.context),
    entities:
      notification.entities && parseEntityPayload(notification.entities),
    event: notification.event,
    date: notification.modifiedAt,
  };
};

const formatNotification = (incomingNotification, currentUserId) => {
  const notification = parseNotification(incomingNotification);
  const actors =
    notification.actors &&
    parseActors(notification.actors, { id: currentUserId });
  const event = notification.event && EVENT_VERB[notification.event];
  const context =
    notification.context &&
    contextToString(notification.context, { id: currentUserId });

  let title = `${actors}${context}${event}`;
  let href, body;

  switch (notification.event) {
    case 'MENTION_MESSAGE': {
      const entities = notification.entities.filter(
        ({ payload }) => payload.senderId !== currentUserId
      );

      if (notification.context.type === 'DIRECT_MESSAGE_THREAD') {
        href = `/messages/${notification.context.id}`;
      } else {
        href = `/thread/${notification.context.id}`;
      }
      body = sentencify(
        entities.map(({ payload }) => {
          if (payload.messageType === 'draftjs') {
            let body = payload.content.body;
            if (typeof body === 'string')
              body = JSON.parse(payload.content.body);
            return `"${toPlainText(toState(body)).replace(
              /[ \n\r\v]+/g,
              ' '
            )}"`;
          }

          return `"${payload.content.body.replace(/[ \n\r\v]+/g, ' ')}"`;
        })
      );
      break;
    }
    case 'MESSAGE_CREATED': {
      const entities = notification.entities.filter(
        ({ payload }) => payload.senderId !== currentUserId
      );

      title = `收到一条新消息`;
      href = `/messages/${notification.context.id}`;
      body = entities
        .map(({ payload }) => {
          const sender = notification.actors.find(
            actor => payload.senderId === actor.id
          );
          if (payload.messageType === 'draftjs') {
            let body = payload.content.body;
            if (typeof body === 'string')
              body = JSON.parse(payload.content.body);
            return `${sender.payload.name} (@${
              sender.payload.username
            }): ${toPlainText(toState(body))}`;
          }

          return `${sender.payload.name}: ${payload.content.body}`;
        })
        .join('\n');
      break;
    }
    case 'REACTION_CREATED': {
      const message = notification.context.payload;

      href = `/thread/${message.threadId}`;
      body =
        message.messageType.toLowerCase() === 'draftjs'
          ? toPlainText(toState(message.content.body))
          : message.content.body;
      break;
    }
    case 'THREAD_REACTION_CREATED': {
      const thread = notification.context.payload;

      href = `/thread/${thread.id}`;
      body =
        thread.type.toLowerCase() === 'draftjs'
          ? toPlainText(toState(thread.content.body))
          : thread.content.body;
      break;
    }
    case 'CHANNEL_CREATED': {
      const entities = notification.entities;
      const newChannelCount = `${entities.length}个频道`

      title = `${newChannelCount}${context}${event}`;
      body = sentencify(entities.map(({ payload }) => `"${payload.name}"`));
      break;
    }
    case 'USER_JOINED_COMMUNITY': {
      href = `/${notification.context.payload.slug}`;
      title = `${actors}${context}${event}`;
      break;
    }

    case 'MENTION_THREAD': {
      // sort and order the threads
      const threads = sortThreads(notification.entities, { id: currentUserId });
      const urlBase =
        notification.context.type === 'DIRECT_MESSAGE_THREAD'
          ? 'messages'
          : 'thread';

      href = `/${urlBase}/${threads[0].id}`;
      body = sentencify(threads.map(thread => `"${thread.content.title}"`));
      break;
    }
    case 'THREAD_CREATED': {
      // sort and order the threads
      const threads = sortThreads(notification.entities, { id: currentUserId });

      const newThreadCount =  `${threads.length}个新的帖子`

      const urlBase =
        notification.context.type === 'DIRECT_MESSAGE_THREAD'
          ? 'messages'
          : 'thread';

      href = `/${urlBase}/${threads[0].id}`;
      title = `${newThreadCount}${context}发布了`;
      body = sentencify(threads.map(thread => `"${thread.content.title}"`));
      break;
    }
    case 'COMMUNITY_INVITE': {
      href = `/${notification.context.payload.slug}`;
      title = `${actors}${context}邀请你的加入`;
      break;
    }
    default:
      return;
  }

  const data = href && {
    href,
  };

  return removeUndefinedProperties({
    raw: notification,
    data,
    title,
    body,
  });
};

export default formatNotification;
