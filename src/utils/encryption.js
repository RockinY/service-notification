import Cryptr from 'cryptr'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error(
    'Looks like youre missing an encryption key for sensitive data!'
  )
}

var cryptr = new Cryptr(ENCRYPTION_KEY)

function encryptString (text /*: string */) /*: string */ {
  return cryptr.encrypt(text)
}

function decryptString (text /*: string */) /*: string */ {
  return cryptr.decrypt(text)
}

function encryptObject (object /*: Object */) /*: Object */ {
  return cryptr.encrypt(JSON.stringify(object))
}

function decryptObject (text /*: string */) /*: Object */ {
  return JSON.parse(cryptr.decrypt(text))
}

module.exports = { decryptString, encryptString, decryptObject, encryptObject }
