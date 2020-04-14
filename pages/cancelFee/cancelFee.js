import config from '../../common/config';
var app = getApp()

Page({
  data: {
    url: ''
  },
  onLoad: function (options) {// 带中文需要encodeURI编码
    // 因为没办法区分e代叫订单的appkey，统一用微信小程序的，支付宝小程序和百度小程序类似
    /*
     * orderId 订单id
     * token  用户token
     * from  渠道
     * udid  用户标志
     */
    this.setData({
      url: config.h5Url + 'responsibility-cancel-order/index.html?orderId=' + app.globalData.order.orderId + '&token=' + app.globalData.userInfo.token + '&from=' + config.from + '&udid=' + app.globalData.userInfo.openId + '&bookingId=' + app.globalData.bookingId + '&city=' + encodeURI(app.globalData.cityPriceAddress.region) + '#wechat_redirect'
    })
  },
  onShareAppMessage: app.shareConfig
})