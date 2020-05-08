//index.js
// 经纬度直线距离计算
// Math.sqrt( Math.pow(69.1 * (lat - lat1),2) + Math.pow(69.1 * (lng - lng1) * Math.cos(lat / 57.3),2)) * 1000 * 2;
import { GPS } from "../../common/GPS";
import configInfo from "../../common/config";
import dataTreating from "../../common/base64";
import { loading, queryError, eStorage } from "../../common/util";
import {
  mGetEndbypois,
  mGetWelcome,
  mMyDrivers,
  mGpsLocation,
  mDriversList,
  mNoworderCommit,
  mSelectDriverOrderCommit,
  mOpenOrderCommit,
  mShopInfo,
  mGetEdjUserInfoApi,
  mFeedback,
  mConfigInit,
  mPostFormId
} from "../../common/actions";
import heightController from "../../common/mapHeightController";
// 获取应用实例
var app = getApp();
Page({
  data: {
    user: {
      phone: ""
    },
    loc: {
      // 存GCJ-02格式
      name: "正在获取您的位置...",
      region: "北京市",
      latitude: 0,
      longitude: 0
    },
    endLoc: {
      name: "请输入目的地",
      region: "北京市",
      latitude: 0,
      longitude: 0
    },
    map: {
      height: 0,
      scale: 15,
      latitude: 0,
      longitude: 0,
      includePoints: [],
      circles: [
        {
          latitude: "",
          longitude: "",
          color: "",
          fillColor: "#7cb5ec88",
          radius: 1,
          strokeWidth: 0
        }
      ],
      controls: [],
      markers: []
    },
    homeAd: {},
    isNew: false,
    ticketList: [], //天降红包
    showAddressRecommend: false,
    calloutTxt: "",
    calloutTxt2: "正在获取司机状态...",
    showMap: true,
    showCallout: true,
    calloutTop: 0,
    showFemale: false,
    isClickFemale: false,
    showDynamic: false,
    showMainBtn: false, //强输目的地控制
  },
  gender: "1",
  isVerified: "0", // 0 未认证 1 已认证
  submitDisabled: true, // 控制多次点击下单bug
  statusOff: 0,
  mode: "normal",
  isCommitOrder: false,
  scanCodeCommit: true,
  isScanCode: false,
  dynamic_msg_return: false,
  // 设置地图自适应的一些信息
  startRegionTime: 0,
  endRegionTime: 0,
  isTapCenterIcon: false,
  gotoUserDisable: false,
  userIconClick: false,
  scanIconClick: false,
  startIconClick: false,
  endIconClick: false,
  cancelLocation: false,
  addressHeight1: 350, // 无预估价的高度
  addressHeight2: 445, // 有预估价的高度
  nowAddressHeight: 0,
  regionchangeTimer: null,
  source: 5,
  cityId: "",
  // 设置地图view
  setMapConfig: function(d) {
  },
  // 修改地图高度
  changeMapHeight() {
    this.setMapConfig(this.mapHeightController());
  },
  // 关闭推荐目的地
  closeAddressRecommend() {
    this.setData({
      showAddressRecommend: false
    });
  },
  // 点击推荐目的地
  goRecommendAddress() {
    app.globalData.storeEndAddress = {
      name: this.data.recommendAddress.name,
      latitude: this.data.recommendAddress.lat,
      longitude: this.data.recommendAddress.lng
    };
    wx.navigateTo({
      url: "../commitConfirm/commitConfirm"
    });
  },
  // 获取推荐目的地
  getRecommendAddress() {
    if (this.data.showMainBtn) return;
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.userInfo.phone) return;
    mGetEndbypois({
      token: app.globalData.userInfo.token,
      edjCityId: app.globalData.cityId,
      lat: this.data.loc.latitude,
      lon: this.data.loc.longitude,
      source: 4
    }).then(res => {
      if (res.code != "0" && res.status != 0) return;
      if (res.data.length < 1) return;
      let recommend;
      res.data.some(item => (item.source == 4 ? (recommend = item) : false));
      if(!recommend)return;
      this.setData({
        recommendAddress: recommend,
        showAddressRecommend: true
      });
    });
  },
  // 设置司机的marker
  setMarker: function(driverList) {
    let that = this;
    let driverMarker = (id, latitude, longitude) => {
      return {
        id: id,
        latitude: latitude,
        longitude: longitude,
        iconPath: "../../res/driver-header.png",
        width: 31,
        height: 38
      };
    };

    let markerArr = [];
    if (driverList) {
      driverList.forEach((item, index) => {
        // 地图司机经纬度转换 baidu => tx
        let coord = GPS.bd_decrypt(item.latitude, item.longitude);
        markerArr.push(driverMarker(index + 1, coord.lat, coord.lon));
      });
    }
    that.setData({
      "map.markers": markerArr
    });
  },
  // map组件控制
  controltap: function(e) {
    if (this.cancelLocation) {
      this.getAuthor();
      return;
    }
    if (this.gotoUserDisable) return;
    if (e.controlId === 2) {
      this.moveToLocation();
    } else if (e.controlId === 3) {
      if (!this.scanIconClick) {
        return;
      }
      this.scanIconClick = false;
      this.scanCode();
    } else {
      
    }
  },
  returnCenter(){
    this.moveToLocation();
  },
  goToPersion(){
    if (!this.userIconClick) {
      return;
    }
    this.userIconClick = false;
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
      this.gotoLogin();
    } else {
      wx.navigateTo({ url: "../personalCenter/personalCenter" });
    }
  },

  // 回归到地图中心点
  moveToLocation() {
    this.refreshLoction().then(() => {
      this.setData({
        "map.scale": 15,
        "map.latitude": app.globalData.nowLoc.latitude,
        "map.longitude": app.globalData.nowLoc.longitude,
        loc: app.globalData.nowLoc
      });
      app.globalData.storeStartAddress = app.globalData.nowLoc;
      this.mapCtx.moveToLocation();
      this.isTapCenterIcon = true;
    });
  },
  // 扫码下单
  scanCode() {
    var that = this;
    that.submitDisabled = true;
    wx.scanCode({
      success: function(res) {
        loading.show();
        var data = res.result.split("?")[1];
        // var data = 'Y3JlYXRlVGltZT0xNTIzNTg3Nzg5MjEwJmRyaXZlcklkPUJKOTczMzg=';
        var decodeData = dataTreating.base64_decode(data);
        var regExp = /^(createTime=)+.*(&driverId=)(.*)/g;
        if (!regExp.test(decodeData)) {
          loading.hide();
          wx.showModal({
            title: "提示",
            content: "仅支持扫描代驾司机二维码",
            showCancel: false,
            complete: function() {
              that.scanCodeCommit = true;
              that.scanIconClick = true;
              that.submitDisabled = false;
            }
          });
        } else {
          let handled = decodeData.split("&"),
            createTime = handled[0].split("=")[1],
            driverId = handled[1].split("=")[1];
          if (createTime < new Date().getTime() - 3e5) { 
            loading.hide();
            console.log("二维码已过期，请联系司机更新后再次扫码");
            wx.showModal({
              content: "二维码已过期，请联系司机更新后再次扫码",
              showCancel: false,
              success: function(res) {
                that.scanIconClick = true;
                that.submitDisabled = false;
              }
            });
            return;
          }
          if (!app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
            loading.hide();
            this.gotoLogin()
          } else {
            that.scanCodeCommit = false;
            that.isScanCode = true;
            that.getDriverList();
            that
              .getOrder()
              .then(() => {
                that.getLocation().then(() => {
                  that.selectDriverSubmit(driverId);
                });
              })
              .catch(() => {});
          }
        }
      },
      fail: function() {
        that.scanCodeCommit = true;
        that.scanIconClick = true;
        that.submitDisabled = false;
        console.log("扫码失败");
      }
    });
  },
  // 地图发生变化的时候，获取中间点，也就是用户选择的位置 map没有touch事件
  regionchange(e) {
    if (this.cancelLocation) return;
    let that = this;
    if(e.type == "begin"){
      that.regionChangeTap = 'start';
      that.startRegionTime = parseInt(e.timeStamp);
      // 设置刚接触地图气泡的状态
      that.setData({
        showCallout: false
      });
    }else{
      that.regionChangeTap = 'end';
      // console.log("regionchangeend");
      that.endRegionTime = parseInt(e.timeStamp);
      if (that.endRegionTime - that.startRegionTime <= 80 && !that.isTapCenterIcon) {
        // 解决真机region问题，实测每次选完地址回来执行region的时间间隔是1-3毫秒，如果用户滑动地图触发，最低设置50毫秒才算一次移动成功
        // console.log('regionchange limit')
        that.setData({
          showCallout: true
        });
        return;
      }
    }
    if (this.regionchangeTimer) clearTimeout(this.regionchangeTimer);
    this.regionchangeTimer = setTimeout(() => {
      if (e.type == "begin") {
        
      } else if (e.type == "end") {
        if (that.action && that.action == "selectStartAddress") that.action = "";
        that.mapCtx.getCenterLocation({
          type: "gcj02",
          success: res => {
            // console.log('getCenterLocation', res)
            let LoactionData = res;
            if (app.globalData.systemInfo == "ios") {
              that.mapCtx.getScale({
                // 排除缩放地图执行region (安卓 scale只能整数，无法获取具体带小数点的scale)
                success: function(res) {
                  // ios真机获取scale，有小数。。。
                  let nowMapScale = res.scale;
                  if (app.globalData.mapScale == nowMapScale.toFixed(6)) {
                    that.mapChangeFun(LoactionData.latitude, LoactionData.longitude);
                  } else {
                    app.globalData.mapScale = nowMapScale.toFixed(6);
                    that.mapChangeFun(LoactionData.latitude, LoactionData.longitude);
                  }
                }
              });
            } else {
              that.mapChangeFun(LoactionData.latitude, LoactionData.longitude);
            }
          }
        });
        that.isTapCenterIcon = false;
      }
    }, 150);
  },
  // 地图改变执行的函数
  mapChangeFun: function(lat, lon) {
    let that = this;
    // 兼容shopId
    if (!app.globalData.shopInfo || app.globalData.shopInfo.shopType != 0) {
      that.setData({
        "loc.latitude": lat,
        "loc.longitude": lon
      });
      that.getDriverList();
    } else {
      that.getDriverList();
      return;
    }
    that.translateLocation();
    app.globalData.storeStartAddress = that.data.loc;
    app.globalData.cityPriceAddress = that.data.loc;
  },
  // 事件处理函数
  getOrder: function() {
    var that = this;
    return new Promise((resolve, reject) => {
      var params = {
        token: app.globalData.userInfo.token,
        pollingCount: 1
      };
      if (that.onloadStart) loading.show();
      mMyDrivers(params)
        .then(function(json) {
          that.isCommitOrder = false;
          that.gotoUserDisable = false;
          if (json.code != "0" && json.status != 0) {
            if (json.message === "Token验证失败" || json.message === '验证失败') {
              wx.showModal({
                content: "您的账号信息已失效，请重新登录",
                success: function (json) {
                  // console.log(json)
                  if(json.confirm){
                    this.gotoLogin()
                  }
                }
              });
              return;
            } 
            loading.hide();
            queryError(json.message);
            return reject();
          }
          // 取消费用支付
          // 暂时未处理 请到app支付
          let cancelFeeDetail = json.data.cancelFeeDetail[0];
          if (json.data.cancelFeeDetail.length > 0 && cancelFeeDetail.payStatus == "1") {
            app.globalData.order = cancelFeeDetail;
            wx.redirectTo({ url: "../pay/pay?orderType=cancelFee" });
            return reject();
          }
          if (json.data.drivers.length > 0 && json.data.drivers[0].orders.length > 0) {
            that.gotoUserDisable = true;
            loading.hide();
            //101:派单中 301:已接单 302:已就位 303:已开车 401:派单失败 403:用户取消 404:司机消单501:司机报单
            var info = json.data.drivers[0];
            app.globalData.bookingAddress = info.address;
            app.globalData.bookingPhone = info.contactPhone;
            app.globalData.bookingTime = info.bookingTime;
            app.globalData.bookingId = info.bookingId;
            app.globalData.bookingType = info.bookingType;
            app.globalData.order = info.orders[0];
            switch (info.orders[0].orderStateCode) {
              case "101": //派单中
                wx.redirectTo({ url: "../polling/polling" });
                reject();
                break;
              case "401": //派单失败
                wx.showModal({
                  title: "派单失败，请重新下单",
                  showCancel: false,
                  complete: function() {
                    that.getLocation();
                  }
                });
                reject();
                break;
              case "501": //司机已经到达目的地
                wx.reLaunch({ url: "../pay/pay" });
                reject();
                break;
              default:
                // console.log('indextoorder')
                wx.reLaunch({ url: "../order/order" });
                reject();
                break;
            }
          } else {
            resolve();
          }
        })
        .catch(err => {
          that.isCommitOrder = false;
          resolve(null);
        });
    });
  },
  // 获取当前的位置
  getLocation: function() {
    // console.log("getLocation了");
    var that = this;
    return new Promise((resolve, reject) => {
      //if (!app.globalData.author.location) loading.hide();
      wx.getLocation({
        type: "gcj02",
        success: function(loc) {
          if (!app.globalData.author.location) {
            app.globalData.author.location = true;
            wx.setStorageSync("author", app.globalData.author);
          }
          that.setData({
            "loc.latitude": loc.latitude,
            "loc.longitude": loc.longitude,
            "map.latitude": loc.latitude,
            "map.longitude": loc.longitude,
            ["map.circles[" + 0 + "].latitude"]: loc.latitude,
            ["map.circles[" + 0 + "].longitude"]: loc.longitude
          });

          let coord = GPS.bd_encrypt(loc.latitude, loc.longitude);
          mGpsLocation({
            latitude: coord.lat,
            longitude: coord.lon
          })
            .then(function(json) {
              if (json.code != "0") {
                queryError(json.message);
                return resolve();
              }
              // 兼容扫描店铺
              if (
                app.globalData.shopInfo &&
                app.globalData.shopInfo.shopType &&
                app.globalData.shopInfo.shopType != 0
              ) {
                that.setData({
                  "loc.name": json.location.street.name,
                  "loc.region": json.location.street.component.city
                });
              }
              that.isMandatory(json.location.street.component.cityId);
              app.globalData.cityId = json.location.street.component.cityId;
              configInfo.cityId = json.location.street.component.cityId;
              var locationInfo = {
                loc: {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  name: json.location.street.name,
                  region: json.location.street.component.city
                },
                cityId: json.location.street.component.cityId
              };
              resolve(locationInfo);
            })
            .catch(() => {
              wx.showModal({
                title: "网络错误请重试",
                showCancel: false
              });
            });
        },
        fail: function() {
          that.setData({ isNotGetLocation: true });
          resolve();
        }
      });
    });
  },
  // 经纬度转换地址信息
  translateLocation: function() {
    // console.log("translateLocation了");
    let that = this;
    // tx => baidu
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    mGpsLocation({
      latitude: coord.lat,
      longitude: coord.lon
    }).then(function(json) {
      if (json.code != "0") {
        queryError(json.message);
        return;
      }
      that.isMandatory(json.location.street.component.cityId, !!app.globalData.action);
      that.getRecommendAddress();
      app.globalData.cityId = json.location.street.component.cityId;
      configInfo.cityId = json.location.street.component.cityId;
      let name = json.location.street.name,
        region = json.location.street.component.city;
      if (app.globalData.action && app.globalData.action == "selectStartAddress") {
        name = that.data.loc.name;
        region = that.data.loc.region;
        app.globalData.action = "";
      }
      that.setData({
        "loc.name": name,
        "loc.region": region
      });
    });
  },
  // 获取司机列表
  getDriverList: function() {
    let onload = false;
    if (this.onloadStart) {
      onload = true;
      this.onloadStart = false;
    }
    let that = this;
    // tx => baidu
    this.setData({
      showCallout: true,
      calloutTxt: "",
      calloutTxt2: "正在获取司机状态..."
    });
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude);
    let params = {
      latitude: coord.lat,
      longitude: coord.lon
    };
    if(app.globalData.userInfo && app.globalData.userInfo.token){
      params.token = app.globalData.userInfo.token;
    }
    mDriversList(params)
      .then(data => {
        if(that.regionChangeTap == 'start') return;
        that.dynamic_msg_return = true;
        let dynamicInfo = {
          dynamicFee: data.dynamicFee,
          dynamicRate: data.dynamicRate,
          feeMax: data.feeMax
        };
        that.judgeDynamic(dynamicInfo, onload);
        if (data.code != "0" && data.status != 0) {
          that.setData({
            showCallout: true,
            calloutTxt: "",
            calloutTxt2: "附近暂无空闲司机"
          });
          that.setMarker();
          that.checkSubmit();
          return;
        }

        let calloutTxt = "",
          calloutTxt2 = "从这里出发";
        if ((data.driverList && data.driverList.length < 1) || !data.driverList) {
          calloutTxt2 = "附近暂无空闲司机";
          calloutTxt = "";
        } else {
          if (data.isLongDistance * 1 == 1) {
            calloutTxt2 = "附近暂无空闲司机";
            calloutTxt = "";
          } else {
            if(data.minutesToArrive * 1 == 0){
              calloutTxt = (data.minutesToArrive * 1 + 1) + "分钟";
            }else{
              calloutTxt = data.minutesToArrive + '分钟';
            }
          }
        }
        that.setData({
          showCallout: true,
          calloutTxt2,
          calloutTxt
        });
        that.setMarker(data.driverList);
        that.checkSubmit();
      })
      .catch(err => {
        that.setData({
          showMap: true
        });
        loading.hide();
        that.checkSubmit();
      });
  },
  // 检查用户经纬度、是否有司机设置button状态（暂不支持远程单）
  checkSubmit: function() {
    let that = this;
    if (that.isScanCode || that.mode == "scanCode") {
      that.submitDisabled = true;
    } else {
      that.submitDisabled = false;
    }
  },
  // 提交订单按钮点击
  commitOrder: function(e) {
    console.log(e)
    let that = this;
    if (this.submitDisabled) return;
    if (this.cancelLocation) {
      this.getAuthor();
      return;
    }
    if (!this.dynamic_msg_return) return;
    if (this.isCommitOrder) return;
    this.isCommitOrder = true;

    if (!this.scanCodeCommit) return;
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
      that.gotoLogin();
    } else {
      loading.show("呼叫司机中");
      that
        .getOrder()
        .then(() => {
          if (this.shopId) {
            that.getDynamic().then(() => {
              that.daijiaoSubmit();
              that.sendFormId(e.detail.formId);
            });
          } else {
            that.doSubmit();
            that.sendFormId(e.detail.formId);
          }
        })
        .catch(() => {
          loading.hide();
        });
    }
  },
  sendFormId: function(formId) {
    let msg = {
      apiMethod: 'v1/api/weixin/collectFormId',
      phone: app.globalData.userInfo.phone,
      formId: formId,
      userId: app.globalData.userInfo.openId,
      messageType: 'form',
    };
    mPostFormId(msg).then(function(res){
      // console.log(res)
    })
  },
  // 代叫第四种开单方式下单
  daijiaoSubmit: function() {
    loading.show("正在派单中");
    // mOpenOrderCommit
    let that = this,
      typeChnnel = "01012";
    let coord = GPS.bd_encrypt(this.data.loc.latitude, this.data.loc.longitude);
    let daijiaoCommitParams = {
      type: typeChnnel,
      number: 1,
      address: app.globalData.shopInfo.shopLoc && app.globalData.shopInfo.shopLoc.address || this.data.loc.name,
      longitude: coord.lon,
      latitude: coord.lat,
      sendSms: true,
      source: this.source,
      isUseBonus: 1,
      donot_use_bonus: 0,
      gps_type: app.globalData.configInfo.gpsType,
      proxyShopId: app.globalData.shopId || this.shopId,
      proxy_order_type: 4,
      driverPay: app.globalData.shopInfo.driverPay,
      strategy_type: app.globalData.shopInfo.strategy_type,
      customerPay: app.globalData.shopInfo.customerPay,
      dynamicFee: this.data.isClickFemale ? 0 : this.data.dynamicInfo.dynamicFee ? this.data.dynamicInfo.dynamicFee : 0,
      dynamicRate: this.data.isClickFemale
        ? 0
        : this.data.dynamicInfo.dynamicRate
        ? this.data.dynamicInfo.dynamicRate
        : 0,
      feeMax: this.data.isClickFemale ? 0 : this.data.dynamicInfo.feeMax ? this.data.dynamicInfo.feeMax : 0
    };
    let params = Object.assign({}, daijiaoCommitParams, {
      openId: app.globalData.userInfo.openId,
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contactPhone: app.globalData.userInfo.phone,
      customerPhones: app.globalData.userInfo.phone
    });
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;

    if (this.data.showDynamic && !this.data.isClickFemale) {
      loading.hide();
      params.method = 'POST';
      wx.navigateTo({
        url: "../dynamicJudge/dynamicJudge?params=" + JSON.stringify(params) + "&type=daijiaoSubmit"
      });
      if (this.data.shopId) {
        this.setData({
          shopId: ""
        });
      }
      if (app.globalData.shopId) {
        app.globalData.shopId = "";
      }
      return;
    }
    delete params.method;
    mOpenOrderCommit(params).then(function(json) {
      if (that.data.shopId) {
        that.setData({
          shopId: ""
        });
      }
      if (app.globalData.shopId) {
        app.globalData.shopId = "";
      }
      if (json.code != "0" && json.status != 0) {
        loading.hide();
        queryError(json.message);
        return;
      }
      app.globalData.bookingTime = new Date(parseInt(json.data.orderTime + "000")).Format();
      app.globalData.bookingId = json.data.bookingId;
      app.globalData.bookingType = json.data.bookingType;
      that.submitBack(app.globalData.shopInfo.shopPhone, json.data.bookingId, 4);
      wx.redirectTo({ url: "../polling/polling" });
      loading.hide();
    });
  },
  // 绑定订单bookingid和策略类型
  submitBack: function(phone, bookingId, orderType) {
    mFeedback({ phone, bookingId, orderType })
      .then(function() {
        console.log("feedback调用成功");
      })
      .catch(() => {});
  },
  // 提交订单
  doSubmit: function() {
    loading.show("正在派单中");
    let that = this;
    // tx => baidu
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude),
      coordEnd = GPS.bd_encrypt(that.data.endLoc.latitude, that.data.endLoc.longitude);
    let endLoc = that.data.endLoc.name ? (that.data.endLoc.name == "请输入目的地" ? "" : that.data.endLoc.name) : "";
    let orderCommit = {
      number: 1,
      edited: false,
      is_use_bonus: 1, //判断是女司机订单
      address: that.data.loc.name,
      lat: coord.lat,
      lng: coord.lon,
      source: that.source,
      donot_use_bonus: 0,
      customer_lat: app.globalData.nowLoc.latitude,
      customer_lng: app.globalData.nowLoc.longitude,
      gps_type: app.globalData.configInfo.gpsType,
      city_id: app.globalData.cityId,
      dynamic_fee: that.data.isClickFemale
        ? 0
        : that.data.dynamicInfo.dynamicFee
        ? that.data.dynamicInfo.dynamicFee
        : 0,
      dynamic_rate: that.data.isClickFemale
        ? 0
        : that.data.dynamicInfo.dynamicRate
        ? that.data.dynamicInfo.dynamicRate
        : 0,
      fee_max: that.data.isClickFemale ? 0 : that.data.dynamicInfo.feeMax ? that.data.dynamicInfo.feeMax : 0,
      destination_lat: coordEnd.lat || "",
      destination_lng: coordEnd.lon || "",
      destination_address: endLoc
    };
    var from_driver_info = eStorage.get("from_driver");
    if (from_driver_info && from_driver_info.from_driver.length > 0) {
      orderCommit.from_driver = from_driver_info.from_driver;
    }

    var params = Object.assign({}, orderCommit, {
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contact_phone: app.globalData.userInfo.phone
    });
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;

    if (that.data.showDynamic && !that.data.isClickFemale) {
      loading.hide();
      wx.navigateTo({
        url: "../dynamicJudge/dynamicJudge?params=" + JSON.stringify(params) + "&type=doSubmit"
      });
      return;
    }
    mNoworderCommit(params).then(function(json) {
      if (json.code != "0" && json.status != 0) {
        loading.hide();
        queryError(json.message);
        return;
      }
      app.globalData.bookingTime = new Date(parseInt(json.data.orderTime + "000")).Format();
      app.globalData.bookingId = json.data.bookingId;
      app.globalData.bookingType = json.data.bookingType;
      wx.redirectTo({ url: "../polling/polling" });
      loading.hide();
    });
  },
  // 选择司机下单
  selectDriverSubmit: function(driverId) {
    loading.show("正在派单中");
    let that = this;
    // tx => baidu
    let coord = GPS.bd_encrypt(that.data.loc.latitude, that.data.loc.longitude),
      coordEnd = GPS.bd_encrypt(that.data.endLoc.latitude, that.data.endLoc.longitude);
    let endLoc = that.data.endLoc.name ? (that.data.endLoc.name == "请输入目的地" ? "" : that.data.endLoc.name) : "";
    let orderCommit = {
      type: 1,
      driver_id: driverId,
      address: that.data.loc.name,
      lat: coord.lat,
      lng: coord.lon,
      source: app.globalData.configInfo.resource.normalResource,
      customer_lat: app.globalData.nowLoc.latitude,
      customer_lng: app.globalData.nowLoc.longitude,
      is_use_bonus: 1,
      donot_use_bonus: 0,
      city_id: app.globalData.cityId,
      gps_type: app.globalData.configInfo.gpsType,
      destination_lat: coordEnd.lat || "",
      destination_lng: coordEnd.lon || "",
      destination_address: endLoc
      // dynamic_fee: that.data.isClickFemale ? 0 : that.showDynamic ? that.data.dynamicInfo.dynamicFee : 0,
      // dynamic_rate: that.data.isClickFemale ? 0 : that.showDynamic ? that.data.dynamicInfo.dynamicRate : 0,
      // fee_max: that.data.isClickFemale ? 0 : that.showDynamic ? that.data.dynamicInfo.dynamicFee : 0
    };
    var params = Object.assign({}, orderCommit, {
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      contact_phone: app.globalData.userInfo.phone
    });
    app.globalData.selectDriverId = driverId;
    app.globalData.bookingAddress = params.address;
    app.globalData.bookingPhone = app.globalData.userInfo.phone;

    // if (that.data.showDynamic && !that.data.isClickFemale) {
    //   loading.hide();
    //   that.mode = "normal";
    //   wx.navigateTo({
    //     url: "../dynamicJudge/dynamicJudge?params=" + JSON.stringify(params) + "&type=selectDriverSubmit"
    //   });
    //   return;
    // }

    mSelectDriverOrderCommit(params).then(function(json) {
      loading.hide();
      if (json.code != "0" && json.status != 0) {
        queryError(json.message);
        that.scanCodeCommit = true;
        that.scanIconClick = true;
        that.isScanCode = false;
        that.getDriverList();
        return;
      }
      app.globalData.bookingTime = new Date(parseInt(json.data.orderTime + "000")).Format();
      app.globalData.bookingId = json.data.bookingId;
      app.globalData.bookingType = json.data.bookingType;
       that.mode = "normal";
      wx.redirectTo({ url: "../polling/polling" });
    });
  },
  // 获取授权状态
  getScope() {
    let that = this;
    wx.getSetting({
      success(res) {
        that.userScope = res.authSetting;
      }
    });
  },
  onLoad: function(query = {}) {
    loading.show();
    let that = this;
    this.onloadStart = true;
    // console.log("onload", query);
    if (query && query.action) {
      this.action = query.action;
      switch (query.action) {
        case "cancel":
          app.globalData.storeStartAddress = null;
          break;
      }
    }
    if(query && query.pages && query.orderId){
      this.redirectPage = query.pages + '?orderId='+query.orderId;
    }
    this.mapHeightController = heightController.bind(this);

    if (query && query.ad_channel) {
      wx.reportAnalytics("ad_statistics", {
        ad_channel: query.ad_channel
      });
    }
    if (query.mode) {
      that.mode = query.mode;
      that.driverId = query.driverId;
    } else {
      // 如果是扫商家二维码之后消单，正常完成订单，或者在后台重新进入 执行onload都清除app.globalData.shopId,防止正常下单走代叫单
      // 排除登录进入的
      if (app.globalData.shopId) {
        delete app.globalData.storeStartAddress;
        delete app.globalData.shopId;
      }
    }
    if (query.entrance == "comment") {
      delete app.globalData.storeEndAddress;
    }
    that.refreshLoction();
    that.setMapConfig(that.addressHeight1); //520

    // query.q = 'http://h5.d.edaijia.cn/weixin/index.html?shopId=8471';
    // query.q = 'http://h5.edaijia.cn/twocode/index.html?BJ97338=';
    var src = decodeURIComponent(query.q),
      allArg = "?" + src.split("?")[1];
    //app.globalData.shopId = 7745;
    app.globalData.qrCode = (src && src != 'undefined')? src : null;
    if (src && src.indexOf("weixin/index.html?shopId=") > -1) {
      var shopId = this.getQueryString("shopId", allArg);
      app.globalData.shopId = shopId;
    } else if (src && src.indexOf("twocode/index.html") > -1) {
      var num = allArg.match(/\w+/);
      if (num && num[0]) {
        app.globalData.from_driver = num[0];
        eStorage.set("from_driver", { from_driver: num[0] }, 2);
      }
    } else {
      var arg = this.getQueryString("act_cid", allArg);
      if (arg) {
        wx.reportAnalytics("statistics", {
          statistics: arg
        });
      }
    }
  },
  // 每次打开页面都会调用，场景比较多如第一打开加载，每次页面回退，onload加载不清除数据
  onShow: function() {
    let that = this;
    this.getScope();
    that.mapCtx = wx.createMapContext("map");
    // 判断onload里面有没有shopId
    // console.log("onshowglobal", app.globalData);
    if (app.globalData.shopId) {
      // console.log("shop进入, shopId:" + app.globalData.shopId);
      that.mode = "shop";
      that.setData({ shopId: app.globalData.shopId });
      that.getShopInfo(app.globalData.shopId);
      return;
    } else {
      // console.log("正常进入");
      that.normalEnterInit();
    }

  },
  // 正常进入init小程序
  normalEnterInit: function() {
    if (this.cancelLocation) return;
    let that = this;
    that.init();
  },
  // 页面初始化
  init: function() {
    let that = this;
    if (!app.globalData.storeStartAddress) {
      that.getLocation().then(json => {
        if (json) initLocation(json);
        this.getDriverList();
        this.getUserInfo();
      });
    } else {
      let storeStartAddress = app.globalData.storeStartAddress;
      this.isAuth = true;

      this.setData({
        loc: storeStartAddress || that.data.loc
      });
      this.isMandatory(app.globalData.cityId);
      this.getDriverList();
      this.getUserInfo();
    }
    function initLocation(json) {
      that.isAuth = true;
      that.setData({
        loc: json.loc
      });

      app.globalData.nowLoc = json.loc;
      app.globalData.cityId = json.cityId;
      configInfo.cityId = json.cityId;
      app.globalData.storeStartAddress = json.loc;
    }
  },
  getUserInfo() {
    let that = this;
    app.getWeChatUserInfo().then(userInfo => {
      loading.hide();
      // console.log("userInfo", userInfo);
      that.initData();
      if (app.globalData.userInfo && app.globalData.userInfo.token) {
        that.getEdjUserInfo();
        if (that.redirectPage){
          wx.navigateTo({
            url: that.redirectPage,
            success:function(){
              that.redirectPage = undefined;
            }
          })
          return;
        }
        that
          .getOrder()
          .then(() => {
            that.isMandatory(app.globalData.cityId).then(() => {
              that.getRecommendAddress();
            });
            that.getWelcome();
            // 判断是否是首次实名认证
            if (app.globalData.isFirstVerify) {
              that.certificationToast();
            }
            if (that.mode == "scanCode") {
              loading.show("正在派单中...");
              that.submitDisabled = true;
              that.getDynamic().then(() => {
                that.getLocation().then(() => {
                  that.selectDriverSubmit(that.driverId);
                });
              });
            } else if (that.mode == "shop" && app.globalData.shopInfo.shopType == 0 && app.globalData.shopId) {
              if (app.globalData.userInfo.phone || app.globalData.userInfo.token) {
                // 登录
                that.getDynamic().then(() => {
                  that.daijiaoSubmit();
                });
              }
            }
          })
          .catch(() => {
            loading.hide();
          });
      } else {
        if (that.mode == "shop" && app.globalData.shopId) {
          that.gotoLogin();
        }
        that.isCommitOrder = false;
        that.dynamic_msg_return = false;
      }
    });
  },
  // 页面数据初始化
  initData: function() {
    let that = this,
      globalData = app.globalData;
    that.setData({
      loc: globalData.storeStartAddress || that.data.loc,
      endLoc: globalData.storeEndAddress || that.data.endLoc
    });
    // console.log("initdata的时候", that.data.loc);
    that.setData({
      "map.latitude": that.data.loc.latitude,
      "map.longitude": that.data.loc.longitude
    });
    configInfo.udid = globalData.userInfo.openId || "20000001"; //小程序只能看到小程序的订单
    // 设置开关状态
    that.isScanCode = false;
    that.scanCodeCommit = true;
    that.scanIconClick = true;
    that.submitDisabled = false;
    that.userIconClick = true;
    that.startIconClick = true;
    that.endIconClick = true;
    that.dynamic_msg_return = false;
    app.globalData.cityPriceAddress = that.data.loc;
  },
  // 获取扫码当前店铺shopId的信息
  getShopInfo: function(shopId) {
    let that = this;
    mShopInfo({
      shopId: shopId
    }).then(function(res) {
      // console.log("getShopInfo", res);
      // 判断是一级店铺还是分销商 type 0 一级店铺 type 1 二级分销商
      if (res.code != 0) {
        wx.showModal({
          content: res.result || "网络错误请重试",
          showCancel: false,
          success: function(res) {
            if (app.globalData.shopId) {
              delete app.globalData.shopId;
            }
            that.normalEnterInit();
          }
        });
        return;
      }
      if (res.data.status == 0 || res.data.status == 2) {
        wx.showModal({
          content: "商家" + res.data.statusDesc,
          showCancel: false,
          success: function(res) {
            if (app.globalData.shopId) {
              delete app.globalData.shopId;
            }
            that.normalEnterInit();
          }
        });
        return;
      }
      let shopInfo = {
        shopLoc: {},
        shopId: shopId,
        shopPhone: res.data.phone,
        shopType: res.data.type,
        driverPay: typeof res.data.driverPay != "undefined" ? res.data.driverPay : "",
        strategy_type: typeof res.data.cashConfigType != "undefined" ? res.data.cashConfigType : "",
        customerPay: typeof res.data.customerPay != "undefined" ? res.data.customerPay : ""
      };
      app.globalData.shopInfo = shopInfo;
      if (res.data.type == 1) {
        if (app.globalData.shopId) {
          that.shopId = app.globalData.shopId;
          delete app.globalData.shopId;
        }
        that.normalEnterInit();
      } else if (res.data.type == 0) {
        // tx => bd
        let coord = GPS.bd_decrypt(res.data.lat, res.data.lng);
        mGpsLocation({
          latitude: coord.lat,
          longitude: coord.lon
        }).then(function(json) {
          loading.hide();
          if (json.code != "0") {
            queryError(json.message);
            return;
          }
          that.isMandatory(app.globalData.cityId);
          app.globalData.cityId = json.location.street.component.cityId;
          configInfo.cityId = json.location.street.component.cityId;
          let shopLoc = {
            name: res.data.shopName,
            latitude: coord.lat,
            longitude: coord.lon,
            region: json.location.street.component.city,
            address: res.data.address
          };
          that.data.loc = shopLoc;
          app.globalData.shopInfo.shopLoc = shopLoc;
          app.globalData.storeStartAddress = shopLoc;
          that.init();
        });
      } else {
        delete app.globalData.storeStartAddress;
        that.normalEnterInit();
      }
    });
  },
  getAuthor: function() {
    let that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting["scope.userLocation"]) {
          that.setData({
            "loc.name": "正在获取您的位置..."
          });
          wx.showModal({
            title: "温馨提醒",
            content: "需要获取您的地理位置才能使用小程序",
            cancelText: "取消",
            confirmText: "开启定位",
            success: function(res) {
              if (res.confirm) {
                that.openWXSetting();
              } else if (res.cancel) {
                that.cancelLocation = true;
              }
            }
          });
        }
      }
    });
  },
  // 打开微信设置
  openWXSetting: function() {
    let that = this;
    wx.openSetting({
      success: function(res) {
        if (res.authSetting["scope.userLocation"]) {
          that.cancelLocation = false;
          that.init();
        }
      }
    });
  },
  isMandatory(city, next) {
    let that = this;
    let cityId = app.globalData.cityId;
    if (!city) return;
    // console.log("=====" + cityId, "||", city, next);
    var data = [
      {
        key: "customer_force_address",
        subkey: "city_" + city
      }
    ];
    this.getWelcome(city);
    let params = {
      config_name_ary:'app_home_user_switch_config',
      current_city_id: city,
      app_ver: 3,
      dynamic: 0,
      token: app.globalData.userInfo ? app.globalData.userInfo.token:''
      // key: JSON.stringify(data),
    };
    return new Promise(resolve => {
      mConfigInit(params).then(function(res) {
        if (res.code == "0") {
          resolve();
          // var statusOff = res.data.customer_force_address["city_" + city];
          // if (statusOff) {
          //   that.statusOff = JSON.parse(statusOff).wx_mini_app || "";
          // } else {
          //   that.statusOff = 0;
          // }
          // let showMainBtn = that.statusOff == "0" ? true : false;
          if (!res.data || !res.data.app_home_user_switch_config) {return}
          let showMainBtn = res.data.app_home_user_switch_config.input_destination
          if(that.data.showAddressRecommend && !showMainBtn){
            that.setData({
              showAddressRecommend: false
            })
          }
          that.setData({
            showMainBtn: !showMainBtn,//"input_destination": 强输目的地配置 true开启，false关闭
          });
          // that.getRecommendAddress();
          that.changeMapHeight();
        }
      });
    })
  },
  
  // 重新获取当前的位置
  refreshLoction: function() {
    let that = this;
    return new Promise(resolve => {
      wx.getLocation({
        type: "gcj02",
        success: function(loc) {
          let coord = GPS.bd_encrypt(loc.latitude, loc.longitude);
          mGpsLocation({
            latitude: coord.lat,
            longitude: coord.lon
          }).then(function(json) {
            // console.log("refreshLoction", json.location.street);
            if (json.code != "0") {
              queryError(json.message);
              resolve();
              return;
            }
            that.isMandatory(json.location.street.component.cityId);
            app.globalData.cityId = json.location.street.component.cityId;
            configInfo.cityId = json.location.street.component.cityId;
            app.globalData.currentCityId = json.location.street.component.cityId;
            app.globalData.nowLoc = {
              region: json.location.street.component.city,
              latitude: loc.latitude,
              longitude: loc.longitude,
              name: json.location.street.name
            };
            resolve();
          });
        },
        fail: function(e) {
          console.log(e, '定位失败');
          that.getAuthor();
          resolve();
        }
      });
    });
  },

  // 获取e代驾用户信息getEdjUserInfo
  getEdjUserInfo: function() {
    let that = this;
    mGetEdjUserInfoApi({ token: app.globalData.userInfo.token }).then(function(json) {
      if (json.code != "0") {
        if (json.message === "Token验证失败" || json.message === '验证失败') {
          wx.showModal({
            content: "您的账号信息已失效，请重新登录",
            success: function (json) {
              if(json.confirm){
                this.gotoLogin()
              }
            }
          });
          return;
        }
        if (json.code * 1 != 2) {
          queryError(json.message);
        } else {
          //会死循环
          // that.getEdjUserInfo();
        }
        return;
      }
      app.globalData.userInfo.name = json.data.familyName + json.data.givenName;
      app.globalData.userInfo.gender = json.data.gender;
      that.isVerified = json.data.isVerified;
      that.gender = json.data.gender;
    });
  },
  // 实名认证发券toast
  certificationToast: function() {
    let that = this,
      costestimateData = that.data.costestimateData;
    app.globalData.isFirstVerify = false;
    that.setData({
      showFemale: false
    });
    wx.showToast({
      title: "实名认证通过，一张女用户专属券飞进您的账户！（当前订单即可使用）",
      icon: "none",
      duration: 1500,
      mask: true
    });
  },
  // tab事件
  handlerFemale: function() {
    var that = this;
    that.source = app.globalData.configInfo.resource.normalResourceFemale;
    app.globalData.isClickFemale = true;
    that.setData({
      isClickFemale: true
    });
    app.globalData.isClickFemale = true;
    this.setMapConfig(this.mapHeightController());
    if (that.isVerified == "0") {
      that.setData({
        showFemale: true
      });
    }
  },
  handlerGeneral: function() {
    var that = this;
    that.source = app.globalData.configInfo.resource.normalResource;
    app.globalData.isClickFemale = false;
    that.setData({
      isClickFemale: false,
      showFemale: false
    });
    app.globalData.isClickFemale = false;
    this.setMapConfig(this.mapHeightController());
  },
  // 点击实名认证按钮
  verifyFemale: function() {
    let that = this;
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
      that.gotoLogin();
    } else {
      if (that.isVerified == "1" && that.gender == "1") {
        // 实名认证过 并且性别是男
        wx.showToast({
          title: "客官淘气了...",
          icon: "none",
          duration: 1000
        });
      } else {
        wx.navigateTo({
          url: "../certification/certification"
        });
      }
    }
  },
  // 跳转登录页面
  gotoLogin: function() {
    wx.navigateTo({ url: "../login/login" });
  },
  getQueryString: function(name, arg) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = arg.substr(1).match(reg);
    if (r != null) {
      return unescape(r[2]);
    }
    return null;
  },
  //地址页面传参以及跳转 先登录才能选择地址
  skipAddressList(e) {
    if (this.cancelLocation) return this.getAuthor();
    let that = this;
    let data,
      locTip = e.currentTarget.dataset.location;
    if (!that.startIconClick && !that.endIconClick) return;
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || !app.globalData.userInfo.phone) {
      that.gotoLogin();
    } else {
      if (locTip == "start") {
        if (!that.startIconClick) {
          return;
        }
        if (app.globalData.shopInfo && app.globalData.shopInfo.shopType == 0) {
          return;
        }
        that.startIconClick = false;
        data = that.data.loc;
        data.locTip = "start";
      } else {
        if (!that.endIconClick) {
          return;
        }
        that.endIconClick = false;
        data = that.data.endLoc;
        data.locTip = "end";
      }
      let query = Object.keys(data)
        .map(function(key) {
          return key + "=" + data[key];
        })
        .join("&");
      wx.navigateTo({ url: "../address/address?" + query });
    }
  },
  // 获取动调
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
  // 动调状态判断
  judgeDynamic(data, onload) {
    data.dynamicRate = data.dynamicRate - 0;
    data.dynamicFee = data.dynamicFee - 0;
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
    this.setMapConfig(this.mapHeightController());
    loading.hide();
    this.setData({
      dynamicInfo: data,
      showMap: true
    });
  },
  // 入口广告
  getWelcome(city) {
    if (!app.globalData.userInfo || !app.globalData.userInfo.token || this.cancelLocation) return;
    let that = this;
    let params = {
      token: app.globalData.userInfo.token,
      currentCityId: city || app.globalData.cityId,
      latitude: that.data.map.latitude,
      longitude: that.data.map.longitude,
      gps_type: "baidu",
      need_home_ad: 1,
      cityName: that.data.loc.region,
      platform: "miniapp"
    };
    mGetWelcome(params).then(function(json) {
      if (json.code != 0 || !json.data.home_ad.ads || json.data.home_ad.ads.length <= 0) {
        that.setData({
          showWelcome: false,
        });
        return;
      }
      let data = json.data.home_ad;
      let list = data.ads[0].content,
        step = 1,
        len = data.ads[0].content.length - 1;
      that.setData({
        showWelcome: true,
        "homeAd.content": data.ads[0].content[0] || "",
        "homeAd.href": data.ads[0].href || "",
      });
      clearInterval(that.noticeTimer);
      that.noticeTimer = setInterval(() => {
        if (step > len) {
          step = 0;
        }
        that.setData({
          "homeAd.content": list[step]
        });
        step++;
      }, 3000);
    });
  },
  onUnload() {
    app.globalData.isClickFemale = false;
    delete app.globalData.storeStartAddress;
  },
  tapWelcome() {
    if (this.cancelLocation) return this.getAuthor();
    let that = this;
    wx.navigateTo({ url: "../homeAd/homeAd?adUrl=" + that.data.homeAd.href });
  },
  // 分享
  onShareAppMessage: app.shareConfig
});
