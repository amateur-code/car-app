import config from '../../common/config';
import dataTreating from '../../common/base64.js'
var app = getApp();

Page({
  data: {
    url: ''
  },
  onLoad: function (options) {// 带中文需要encodeURI编码
    if (options.path == 'user-app-pack/coupon/cancel-rules.html'){
      this.setData({
        url: config.h5Url + options.path + '?city=' + encodeURI(app.globalData.cityPriceAddress.region) + '&token=' + app.globalData.userInfo.token
      })
    } else if (options.path == 'user-app-client/surprised-gift/index.html'){
      let data = JSON.parse(options.ecrmRedpacket)
      this.setData({
        url: data.drawAwardUrl + '?ecrmRedpacket=' + options.ecrmRedpacket
      })
    } else if (options.path === 'driverbook/protocol.html') {
			this.setData({
				url: config.h5Url + options.path
			})
    }
  },
  onShareAppMessage: app.shareConfig
})