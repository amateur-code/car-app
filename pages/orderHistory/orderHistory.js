// pages/orderHistory/orderHistory.js
let app = getApp();
import { loading, queryError, autoAdpatStyle } from '../../common/util';
import { mGetOrderHistory } from '../../common/actions';

Page({
  data: {
    orderList: [],
    pageSize: 10,
    currentPage: 0,
    orderNo: 0,
    hasMoreOrder: false,
    showEmpty: false,
    skin: ''
  },
  onLoad: function (options) {
    autoAdpatStyle(this)
    this.getOrderHistory()
  },
  goDetail(e){
    console.log('orderId=' + e.currentTarget.dataset.orderid + '&fromHistory=true&status=' + e.currentTarget.dataset.status)
    wx.navigateTo({ 
      url: '../orderDetail/orderDetail?orderId=' + e.currentTarget.dataset.orderid + '&fromHistory=true&status=' + e.currentTarget.dataset.status 
    });
  },
  getMore(){
    if(!this.data.hasMoreOrder){return;}
    let that = this;
    that.getOrderHistory();
  },
  getOrderHistory(isPullDown){
    loading.show();
    let that = this;
    let params = {
      token: app.globalData.userInfo.token,
      pageSize: that.data.pageSize,
      pageNo: that.data.currentPage
    }
    if(isPullDown){
      params.pageNo = 0;
    }
    mGetOrderHistory(params).then(function (json) {
      if(json.code != '0'){
        loading.hide();
        queryError(json.message);
        return;
      }
      let data = json.data;
      let orderList = data.orderList;
      let hasMoreOrder, currentPage = that.data.currentPage + 1;
      orderList = orderList.map((item, index) => {
        item.create_time = that.formatTime(new Date(item.create_time * 1000));
        return item
      });
      if(isPullDown){
        if(data.orderCount > that.data.pageSize){
          hasMoreOrder = true;
        }else{
          hasMoreOrder = false;
        }
        loading.hide();
        wx.stopPullDownRefresh();
        return that.setData({
          orderList: orderList,
          orderNo : data.orderCount,
          hasMoreOrder: hasMoreOrder,
          showEmpty: orderList.length > 0 ? false : true
        });
      }
      orderList = that.data.orderList.concat(orderList);
      if(data.orderCount > that.data.pageSize * currentPage){
        hasMoreOrder = true;
      }else{
        hasMoreOrder = false;
      }
      that.setData({
        orderList: orderList,
        orderNo : data.orderCount,
        hasMoreOrder: hasMoreOrder,
        currentPage: currentPage,
        showEmpty: orderList.length > 0 ? false : true
      });
      loading.hide();
      wx.stopPullDownRefresh();
    });
  },

  formatTime(date, format){
    format = format || "yyyy-MM-dd hh:mm:ss";
    var list = {
      "y+": String(date.getFullYear()), //年
      "M+": String(date.getMonth() + 1), //月份 
      "d+": String(date.getDate()), //日 
      "h+": String(date.getHours()), //小时 
      "m+": String(date.getMinutes()), //分 
      "s+": String(date.getSeconds()), //秒 
      "q+": String(Math.floor((date.getMonth() + 3) / 3)), //季度 
      "S": String(date.getMilliseconds()) //毫秒 
  
    };
    Object.keys(list).map(function (key) {
      var reg = new RegExp("(" + key + ")", 'g');
      format = format.replace(reg, function (fmt) {
        if (/y+/.test(fmt)) return list[key].substr(4 - fmt.length);
        return fmt.length == 1 ? list[key] : ("00" + list[key]).substr(list[key].length);
      });
    })
    return format;
  },

  onPullDownRefresh: function () {
    this.getOrderHistory(true);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.getMore();
  },
  onShareAppMessage: app.shareConfig
})