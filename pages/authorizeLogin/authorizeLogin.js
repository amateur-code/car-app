var app = getApp();
import { loading } from "../../common/util";
import {
  mThirdBind,
  mThirdUserinfo,
  mGetToken
} from "../../common/actions";
Page({
  data: {},
  code: '',
  retry: false,
  detail: {},
  onLoad(query) {
    let that = this;
    this.mode = query.mode || '';
    this.driverId = query.driverId || '';
    wx.login({
      success(res){
        if(res.code) that.code = res.code;
      }
    });
    setInterval(() => {
       wx.login({
        success(res){
          if(res.code) that.code = res.code;
        }
      });
    }, 1000 * 60 * 5);
  },
  goProtocol(){
    wx.navigateTo({
      url: '../protocol/protocol'
    });
  },
  onGetAuthorize(e) {
    let that = this;
    if (e.detail.errMsg == "getPhoneNumber:ok") {  //同意授权
      this.detail = e.detail;
      loading.show('正在登录');
      this.login();
    }
  },
  login(){
    let that = this;
    that.getWeChatUserInfo(that.detail, that.code);
  },
  getWeChatUserInfo(data, code) {
    let params = {
      type: 1,
      code: code,
      encryptedData: data.encryptedData,
      signature: data.signature || '',
      iv: data.iv,
      currentCityId: app.globalData.cityId
    }
    mThirdUserinfo(params).then(res => {
      loading.hide();
      if(res.code != 0){
        wx.showModal({
          title: '登录失败，请重试',
          showCancel: false,
          success: () => {},
        });
        return;
      }
      wx.showToast({
        title: '登录成功',
        icon: 'success',
      });
      app.globalData.userInfo = res.data;
      app.globalData.userInfo.openId = res.data.wxMiniOpenId;
      if (res.data.phone && res.data.wxMiniOpenId) {
        this.bindUser(res.data);
      }
      this.goBack();
    });
  },
  bindUser(userInfo) {
    mThirdBind({
      type: 1,
      phone: userInfo.phone,
      openId: userInfo.wxMiniOpenId,
      unionId: userInfo.wxUnionId,
    }).then(() => {});
  },
  goBack(){
    wx.reLaunch({ 
      url: this.mode ? '../index/index?&mode=' + this.mode + '&driverId=' + this.driverId : '../index/index'
    });
  },
  goLogin() {
    wx.navigateTo({
      url: this.mode ? "../login/login?mode=" + this.mode + '&driverId=' + this.driverId : '../login/login',
    });
  },
  onShareAppMessage: app.shareConfig
});
