// pages/homeAd/homeAd.js
var app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      adUrl: options.adUrl+"?user="+encodeURI(JSON.stringify(app.globalData.user || app.globalData.userInfo))
    })
  },
  onShareAppMessage: app.shareConfig
})