// @flow
import { MENTIONS } from './regexps'

export const getMentions = (text: string): Array<string> => {
  const matchedMentions = text.match(MENTIONS)
  const mentions = matchedMentions
    ? matchedMentions.filter(mention => !mention.startsWith('/'))
    : [];

  if (!mentions || mentions.length === 0) {
    return []
  }

  const trimmed = mentions.map(
    mention => (typeof mention === 'string' ? mention.trim() : mention)
  )

  const cleaned = removeAtSymbol(trimmed)

  const lowercase = makeLowercase(cleaned)

  const distinct = getDistinctMentions(lowercase)

  return distinct
}

const makeLowercase = (usernames: Array<string>): Array<string> => {
  return usernames.map(u => u.toLowerCase());
};

const removeAtSymbol = (usernames: Array<string>): Array<string> => {
  return usernames.map(u => u.substr(1));
};

export const getDistinctMentions = (
  usernames: Array<string>
): Array<string> => {
  return usernames.filter((v, i, a) => a.indexOf(v) === i);
}

export default getMentions