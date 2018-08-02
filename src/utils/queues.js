const createQueue = require('./createQueue')
import type { Queues } from './types'
const EventEmitter = require('events')

exports.QUEUE_NAMES = {
  sendNotificationAsPushQueue: 'SEND_PUSH_NOTIFICATIONS'
}

// We add one error listener per queue, so we have to set the max listeners
// to whatever it is set to + the amount of queues passed in
// $FlowIssue
EventEmitter.defaultMaxListeners =
  // $FlowIssue
  Object.keys(exports.QUEUE_NAMES).length + EventEmitter.defaultMaxListeners;

// Create all the queues, export an object with all the queues
const queues: Queues = Object.keys(exports.QUEUE_NAMES).reduce(
  (queues, name) => {
    queues[name] = createQueue(exports.QUEUE_NAMES[name]);
    return queues;
  },
  {}
);

// Needs to be module.exports so import { sendEmailValidationEmailQueue } from 'queues' works
// it wouldn't work with export default queues and for some reason export { ...queues } doesn't either
module.exports = queues;