import { 
  loading, 
  queryError 
} from '../../common/util';

import { 
  mOrderFeeInner, 
  mPayWx 
} from '../../common/actions';

let app = getApp();

Page({
  data: {
    openId: '',
    orderId: '',
    order: {}
  },
  onLoad: function (query) {
    let _t = this;
    // query.q = 'https://h5.d.edaijia.cn/driver-app-client/unpaid-order/index.html?orderId=973475982';
    let data = decodeURIComponent(query.q).split("?")[1];
    let regExp = /^(orderId=)+.*/g;
    if (!regExp.test(data)) {
      wx.showModal({
        title: "提示",
        content: "请扫描正确的二维码",
        showCancel: false
      });
      return;
    } 

    this.orderId = data.split('=')[1];
    app.getWeChatUserInfo().then(res => {
      _t.openId = res.openId;
      this.getOrderPay({
        orderId: this.orderId
      });

    });
  },
  onShow: function () {},
  // 确认支付
  getOrderPay(params) {
    let that = this;
    loading.show();
    mOrderFeeInner({
      order_id: params.orderId,
      is_need_coupon: 1,
    }).then((json) => {
      if (json.code != '0') {
        loading.hide();
        queryError(json.message);
        return;
      };
      that.setData({
        "order": json.data,
        "order.order_time": new Date(parseInt(json.data.order_info.order_time + "000")).Format('yyyy年MM月dd日 hh:mm'),
        "order.show": true
      });
      loading.hide();
    });
  },
  // 查看路径
  lookTrace: function () {
    wx.navigateTo({ url: '../orderTrace/orderTrace?orderId=' + this.orderId + '&cashier=1' });
  },
  // 确认支付
  commitOrder: function () {
    loading.show('正在支付中');
    var that = this;
    var fee = this.data.order.need_pay.money * 100;
    var params = {
      openid: that.openId,
      fee: fee,
      pay_detail: '[{"' + that.orderId + '":"' + fee + '"}]',
      channel: 91,//微信小程序扫码支付

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
                wx.reLaunch({ url: '../index/index' });
              }
            }
          });
        } else {
          queryError(json.message);
        }
      } else {
        wx.requestPayment({
          'timeStamp': json.data.timeStamp,
          'nonceStr': json.data.nonceStr,
          'package': json.data.package,
          'signType': json.data.signType,
          'paySign': json.data.paySign,
          'success': function (res) {
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 1000,
              success: function () {
                wx.reLaunch({
                  url: '../index/index',
                });
              }
            })
          },
          'fail': function (res) {
            wx.showToast({
              title: '支付失败',
              image: '../../res/fail.png',
              duration: 1000
            });
          }
        });
      }
    });
  },

  onHide: function () {
    
  },
  onUnload: function () {
   
  },
  onShareAppMessage: app.shareConfig
})