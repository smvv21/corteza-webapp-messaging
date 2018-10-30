import { Channel, Message } from '@/types'
import localCommands from '@/commands'

export default {
  install (Vue, { eventbus, store }) {
    eventbus.$on('$ws.channels', (channels) => {
      let cc = []
      channels.forEach((c) => {
        cc.push(new Channel(c))

        // Set unread state for all channels
        store.dispatch('unread/setChannel', {
          ID: c.ID,
          count: (c.view || {}).newMessagesCount,
          lastMessageID: (c.view || {}).lastMessageID,
        })
      })

      store.dispatch('channels/resetList', cc)
    })

    eventbus.$on('$ws.channel', (channel) => {
      store.dispatch('channels/updateList', new Channel(channel))
    })

    eventbus.$on('$ws.channelJoin', (join) => {
      store.dispatch('channels/joinChannel', join)
    })

    eventbus.$on('$ws.channelPart', (part) => {
      store.dispatch('channels/partChannel', part)
    })

    eventbus.$on('$ws.channelActivity', (activity) => {
      const currentUser = store.getters['auth/user']
      if (currentUser.ID !== activity.userID) {
        // Store activity only if someone else is active...
        store.commit('users/active', activity)
      }
    })

    // Handle users payload when it gets back
    eventbus.$on('$ws.users', (users) => {
      store.dispatch('users/resetList', users)
    })

    eventbus.$on('$ws.clientConnected', ({ uid }) => {
      store.commit('users/connections', { ID: uid, delta: 1 })
    })

    eventbus.$on('$ws.clientDisconnected', ({ uid }) => {
      store.commit('users/connections', { ID: uid, delta: -1 })
    })

    // Handles single-message updates that gets from the backend
    eventbus.$on('$ws.message', (message) => {
      const msg = new Message(message)

      if (msg.updatedAt == null && msg.deletedAt == null && msg.replies === 0) {
        // Count only new mesages, no updates
        store.dispatch('unread/incChannel', msg.channelID)

        eventbus.$emit('$core.newMessage', { message })
      }
      store.dispatch('history/update', [msg])

      // Assume activity stoped
      store.commit('users/inactive', { channelID: msg.channelID, userID: msg.user.ID, kind: 'typing' })
    })

    // This serves a sole purpose of handling callback to getMessage calls to $ws
    eventbus.$on('$ws.messages', messages => store.dispatch('history/update', messages.map(message => new Message(message))))

    eventbus.$on('$ws.commands', (commands) => {
      store.commit('suggestions/setCommands', commands.map(c => {
        return {
          command: c.name,
          description: c.description,
          params: [],
          meta: {},
          handler: (vm, { channel, params, input }) => {
            vm.$ws.exec(channel.ID, c.name, {}, input)
          },
        }
      }).concat(localCommands))
    })
  },
}
