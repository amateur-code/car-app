
import { GPS } from '../../common/GPS';
import dataTreating from '../../common/base64';
import configInfo from "../../common/config";
import { loading, encryptPhone, queryError } from '../../common/util';
import {
  mGpsLocation,
  mMyDrivers,
  mOrderPolling,
  mOrderCancel,
  mBindTicket,
  mSelectDriverOrderCommit,
  mConfigInitTxt,
  mDriversList
} from '../../common/actions';
let app = getApp()
  , setInter
  , setTime
  , radWidth = 100;
Page({
  data: {
    isNew: false,
    ticketList: [],
    pollingCount: 1,
    map: {
      mapHeight: app.globalData.windowHeight - (app.globalData.windowWidth / 750),
      btnHeight: app.globalData.windowHeight - app.globalData.windowWidth / 750 * 130,
      scale: 14,
      longitude: 0,
      latitude: 0,
    },
    circles: [
      {
        latitude: 0,
        longitude: 0,
        color: '#2677d95c',
        fillColor: '#2677d94a',
        radius: radWidth,
        strokeWidth: 1
      }
    ],
    calloutTop: (app.globalData.configInfo.systemInfo.windowHeight - (app.globalData.configInfo.systemInfo.windowWidth / 750)) / 2,
    calloutTxt: '',
    calloutTxt2: '正在为您联络司机请稍后',
    markers: [],
    showLocationModel: false,
    showCancel: false,
    title: null,
    tip: null,
    titleItem: '',
    tipItem: '',
    showPollingConfigTip: false,
    showPollingConfigTitle: false,
  },
  mapHeight: 440,
  mode: '',
  polling: function () {
    var that = this;
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.bookingId) return;
    var params = {
      token: app.globalData.userInfo.token,
      bookingId: app.globalData.bookingId,
      bookingType: app.globalData.bookingType,
      pollingStart: new Date().Format(),
      pollingCount: that.data.pollingCount
    };
    that.getMapMsg(params);//获取下单地址经纬度信息
    that.getPolling(params);//拉取订单
  },
  // 动态设置地图高度
  setMapConfig: function (d) {
    let hh = app.globalData.configInfo.systemInfo.windowHeight - (app.globalData.configInfo.systemInfo.windowWidth / 750) * d;
    this.setData({
      "map.mapHeight": hh,
      "calloutTop": hh / 2 - 58,
    });
  },
  refreshMap() {
    this.setData({
      "map.latitude": this.driverPosition.lat,
      "map.longitude": this.driverPosition.lon,
    });
  },
  getMapMsg(params) {
    var that = this;
    mMyDrivers(params).then(function (json) {
      loading.hide();
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      let data = json.data;
      if (!data.drivers || !data.drivers[0]) {
        if (!that.fail && !that.po) {
          that.po = true;
          setTime(that.polling, 500);
          return;
        }
      }
      let { lon, lat } = GPS.bd_decrypt(data.drivers[0].lat, data.drivers[0].lng);
      if (!that.createdTime) { that.createdTime = data.drivers[0].createdTime || new Date().getTime(); }
      that.getConfigInit();
      that.driverPosition = {
        lon, lat
      }
      console.log(data);
      that.setData({
        'map.longitude': lon,
        'map.latitude': lat,
        'circles[0].latitude': lat,
        'circles[0].longitude': lon,
        markers: [{
          iconPath: '../../res/blue.png',
          id: 1,
          latitude: lat,
          longitude: lon,
          width: 15,
          height: 15,
          anchor: {
            x: .5, y: .5
          },
        }],
      });
    });
  },

  getPolling(params) {
    var that = this;
    mOrderPolling(params).then(function (json) {
      if (json.code != '0') {
        queryError(json.message);
        //that.polling();
        return;
      }
      let data = json.data;
      console.log("拉取订单中..."); //设置10秒拉取一次

      switch (data.pollingState) {
        case '0':
          if (setTime) clearTimeout(setTime);
          setTime = setTimeout(function () {
            params.pollingCount = parseInt(data.pollingCount) + 1 + ''
            that.getPolling(params);
            that.refreshMap();
          }, 10000);
          break;
        case '1'://拒单
          clearInterval(that.configTimer1);
          clearInterval(that.configTimer2);
          clearInterval(that.pollingTimer);
          clearInterval(setInter);
          clearTimeout(setTime);
          that.fail = true;
          wx.showModal({
            title: '派单失败，请重新下单',
            showCancel: false,
            success: function (res) {
              wx.reLaunch({
                url: "../index/index"
              });
            }
          });
          break;
        case '2'://接单
          app.globalData.order = {
            driverId: data.driverId,
            orderId: data.orderId
          };
          wx.reLaunch({ url: '../order/order' });
          break;
      }
    }).catch(function () {
      that.polling();
    });
  },

  //取消订单弹框
  confirmCancel: function () {
    var that = this;
    wx.showModal({
      title: '确认要取消当前订单吗？',
      success: function (res) {
        if (res.confirm) {
          that.cancelOrder();
        }
      }
    })
  },

  //取消订单操作
  cancelOrder: function () {
    loading.show('取消订单中');
    mOrderCancel({
      token: app.globalData.userInfo.token,
      bookingId: app.globalData.bookingId
    }).then(function (json) {
      loading.hide();
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      if (json.message != '司机服务中，不可取消订单') {
        app.globalData.storeEndAddress = null;
        wx.reLaunch({ url: '../index/index?action=cancel' });
      } else {
        wx.showModal({
          title: json.message,
          showCancel: false,
        });
      }
    });
  },
  // 获取polling文案配置
  getConfigInit() {
    let that = this;
    this.pollingAnimate();
    mConfigInitTxt({
      cityId: this.data.cityId,
      nameAry: 'app_home_discount_order_config',
    }).then(json => {
      if (json.code != "0") {
        queryError(json.message);
        return;
      }
      that.getInitConfig(json.data.appHomeDiscountOrderConfig);
    })
  },
  // 获取polling文案配置
  getInitConfig(data) {
    let that = this, title, tip, count1 = 0, count2 = 0;
    data.title.some(item => item.channel == app.globalData.configInfo.channel.normalChanel && item.source == app.globalData.configInfo.resource.normalResource ? title = item : false);
    data.tips.some(item => item.channel == app.globalData.configInfo.channel.normalChanel && item.source == app.globalData.configInfo.resource.normalResource ? tip = item : false);
    if (title && title.content.length) {
      this.setData({
        showPollingConfigTitle: true,
        title: title,
        titleItem: title.content[0]
      });
      if (this.configTimer1) clearInterval(this.configTimer1);
      this.configTimer1 = setInterval(() => {
        if (count1++ >= title.content.length - 1) {
          if (title.recycle) {
            count1 = 0;
          } else {
            return clearInterval(this.configTimer1)
          }
        }
        this.setData({
          titleItem: title.content[count1]
        });
      }, title.interval * 1000);
    }
    if (tip && tip.content.length) {
      this.setData({
        showPollingConfigTip: true,
        tip: tip,
        tipItem: tip.content[0],
      });
      if (this.configTimer2) clearInterval(this.configTimer2);
      this.configTimer2 = setInterval(() => {
        if (count2++ >= tip.content.length - 1) {
          if (tip.recycle) {
            count2 = 0;
          } else {
            return clearInterval(this.configTimer2)
          }
        }
        this.setData({
          tipItem: tip.content[count2]
        });
      }, tip.interval * 1000);
    }
    this.setData({
      showCancel: true,
    });
    if (this.data.showPollingConfigTip || this.data.showPollingConfigTitle) {
      if (this.data.showPollingConfigTip && !this.data.showPollingConfigTitle) {
        this.mapHeight = 340;
      } else if (!this.data.showPollingConfigTip && this.data.showPollingConfigTitle) {
        this.mapHeight = 327;
      }
      this.setMapConfig(this.mapHeight);
      return;
    }
    this.mapHeight = 0;
    this.setMapConfig(this.mapHeight);
  },
  pollingAnimate() {
    let that = this;
    if (setInter) clearInterval(setInter);
    setInter = setInterval(function () {
      if (that.fail) return;
      radWidth += 50;
      if (radWidth > 1500) {
        radWidth = 0
      }
      that.setData({
        'circles[0].radius': radWidth,
      })
    }, 200);
    let time;
    if (typeof this.createdTime == 'number') {
      time = this.time;
    } else {
      time = (this.createdTime + '').replace(/-/g, '/');
    }
    let createdTime = new Date(time).getTime();
    if (createdTime != createdTime) {
      createdTime = new Date(this.createdTime * 1).getTime();
    }
    let now = new Date().getTime();
    let startTime = parseInt((now - createdTime) / 1000);
    that.pollingTimer = setInterval(function () {
      if (that.fail) return;
      startTime = startTime + 1;
      that.setData({
        calloutTxt: getMS(startTime),
      });
      return;
    }, 1000);
    function getMS(time) {
      let m = parseInt(time / 60), s = parseInt(time % 60);
      return toFixTwo(m) + ":" + toFixTwo(s);
    }
    function toFixTwo(value) {
      return ('0' + value).slice(-2);
    }
  },
  onLoad: function (query) {
    if (this.data.shopId) {
      this.setData({
        shopId: ''
      })
    }
    if (app.globalData.shopId) {
      app.globalData.shopId = ''
    }
    if (query.q) {
      this.mode = "outScanCode";
      this.driverInfo(query.q);
      return;
    }
    wx.removeStorageSync("from_driver");
    if (query.bookingId) {
      app.globalData.bookingTime = new Date(parseInt(query.orderTime + '000')).Format();
      app.globalData.bookingId = query.bookingId;
      app.globalData.bookingType = query.bookingType;
      app.globalData.bookingPhone = app.globalData.userInfo.phone;
    }
    if (query.isNew == 'true') {
      this.newBindTicket();
    }
  },
  //初始化，要拉取订单
  onShow: function () {
    let that = this;
    if (that.mode == 'outScanCode') {
      if (that.showLocationModel) {
        that.getAuthor();
      } else {
        console.log('xuansiji')
        this.selectDriver();
      }
      return;
    }
    this.polling();
    this.setData({
      bookingPhoneStr: encryptPhone(app.globalData.bookingPhone)
    });
    that.getAuthor();
  },
  driverInfo(q) {
    let codeUrl = decodeURIComponent(q);
    let decodeData = dataTreating.base64_decode(codeUrl.split('?')[1]);
    let handled = decodeData.split('&'),
      createTime = handled[0].split('=')[1],
      driverId = handled[1].split('=')[1];
    this.driverId = driverId;
    this.createTime = createTime;
  },
  selectDriver: function () {
    loading.show();
    let createTime = this.createTime,
      driverId = this.driverId;
    if (createTime < (new Date).getTime() - 3e5) {
      loading.hide();
      console.log('二维码已过期，请联系司机更新后再次扫码');
      wx.showModal({
        content: '二维码已过期，请联系司机更新后再次扫码',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            wx.reLaunch({ url: '../index/index' });
          }
        }
      });
      return;
    }
    this.driverId = driverId;
    console.log('init')
    this.init();
  },
  getDynamic: function () {
    let that = this;
    // tx => baidu
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    return new Promise((resolve, reject) => {
      mDriversList({
        token: app.globalData.userInfo.token,
        latitude: coord.lat,
        longitude: coord.lon
      }).then(data => {
        that.dynamic_msg_return = true;
        let dynamicInfo = {
          dynamicFee: data.dynamicFee * 1,
          dynamicRate: data.dynamicRate * 1,
          feeMax: data.feeMax
        }
        that.judgeDynamic(dynamicInfo);
        resolve();
      }).catch(err => {
        loading.hide();
        reject();
      });
    });
  },
  judgeDynamic(data) {
    if (data.dynamicRate && data.dynamicRate * 1 != 0) {
      //动态调价
      this.setData({
        showDynamic: true
      });
    } else if (data.dynamicFee && data.dynamicFee * 1 != 0) {
      this.setData({
        showDynamic: true
      });
    } else if (data.dynamicFee * 1 == 0 || !data.dynamicRate > 1) {
      this.setData({
        showDynamic: false
      });
    }
    this.setData({
      dynamicInfo: data,
    });
  },
  init: function () {
    let that = this;
    that.getLocation().then(function () {
      that.getUserInfo().then(userInfo => {
        if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
          that.gotoLogin(that.driverId);
        } else {
          if(app.globalData.userInfo && app.globalData.userInfo.openId){
            configInfo.udid = app.globalData.userInfo.openId;
          }
          that.getOrder().then(function () {
            that.getDynamic().then(() => {
              console.log('selectDriverSubmit')
              that.selectDriverSubmit(that.driverId);
            });
          }).catch(code => {
            console.log(code, 'polinhgcode')
            if (code == '101') {
              that.polling();
            }
          });
        }
      });
    }).catch(() => { });
  },
  // 跳转登录页面
  gotoLogin: function (driverId) {
    loading.hide();
    wx.redirectTo({ url: '../login/login?mode=scanCode&driverId=' + driverId });
  },
  getUserInfo: function () {
    return new Promise(resolve => {
      app.getWeChatUserInfo().then(userInfo => {
        resolve(userInfo);
      });
    })
  },
  getOrder: function () {
    loading.show('呼叫司机中');
    var that = this;
    var params = {
      token: app.globalData.userInfo.token,
      pollingCount: 1,
      gpsType: app.globalData.configInfo.gpsType
    };
    return new Promise((resolve, reject) => {
      mMyDrivers(params).then(function (json) {
        if (json.code != '0' && json.status != 0) {
          if (json.message === "Token验证失败" || json.message === '验证失败') {
            wx.showModal({
              content: "您的账号信息已失效，请重新登录",
              success: function (json) {
                wx.navigateTo({url: "../login/login?mode=scanCode&driverId=" + that.driverId});
              }
            });
            return;
          }
          queryError(json.message);
          return reject();
        }
        if (json.data.drivers && json.data.drivers.length > 0 && json.data.drivers[0].orders.length > 0) {
          //101:派单中 301:已接单 302:已就位 303:已开车 401:派单失败 403:用户取消 404:司机消单501:司机报单
          var info = json.data.drivers[0];
          app.globalData.bookingAddress = info.address;
          app.globalData.bookingPhone = info.contactPhone;
          app.globalData.bookingTime = info.bookingTime;
          app.globalData.bookingId = info.bookingId;
          app.globalData.bookingType = info.bookingType;
          app.globalData.order = info.orders[0];
          loading.hide();
          switch (info.orders[0].orderStateCode) {
            case '101'://派单中
              reject('101');
              break;
            case '401'://派单失败
              clearInterval(that.configTimer1);
              clearInterval(that.configTimer2);
              clearInterval(that.pollingTimer);
              clearTimeout(setTime);
              that.fail = true;
              wx.showModal({
                title: '派单失败，请重新下单',
                showCancel: false,
                complete: function () {
                  wx.reLaunch({ url: '../index/index' });
                }
              });
              reject();
              break;
            case '501'://司机已经到达目的地
              wx.reLaunch({ url: '../pay/pay' });
              reject();
              break;
            default:
              wx.reLaunch({ url: '../order/order' });
              reject();
              break;
          }
        } else {
          resolve();
        }
      });
    });
  },
  selectDriverSubmit: function (driverId) {
    var that = this;
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    that.data.showDynamic = false;
    let orderCommit = {
      type: 1,
      driver_id: driverId,
      address: that.data.loc.name,
      lat: coord.lat,
      lng: coord.lon,
      is_use_bonus: 1,
      donot_use_bonus: 0,
      source: app.globalData.configInfo.resource.normalResource,
      customer_lat: that.data.loc.latitude,
      customer_lng: that.data.loc.longitude,
      gps_type: app.globalData.configInfo.gpsType,
      destination_lat: '',
      destination_lng: '',
      destination_address: '',
      city_id: that.data.cityId,
      dynamic_fee: that.data.showDynamic ? that.data.dynamicInfo.dynamicFee : 0,
      dynamic_rate:  that.data.showDynamic ? that.data.dynamicInfo.dynamicRate : 0,
      fee_max: that.data.showDynamic ? that.data.dynamicInfo.dynamicFee : 0
    };
    var params = Object.assign({}, orderCommit, {
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contact_phone: app.globalData.userInfo.phone,
    });
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;

    // if (that.data.showDynamic) {//showDynamic
    //   loading.hide();
    //   app.globalData.dynamicDriverId = driverId;
    //   wx.redirectTo({
    //     url: '../dynamicJudge/dynamicJudge?params=' + JSON.stringify(params) + '&type=selectDriverSubmit&fromPage=selectDriver'
    //   });
    //   return;
    // }

    mSelectDriverOrderCommit(params).then(function (json) {
      that.createdTime = new Date().getTime();
      if (json.code != '0' && json.status != 0) {
        loading.hide();
        wx.showModal({
          content: json.message || '网络错误请重试',
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              wx.redirectTo({ url: '../index/index' });
            }
          }
        });
        return;
      }
      app.globalData.bookingTime = new Date(parseInt(json.data.orderTime + '000')).Format();
      app.globalData.bookingId = json.data.bookingId;
      app.globalData.bookingType = json.data.bookingType;
      that.polling();
    });
  },
  getLocation: function (callback) {
    var that = this;
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: function (loc) {
          let coord = GPS.bd_encrypt(loc.latitude, loc.longitude);
          mGpsLocation({
            latitude: coord.lat,
            longitude: coord.lon
          }).then(function (json) {
            if (json.code != '0') {
              queryError(json.message);
              return reject();
            }
            that.data.cityId = json.location.street.component.cityId;
            app.globalData.cityId = json.location.street.component.cityId;
            that.setData({
              'loc.latitude': coord.lat,
              'loc.longitude': coord.lon,
              'loc.name': json.location.street.name,
              'loc.region': json.location.street.component.city,
              'map.longitude': coord.lon,
              'map.latitude': coord.lat,
            })
            that.setMapLoc(coord.lon, coord.lat);
            resolve();
          }).catch(() => { });
        },
        fail: function () {
          that.getAuthor();
          reject();
        }
      });
    });
  },
  setMapLoc: function (lon, lat) {
    let that = this;
    that.setData({
      'map.longitude': lon,
      'map.latitude': lat,
      'circles[0].latitude': lat,
      'circles[0].longitude': lon,
      markers: [{
        iconPath: '../../res/blue.png',
        id: 1,
        latitude: lat,
        longitude: lon,
        width: 15,
        height: 15,
        anchor: {
          x: .5, y: .5
        },
      }],

    });
  },
  getAuthor: function () {
    let that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          that.showLocationModel = true;
          wx.showModal({
            title: '温馨提醒',
            content: '需要获取您的地理位置才能使用小程序',
            showCancel: false,
            confirmText: '开启定位',
            success: function (res) {
              if (res.confirm) {
                that.openWXSetting();
              }
            }
          })
        }
      }
    })
  },
  openWXSetting: function () {
    let that = this;
    wx.openSetting({
      success: function (res) {
        if (res.authSetting['scope.userLocation']) {
          that.init();
        }
      }
    });
  },
  // 新人绑定优惠券
  newBindTicket: function () {
    let that = this;
    let params = {
      englishName: 'xiaochengxu2',
      couponType: 1,
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone
    }
    mBindTicket(params).then(function (json) {
      if (json.code == 2) { } else if (json.code == 0) {
        that.setData({
          'ticketList': json.data.suc,
          isNew: true
        })
      } else if (json.code == 4) {
        that.setData({
          'ticketList': json.data.bindResult.suc,
          isNew: true
        })
      }
    });
  },
  closeAC: function () {
    this.setData({
      isNew: false
    })
  },

  onHide() {
    clearInterval(this.configTimer1);
    clearInterval(this.configTimer2);
    clearInterval(this.pollingTimer);
    clearTimeout(setTime);
  },
  onUnload() {
    this.mode = '';
    clearInterval(this.configTimer1);
    clearInterval(this.configTimer2);
    clearInterval(this.pollingTimer);
    clearInterval(setInter);
    clearTimeout(setTime);
  },
  onShareAppMessage: app.shareConfig
})

