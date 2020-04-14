import config from '../../common/config';
var app = getApp();
Page({

  data: {
    url: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.setData({
      url: config.h5Url + 'driverbook/protocol.html'
    })
  },
  onShareAppMessage: app.shareConfig
})