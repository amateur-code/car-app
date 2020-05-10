import { loading, encryptPhone, queryError, autoAdpatStyle} from '../../common/util';
let app = getApp();

Page({
  data: {
    user: {},
    city: '北京',
    servicePhone: '4008-10-3939',
    skin:''
  },
  initData: function(){
    // console.log(app.globalData.cityPriceAddress)
    this.setData({
      'city': app.globalData.storeStartAddress.region,
      'user.avatarUrl': app.globalData.userInfo.avatarUrl || '../../res/avatarUrl.png',
      'user.phone': encryptPhone(app.globalData.userInfo.phone)
    })
  },
  makeACall: function(){
    wx.makePhoneCall({
      phoneNumber: this.data.servicePhone
    })
  },
  bindGetUserInfo:  function(e){
    // console.log(e.detail.userInfo);
    this.setData({
      'user.avatarUrl': e.detail.userInfo.avatarUrl || '../../res/avatarUrl.png',
    });
    this.setUserInfo(e.detail.userInfo);
  },
  onLoad: function (options) {
    autoAdpatStyle(this)
    this.initData();
  },
  setUserInfo(userInfo){
    this.setData({
      'user.avatarUrl': userInfo.avatarUrl || '../../res/avatarUrl.png',
    });
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      avatarUrl: userInfo.avatarUrl
    };
    wx.setStorage({ key: 'user', data: app.globalData.userInfo });
  },
  onShow: function () {
    let that = this;
    wx.getUserInfo({
      success: function(res) {
        console.log('wx.getUserInfo');
        that.setUserInfo(res.userInfo);
      }
    });
  },
  onShareAppMessage: app.shareConfig
})