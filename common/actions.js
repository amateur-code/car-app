import configInfo from "./config";
import { 
  getOpen,
  postOpen,
  getAct,
  postAct,
  getProxy,
  postProxy 
} from "./request";

/**
 * 获取openId
 */
export const mWechatForward = params => {
  Object.assign(params, {
    type: 'openid',
    businessType: 1,
    apiUrl: "alipayProgram/getAuthToken",
  });
  return getOpen(params);
}

/**
 * 获取推荐起始地
 * @param {*} params
 */
export const mGetNearbypois = params => {
  Object.assign(params, {
    apiUrl: "gps/nearbypois",
    gpsType: configInfo.gpsType
  })
  return getOpen(params);
}

/**
 * 登录提交
 */
export const mCLogin = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/login',
    os: '',
    verify_type: 1,
    business: 'edaijia_h5'
  });
  return getOpen(params);
}

/**
 * 获取验证码
 */
export const mGetSms = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/prelogin',
    business: 'edaijia_h5'
  });
  return getOpen(params);
}

/**
 * 订单提交
 */
export const mNoworderCommit = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/order/multi',
  });
  return postOpen(params);
}

/**
 * 单店下单
 */
export const mOpenOrderCommit = params => {
  Object.assign(params, {
    apiUrl: 'order/commit',
  });
  return postOpen(params);
}

/**
 * 选司机下单提交
 */
export const mSelectDriverOrderCommit = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/order/single',
  });
  return getOpen(params);
}

/**
 * 经纬度转地理位置信息
 */
export const mGpsLocation = params => {
  Object.assign(params, {
    apiUrl: 'gps/location',
    gpsType: configInfo.gpsType
  });
  return getOpen(params);
}

/**
 * 获取为我服务的司机
 */
export const mMyDrivers = (params) => {
  Object.assign(params, {
    apiUrl: 'customer/info/drivers',
    gpsType: configInfo.gpsType
  });
  return getOpen(params);
}

/**
 * 周围司机列表
 */
export const mDriversList = params => {
  Object.assign(params, {
    apiUrl: 'driver/idle/list',
    gpsType: configInfo.gpsType
  });
  return getOpen(params);
}

/**
 * 获取检索地址列表
 */
export const mGpsStreet = params => {
  Object.assign(params, {
    apiUrl: 'gps/baidu/street',
  });
  return getOpen(params);
}

/**
 * 预估价
 */

export const mCostEstimate = params => {
  Object.assign(params, {
    apiUrl: "oeapi/costestimate",
    gps_type: configInfo.gpsType,
    is_select_bonus: 0,
    channel: configInfo.channel.normalChanel
  })
  return getOpen(params);
};

/**
 * 联系司机
 */
export const mOrderPolling = params => {
  Object.assign(params, {
    apiUrl: "order/polling",
  })
  return getOpen(params);
};

/**
 * 取消订单
 */
export const mOrderCancel = params => {
  Object.assign(params, {
    type: 2,
    apiUrl: "order/cancel",
  })
  return postOpen(params);
};

/**
 * 服务司机位置
 */
export const mDriverPosition = params => {
  Object.assign(params, {
    type: 2,
    apiUrl: "driver/position",
  })
  return postOpen(params);
};

/**
 * 支付订单详情
 */
export const mOrderPay = params => {
  Object.assign(params, {
    apiUrl: "oapi/order/pay",
  })
  return postOpen(params);
};


/**
 * 微信支付服务
 */
export const mPayWx = params => {
  Object.assign(params, {
    apiUrl: "oeapi/payWx",
  })
  return postOpen(params);
};

/**
 * 评价订单明细
 */
export const mOrderDetail = params => {
  Object.assign(params, {
    apiUrl: "oeapi/order/historyDetail",
  })
  return postOpen(params);
};


/**
 * 获取评价信息
 */
export const mDriverTag = params => {
  Object.assign(params, {
    apiUrl: "oeapi/driver/tag",
  })
  return postOpen(params);
};

// /**
//  * 评价
//  */
export const mAddComment = params => {
  Object.assign(params, {
    apiUrl: "oeapi/order/comment",
  });
  return postOpen(params);
};

/**
 * 订单轨迹
 */
export const mDriverTrace = params => {
  Object.assign(params, {
    apiUrl: "oapi/order/trace", 
  })
  return postOpen(params);
};

