
//app.js
import configInfo from './common/config';
import { polyInit } from './common/polyfill';
import { mThirdUserinfo, mGetToken } from './common/actions';

App({

  /** 
   * 逻辑tips:
   * 1,每次新打开小程序都会获取授权信息uncionId拿最新的token
   * 2,然后把拿到的openId phone token unionId 赋值给 globalData.userInfo
   * 3，userInfo和user 数据混了，故2个都写吧
   *
  */

  onLaunch: function () { // 同步操作
    
    this.getSystemInfo();
    polyInit();
    var author = wx.getStorageSync("author");
    if (author) {
      this.globalData.author = author;
    } else {
      this.globalData.author = {
        user: false,
        location: false
      };
    }
  },
  getWeChatUserInfo() {
    let that = this;
    return new Promise((resolve, reject) => {
      if (that.globalData.userInfo) {
        resolve(this.globalData.userInfo);
      } else {
        that.getCode().then(code => {
          that.getUser(code).then(res => {
            resolve(res);
          }).catch(() => { resolve({}) });
        }).catch(() => { resolve({}) });
      }
    });
  },
  getCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          if (res.code) {
            resolve(res.code)
          } else {
            reject(res);
          }
        }
      })
    })
  },
  getUser: function (code) {
    var that = this;
    let par = {
      type: 1,
      code: code
    }
    return new Promise((resolve, reject) => {
      mGetToken({ ...par }).then(function (res) {
        if (res.code == 0) {
          that.globalData.userInfo = res.data;
          resolve(res.data);
        } else {
          that.globalData.userInfo = par;
          resolve(par);
        }
        that.globalData.userInfo.openId = that.globalData.userInfo.openId || that.globalData.userInfo.wxMiniOpenId
      }).catch(() => {
        that.globalData.userInfo = par;
        resolve(par);
      });
    });
  },
  shareConfig: function () { //分享
    return {
      title: configInfo.shareInfo.title,
      desc: configInfo.shareInfo.desc,
      path: configInfo.shareInfo.path
    }
  },
  getSystemInfo: function () {
    var _this = this;
    wx.getSystemInfo({
      //获取设备信息
      success: (res) => {
        console.log("小程序基础库版本为：" + res.SDKVersion)
        _this.globalData.systemInfo = res.platform;
        _this.globalData.windowHeight = res.windowHeight;
        _this.globalData.windowWidth = res.windowWidth;
      }
    })
  },

  globalData: {
    detailToIndex: false,
    configInfo: configInfo,
    // couponId:'',
    isClickFemale: false,
    userInfo: null,
    cityId: '',
    currentCityId: '',
    user: null,
    openId: '',
    systemInfo: 'devTools',
    windowHeight: 0,
    windowWidth: 0,
    order: {},
    isVirtual: false,
    virtualKey: '',
    virtualStatus: '',
    virtualData: {},
    showQueryError: false,
    storeStartLocation: null,// 全局存初始位置，以处理特定场景onlad进来有数据无需定位
    mapScale: 14,
    isFirstVerify: false,
    nowLoc: {
      name: '',
      region: '',
      latitude: 0,
      longitude: 0,
    },
    cityPriceAddress: {
      name: '',
      region: '',
      latitude: 0,
      longitude: 0,
    }
  }
})





