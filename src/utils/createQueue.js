// @flow
import Queue from 'bull'
import createRedis from './createRedis'
import Raven from './raven'

const client = createRedis()
const subscriber = createRedis()

function createQueue(name: string, queueOptions?: Object = {}) {
  const queue = new Queue(name, {
    createClient: function(type) {
      switch (type) {
        case 'client':
          return client;
        case 'subscriber':
          return subscriber;
        default:
          return createRedis()
      }
    },
    defaultJobOptions: {
      removeOnComplete: true,
      attempts: 1
    },
    ...queueOptions
  })

  queue.on('stalled', job => {
    const message = `Job#${job.id} stalled, processing again.`
    if (process.env.NODE_ENV !== 'production') {
      console.log(message)
      return
    }
    Raven.captureException(new Error(message))
  })

  queue.on('failed', (job, err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Job#${job.id} failed, with following reason`);
      console.error(err);
      return;
    }
    Raven.captureException(err);
  })
  return queue
}

export default createQueue