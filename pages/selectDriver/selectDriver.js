
import { GPS } from '../../common/GPS';
import dataTreating from '../../common/base64';
import { loading, queryError } from '../../common/util';
import { gpsLocation, myDrivers, orderPolling, mOrderCancel, bindTicket, mSelectDriverOrderCommit, driversList } from '../../common/actions';

let app = getApp()
  , setInter
  , setTime
  , radWidth = 100;
Page({
  data: {
    driverId : '',
    user: {
      phone: ''
    },
    map: {
      mapHeight: app.globalData.windowHeight,
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
      }],
    markers: [],
    loc: { // 存GCJ-02格式
      name: "正在获取您的位置...",
      region: "北京市",
      latitude: 39.90886,
      longitude: 116.39739
    },
    pollingCount: 1,
    showCancelBtn: false
  },
  showLocationModel: false,
  orderCommit: {},
  cityId: '',
  onLoad: function (query) {
    console.log(query);
    let that = this;
    // query.q = 'http://h5.d.edaijia.cn/driver-app-pack/driver-qrcode-order/driver.html?Y3JlYXRlVGltZT0xNTU3NDcxMTcxODM4JmRyaXZlcklkPVNIODU1Njk=';
    let codeUrl = decodeURIComponent(query.q);
    let decodeData = dataTreating.base64_decode(codeUrl.split('?')[1]);
    let handled = decodeData.split('&'),
        createTime = handled[0].split('=')[1],
        driverId = handled[1].split('=')[1];
    if (createTime < (new Date).getTime() - 3e5){
      console.log('二维码已过期，请联系司机更新后再次扫码');
      wx.showModal({
        content: '二维码已过期，请联系司机更新后再次扫码',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            wx.redirectTo({ url: '../index/index' });
          }
        }
      })
      return;
    }
    that.setData({driverId: driverId})
    setInter = setInterval(function () {
      radWidth += 100;
      if (radWidth > 2000) {
        radWidth = 0
      }
      that.setData({
        'circles[0].radius': radWidth,
      })
    }, 100)
    that.init(function(){
      if (!app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
        that.gotoLogin(driverId);
      } else {
        that.getOrder(function () {
          that.getDynamic(function(){
            that.selectDriverSubmit(driverId)
          });
        });
      }
    });
  },
  onShow: function () {
    let that = this;
    if (that.showLocationModel){
      setInter = setInterval(function () {
        radWidth += 100;
        if (radWidth > 2000) {
          radWidth = 0
        }
        that.setData({
          'circles[0].radius': radWidth,
        })
      }, 100)
      that.getAuthor();
    }
  },
  getDynamic: function(callback){
    let that = this; 
    // tx => baidu
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    driversList(app.globalData.userInfo.token, coord.lat, coord.lon, function (data) {
      if (data.dynamicRate && data.dynamicRate != "0") {//动态调价
        that.setData({
          dynamic: true,
          dynamicRate: data.dynamicRate,
          feeMax: data.feeMax
        })
      }
      if(data.dynamicFee && data.dynamicFee != "0"){
        that.setData({
          dynamic: true,
          dynamicFee: data.dynamicFee,
          feeMax: data.feeMax
        })
      }
      if(data.dynamicFee == 0 || !data.dynamicRate > 1){
        that.setData({
          dynamic: false
        })
      }
      typeof callback == 'function' ? callback() : console.log('callback is not function!');
    }, function () {
      loading.hide();
    });
  },
  // 事件处理函数
  getOrder: function (callback) {
    loading.show('正在派单中。。。');
    var that = this;
    var params = {
      token: that.data.userInfo.token,
      pollingCount: 1,
      gpsType: app.globalData.gpsType
    };
    myDrivers(params, function (json) {
      if (json.code != '0' && json.status != 0) {
        queryError(json.message);
        return;
      }
      if (json.data.drivers.length > 0 && json.data.drivers[0].orders.length > 0) {
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
            wx.reLaunch({ url: '../polling/polling' });
            break;
          case '401'://派单失败
            wx.showModal({
              title: '派单失败，请重新下单',
              showCancel: false,
              complete: function () {
                that.getLocation();
              }
            });
            break;
          case '501'://司机已经到达目的地
            wx.reLaunch({ url: '../pay/pay' });
            break;
          default:
            wx.reLaunch({ url: '../order/order' });
            break;
        }
      } else {
        typeof callback == 'function' ? callback() : that.getLocation();
      }
    }, function (error) {
      
      }, 'scanCode', that.data.driverId);
  },
  selectDriverSubmit: function (driverId) {
    var that = this;
    let orderCommit = {
      method: 'get',
      type: 1,
      driver_id: driverId,
      address: that.data.loc.name,
      lat: that.data.loc.latitude,
      lng: that.data.loc.longitude,
      is_use_bonus: 1,
      source: 5,
      customer_lat: that.data.loc.longitude,
      customer_lng: that.data.loc.longitude,
      gps_type: app.globalData.gpsType,
      destination_lat: '',
      destination_lng: '',
      destination_address: '',
      city_id: that.data.cityId,
      dynamic_fee: that.data.dynamicFee ? that.data.dynamicFee : 0,
      dynamic_rate: that.data.dynamicRate ? that.data.dynamicRate : 0,
      fee_max: that.data.feeMax ? that.data.feeMax : 0,
    };
    var params = Object.assign({}, orderCommit, {
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contact_phone: app.globalData.userInfo.phone,
    });
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;

    if(that.data.dynamic){
      loading.hide();
      app.globalData.dynamicDriverId = driverId;
      wx.redirectTo({
        url: '../dynamicJudge/dynamicJudge?params=' + JSON.stringify(params) + '&type=selectDriverSubmit&fromPage=selectDriver'
      });
      return;
    }

    mSelectDriverOrderCommit(params).then(function (json) {
      loading.hide();
      if (json.code != '0' && json.status != 0) {
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
      let pollingParams = {
        token: app.globalData.userInfo.token,
        bookingId: app.globalData.bookingId,
        bookingType: app.globalData.bookingType,
        pollingStart: new Date().Format(),
        pollingCount: that.data.pollingCount
      }
      that.setData({
        allowDynamic: false
      })
      that.getPolling(pollingParams);
    });
  },
  getPolling(params) {
    var that = this;
    orderPolling(params, function (json) {
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      let data = json.data;
      that.setData({ showCancelBtn: true});
      switch (data.pollingState) {
        case '0':
          console.log("拉取订单中..."); //设置10秒拉取一次
          setTime = setTimeout(function () {
            params.pollingCount = parseInt(data.pollingCount) + 1 + ''
            that.getPolling(params);
          }, 10000);
          break;
        case '1'://拒单
          wx.redirectTo({ url: '../index/index' })
          break;
        case '2'://接单
          app.globalData.order = {
            driverId: data.driverId,
            orderId: data.orderId
          };
          wx.reLaunch({ url: '../order/order' });
          break;
      }
    }, function () {
      console.log('orderPolling fail');
    }, function () {
      that.polling();
    })
  },
  // 页面初始化
  init: function (callback) {
    let that = this;
    that.getLocation(function(){
      that.isHasUser(callback);
    })
  },
  // 判断是否有用户信息
  isHasUser: function (callback) {
    let that = this;
    if (app.globalData.user) {
      that.setData({ user: app.globalData.user });
      typeof callback == 'function' ? callback() : console.log('callback is not function!');
    } else {
      that.getUserInfo(callback);
    }
  },

  // 获取用户相关信息
  getUserInfo: function (callback) {
    let that = this;
    app.initUser(function (userInfo) {
      that.setData({ user: app.globalData.user });
      typeof callback == 'function' ? callback() : console.log('callback is not function!');
    });
  },
  // 跳转登录页面
  gotoLogin: function (driverId) {
    loading.hide();
    wx.showModal({
      title: '您未登录，请先登录',
      showCancel: false,
      complete: function () {
        wx.redirectTo({ url: '../authorizeLogin/authorizeLogin?mode=scanCode&driverId=' + driverId });
      }
    });
  },
  // 获取当前的位置
  getLocation: function (callback) {
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function (loc) {
        let coord = GPS.bd_encrypt(loc.latitude, loc.longitude);
        gpsLocation(coord.lat, coord.lon, function (json) {
          console.log(json);
          if (json.code != '0') {
            queryError(json.message);
            return;
          }
          that.data.cityId = json.location.street.component.cityId;
          that.setData({
            'loc.latitude': coord.lat,
            'loc.longitude': coord.lon,
            'loc.name': json.location.street.name,
            'loc.region': json.location.street.component.city,
            'map.longitude': coord.lon,
            'map.latitude': coord.lat,
          })
          that.setMapLoc(coord.lon, coord.lat);
          console.log(that.data.loc)
          if (callback) callback();
        });
      },
      fail: function () {
        that.getAuthor();
      }
    });
  },
  setMapLoc: function (lon, lat){
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
        callout: {
          content: '正在为您联络司机请稍后',
          display: 'ALWAYS',
          color: '#ffffff',
          fontSize: 12,
          bgColor: '#293847',
          borderRadius: 6,
          padding: 10,
          border: '#293847',
        }
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
        } else {
          that.init(function () {
            if (!app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
              that.gotoLogin(that.data.driverId);
            } else {
              that.getOrder(function () {
                that.selectDriverSubmit(that.data.driverId);
              });
            }
          });
        }
      }
    })

  },
  // 打开微信设置
  openWXSetting: function () {
    let that = this;
    wx.openSetting({
      success: function (res) {
        if (res.authSetting['scope.userLocation']) {
          app.initUser(function (userInfo) {
          });
        }
      }
    })
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
    var that = this;
    mOrderCancel({
      token: app.globalData.userInfo.token,
      bookingId: app.globalData.bookingId
    }).then(function (json) {
      loading.hide();
      if (json.message != '司机服务中，不可取消订单') {
        wx.redirectTo({ url: '../index/index' })
      } else {
        wx.showModal({
          title: json.message,
          showCancel: false,
        });
      }
    })
  },
  onHide() {
    clearTimeout(setTime);
    clearTimeout(setInter);
  },
  onUnload() {
    clearTimeout(setTime);
    clearTimeout(setInter);
  },
  onShareAppMessage: app.shareConfig()
})

