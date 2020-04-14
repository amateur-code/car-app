// pages/dynamicJudge/dynamicJudge.js
import config from '../../common/config';
var app = getApp()
Page({
  data: {
    
  },

  onLoad: function (options) {
    let params = {};
    let urlParams = Object.assign(JSON.parse(options.params), {
      appkey: config.appkey,
      from: config.from,
      udid: app.globalData.userInfo.openId,
      app_ver: config.appVer,
      from_type: config.fromType,
      ver: config.ver,
    });
    params.MD5KEY = config.md5key;
    params.urlParams = urlParams;
    params.platform = 'miniapp';
    params.type = options.type;
    if(options.fromPage){
      params.fromPage = options.fromPage;
    }
    this.setData({
      url: config.h5Url + "dynamic/index.html?params=" + encodeURI(JSON.stringify(params)) + '#wechat_redirect'
    });
    console.log(this.data.url);
  },
  onShareAppMessage: app.shareConfig
})