import { loading, queryError, autoAdpatStyle } from '../../common/util';
import { mOrderDetail, mDriverTag, mAddComment } from '../../common/actions';
let app = getApp();

Page({
  clickOff: true,
  data: {
    starList: [{
      grade: 1,
      iconPath: '../../res/star-gray.png'
    },
    {
      grade: 2,
      iconPath: '../../res/star-gray.png'
    },
    {
      grade: 3,
      iconPath: '../../res/star-gray.png'
    },
    {
      grade: 4,
      iconPath: '../../res/star-gray.png'
    },
    {
      grade: 5,
      iconPath: '../../res/star-gray.png'
    }],
    remarks: [
      { detail: "", code: "1" },
      { detail: "", code: "2" },
      { detail: "", code: "3" },
      { detail: "", code: "4" },
      { detail: "", code: "5" },
      { detail: "", code: "6" }
    ],
    showComment: false,
    currentItemId: 0,
    checked: false,
    title: '匿名评价司机',
    flag: {
      show: false,
      text: '请填写您对司机服务的意见'
    },
    showFee: true,
    orderChannel: "",
    onlinePayTag: false
  },
  commentInfo: {
    level: 0,
    codeList: [],
    message: '无',
    is_complain: 0
  },
  grayStarPath: '../../res/star-gray.png',
  lightStarPath: '../../res/star-light.png',
  isCommentClick: false,
  driverId: '',
  gotoIndex: true,
  allRemarks: null,
  getOrderDetail: function (orderId) {
    let that = this;
    mOrderDetail({
      token: app.globalData.userInfo.token,
      order_id: orderId
    }).then(function (json) {
      if (that.data.onlinePayTag) {
        that.setData({
          onlinePayTag: false
        })
      }

      if (json.code != '0') {
        loading.hide();
        queryError(json.message, true);
        return;
      }
      let data = json.data;
      if (that.data.status * 1 == 2) {
        if (!data.cancelFeeDetail || Object.keys(data.cancelFeeDetail).length == 0) {
          that.setData({
            showFee: false
          });
        }
      }
      let time_arr = new Date(parseInt(data.createTime) * 1000).Format('yyyy-MM-dd hh:mm'),
        time_diff = parseInt(data.endTime) - parseInt(data.startTime);
      if (data.endTime == 0) {
        time_diff = 0;
      }
      let income = data.income;
      if(data.income * 1 == 0 && data.cancelFeeDetail && data.cancelFeeDetail.feeDetail && data.cancelFeeDetail.feeDetail.totalCost){
        income = data.cancelFeeDetail.feeDetail.totalCost;
      }
      that.setData({
        'order.orderId': data.orderId,
        'order.driverImg': data.driver.pictureSmall,
        'order.driverName': data.driver.name || '',
        'order.driverId': data.driver.name ? data.driver.driverId : '',
        'order.driverYear': data.driver.year || '',
        'order.time': time_arr,
        'order.locationStart': data.locationStart,
        'order.locationEnd': data.locationEnd,
        'order.income': income,
        'order.distance': data.distance,
        'order.costTime': parseInt(time_diff / 60),
        'order.cancelOrderJson': data.cancelOrderJson ? data.cancelOrderJson : '',
        orderChannel: data.channel
      });
      that.driverId = data.driver.driverId;
      if (data.isComment === 'N') {
        that.isCommentClick = true;
      } else {
        that.isCommentClick = false;
        that.setData({
          title: '已评价',
          showComment: false
        });
        that.changeStar(data.level);
      }
      loading.hide();
    });
  },
  lookTrace: function () {
    if (!this.clickOff) return;
    this.clickOff = false;
    wx.navigateTo({ url: '../orderTrace/orderTrace?orderId=' + this.data.order.orderId });
  },
  costDetail: function () {
    if (!this.clickOff) return;
    this.clickOff = false;
    // wx.navigateTo({ url: '../costDetails/costDetails?orderId=' + this.data.order.orderId });
    wx.navigateTo({ url: '../historyDetail/historyDetail?orderId=' + this.data.order.orderId });
  },
  clickStar: function (e) {
    // console.log(wx.pageScrollTo) // 真机为null 版本6.6.1
    let that = this;
    if (!that.isCommentClick || !e.target.id) return;
    that.changeStar(e.target.id, function () {
      that.setData({ showComment: true });
      if (that.allRemarks) {
        that.allRemarks[e.target.id].map(function (item, index) {
          that.allRemarks[e.target.id][index]['active'] = '';
        })
        that.setData({ remarks: that.allRemarks[e.target.id] })
      } else {
        that.getDriverTag(e.target.id);
      }
      that.commentInfo.level = e.target.id;
    });
  },
  // 获取司机评价标签
  getDriverTag: function (id) {
    let that = this;
    mDriverTag({
      token: app.globalData.userInfo.token,
      driver_id: that.driverId
    }).then(function (json) {
      if (json.code != '0') {
        queryError(message);
        return;
      }
      that.allRemarks = json['driver.remarks'];
      that.allRemarks[id].map(function (item, index) {
        that.allRemarks[id][index]['active'] = '';
      })
      that.setData({
        remarks: that.allRemarks[id]
      })
    });
  },
  chooseTag: function (e) {
    let that = this;
    if (!e.target.dataset.code) return;
    let c_remarks = that.data.remarks,
      key = e.target.dataset.active,
      _index = e.target.dataset.index;
    c_remarks.map(function (item, index) {
      if (key == '') {
        c_remarks[_index].active = '1';
      } else {
        c_remarks[_index].active = '';
      }
    })
    that.setData({
      remarks: c_remarks
    })
  },
  // 数组去重
  getCodeList: function () {
    let that = this, t_codeList = [];
    that.data.remarks.forEach(function (item) {
      if (item.active == '1') {
        t_codeList.push(item.code);
      }
    })
    return t_codeList;
  },
  
  changeStar: function (level, callback) {
    let that = this;
    let newStarList = that.data.starList;
    newStarList.map(function (item, index) {
      if (index < level) {
        item.iconPath = that.lightStarPath;
      } else {
        item.iconPath = that.grayStarPath;
      }
    })
    that.setData({
      starList: newStarList
    })
    if (callback) callback();
  },
  getTextarea: function (e) {
    // console.log(e.detail.value)
    this.commentInfo.message = e.detail.value;
  },
  commitComment: function () {
    let that = this;
    if (that.commentInfo.level <= 4 && that.getCodeList().length < 1) {
      that.flagShow();
      return;
    };
    that.commentInfo.codeList = that.getCodeList();
    let params = {
      token: app.globalData.userInfo.token,
      order_id: that.data.order.orderId,
      driver_id: that.driverId,
      level: that.commentInfo.level,
      reason_codes: that.commentInfo.codeList,
      content: that.commentInfo.message || '无',
      is_complain: that.commentInfo.is_complain
    }
    loading.show();
    mAddComment(params).then(function (json) {
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      wx.showToast({
        title: '评价成功',
        icon: 'success',
        duration: 2000,
        success: function () {
          that.getOrderDetail(that.data.order.orderId);
          if (!that.isFromSelectDriver()) {
          } else{
            that.jumpToIndex();
          }
        },
        fail: function () {

        }
      })
    });
  },
  flagShow: function () {
    let that = this;
    that.setData({ 'flag.show': true });
    let timer = setTimeout(function () {
      that.setData({ 'flag.show': false });
      clearTimeout(timer);
    }, 800)
  },
  isFromSelectDriver: function () {
    if (this.data.orderChannel && this.data.orderChannel == '01001'){
      return true;
    }
    return false;
  },
  jumpToIndex: function () {
    let that = this;
    that.jumpTimer&&clearTimeout(that.jumpTimer);
    that.jumpTimer = setTimeout(function () {
      if (that.gotoIndex) {
        that.gotoIndex = false;
        wx.reLaunch({ url: '../index/index?entrance=comment' });
      }
    }, 1000);
  },
  onLoad: function (options) {
    console.log(options);
    loading.show();
    autoAdpatStyle(this)
    let that = this;
    if (options && options.from && options.from == 'pay') {
      app.globalData.detailToIndex = true;
      app.globalData.storeStartAddress = null;
    }

    that.setData({
      onlinePayTag: options.onlinePay?true:false
    })

    if (options && options.status) {
      this.setData({
        status: options.status
      });
    };
    that.getOrderDetail(options.orderId);
  },
  onShow: function () {
    this.clickOff = true;
  },
  onUnload: function () {
    if(this.jumpTimer){
      clearTimeout(this.jumpTimer);
    }
  },
  onShareAppMessage: app.shareConfig
})