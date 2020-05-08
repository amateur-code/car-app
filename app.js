
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
    const res =  wx.getSystemInfoSync()
    console.log("小程序基础库版本为：" + res.SDKVersion)
    this.globalData.systemInfo = res.platform;
    this.globalData.windowHeight = res.windowHeight;
    this.globalData.windowWidth = res.windowWidth;
    this.globalData.isCar = res.device == 'wecar'
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
    isCar: false,
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
    },

    
    // test
    // userInfo:{
    //   "openId":"ohRHq0LdkB5JCd3E5TeGClny2Y84",
    //   "unionId":"oPlwpuJwRevYMwlnwhEgBWXMAeck",
    //   "phone":"17701035267",
    //   "token":"f650025059594b97bd933abbb94a0a29",
    //   "name":"",
    //   "gender":"1",
    //   "avatarUrl":"https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83eqzh2c5OGpQSCWURl6Pjc6QTAEQqHnprvzs9XrlxFvVJoRjwxKUWHGTicKmGdQ4F1Bk36PLla24dzA/132"
    // },
    // storeEndAddress: {
    //   latitude: 39.86511540630113,
    //   longitude: 116.37902388245611,
    //   name: "北京南站",
    //   region: "北京市",
    // },
    // storeStartAddress: {
    //   latitude: 39.9219,
    //   longitude: 116.44355,
    //   name: "北京市朝阳区人民政府",
    //   region: "北京市",
    // }

  }
})





