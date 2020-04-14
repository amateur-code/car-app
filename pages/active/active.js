import config from '../../common/config';
var app = getApp()

Page({
  data: {
    url: ''
  },
  onLoad: function (options) {
    this.setData({
      url: config.h5Url + 'activities/xiaochengxu2?openId=' + options.openId + '&phone=' + options.phone
    })
  },
  onShareAppMessage: app.shareConfig
})