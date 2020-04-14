//logs.js
var util = require('../../common/util.js')
Page({
  data: {
    logs: []
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(function (log) {
        return new Date(log).Format()
      })
    })
  }
})
