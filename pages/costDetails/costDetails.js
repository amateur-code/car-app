import { mOrderTrace } from '../../common/actions';
import { loading, queryError} from '../../common/util';
let app = getApp();
Page({
  data: {
    ruleTop: app.globalData.windowHeight - app.globalData.windowWidth / 750 - 60,
    feeDetail: [],
    totalFee: '',
    region: '北京'
  },
  // 获取城市列表
  getCity: function(){
    let that = this;
    that.setData({
      region: app.globalData.storeStartAddress.region
    });
  },
  onLoad: function (options) {
    // console.log(app.globalData.nowLoc)
    loading.show();
    let that = this;
    that.getCity();
    mOrderTrace({
      token: app.globalData.userInfo.token,
      order_id: options.orderId
    }).then(function (json) {
      if (json.code != '0') {
        queryError(json.message);
        return;
      }
      let { total, collection_fee } = json.data.order_fee;
      collection_fee.map((item, index) => {
        if(item.key.indexOf('抵扣') > -1 || item.key.indexOf('立减') > -1 || item.key.indexOf('现金') > -1){
          item.isReduce = true;
        }
      });
      that.setData({
        feeDetail: collection_fee,
        totalFee: total
      });
      loading.hide();
    });
  },
  onShareAppMessage: app.shareConfig
})