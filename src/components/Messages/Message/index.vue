<template>
  <li
    :id="message.messageID"
    ref="message"
    :key="message.messageID"
    class="message-n-meta"
    :class="{
      'attachment' : message.attachment,
      'valid' : message.attachment && message.attachment.size > 0,
      'with-replies' : message.replies,
      'edited' : message.updatedAt,
      'pinned' : highlightPinned && message.isPinned,
      'bookmarked' : highlightBookmarked && message.isBookmarked,
      'highlighted': highlightMessage,
      'last-read': isLastRead && !isLast,
      'unread': isUnread,
      'type-channel-event': message.type === 'channelEvent',
      'last' : isLast && !isFirst,
      'my-msg-item' : message.userID === currentUser.userID,
    }"
    @click.alt.exact.prevent="$emit('markAsUnread', { message })"
    @click.meta.exact.prevent="onOpenThread"
  >
    <div
      v-if="isLastRead && !isLast"
      class="label"
      @click="$emit('markAsUnread', { message })"
    >
      {{ $t('message.newMessages') }}
    </div>

    <em
      v-if="message.userID !== currentUser.userID && message.type !== 'channelEvent'"
      class="avatar"
    >
      <router-link :to="{ name: 'profile', params: { userID: message.userID } }">
        <avatar
          :user-i-d="message.userID"
          :user="message.user"
        />
      </router-link>
    </em>

    <div>
      <div
        :class="{ from_me: message.userID === currentUser.userID,
                  'message' : !isEditing,
        }"
      >
        <attachment
          v-if="message.attachment"
          class="message-content"
          :attachment="message.attachment"
        />

        <contents
          v-if="!isEditing"
          :id="message.messageID"
          class="message-content"
          :content="message.message"
          v-on="$listeners"
        />
      </div>
      <div class="day-time">
        {{ momentDayMonth(message.createdAt) }} {{ momentHourMinute(message.createdAt) }}
      </div>
    </div>

    <em
      v-if="message.userID === currentUser.userID && message.type !== 'channelEvent'"
      class="avatar avatar-my"
    >
      <router-link :to="{ name: 'profile', params: { userID: message.userID } }">
        <avatar
          :user-i-d="message.userID"
          :user="message.user"
        />
      </router-link>
    </em>

    <footnote
      :message="message"
      :hide-replies="hideReplies"
      v-on="$listeners"
    />
  </li>
</template>
<script>
import * as moment from 'moment'
import Attachment from './Attachment'
import Contents from './Contents'
// import Reactions from './Reactions'
// import EmbeddedBox from './EmbeddedBox'
// import Footnote from './Footnote'
// import Actions from './Actions'
import Avatar from 'corteza-webapp-messaging/src/components/Avatar'
// import InlineEdit from './InlineEdit'

export default {
  components: {
    Attachment,
    Contents,
    Avatar,
    // Reactions,
    // InlineEdit,
    // EmbeddedBox,
    // Footnote,
    // Actions,
  },

  props: {
    message: {
      type: Object,
      required: true,
    },
    channel: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    edit: {
      type: String,
      required: false,
      default: undefined,
    },
    consecutive: {
      type: Boolean,
      required: false,
    },
    currentUser: {
      type: Object,
      required: true,
    },
    suggestionPriorities: {
      type: Object,
      default: () => ({}),
    },
    submitOnEnter: {
      type: Boolean,
      required: false,
      default: false,
    },

    readOnly: Boolean,

    hideActions: Boolean,
    hideMarkAsUnread: Boolean,
    hideActionOpenThread: Boolean,
    hideActionsMenu: Boolean,
    hidePinning: Boolean,
    hideBookmarking: Boolean,
    hideActionGoToMessage: { type: Boolean, default: false },
    hideReactions: Boolean,
    hideReplies: Boolean,

    isUnread: Boolean,
    isLastRead: Boolean,
    isFirst: Boolean,
    isLast: Boolean,

    showEditor: Boolean,

    // Controling bookmarked and pinned messages highlighting
    highlightBookmarked: { type: Boolean, default: true },
    highlightPinned: { type: Boolean, default: true },
    highlightMessage: { type: Boolean, default: false },
  },

  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: false,
      showEditorInternal: false,
    }
  },

  computed: {
    embeded () {
      if (this.message) {
        const regExp = /^http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-_]*)(&(amp;)?[\w?=]*)?$/gi
        const match = regExp.exec(this.message.message)
        if (match && match[1] && match[1].length === 11) {
          return { src: `https://www.youtube.com/embed/${match[1]}?autoplay=0&enablejsapi=0` }
        }
        return false
      }
      return undefined
    },

    /**
     * Determines user's label
     * @returns {String}
     */
    getUserLabel () {
      return this.message.user.label
    },

    /**
     * Helper to determine if given message should be in editing
     * @returns {Boolean}
     */
    isEditing () {
      return this.message.messageID === this.edit
    },
  },

  methods: {
    onInputSubmit ({ value }) {
      this.showEditor = false
    },

    moment: function (timeString) {
      return moment(timeString)
    },

    momentDayMonth: function (timeString) {
      return moment(timeString).format('DD/MM')
    },

    momentHourMinute: function (timeString) {
      return moment(timeString).format('HH:mm')
    },

    isToday: function (timeString) {
      return (moment().startOf('day').unix() === moment(timeString).startOf('day').unix())
    },

    // Wrapper that append message info to event
    onReaction ({ reaction }) {
      this.$emit('messageReaction', { message: this.message, reaction })
    },

    onOpenThread () {
      if (this.message.canReply && !this.hideActionOpenThread) {
        this.$emit('openThreadPanel', { message: this.message })
      }
    },
  },
}

