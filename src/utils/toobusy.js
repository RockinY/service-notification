import toobusy from 'toobusy-js'

export default (req, res, next) => {
  if (process.env.NODE_ENV !== 'testing' && toobusy()) {
    res.statusCode = 503
    res.send(
      'It seems that we are busy now, please try again later!'
    )
  } else {
    next()
  }
}
