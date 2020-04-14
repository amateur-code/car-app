import {
  mRedPacketInfo
} from "./actions";

let app = getApp();

let redPacket = {
  data: {
    triggerAction: '',
    info: {}
  },
  getData(param) {
    //openIndex,predict,evaluateSuccess,onlinePaySuccess,call400
    let that = this;
    that.data.triggerAction = param.triggerAction;
    Object.assign(param, {
      apiMethod: 'v2/api/activity/landing-award',
      longitude: app.globalData.nowLoc.longitude,
      latitude: app.globalData.nowLoc.latitude,
      token: app.globalData.userInfo.token,
      cityId: app.globalData.cityId,
      triggerChannel:'WeChat',
    })
    return new Promise((resolve, reject) => {
      mRedPacketInfo(param).then(json => {
        console.log(json)
        // json = {
        //   code: "0",
        //   message: "success",
        //   data: {
        //     activityId: "rrryy666",
        //     activityName: "6666r'r",
        //     activityDesc: "",
        //     triggerWay: "popupDirect",
        //     triggerContent: {
        //       insidePushContent: "内容内容内容内容内容内容内容内容",
        //       insidePushUrl: "edaijia://9",
        //       insidePushTitle: "标题",
        //       popupManualUrl: "http://pic.edaijia.cn/activity_platform/5f4c0d5436aa42a6b4569ba7d964644c.png",
        //       drawAwardUrl: "https://h5.d.edaijia.cn/user-app-client/surprised-gift/index.html",
        //       popupDirectUrl: "http://pic.edaijia.cn/activity_platform/5f4c0d5436aa42a6b4569ba7d964644c.png",
        //       backgroundColor: ""
        //     },
        //     awardInfo: {
        //       awardId: "awardId_5d5fca664a94cc545113d5de",
        //       awardName: "优惠券-固定码",
        //       awardDesc: "奖品描述",//20190820
        //       awardType: "coupon", //奖品类型 coupon券 blackGold黑金 outsideCoupon 外部券
        //       deliverAwardNum: 8888, //发放奖品数量
        //       couponList: [
        //         {
        //           bonusSn: "664550237759",
        //           name: "50元优惠劵",
        //           endDate: "2019-09-02 23:59:00",
        //           numberForShow: "50",
        //           unitForShow: "元",
        //           maxAmount: "0.0",
        //           money: "50.0"
        //         },
        //         {
        //           bonusSn: "626566594331",
        //           name: "30元优惠劵",
        //           endDate: "2019-09-02 23:59:00",
        //           numberForShow: "30",
        //           unitForShow: "元",
        //           maxAmount: "0.0",
        //           money: "30.0"
        //         },
        //         {
        //           bonusSn: "976638774023",
        //           name: "40元优惠劵",
        //           endDate: "2019-09-02 23:59:00",
        //           numberForShow: "40",
        //           unitForShow: "元",
        //           maxAmount: "0.0",
        //           money: "40.0"
        //         }
        //       ],
        //       blackGold: {
        //         discount: "0.88" //折扣
        //        }
        //     },
        //     isShow: 1,
        //     receiptType: "popupDirect"
        //   }
        // }
        let info = json.data;
        that.data.info[param.triggerAction] = info;
        if (json.code * 1 != 0) {
          reject(json)
          return;
        }
        if (info.isShow * 1 != 1) {
          return;
        }
        info.showViewType = that.getShowType(info);
        info.showHeiJin = that.getIsShowHeijin(info);
        info.triggerChannel = 'WeChat';
        info.triggerAction = param.triggerAction;
        that.sendReceiptMsg(info, param);
        resolve(info)
      })
    }).catch((e) => {
      // queryError(e.message || '网络错误')
    })
  },

  getShowType(msg) {
    let type = 1;
    if (msg.triggerWay == 'insidePush') {//端内
      type = 1;
    } else if (msg.triggerWay == 'popupManual') {//手动
      type = 3;
    } else if (msg.triggerWay == 'popupDirect') {//自动
      if (msg.awardInfo.awardType == 'coupon') {
        type = 2;
      } else if (msg.awardInfo.awardType == 'blackGold') {
        type = 4;
      } else { }
    } else { }
    return type;
  },

  getIsShowHeijin(msg) {
    let show = false;
    if (msg.triggerWay == 'popupDirect') {
      if (msg.awardInfo.awardType == 'blackGold') {
        show = true;
      }
    }
    return show;
  },

  sendReceiptMsg(msg, param) {
    let param2 = {
      activityId: msg.activityId,
      awardId: msg.awardInfo.awardId,
      receiptType: msg.receiptType,
      triggerAction: param.triggerAction,
      token: app.globalData.userInfo.token,
      cityId: app.globalData.cityId,
      apiMethod: 'v1/api/activity/landing-award/receipt',
      triggerChannel: 'WeChat',
    }
    mRedPacketInfo(param2).then(info => {
      //回执消息不用处理
    })
  },
}

export {
  redPacket
}