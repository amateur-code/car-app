import { mCostEstimate } from '../../common/actions';
import { GPS } from '../../common/GPS';
import { loading, queryError, autoAdpatStyle } from '../../common/util';
var app = getApp();

Page({

  data: {
    totalFee: '',
    feeDetail: [],
    city: '北京',
    skin: ''
  },
  getCity: function(){
    this.setData({
      city: app.globalData.cityPriceAddress.region
    })
  },
  onLoad: function (options) {
    autoAdpatStyle(this)
    loading.show();
    let that = this;
    that.getCity();
    let coordStart = GPS.bd_encrypt(options.start_lat, options.start_lng),
      coordEnd = GPS.bd_encrypt(options.end_lat, options.end_lng);
    let params = {
      token: app.globalData.userInfo.token,
      start_lat: coordStart.lat,
      start_lng: coordStart.lon,
      end_lat: coordEnd.lat,
      end_lng: coordEnd.lon,
      gps_type: app.globalData.configInfo.gpsType,
      channel: options.channel,
      address_to: options.address_to,
      address_from: options.address_from,
      source: options.source,
      is_select_bonus: 0
    }
    mCostEstimate(params).then(function (json) {
      loading.hide();
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      let feeDetail = json.feeDetail;
      feeDetail.map((item, index) => {
        if(item.key.indexOf('抵扣') > -1 || item.key.indexOf('立减') > -1 || item.key.indexOf('现金') > -1){
          item.isReduce = true;
        }
      });
      that.setData({
        totalFee: parseFloat(json.fee).toFixed(2),
        feeDetail: feeDetail
      })
    });
  },
  onShareAppMessage: app.shareConfig
})