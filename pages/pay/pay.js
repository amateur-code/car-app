import { loading, queryError, autoAdpatStyle } from '../../common/util';
import { mDriverPosition, mOrderPay, mPayWx, mCouponList, mPayNotify, mPostFormId } from '../../common/actions';
let app = getApp();
import drawQrcode from '../../common/weapp.qrcode';

Page({

  data: {
    noList: false,
    couponLisrFee: '',
    bonusId: '',
    limitCoupon: false,
    couponTxt: '无可用代驾券',
    showcancelFee: false,
    currentCity: '北京市',
    payType: '',//判断是否是取消单
    detailToIndex: app.globalData.detailToIndex,
    showPay: false,
    skin: ''
  },
  pollingCount: 1,
  timer: null,
  timer2: null,
  payApiCount: 0,
  clickOff: true,
  isLimit: false,
  userBonus: false,
  onLoad: function (options) {
    let that = this;
    that.setData({
      ...app.globalData,
      currentCity: app.globalData.cityPriceAddress.region,
      payType: options.orderType ? options.orderType : "",

    });
    autoAdpatStyle(this)
    delete app.globalData.couponId;
    // if (options && options.orderType) that.orderType = options.orderType;
  },
  onShow: function () {
    if(app.globalData.detailToIndex){
      loading.show();
      app.globalData.detailToIndex = false;
      wx.reLaunch({url: '../index/index'});
      return;
    }
    let that = this, globalData = app.globalData;
    that.clickOff = true;
    if ('couponId' in globalData) {
      loading.show('载入中...');
      that.getOrderPay({
        is_update_coupon: 1,
        bonus_id: globalData.couponId
      });
    }
    if (that.data.payType && that.data.payType == 'cancelFee'){
      that.getCancelOrderPay();
    }else{
      that.updateState();
    }
  },
  updateState: function () {
    let that = this;
    let params = {
      token: app.globalData.userInfo.token,
      bookingId: app.globalData.bookingId,
      driverId: app.globalData.order.driverId,
      orderId: app.globalData.order.orderId,
      pollingCount: that.pollingCount,
      gpsType: app.globalData.configInfo.gpsType
    };
    mDriverPosition(params).then(function (json) {
      // console.log('拉去订单')
      if (json.code != '0') {
        loading.hide();
        queryError(json.message);
        return;
      }
      let data = json.data, tipTxt = '';
      switch (data.driver.orderStateCode) {
        case '501': //司机已报单
          app.globalData.order.orderId = data.driver.orderId;
          that.setData({
            "driver.name": data.driver.name,
            "driver.phone": data.driver.phone,
            "driver.time": new Date(parseInt(data.driver.orderAllStates[0].orderStateTimestamp + "000")).Format('MM月dd日 hh:mm'),
            "channel": data.driver.channel
          });
          if (data.driver.onlinePayStatus > 0 && data.driver.payChannel == 3) {
            if (that.payApiCount < 1) {
              that.getOrderPay({ is_update_coupon: 0 });
              that.payApiCount++
            }
            break;
          }
          clearTimeout(that.timer);
          if (that.isLimit) return;
          wx.navigateTo({ url: '../orderDetail/orderDetail?from=pay&orderId=' + app.globalData.order.orderId });
          return;
        default:
          console.log('error');
          break;
      }
      clearTimeout(that.timer);
      that.timer = setTimeout(function () {
        that.pollingCount = that.pollingCount + 1;
        that.updateState();
      }, 6000); //data.next * 6000
    }).catch(function () {
      that.pollingCount = that.pollingCount + 1;
      that.updateState();
    });
  },
  getOrderPay: function (para = {}, isComplete) {
    let that = this;
    let params = {
      order_id: app.globalData.order.orderId,
      token: app.globalData.userInfo.token,
      phone: app.globalData.userInfo.phone,
      is_need_coupon: 1,
      ...para
    }
    if (isComplete) {
      params = Object.assign({}, params, {
        completed_order: 1
      });
    }
    return new Promise((resolve, reject) => {
      mOrderPay(params).then((json) => {
        if (json.code != '0') {
          loading.hide();
          reject();
          queryError(json.message);
          return;
        }
        resolve();
        let couponBind, couponBinded;
        if(json.data.coupon_user_select && json.data.coupon_user_select.id){
          couponBind = json.data.coupon_user_select;
          if(json.data.coupon_user_select && json.data.coupon_bind && json.data.coupon_user_select.id == json.data.coupon_bind.id){
            couponBinded = {};
          }else{
            couponBinded = json.data.coupon_bind;
          }
        }else if(json.data.coupon_bind && json.data.coupon_bind.id){
          couponBind = json.data.coupon_bind;
        }
        if(json.data.coupon_fee * 1 > 0){
          this.userBonus = true;
        }else{
          this.userBonus = false;
        }
        that.setData({
          "order.start": json.data.start,
          "order.destination": json.data.destination ? json.data.destination : json.data.start,
          "order.cast": json.data.cast,
          "order.income": json.data.income,
          "order.collectionFee": json.data.collection_fee || [],
          "order.settleFee": json.data.settle_fee || [],
          'order.couponBind': couponBind || {},
          'order.couponBinded': couponBinded || {},
          'order.couponFee': json.data.coupon_fee || '',
          "order.show": true
        });
        that.checkoutCoupon().then(json => {
          // console.log(json)
          if (json.code * 1 != 0){
            if (json.code * 1 == 400) {
              that.setData({
                couponTxt: '暂无可用优惠券',
                limitCoupon: true
              })
            } else{
              that.setData({
                couponTxt: '优惠券拉取失败...',
                limitCoupon: true
              })
            }
          } else {
            if(!json.data){
              that.setData({
                couponTxt: '暂无可用优惠券',
                limitCoupon: true
              })
            } else {
              that.setData({
                couponTxt: '请选择优惠券',
                limitCoupon: false
              })
            }
            
          }
          
        });
        loading.hide();
      });
    });
  },
  callPhone: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.driver.phone
    })
  },
  cancelOrderCallPhone: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.driver.phone
    })
  },
  lookTrace: function () {
    if (!this.clickOff) return;
    this.clickOff = false;
    wx.navigateTo({ url: '../orderTrace/orderTrace?orderId=' + app.globalData.order.orderId });
  },
  commitOrderNotify() {
    let that = this;
    loading.show('确认支付中');
    that.getOrderPay({}, true).then(() => {
      // console.log('回调函数')
      let ordersArr = [{
        order_id: app.globalData.order.orderId
      }];
      // ordersArr.push(itemOrder);
      // console.log(ordersArr)
      let strOrdersArr = JSON.stringify(ordersArr);
      mPayNotify({
        token: app.globalData.userInfo.token,
        orders: strOrdersArr,
        pay_channel: 1
      }).then(function (json) {
        loading.hide();
        if (json.code != '0') {
          queryError(json.message);
          return;
        }
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1000,
          success: function () {
            that.isLimit = true;
            clearTimeout(that.timer);
            let onlineParam = that.isFromSelectDriver() ? "" : "&onlinePay=true";
            wx.navigateTo({ url: '../orderDetail/orderDetail?from=pay&orderId=' + app.globalData.order.orderId + onlineParam });
          }
        })
      });
    });
  },
  getCancelOrderPay() {
    let that = this;
    let params = {
      order_id: app.globalData.order.orderId,
      token: app.globalData.userInfo.token,
    }
    mOrderPay(params).then(json => {
      if (json.code != '0') {
        loading.hide();
        queryError(json.message);
        return;
      }
      let cancelFeeDetail = json.data.cancel_fee_detail;
      if (cancelFeeDetail.pay_status == '0') {
        that.timer && clearTimeout(that.timer);
        wx.reLaunch({ url: '../index/index' });
      } else {
        that.setData({
          "showcancelFee": true,
          "order.show": true,
          "order.start": cancelFeeDetail.location_start,
          "order.destination": cancelFeeDetail.location_end == '请输入目的地' ? '' : cancelFeeDetail.location_end,
          "driver.name": cancelFeeDetail.driver_name,
          "driver.time": new Date(parseInt(cancelFeeDetail.service_detail.booking_time + "000")).Format('MM月dd日 hh:mm'),
          "driver.phone": cancelFeeDetail.driver_phone,
          "cancelDesc": cancelFeeDetail.cancel_desc,
          "FeeDetail": cancelFeeDetail.fee_detail,
          "order.cast": (cancelFeeDetail.pay_detail.cash * 1).toFixed(2),
          "payDetail": cancelFeeDetail.pay_detail
        })
        loading.hide();

        clearTimeout(that.timer2);
        that.timer2 = setTimeout(function () {
          that.getCancelOrderPay();
        }, 10000);
      }

    });
  },
  sendFormId: function (formId) {
    let msg = {
      apiMethod: 'v1/api/weixin/collectFormId',
      phone: app.globalData.userInfo.phone,
      formId: formId,
      userId: app.globalData.userInfo.openId,
      messageType: 'trade',
    };
    mPostFormId(msg).then(function (res) {
      // console.log(res)
    })
  },
  commitOrder: function () {
    loading.show('正在支付中');
    var that = this;
    var fee = this.data.order.cast * 100;
    var params = {
      openid: app.globalData.userInfo.openId,
      token: app.globalData.userInfo.token,
      fee: fee,
      pay_detail: '[{"' + app.globalData.order.orderId + '":"' + fee + '"}]',
      channel: 88
    };
    mPayWx(params).then(function (json) {
      loading.hide();
      if (json.code != '0') {

        if (json.code * 1 == 4) {
          wx.showModal({
            content: '该订单已经支付',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                that.isLimit = true;
                clearTimeout(that.timer);
                if (that.data.payType == 'cancelFee') {
                  wx.reLaunch({ url: '../index/index' });
                } else {
                  wx.navigateTo({ url: '../orderDetail/orderDetail?from=pay&orderId=' + app.globalData.order.orderId });
                }

              }
            }
          });
        } else {
          queryError(json.message);
        }
        return;
      } else {
        that.setData({showPay:true})
        drawQrcode({
          width: app.globalData.windowWidth / 750 * 100,
          height: app.globalData.windowWidth / 750 * 100,
          canvasId: 'myQrcode',
          text: decodeURIComponent(json.data),
        })
      }
    });
  },
  onHide: function () {
    clearTimeout(this.timer);
    clearTimeout(this.timer2);
  },
  onUnload: function () {
    clearTimeout(this.timer);
    clearTimeout(this.timer2);
  },
  // 判断是否含有优惠券
  checkoutCoupon(callback) {
    let that = this, bType = '0';
    if (app.globalData.order.source == '173') {
      bType = '3'
    }
    let params = {
      token: app.globalData.userInfo.token,
      pageNO: 0,
      pageSize: 20,
      sort: 2,
      status: 1,
      price: that.data.order.income,
      b_type: bType, //请求优惠券列表时的类型
      channel_limited: 4,
      current_city_id: app.globalData.cityId,
      gps_type: app.globalData.configInfo.gpsType,
      order_time: 0,
      order_id: app.globalData.order.orderId
    }
    return new Promise(resolve => {
      mCouponList(params).then(function (json) {
        // console.log('couponcode', json)

        loading.hide();
        resolve(json);
      });
    })
  },
  //选券
  getCoupon() {
    let that = this;
    console.log('../coupon/coupon?bonusId=' + that.data.nowBonusId +
    '&price=' + that.data.order.income +
    '&orderId=' + app.globalData.order.orderId +
    "&couponBind=" + encodeURIComponent(JSON.stringify(this.data.order.couponBind)) +
    "&couponBinded=" + encodeURIComponent(JSON.stringify(this.data.order.couponBinded)) +
    "&userBonus=" + this.userBonus)
    if (!that.data.limitCoupon) {
      wx.navigateTo({
        url: encodeURI('../coupon/coupon?bonusId=' + that.data.nowBonusId +
          '&price=' + that.data.order.income +
          '&orderId=' + app.globalData.order.orderId +
          "&couponBind=" + encodeURIComponent(JSON.stringify(this.data.order.couponBind)) +
          "&couponBinded=" + encodeURIComponent(JSON.stringify(this.data.order.couponBinded)) +
          "&userBonus=" + this.userBonus)
      })
    }
  },
  //扫司机二维码下单的bookType是01001
  isFromSelectDriver() {
    if (app.globalData.bookingType && app.globalData.bookingType == '01001'){
      return true;
    }
    return false;
  },
  onShareAppMessage: app.shareConfig
})