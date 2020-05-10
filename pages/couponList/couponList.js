// pages/couponList/couponList.js
let app = getApp();
import { loading, queryError, wxPromisify, autoAdpatStyle } from '../../common/util';
import { mCouponList } from '../../common/actions';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponList:[],
    currentPage: 0,
    orderNo: 0,
    pageSize: 20,
    showEmpty: false,
    bType: 'all',
    skin: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    autoAdpatStyle(this)
    let that = this, title;
    if(options.from == 'index'){
      title = '可用优惠券';
    }else{
      title = '我的代驾券';
    }
    wx.setNavigationBarTitle({
      title: title
    });
    that.setData({
      bType: options.bType
    })
    that.getCouponList(false);
  },
  getCouponList(isPullDown){
    loading.show();
    let that = this;
    let bType = that.data.bType;
    if (app.globalData.order.source == '173') {
      bType = '3';
    }
    let params = {
      status: 1,
      token: app.globalData.userInfo.token,
      pageSize: that.data.pageSize,
      phone: app.globalData.userInfo.phone,
      pageNo: that.data.currentPage,
      sort: 2,
      current_city_id: app.globalData.cityId,
      b_type: bType, //请求优惠券列表时的类型
      channel_limited: 2,  //前置2 ，后置4
      gps_type: app.globalData.configInfo.gpsType,
      order_time: 0
    }
    mCouponList(params).then(function (json) {
      if(json.code != '0'){
        loading.hide();
        queryError(json.message);
        return;
      }
      let couponList = json.data;
      let currentPage = that.data.currentPage + 1;
      couponList = couponList.map((item, index) => {
        if(item.bonusType == 1) {
          item.money = parseInt(item.money);
        }
        return item;
      });
      that.setData({
        couponList: couponList,
        currentPage: currentPage,
        showEmpty: couponList.length > 0 ? false : true
      });
      loading.hide();
      if(isPullDown){
        wx.stopPullDownRefresh();
      }
    });
  },

  onPullDownRefresh: function () {
    this.getCouponList(true);
  },
  onShareAppMessage: app.shareConfig
})