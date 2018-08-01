var EditorState = require('draft-js/lib/EditorState')
var ContentState = require('draft-js/lib/ContentState')
var convertFromRaw = require('draft-js/lib/convertFromRawToDraftState')
var convertToRaw = require('draft-js/lib/convertFromDraftStateToRaw')

var toPlainText = function toPlainText (
  editorState /* : typeof EditorState */
) /* : string */ {
  return editorState.getCurrentContent().getPlainText()
}

// This is necessary for SSR, if you create an empty editor on the server and on the client they have to
// have matching keys, so just doing fromPlainText('') breaks checksum matching because the key
// of the block is randomly generated twice and thusly does't match
var emptyContentState = convertFromRaw({
  entityMap: {},
  blocks: [
    {
      text: '',
      key: 'foo',
      type: 'unstyled',
      entityRanges: []
    }
  ]
})

var fromPlainText = function fromPlainText (
  text /* : string */
) /* : typeof EditorState */ {
  if (!text || text === '') {
    return EditorState.createWithContent(emptyContentState)
  }
  return EditorState.createWithContent(ContentState.createFromText(text))
}

var toJSON = function toJSON (
  editorState /* : typeof EditorState */
) /* : Object */ {
  return convertToRaw(editorState.getCurrentContent())
}

var toState = function toState (json /* : Object */) /* : typeof EditorState */ {
  return EditorState.createWithContent(convertFromRaw(json))
}

var isAndroid = function isAndroid () /* : bool */ {
  return navigator.userAgent.toLowerCase().indexOf('android') > -1
}

module.exports = {
  toJSON: toJSON,
  toState: toState,
  toPlainText: toPlainText,
  fromPlainText: fromPlainText,
  emptyContentState: emptyContentState,
  isAndroid: isAndroid
}
