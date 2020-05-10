
import { GPS } from '../../common/GPS';
import { loading, queryError, autoAdpatStyle } from '../../common/util';
import { mDriverTrace, mDriverPosition, mOrderCancel, mCancelFeeApi, mGpsLocation} from '../../common/actions';
var app = getApp()
  , realtimeDistance
  , waitTime
  , onlinePayStatus
  , orderStateCode;

Page({
  data: {
    pollingCount: 1,
    offOrderDetails: false,//控制跳转费用详情页
    modalHidden: true,
    stopTime: false,
    onOff: true,//全局只执行一次的开关
    xing: '../../res/xing.png',
    phoneIcon: '../../res/phone.png',
    driver: [],//
    newLevel: '',
    notice: '司机正在火速赶来，请保持电话畅通',
    map: {
      mapHeight: app.globalData.windowHeight - app.globalData.windowWidth / 750 * 180,
      btnHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 750 * 180 - app.globalData.windowWidth / 750 * 130) - 15,
      longitude: 0,
      latitude: 0,
      name: ""
    },
    markers: [
      {
        iconPath: '../../res/b-user.png',//下单的位置
        id: 2,
        latitude: 0,
        longitude: 0,
        width: 22,
        height: 21.5,
        anchor: {
          x: .5, y: .5
        },
      },
      {
        iconPath: '../../res/blue.png', //  用户位置
        id: 3,
        latitude: 0,
        longitude: 0,
        width: 22,
        height: 22,
        anchor: {
          x: .5, y: .5
        },
      },
      {
        iconPath: '../../res/b-loc.png', //  就位的位置
        id: 4,
        latitude: 0,
        longitude: 0,
        width: 22,
        height: 22,
        anchor: {
          x: .5, y: .5
        },
      },
      {
        iconPath: '../../res/driver-header.png',//司机实时位置
        id: 1,
        latitude: 0,
        longitude: 0,
        width: 31,
        height: 38,
        anchor: {
          x: .5, y: .5
        },
        callout: {
          content: '正在获取...',
          display: 'ALWAYS',
          color: '#000000',
          fontSize: 14,
          bgColor: '#ffffff',
          borderRadius: 60,
          padding: 10,
          border: '#293847'
        }
      },

    ],
    polyline: [],//轨迹
  },
  clickOrderDe: true,
  limitCancel: false,
  callPhone: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.driver.phone //仅为示例，并非真实的电话号码
    });
  },

  //气泡事件，跳转订单费用详情
  orderDetails: function () {
    if (!this.clickOrderDe) return;
    this.clickOrderDe = false;
    if (this.data.offOrderDetails) {
      wx.navigateTo({ url: '../costDetails/costDetails?orderId=' + app.globalData.order.orderId })
    };
  },

  //处理轨迹经纬度转化 百度-腾讯
  getPath(arg) {
    arg.map(function (item, index, array) {
      let { lon, lat } = GPS.bd_decrypt(item.lat, item.lng)
      item.longitude = lon;
      item.latitude = lat;
      delete item.lng;
      delete item.time;
      delete item.lat;
      return array;
    });
  },
  refreshRegion(latitude, longitude){
    let coord = GPS.bd_encrypt(latitude, longitude);
    this.gpsLocation(coord.lat, coord.lon).then(res => {
      app.globalData.storeStartAddress = {
        name: res.location.street.name,
        region: res.location.street.component.city,
        latitude: coord.lat,
        longitude: coord.lon
      };
    });
  },
  gpsLocation(latitude, longitude) {
    return new Promise((resolve, reject) => {
      mGpsLocation({
        latitude,
        longitude
      }).then(res => {
        if (res.code != 0) {
          wx.showModal({ title: res.message });
          return
        }
        resolve(res);
      })
    })
  },
  //订单轨迹
  getDriverTrace(params) {
    loading.hide();
    let that = this;
    if (that.data.stopTime) { return };
    setTimeout(function () {//后续时间设置30秒
      //that.setData({ pollingCount: +data.pollingCount + 1 });
      that.updateState();
    }, 30000);

    mDriverTrace(params).then(function (json) {
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      let data = json.data
        , { drive_distance, time_cost, total, collection_fee } = data.order_fee || []//订单费用详情
        , { order_state, accept_pos, current_pos, arrive_pos = "", } = data.order_states_info
        , acceptPos = GPS.bd_decrypt(accept_pos.lat, accept_pos.lng)//下单位置
        , currentPos = GPS.bd_decrypt(current_pos.lat, current_pos.lng)//当前位置
        , arrivePos = GPS.bd_decrypt(arrive_pos.lat, arrive_pos.lng);//就位位置
      that.getPath(data.arrive);//接单到就位坐标点集合
      that.getPath(data.drive);//开车到完成的坐标点集合
      data.drive.unshift(data.arrive.pop())//衔接以上2个数组

      that.refreshRegion(currentPos.lat, currentPos.lon);
      that.setData({
        'markers[3].latitude': currentPos.lat,//司机实时位置，当前位置
        'markers[3].longitude': currentPos.lon,
        'markers[0].latitude': acceptPos.lat,//下单位置
        'markers[0].longitude': acceptPos.lon,
        polyline: [{//渲染轨迹
          points: data.arrive,
          color: '#55bf77fa',
          width: 5,
        },
        {
          points: data.drive,
          color: '#55bf77fa',
          width: 5,
        }],
      });

      that.orderStateCode = orderStateCode;
      switch (orderStateCode) {
        case '301'://已接单
          let realtimeDis = realtimeDistance >= 1000 ? (parseFloat(realtimeDistance) / 1000).toFixed(1) + "公里" : realtimeDistance + "米";
          wx.setNavigationBarTitle({ title: '司机已接单' });
          that.setData({
            "markers[3].callout.content": '距离  ' + realtimeDis,
          })
          that.renderCancelTips(orderStateCode);
          break;
        case '302'://已就位
          wx.setNavigationBarTitle({ title: '司机已就位' });
          that.setData({
            'markers[3].callout.content': waitTime === '0' ? '司机就位' : '司机已等待  ' + waitTime + '分钟',
            'markers[3].iconPath': '../../res/o-loc.png',
            'markers[3].width': 22,
            'markers[3].height': 22,
          })
          that.renderCancelTips(orderStateCode);
          break;
        case '303'://已开车
          if (!data.order_fee) {
            drive_distance = '已行驶0公里'
          } else {
            drive_distance = '已行驶 | ' + drive_distance + '     ' + total + '元 >'
            that.setData({
              offOrderDetails: true
            })
          }
          wx.setNavigationBarTitle({ title: '代驾中' });
          that.setData({
            modalHidden: false,
            'markers[2].latitude': arrivePos.lat,
            'markers[2].longitude': arrivePos.lon,
            'markers[3].callout.content': drive_distance,
            'markers[3].callout.fontSize': 14,
            'markers[3].iconPath': '../../res/o-car.png',
            'markers[3].width': 22,
            'markers[3].height': 22,
            notice: '司机为您代驾中，可查看已行驶路程轨迹'
          })
          break;
        case '304'://司机到达目的地
          wx.setNavigationBarTitle({ title: '代驾结束' });
          that.setData({
            offOrderDetails: true,
            modalHidden: false,
            'markers[2].latitude': arrivePos.lat,
            'markers[2].longitude': arrivePos.lon,
            'markers[3].callout.content': total + '元 | ' + drive_distance + '      查看明细 >',
            'markers[3].callout.fontSize': 14,
            'markers[3].iconPath': '../../res/finish.png',
            'markers[3].width': 22,
            'markers[3].height': 22,
            'markers[1]': [],
            notice: '已到达指定地点，代驾结束，请确认费用并支付'
          });
          break;
        case '403'://用户取消
          that.removeShopId();
          app.globalData.storeEndAddress = null;
          app.globalData.storeStartAddress = null;
          wx.reLaunch({ url: '../index/index' });
          // console.log("用户取消")
          break;
        case '404':// 司机消单
          that.setData({ stopTime: true });
          wx.showModal({
            title: '司机已消单，请重新下单',
            showCancel: false,
            complete: function () {
              that.removeShopId();
              app.globalData.storeEndAddress = null;
              app.globalData.storeStartAddress = null;
              wx.reLaunch({ url: '../index/index' })
            }
          });
          break;
        case '501':// 司机报单
          console.log("司机报单，订单正式结束");
          wx.redirectTo({ url: '../pay/pay' });
          break;
      };
    });
  },
  renderCancelTips(orderStateCode){
    let that = this;
    let noticeText = '司机正在火速赶来，请保持电话畅通';
    if(orderStateCode == '302'){
      noticeText = '司机已经达到下单位置，请保持电话畅通'
    }

    mCancelFeeApi({
      order_id: app.globalData.order.orderId
    }).then(json => {
      loading.hide();
      if (json.code * 1 == 0) {
        let freeTime = new Date((parseInt(json.data.service_detail.accept_time) + json.data.calculator.free_minute * 60) * 1000).Format('hh:mm');
        noticeText = '司机正在火速赶来，' + freeTime + '后取消需支付取消费';
        if(orderStateCode == '302'){
          noticeText = freeTime + '后取消，将需支付取消费';
        }
      }
      that.setData({
        notice: noticeText
      });
    }).catch(err => {
      that.setData({
        notice: noticeText
      });
    });
  },
  /**
   * 跟新订单状态
   */
  updateState() {
    var that = this;
    if (that.data.stopTime) { return };
    if (that.data.onOff) { loading.show() };
    var params = {
      token: app.globalData.userInfo.token,
      bookingId: app.globalData.bookingId,
      driverId: app.globalData.order.driverId,
      order_id: app.globalData.order.orderId,
      pollingCount: this.data.pollingCount,
      gpsType: app.globalData.configInfo.gpsType,
    };
    mDriverPosition(params, function () {
      // console.log("mDriverPosition fail")
    }).then(function (json) {
      // console.log(json.data)
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      let driver = json.data.driver,
        { lon, lat } = GPS.bd_decrypt(driver.customerLat, driver.customerLng),//用户位置
        driverLoc = GPS.bd_decrypt(driver.latitude, driver.longitude);//用户位置
      realtimeDistance = driver.realtimeDistance;//司机距离用户实时距离
      waitTime = driver.waitTime;//司机等待时间
      orderStateCode = driver.orderStateCode;//订单的状态
      onlinePayStatus = driver.onlinePayStatus;
      if (that.data.onOff) {
        that.setData({
          'map.longitude': driverLoc.lon,//地图经纬度
          'map.latitude': driverLoc.lat,
          'markers[1].latitude': lat,//用户的位置
          'markers[1].longitude': lon,
          driver: driver,
          newLevel: parseFloat(driver.newLevel).toFixed(1),
          onOff: false
        });
      };
      that.getDriverTrace(params);
    }).catch(function () {
      that.getDriverTrace();
    })
  },

  // 取消订单对话框
  confirmCancel: function () {
    var that = this;
    console.log(that.orderStateCode)
    if (that.limitCancel) return;
    that.limitCancel = true;
    mCancelFeeApi({
      order_id: app.globalData.order.orderId
    }).then(json => {
      if(json.code * 1 != 0){
        if (json.code * 1 == 2){
          wx.showModal({
            title: '确认要取消当前订单吗？',
            success: function (res) {
              if (res.confirm) {
                // that.cancelOrder();
                wx.navigateTo({
                  url: '../cancelReason/cancelReason?orderStateCode=' + that.orderStateCode
                })
              } else if (res.cancel) {
                that.limitCancel = false;
              }
            }
          })
        } else {
          queryError(json.message);
        }
        return;
      }
      if (json.message == '司机已开车' || json.message == '请重新请求'){
        queryError(json.message);
        return;
      }
      wx.navigateTo({
        url: '../cancelFee/cancelFee',
      })
    })
  },

  // 取消订单
  cancelOrder: function () {
    let that = this;
    loading.show('取消订单中');
    mOrderCancel(app.globalData.userInfo.token, app.globalData.bookingId).then(function (json) {
      loading.hide(); 
      if (json.message != '司机服务中，不可取消订单') {
        that.removeShopId();
        app.globalData.storeEndAddress = null;
        app.globalData.storeStartAddress = null;
        wx.redirectTo({ url: '../index/index' })
      } else {
        wx.showModal({
          title: json.message,
          showCancel: false,
        });
      }
    });
  },

  removeShopId: function(){
    // 如果是e代叫商家二维码下单
    // if (app.globalData.shopId) {
    //   delete app.globalData.shopId
    // }
  },
  onLoad: function(query){
    if(query.bookingId){
      app.globalData.bookingTime = new Date(parseInt(query.orderTime + '000')).Format();
      app.globalData.bookingId = query.bookingId;
      app.globalData.bookingType = query.bookingType;
      app.globalData.bookingPhone = app.globalData.userInfo.phone;
    }
    autoAdpatStyle(this)
  },
  //监听页面显示
  onShow: function () {
    this.setData({ stopTime: false })
    this.clickOrderDe = true;
    this.limitCancel = false;
    this.updateState();
  },

  //监听页面卸载
  onUnload: function () {
    this.setData({ stopTime: true });
  },

  //监听页面隐藏
  onHide() {
    this.setData({ stopTime: true });
  },
  onShareAppMessage: app.shareConfig
});