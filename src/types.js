import { toNFD } from 'corteza-webapp-messaging/src/lib/normalizers'
const fuzzysort = require('fuzzysort')
const UINT64_ZEROPAD = '00000000000000000000'

export { Channel } from './types/channel'

export class Message {
  constructor (m) {
    if (!m) {
      return
    }

    this.messageID = m.messageID
    this.userID = m.userID
    this.message = m.message
    this.type = m.type
    this.channelID = m.channelID
    this.replyTo = m.replyTo || ''
    this.replies = m.replies || 0
    this.createdAt = m.createdAt
    this.updatedAt = m.updatedAt || null
    this.deletedAt = m.deletedAt || null

    this.isPinned = !!m.isPinned
    this.isBookmarked = !!m.isBookmarked
    this.reactions = (m.reactions || []).map(r => new MessageReaction(r))
    this.mentions = m.mentions || []

    this.canReply = !!m.canReply
    this.canEdit = !!m.canEdit
    this.canDelete = !!m.canDelete

    // only to pass values along to unread store, do not use it directly
    this.unread = m.unread

    this.attachment = m.att ? new Attachment(m.att) : null

    // Preparing sort key
    //
    // We're using uint64 for ID and JavaScript does not know how to handle this type
    // natively. We get the value from backend as string anyway and we need to prefix
    // it with '0' to ensure string sorting does what we need it to.
    this.sortKey = this.messageID ? UINT64_ZEROPAD.substr(this.messageID.length) + this.messageID : UINT64_ZEROPAD
  }

  isMentioned (userID) {
    return this.mentions.indexOf(userID) !== -1
  }

  addReaction ({ reaction, userID }) {
    const i = this.reactions.findIndex(r => r.reaction === reaction)

    if (i === -1) {
      this.reactions.push(new MessageReaction({ reaction, userIDs: [userID], count: 1 }))
    } else {
      let r = this.reactions[i]

      if (r.userIDs.indexOf(userID) === -1) {
        r.userIDs.push(userID)
        r.count = r.userIDs.length
      }
    }
  }

  removeReaction ({ reaction, userID }) {
    const i = this.reactions.findIndex(r => r.reaction === reaction)

    if (i !== -1) {
      let r = this.reactions[i]
      r.userIDs = r.userIDs.filter(ID => ID !== userID)
      r.count = r.userIDs.length
    }

    // Filter out all invalid reactions
    this.reactions = this.reactions.filter(r => r.count > 0)
  }
}

class MessageReaction {
  constructor ({ reaction, userIDs, count }) {
    this.reaction = reaction
    this.userIDs = userIDs
    this.count = count
  }
}

export function Attachment (a) {
  this.attachmentID = a.attachmentID
  this.userID = a.userID
  this.name = a.name
  this.meta = a.meta

  if (window.MessagingAPI) {
    const base = window.MessagingAPI

    this.url = base + a.url
    this.previewUrl = base + a.previewUrl
    this.downloadUrl = this.url + (this.url.indexOf('?') === -1 ? '?' : '&') + 'download=1'
  }
}

export class User {
  constructor (u) {
    u = u || {}

    this.userID = u.userID || ''
    this.username = u.username || ''
    this.handle = u.handle || ''
    this.name = u.name || ''
    this.email = u.email || ''

    this.fts = (this.name + ' ' + this.username + ' ' + this.handle + ' ' + this.email + ' ' + this.userID).toLocaleLowerCase()
  }

  fuzzyKey () {
    return fuzzysort.prepare(toNFD(this.suggestionLabel()))
  }

  suggestionLabel () {
    return this.handle || this.name || (this.email || '').split('@')[0] || this.userID || ''
  }

  Match (q) {
    return this.fts.indexOf(q) > -1
  }
}

export function Member (m) {
  if (!m) {
    return
  }

  this.userID = m.userID
  this.type = m.type
  this.channelID = m.channelID
  this.createdAt = m.createdAt || null
  this.updatedAt = m.updatedAt || null
}
