import config from '../../common/config';
var app = getApp()

Page({
  data: {
    url: ''
  },
  onLoad: function (options) {// 带中文需要encodeURI编码
    let token = app.globalData.userInfo.token,
      tokenLink = token ? token : '';
    this.setData({
      //url: config.h5Url + 'app/price.html?city=' + encodeURI(options.city)
      url: config.h5Url + 'app/price.html?city=' + encodeURI(options.city) + "&token=" + tokenLink
    })
  },
  onShareAppMessage: app.shareConfig
})
