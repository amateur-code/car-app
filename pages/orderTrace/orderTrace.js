import { GPS } from '../../common/GPS';
import { 
  loading, 
  queryError
} from '../../common/util';
import { 
  mDriverTrace,
  mDriverTraceInner 
} from '../../common/actions';

let app = getApp();

Page({
  data: {
    height: app.globalData.windowHeight,
    markers: [{
      iconPath: "../../res/b-loc.png",
      id: 0,
      latitude: 0,
      longitude: 0,
      width: 30,
      height: 30,
      callout: {
        content: '代驾开始',
        display: 'ALWAYS',
        color: '#ffffff',
        fontSize: 12,
        bgColor: "#293847",
        borderRadius: 6,
        padding: 9,
        border: "#293847"
      }
    },{
      iconPath: "../../res/finish.png",
      id: 1,
      latitude: 0,
      longitude: 0,
      width: 30,
      height: 30,
      callout: {
        content: '代驾结束',
        display: 'ALWAYS',
        color: '#ffffff',
        fontSize: 12,
        bgColor: "#293847",
        borderRadius: 6,
        padding: 9,
        border: "#293847"
      }
    }],
    includePoints: [],
    polyline: [{
      points: [],
      color: "#56c076",
      width: 5,
      dottedLine: false
    }],
    showMap: false
  },
  // 渲染轨迹
  getTrace: function (orderId, cashier){
    loading.show();
    let that = this,
      driverTraceApi = null;
    if (cashier){
      driverTraceApi = mDriverTraceInner({
        order_id: orderId
      })
    } else {
      driverTraceApi = mDriverTrace({
        token: app.globalData.userInfo.token,
        order_id: orderId
      });
    }
    driverTraceApi.then(function(json){
      if(json.code != '0'){
        loading.hide();
        queryError(json.message, true);
        return;
      }
      
      let traceArr = json.data.drive; 
      if (traceArr.length <= 0) {
        traceArr.push({
          lat: app.globalData.nowLoc.latitude || '',
          lng: app.globalData.nowLoc.longitude || '',
          time: json.data.drive_time == 0 ? '' : json.data.drive_time
        })
      }
      if(traceArr[traceArr.length - 1].time == 0){
        that.setData({
          ['markers[' + 1 + '].callout.content']: '代驾结束'
        });
      }else{
        that.setData({
          ['markers[' + 0 + '].callout.content']: '代驾开始(' + new Date(parseInt(traceArr[0].time + "000")).Format('MM-dd hh:mm') + ')',
          ['markers[' + 1 + '].callout.content']: '代驾结束(' + new Date(parseInt(traceArr[traceArr.length - 1].time + "000")).Format('MM-dd hh:mm') + ')'
        });
      }
      if (traceArr) that.getPath(traceArr);
      let startLoc = traceArr[0];
      let endLoc = traceArr[traceArr.length - 1];
      that.setData({
        includePoints: traceArr,
        ['polyline[' + 0 + '].points']: traceArr,
        ['markers[' + 0 + '].latitude']: startLoc.latitude || '',
        ['markers[' + 0 + '].longitude']: startLoc.longitude || ''
      })
      if (json.data.finish_time != 0) {
        that.setData({
          ['markers[' + 1 + '].latitude']: endLoc.latitude || '',
          ['markers[' + 1 + '].longitude']: endLoc.longitude || ''
        })
      }
      setTimeout(() => {
        that.setData({
          showMap: true
        });
        loading.hide();
      }, 500);
    });
  },
  // 处理接口返回的数据
  getPath: function(arg){
    arg.map(function (item, index, array) {
      let { lon, lat } = GPS.bd_decrypt(item.lat, item.lng);
      item.longitude = lon;
      item.latitude = lat;
      delete item.lat;
      delete item.lng;
      delete item.time;
      return array;
    })
  },
  onLoad: function (options) {
    let that = this,
      cashier = false;
    that.setData(app.globalData)
    if (options.cashier){
      cashier = true
    }
    that.getTrace(options.orderId, cashier);
    
  },
  onShareAppMessage: app.shareConfig
})