/**
 * 静态订单轨迹
 */
export const mOrderTrace = params => {
  Object.assign(params, {
    apiUrl: "oapi/order/trace",
  })
  return postOpen(params);
};

/**
 * 新人绑定组合券
 */
export const mBindTicket = params => {
  Object.assign(params, {
    apiUrl: "activityConfig/batchBindByToken",
  })
  return postAct(params);
};

/**
 * e代叫第四种开单方式查询店铺信息
 */

export const mShopInfo = params => {
  Object.assign(params, {
    apiUrl: 'h5/proxyShop/info',
  });
  return postProxy(params);
}

/**
 * 查询用户信息/oeapi/infosave
 */
export const mGetEdjUserInfoApi = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/myInfoView',
  });
  return getOpen(params);
}

/**
 * 保存用户信息/oeapi/infosave
 */
export const mMyInfosaveApi = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/myInfosave',
  });
  return getOpen(params);
}

/**
 * 优惠券查询/oeapi/couponList
 */
export const mCouponList = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/coupon/list',
  });
  return postOpen(params);
}

/**
 * 支付为0的情况 确认支付
 */
export const mPayNotify = params => {
  Object.assign(params, {
    apiUrl: 'oeapi/pay/notify',
  });
  return getOpen(params);
}

/**
 * 语音播报确认接口
 */
export const mVerifyVoice = params => {
  Object.assign(params, {
    business: 'edaijia_h5',
    apiUrl: 'oeapi/verify/voice',
  });
  return getOpen(params);
}

/**
 * e代叫缓存策略类型
 */
export const mFeedback = params => {
  Object.assign(params, {
    apiUrl: 'h5/proxyorder/feedback',
  });
  return postProxy(params);
}

/**
 * 取消费
 */
export const mCancelFeeApi = params => {
  Object.assign(params, {
    apiUrl: 'oapi/order/cancelFee',
  });
  return getOpen(params);
}

/**
 * 获取历史订单
 */
export const mGetOrderHistory = params => {
  Object.assign(params, {
    apiUrl: 'oapi/order/history/list',
  });
  return postOpen(params);
}

/**
 * 首页小喇叭广告
 */
export const mGetWelcome = params => {
  Object.assign(params, {
    apiUrl: 'oapi/welcome',
  });
  return postOpen(params, true);
}

/**
 * 是否强输目的地
 */
export const mConfigInit = params => {
  Object.assign(params, {
    apiUrl: 'oapi/config/init',
  });
  return getOpen(params);
}

/**
 * 获取unionId
 */
export const mThirdUserinfo = params => {
  Object.assign(params, {
    apiUrl: 'sso/third/get/userinfo/v2'
  });
  return getOpen(params);
}

/**
 * 获取gettoken
 */
export const mGetToken = params => {
  Object.assign(params, {
    apiUrl: 'sso/third/get/token/v2'
  });
  return getOpen(params);
}

/**
 * 绑定token接口
 */
export const mThirdBind = params => {
  Object.assign(params, {
    apiUrl: 'sso/third/bind/v2',
  });
  return getOpen(params);
}

/**
 * 获取推荐下车地点
 */
export const mGetEndbypois = params => {
  Object.assign(params, {
    apiUrl: "gps/endbypois",
    gpsType: configInfo.gpsType
  })
  return getOpen(params);
}

/**
 * polling页面文案
 */
export const mConfigInitTxt = params => {
  Object.assign(params, {
    apiUrl: "config/init",
    type: 2
  })
  return postOpen(params);
}

/**
 * formid,模板消息用
 */
export const mPostFormId = params => {
  Object.assign(params, {
    apiUrl: "api/gateway",
    service: 'weixin',
  })
  return postOpen(params);
}

/**
 * 天降红包红包接口
 */
export const mRedPacketInfo = params => {
  Object.assign(params, {
    apiUrl: "api/gateway",
    service: 'ecap',
  })
  return postOpen(params);
}

/**
 * 收银台支付订单详情
 */
export const mOrderFeeInner = params => {
  Object.assign(params, {
    apiUrl: "oapi/order/feeInner",
  })
  return postOpen(params);
};

/**
 * 收银台订单轨迹
 */
export const mDriverTraceInner = params => {
  Object.assign(params, {
    apiUrl: "oapi/order/traceInner",
  })
  return postOpen(params);
};
