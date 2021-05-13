import Vue from 'vue'

import './config-check'
import './console-splash'

import './plugins'
import './mixins'
import './components'
import './gesture'

import i18n from './i18n'
import store from './store'
import router from './router'

// 修复 $auth.open 会忽略目录结构直接访问网站根目录的bug
Vue.prototype.$auth.open = function () {
  router.push('/auth')
}

export default (options = {}) => {
  options = {
    el: '#app',
    name: 'messaging',
    template: '<div id="messenger" class="crust"><router-view/></div>',

    router,
    store,
    i18n: i18n(),

    // Any additional options we want to merge
    ...options,
  }

  return new Vue(options)
}
