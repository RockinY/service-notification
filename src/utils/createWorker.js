// @flow
// create a worker with bull and start a small webserver which responds with
// health information

import http from 'http'
import EventEmitter from 'events'
import createQueue from './createQueue'