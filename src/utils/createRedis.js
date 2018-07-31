// @flow
import Redis from 'ioredis'

const config = {
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
}

export default (extraConfig?: Object) => {
  return new Redis({
    ...config,
    ...extraConfig
  })
}