</script>

<style scoped lang="scss">
@import 'corteza-webapp-messaging/src/themes/corteza-base/menu-layer.scss';

em{
  font-style: normal;
}

.last-read {
  border-bottom: 1px solid $danger;

  .label {
    background: white;
    color: $danger;
    display: inline;
    position: absolute;
    right: 16px;
    bottom: -11px;
    line-height: 20px;
    padding: 0 10px;
    z-index: 1;
    border: 1px solid $danger;
    cursor: pointer;
  }
}

.message-n-meta {
  display:flex;
  margin-bottom: 10px;
  position: relative;

  &.edited {
    &.last-read {
      &::after {
        margin-top: 5px;
      }
    }
  }

  &:hover,
  &:focus{
    background-color: rgba($secondary, 0.1);
    .date {
      display: inline-block;
    }
    .actions {
      //display: block;
    }
    .reactions.no-reactions {
      display: block;
      right: 0px;
    }
  }

  &.type-channel-event{
    display:none;
    padding: 1px 1px 1px 66px;
    margin-bottom: 0px;
    font-style: italic;
    &:hover{
      background: none;
    }
    .message{
      background: none;
      &:before{
        background: none;
      }
      .message-content {
        font-size: 12px;
      }
    }
    &.last-read {
      font-style: normal;
    }
  }

  &.bookmarked {
    .message{
      border-right: 3px solid $success;
    }
  }

  &.pinned {
    .message{
      border-right: 3px solid $warning;
    }
    &.bookmarked{
      .message{
        &:after{
          content:" ";
          background: linear-gradient(to bottom, rgba(113,148,48,1) 0%, rgba(113,148,48,1) 50%, rgba(245,211,128,1) 50%, rgba(245,211,128,1) 100%);
          display: block;
          height: 100%;
          width: 3px;
          position: absolute;
          bottom: 0;
          right: -3px;
        }
      }
    }
  }

  &.highlighted {
    background-color: rgba($warning, 0.3);
  }

  &.unread {
    .message{
      /*border-right: 4px solid $appred;*/
    }
  }

  &.consecutive {
    margin-top: -10px;
    &:hover,
    &:focus{
      .date {
        display: none;
      }
    }
    &.type-channel-event{
      margin-top: 0;
    }

    &.attachment {
      margin-bottom: 10px;
      // because attachments are bigger than 65px;
    }
    .message {
      &:before {
        display: none;
      }
    }

  }

  .reactions {
    &.no-reactions{
      position: absolute;
      display: none;
      margin-top: -5px;
      margin-left: -10px;
      z-index: 2;
      float: right;
    }
  }

  &.my-msg-item{
    justify-content: flex-end;
    text-align:right;

    .message{
      border-radius: 8px 0  8px 8px;
    }
  }
}

.author{
  min-height: 16px;
  a {
    text-decoration: none;
    color: $secondary;
  }
}

.day-time {
  margin-top: 6px;
  color: $secondary;
}

.avatar {
  a {
    text-decoration: none;
  }

  margin-right:10px;

  &.avatar-my{
    margin-left:10px;
  }
}

.author,
.date {
  display: inline-block;
  padding: 2px 0.5em 2px 0;
}

.actions {
  display: none;
}

.message {
  position: relative;
  background-color: $white;
  word-wrap: break-word;
  padding: 10px;
  display: table;
  min-width: 180px;

  border-radius: 0 8px 8px 8px;

  &:before {
    display: none !important;
    content: " ";
    background-color: $white;
    position: absolute;
    left: -5px;
    top: 8px;
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
  }

  &.from_me {
    background-color: $currentmymessagebgcolor;

    span,
    &:before  {
      background-color: $currentmymessagebgcolor;
    }
  }

  .message-content {
    font-size: 14px;
    word-break: break-word;
    /deep/table {
      border-collapse: collapse;
      td, th {
        padding: 5px 15px;
      }
      tr {
        border-top: 1px solid black;
      }
      thead {
        font-family: 'nunito_sansbold';
        tr {
          border-top: none;
        }
      }
    }
    /deep/hr {
      border: 1px solid black;
    }
    /deep/strong {
      font-family: 'nunito_sansbold';
    }
  }
}
</style>
