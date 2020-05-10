import { mOrderDetail } from '../../common/actions';
import { loading, queryError, autoAdpatStyle } from '../../common/util';
let app = getApp();
Page({
  data: { 
    feeDetail: [],
    totalFee: '',
    detailgebied:'',
    skin:''
  },

  onLoad: function (options) {
    // console.log(app.globalData.nowLoc)
    loading.show();
    let that = this;
    autoAdpatStyle(that)
    mOrderDetail({
      token: app.globalData.userInfo.token,
      order_id: options.orderId
    }).then(function (json) {
      if (json.code != '0') {
        loading.hide();
        queryError(json.message);
        return;
      }
      let data = json.data;
      if(data.cancelFeeDetail){
        let cancelFee = data.cancelFeeDetail.feeDetail;
        let feeDetail = [
          {key: "等候费", value: cancelFee.waitFee + "元"},
          {key: "取消费", value: cancelFee.cancelFee + "元"}
        ];
        that.setData({
          totalFee: cancelFee.totalCost,
          feeDetail: feeDetail
        })
        return loading.hide();
      }
      let { collectionFee = [], settleFee = [], income = '' } = data;
      that.setData({
        detailgebied: '(' + collectionFee[0].key.split('(')[1]
      })
      collectionFee[0].key = collectionFee[0].key.split('(')[0];
      let feeList = [...collectionFee, ...settleFee];
      feeList.map((item, index) => {
        if(item.key.indexOf('抵扣') > -1 || item.key.indexOf('立减') > -1 || item.key.indexOf('现金') > -1){
          item.isReduce = true;
        }
      });
      that.setData({
        feeDetail: feeList,
        totalFee: income
      })
      loading.hide();
    });
  },
  onShareAppMessage: app.shareConfig
})