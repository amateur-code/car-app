var app = getApp();
import { GPS } from "../../common/GPS";
import { loading, queryError, eStorage } from "../../common/util";
import {
  mCostEstimate,
  mMyDrivers,
  mDriversList,
  mNoworderCommit,
  mOpenOrderCommit,
  mFeedback,
  mPostFormId
} from '../../common/actions';
Page({
  data: {
    map: {
      height: '100%',
      includePoints: [],
      markers: [],
    },
    dynamicFee: 0,
    dynamicRate: 0,
    isClickFemale: true,
    feeMax: 0,
    dynamic: false,
    timer: null,
  },
  calloutText: ' 正在获取您的位置... ',
  source: 5,
  includePadding: [100, 100, 100, 100],
  isCommitOrder: false,
  addressHeight1: 330,// 正常高度
  addressHeight2: 370,// 有预估价的高度
  onLoad() {
    this.setMapConfig(this.addressHeight1);
    this.mapCtx = wx.createMapContext("confirmMap");
    this.setData({
      loc: app.globalData.storeStartAddress,
      endLoc: app.globalData.storeEndAddress,
      isClickFemale: app.globalData.isClickFemale
    });
    if (app.globalData.shopId) {
      this.loc = app.globalData.shopLoc.shopLoc
    }
    this.source = app.globalData.isClickFemale ? app.globalData.configInfo.resource.normalResourceFemale : app.globalData.configInfo.resource.normalResource
    this.initMap();
  },
  onShow() {
    this.isCommitOrder = false;
    this.getDriverList().then(() => {});
    this.getCostEstimate();
    this.setMapConfig(this.addressHeight1);

    this.timer = setInterval(() => {
      this.getDriverList();
      this.getCostEstimate();
    }, 5 * 60 * 1000);

  },

  onHide: function () {
    this.timer && clearInterval(this.timer);
  },
  onUnload: function () {
    this.timer && clearInterval(this.timer);
  },

  // 设置地图高度
  setMapConfig(d) {
    let that = this,
      hh = app.globalData.configInfo.systemInfo.windowHeight - (app.globalData.configInfo.systemInfo.windowWidth / 750) * d;
    that.setData({
      "map.height": hh,
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
  getDynamic: function() {
    let that = this;
    // tx => baidu
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    return new Promise((resolve, reject) => {
      mDriversList({
        token: app.globalData.userInfo.token,
        latitude: coord.lat,
        longitude: coord.lon
      })
        .then(data => {
          that.dynamic_msg_return = true;
          let dynamicInfo = {
            dynamicFee: data.dynamicFee,
            dynamicRate: data.dynamicRate,
            feeMax: data.feeMax
          };
          that.setData({
            dynamicInfo
          });
          resolve();
        })
        .catch(err => {
          loading.hide();
          reject();
        });
    });
  },
  // 确认下单
  commitOrder(e) {
    console.log(e)
    let that = this;
    if (this.isCommitOrder) return;
    this.isCommitOrder = true;
    loading.show("呼叫司机中");
    this.getOrder().then(() => {
      this.getDriverList().then(() => {
        if (app.globalData.shopInfo && app.globalData.shopInfo.shopType == 1 && app.globalData.shopInfo.shopId) {
          that.getDynamic().then(() => {
            that.daijiaoSubmit();
            that.sendFormId(e.detail.formId);
          });
        } else {
          that.getDynamic().then(() => {
            that.doSubmit();
            that.sendFormId(e.detail.formId);
          });
        }
      })
    })
  },
  sendFormId: function (formId) {
      let msg = {
        apiMethod:'v1/api/weixin/collectFormId',
        phone: app.globalData.userInfo.phone,
        formId: formId,
        userId: app.globalData.userInfo.openId,
        messageType: 'form',
      };
      mPostFormId(msg).then(function (res) {
        // console.log(res)
      })
  },

  // 提交订单逻辑
  doSubmit() {
    let that = this;
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude),
      coordEnd = GPS.bd_encrypt(that.data.endLoc.latitude, that.data.endLoc.longitude);

    let endLoc = that.data.endLoc.name ? that.data.endLoc.name == '请输入目的地' ? '' : that.data.endLoc.name : '';
    let orderCommit = {
      number: 1,
      edited: false,
      is_use_bonus: 1,
      address: that.data.loc.name,
      lat: coord.lat,
      lng: coord.lon,
      donot_use_bonus: 0,
      gps_type: app.globalData.configInfo.gpsType,
      source: that.source,
      customer_lat: app.globalData.nowLoc.latitude,
      customer_lng: app.globalData.nowLoc.longitude,
      city_id: app.globalData.cityId,
      destination_lat: coordEnd.lat || "",
      destination_lng: coordEnd.lon || "",
      destination_address: endLoc,
      estimate_id: that.data.costestimateData.seq,
    };
    var from_driver_info = eStorage.get('from_driver');
    if (from_driver_info && from_driver_info.from_driver.length > 0) {
      orderCommit.from_driver = from_driver_info.from_driver;
    }
    if (that.data.dynamic) {
      orderCommit.dynamic_fee = that.data.dynamicFee ? that.data.dynamicFee : 0;
      orderCommit.dynamic_rate = that.data.dynamicRate ? that.data.dynamicRate : 0;
      orderCommit.fee_max = that.data.feeMax ? that.data.feeMax : 0;
    }
    var params = Object.assign({}, orderCommit, {
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contact_phone: app.globalData.userInfo.phone
    });
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;

    if (that.data.dynamic && !that.data.isClickFemale) {
      loading.hide();
      params.method = 'POST'
      wx.navigateTo({
        url: "../dynamicJudge/dynamicJudge?params=" + JSON.stringify(params) + "&type=doSubmit"
      });
      return;
    }
    mNoworderCommit(params).then(json => {
      if (json.code != "0" && json.status != 0) {
        loading.hide();
        queryError(json.message);
        return;
      }
      app.globalData.bookingTime = new Date(
        parseInt(json.data.orderTime + "000")
      ).Format();
      app.globalData.bookingId = json.data.bookingId;
      app.globalData.bookingType = json.data.bookingType;
      that.timer && clearInterval(that.timer);
      wx.reLaunch({
        url: "../polling/polling"
      });
      loading.hide();
    })
  },
  // 代叫第四种开单方式下单
  daijiaoSubmit: function () {
    // mOpenOrderCommit
    let that = this, typeChnnel = '01012';
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    let daijiaoCommitParams = {
      type: typeChnnel,
      number: 1,
      address: that.data.loc.name,
      longitude: coord.lon,
      latitude: coord.lat,
      sendSms: true,
      source: that.source,
      isUseBonus: 1,
      donot_use_bonus: 0,
      gps_type: app.globalData.configInfo.gpsType,
      proxyShopId: app.globalData.shopInfo.shopId,
      estimate_id: that.data.costestimateData.seq,
      proxy_order_type: 4,
      driverPay: app.globalData.shopInfo.driverPay,
      strategy_type: app.globalData.shopInfo.strategy_type,
      customerPay: app.globalData.shopInfo.customerPay,
      dynamicFee: that.data.isClickFemale ? 0 : that.data.dynamicInfo.dynamicFee ? that.data.dynamicInfo.dynamicFee : 0,
      dynamicRate: that.data.isClickFemale ? 0 : that.data.dynamicInfo.dynamicRate ? that.data.dynamicInfo.dynamicRate : 0,
      feeMax: that.data.isClickFemale ? 0 : that.data.dynamicInfo.feeMax ? that.data.dynamicInfo.feeMax : 0,
    }
    let params = Object.assign({}, daijiaoCommitParams, {
      openId: app.globalData.userInfo.openId,
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contactPhone: app.globalData.userInfo.phone,
      customerPhones: app.globalData.userInfo.phone
    });
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;
    if (that.data.dynamic && !that.data.isClickFemale) {
      loading.hide();
      params.method = "POST";
      wx.navigateTo({
        url: '../dynamicJudge/dynamicJudge?params=' + JSON.stringify(params) + '&type=daijiaoSubmit'
      });
      return;
    }
    delete params.method;
    mOpenOrderCommit(params).then((json) => {
      if (json.code != '0' && json.status != 0) {
        // console.log('noworderCommit报错')
        // console.log(json)
        loading.hide();
        queryError(json.message);
        return;
      }
      if (that.data.shopId) {
        that.setData({
          shopId: ''
        })
      }
      if (app.globalData.shopId) {
        app.globalData.shopId = ''
      }
      app.globalData.bookingTime = new Date(parseInt(json.data.orderTime + '000')).Format();
      app.globalData.bookingId = json.data.bookingId;
      app.globalData.bookingType = json.data.bookingType;
      that.submitBack(app.globalData.shopInfo.shopPhone, json.data.bookingId, 4);
      wx.reLaunch({ url: '../polling/polling' });
      loading.hide();
    });
  },
  submitBack: function(phone, bookingId, orderType) {
    mFeedback({ phone, bookingId, orderType })
      .then(function() {
        console.log("feedback调用成功");
      })
      .catch(() => {});
  },
  // 获取为我服务的司机
  getOrder() {
    return new Promise((resolve, reject) => {
      mMyDrivers({
        token: app.globalData.userInfo.token,
        pollingCount: 1
      }).then(json => {
        // 处理token验证业务接口失效
        if (json.message === "Token验证失败" || json.message === '验证失败') {
          wx.alert({
            content: "您的账号信息已失效，请重新登录",
            success: function (json) {
              wx.navigateTo({url: "../login/login"});
            }
          });
          return reject();
        }


        if (json.code != 0) {
          wx.showToast({ title: json.message, icon: 'none' });
          return reject();
        }

        let cancelFeeDetail = json.data.cancelFeeDetail[0];

        // 取消费支付
        if (json.data.cancelFeeDetail.length > 0 && cancelFeeDetail.payStatus == "1") {
          app.globalData.order = cancelFeeDetail;
          wx.redirectTo({
            url: "../pay/pay?orderType=cancelFee"
          });
          return reject();
        }

        if (json.data.drivers.length > 0 && json.data.drivers[0].orders.length > 0) {
          //101:派单中 301:已接单 302:已就位 303:已开车 401:派单失败 403:用户取消 404:司机消单501:司机报单

          let info = json.data.drivers[0];
          app.globalData.bookingAddress = info.address;
          app.globalData.bookingPhone = info.contactPhone;
          app.globalData.bookingTime = info.bookingTime;
          app.globalData.bookingId = info.bookingId;
          app.globalData.bookingType = info.bookingType;
          app.globalData.order = info.orders[0];

          switch (info.orders[0].orderStateCode) {
            case "101":
              wx.reLaunch({ url: "../polling/polling" });
              break;
            case "401":
              wx.confirm({
                title: "派单失败，请重新下单",
                showCancel: false
              });
              break;
            case "501":
              wx.redirectTo({ url: "../pay/pay" });
              break;
            default:
              wx.reLaunch({ url: "../order/order" });
              break;
          }
          reject();
        } else {
          resolve();
        }
      })
    })
  },

  // 获取预估价
  getCostEstimate: function (callback) {
    let that = this;
    if (!app.globalData.userInfo.phone || !app.globalData.storeEndAddress) return;
    let coordStart = GPS.bd_encrypt(this.data.loc.latitude, this.data.loc.longitude),
      coordEnd = GPS.bd_encrypt(this.data.endLoc.latitude, this.data.endLoc.longitude);
    let params = {
      token: app.globalData.userInfo.token,
      start_lat: coordStart.lat,
      start_lng: coordStart.lon,
      end_lat: coordEnd.lat,
      end_lng: coordEnd.lon,
      source: this.source,
      address_from: this.data.loc.name,
      address_to: this.data.endLoc.name,
      is_select_bonus: 0,
      channel: app.globalData.configInfo.channel.normalChanel,
      city_id: app.globalData.cityId
    };
    mCostEstimate(params).then(json => {
      loading.hide();
      if (json.code === "5" || json.code === "2") {
        that.setData({
          "costestimateData.hint": true,
          "costestimateData.show": false
        });
        callback && callback();
      } else if (json.code === "0") {
        that.setData({
          "costestimateData.hint": false,
          "costestimateData.show": true,
          "costestimateData.cost": parseFloat(json.fee).toFixed(2),
          "costestimateData.seq": json.seq,
          "costestimateData.deductMoney": parseFloat(json.deductMoney).toFixed(2)
        });
        that.setMapConfig(that.addressHeight1);
        callback && callback();
      } else {
        queryError(json.message);
      }
    })
  },

  // 预估费详情
  costestimatePage: function () {
    let that = this;
    let data = {
      start_lat: that.data.loc.latitude,
      start_lng: that.data.loc.longitude,
      end_lat: that.data.endLoc.latitude,
      end_lng: that.data.endLoc.longitude,
      source: that.source,
      address_from: that.data.loc.name,
      address_to: that.data.endLoc.name,
      channel: app.globalData.configInfo.channel.normalChanel
    };
    let query = Object.keys(data).map(function (key) {
      return key + "=" + data[key];
    }).join("&");
    console.log("../costEstimate/costEstimate?" + query)
    wx.navigateTo({
      url: "../costEstimate/costEstimate?" + query
    });
  },

  // 回到中心点
  returnCenter() {
    this.initMap();
  },
  getCenter() {
    let start = GPS.bd_decrypt(
      this.data.loc.latitude,
      this.data.loc.longitude
    )
    let end = GPS.bd_decrypt(
      this.data.endLoc.latitude,
      this.data.endLoc.longitude
    )
    return {
      latitude: (start.lat + end.lat) / 2,
      longitude: (start.lon + end.lon) / 2
    }
  },
  // 地图初始化
  initMap() {
    let markers = this.createMarkers();
    this.setData({
      "map.markers": markers.markers,
    });
    this.mapCtx.includePoints({
      points: markers.includePoints,
      padding: this.includePadding
    });
  },

  // 获取司机列表
  getDriverList() {
    return new Promise((resolve, reject) => {
      let coord = GPS.bd_encrypt(this.data.loc.latitude, this.data.loc.longitude);
      mDriversList({
        latitude: coord.lat,
        longitude: coord.lon,
        token: app.globalData.userInfo.token
      }).then(data => {
        if (data.code != 0 && data.code != 2) {
          wx.showToast({ content: data.message });
          return
        }

        let calloutTxt = ' 正在获取您的位置... ';
        if (data.driverList && data.driverList.length < 1 || !data.driverList) {
          calloutTxt = " 附近暂无空闲司机 ";
        } else {
          if (data.minutesToArrive == "0") {
            if (data.isLongDistance == 1) {      //不支持远途
              calloutTxt = " 附近暂无空闲司机 ";
            } else {
              if (data.driverList && data.driverList.length < 1) {
                calloutTxt = " 附近暂无空闲司机 ";
              } else {
                data.minutesToArrive = parseInt(data.minutesToArrive) + 1;
                calloutTxt = " " + data.minutesToArrive + " 分钟后上车 "
              }
            }
          } else {
            calloutTxt = " " + data.minutesToArrive + " 分钟后上车 ";
          }
        }
        this.calloutText = calloutTxt;
        this.setData({
          'map.markers[0].callout.content': calloutTxt
        })
        //动态调价
        //动态调价
        if (data.dynamicFee * 1 == 0 || data.dynamicRate * 1 <= 1) {
          this.setData({
            dynamic: false
          });
        }

        if (data.dynamicRate && data.dynamicRate * 1 != 0) {
          this.setData({
            dynamic: true,
            dynamicRate: data.dynamicRate * 1,
            dynamicFee: data.dynamicFee　* 1,
            feeMax: data.feeMax
          });
        }

        if (data.dynamicFee && data.dynamicFee * 1 != 0) {
          this.setData({
            dynamic: true,
            dynamicRate: data.dynamicRate * 1,
            dynamicFee: data.dynamicFee　* 1,
            feeMax: data.feeMax
          });
        }
        resolve('');
      }).catch(() => {
        if (!this.data.allowDynamic) {
          loading.hide();
        }
      })
    })

  },

  // 创建地图markers
  createMarkers() {
    let markers = [], includePoints = [];
    markers.push({
      id: 1,
      callout: {
        display: 'ALWAYS',
        content: this.calloutText,
        color: "#000000",
        fontSize: 12,
        borderRadius: 66,
        bgColor: "#ffffff",
        padding: 10,
      },
      latitude: this.data.loc.latitude,
      longitude: this.data.loc.longitude,
      iconPath: "../../res/map_sign_up.png",
      width: 20,
      height: 35
    });
    includePoints.push({
      latitude: this.data.loc.latitude,
      longitude: this.data.loc.longitude,
    });
    markers.push({
      id: 2,
      latitude: this.data.endLoc.latitude,
      longitude: this.data.endLoc.longitude,
      iconPath: "../../res/map_sign_down.png",
      width: 20,
      height: 35
    });
    includePoints.push({
      latitude: this.data.endLoc.latitude,
      longitude: this.data.endLoc.longitude,
    })
    return { markers, includePoints };
  },
  onShareAppMessage: app.shareConfig
});
