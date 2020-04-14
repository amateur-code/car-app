import { loading, queryError } from '../../common/util';
import { mCouponList } from '../../common/actions';
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    dataList: {},
    isList: false
  },
  onLoad: function (options) {
    this.userBonus = options.userBonus;
    this.couponBind = JSON.parse(decodeURIComponent(decodeURIComponent(options.couponBind)));
    this.couponBinded = JSON.parse(decodeURIComponent(decodeURIComponent(options.couponBinded)));
    let that = this, bType = '0';
    loading.show('加载中...');
    if (app.globalData.order.source == '173') {
      bType = '3'
    }
    let params = {
      token: app.globalData.userInfo.token,
      pageNO: 0,
      pageSize: 20,
      sort: 2,
      status: 1,
      price: options.price,
      b_type: bType, //请求优惠券列表时的类型
      channel_limited: 4,
      current_city_id: app.globalData.cityId,
      gps_type: 'baidu',
      order_time: 0,
      order_id: app.globalData.order.orderId
    }
    mCouponList(params).then((json) => {
      loading.hide();
      if (json.code != 0) {
        if (json.code == 600 || json.code == 400) {
          that.setData({
            isList: true
          });
        }
        if(json.code != 400 ) queryError(json.message);
        return;
      } else if (json.data.length > 0) {
        let couponListData = json.data;
        if(this.couponBind && this.couponBind.id){
          couponListData = couponListData.filter(item => item.id != this.couponBind.id);
          couponListData.unshift(this.couponBind);
        }
        if(this.couponBinded && this.couponBinded.id){
          couponListData = couponListData.filter(item => item.id != this.couponBinded.id);
          couponListData.unshift(this.couponBinded);
        }
        console.log(this.couponBind)
        couponListData.map(item => {
          item.isChecked = ((item.id == this.couponBind.id) && (this.userBonus != 'false'));
          item.bonusType = item.bonusType || item.bonus_type;
          item.numberForShow = item.numberForShow || item.number_for_show;
          item.unitForShow = item.unitForShow || item.unit_for_show;
          item.limitTime = item.limitTime || item.limit_time;
        });
        that.setData({
          dataList: couponListData
        });
      } else {
        let couponListData = json.data;
        if(this.couponBind.id){
          couponListData = couponListData.filter(item => item.id != this.couponBind.id);
          couponListData.unshift(this.couponBind);
        }
        if(this.couponBinded.id){
          couponListData = couponListData.filter(item => item.id != this.couponBinded.id);
          couponListData.unshift(this.couponBinded);
        }
        couponListData.map(item => {
          item.isChecked = (item.id == this.couponBind.id && this.userBonus == 'true');
          item.bonusType = item.bonusType || item.bonus_type;
          item.numberForShow = item.numberForShow || item.number_for_show;
          item.unitForShow = item.unitForShow || item.unit_for_show;
          item.limitTime = item.limitTime || item.limit_time;
        });
        that.setData({
          isList: couponListData.length > 0 ? false : true,
          dataList: couponListData
        });
      }
    });
  },
  getCouponId(e) {
    let checkedIndex = e.currentTarget.dataset.index;
    let list = this.data.dataList;
    list.forEach((item, index) => {
      if (index == checkedIndex) {
        if (!item.isChecked) {
          app.globalData.couponId = item.id
        } else {
          app.globalData.couponId = ""
        }
        item.isChecked = !item.isChecked;
      } else {
        item.isChecked = false;
      }
    });
    this.setData({
      dataList: list
    });
  },
  onShareAppMessage: app.shareConfig
})