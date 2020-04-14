import md5 from "./md5";
import configInfo from "./config";
import { queryError } from './util';

// 重置请求参数
let getParams = params => {
  let baseUrl = params.baseUrl,
    appkey = configInfo.appkey,
    md5key = configInfo.md5key;

  if (
    baseUrl.indexOf('activity.edaijia') > -1 ||
    baseUrl.indexOf('activity.d.edaijia') > -1 ||
    baseUrl.indexOf('proxyuser.edaijia') > -1 ||
    baseUrl.indexOf('proxyuser.d.edaijia') > -1
  ) {
    appkey = configInfo.activityAPPKEY;
    md5key = configInfo.activityMD5KEY;
  }

  delete params.baseUrl;
  Object.assign(params, {
    appkey: appkey,
    from: configInfo.from,
    udid: configInfo.udid,
    from_type: configInfo.fromType,
    app_ver: configInfo.appVer,
    ver: configInfo.ver,
    timestamp: new Date().Format("yyyy-MM-dd hh:mm:ss"),
    os: configInfo.os
  })

  let paramStr = [],
    paramStrSorted = [];

  for (let n in params) {
    paramStr.push(n);
  }

  paramStr = paramStr.sort();
  paramStr.forEach(function (key) {
    paramStrSorted.push(key + params[key]);
  });
  let text = md5key + paramStrSorted.join("") + md5key;
  params.sig = md5(text).slice(0, 30); // param.timestamp = param.timestamp.replace(/ /g,'%20');
  let qs = '';
  Object.keys(params).forEach(item => {
    qs = qs + item + "=" + encodeURIComponent(params[item]) + "&";
  });
  return qs.slice(0, qs.length - 1);

}

const request = (model, baseUrl, method, hideError) => {
  model.baseUrl = baseUrl;
  let reqUrl = baseUrl + '' + model.apiUrl;
  if (model.apiUrl.includes('oapi') || model.apiUrl.includes('oeapi')) {
    model.current_city_id = configInfo.cityId;
  } else {
    model.currentCityId = configInfo.cityId;
  }
  delete model.apiUrl;
  // console.log(getParams(model))
  // return;
  return new Promise((resolve, reject) => {
    wx.request({
      url: reqUrl + '?' + getParams(model),
      method: method,
      success: res => {
        if (parseInt(res.statusCode) != 200) {
          reject(res);
          return;
        }
        // 验证失败抛出到indexjs处理
        if ((res.data.message === "Token验证失败" || res.data.message === '验证失败') && reqUrl.indexOf('customer/info/drivers') < -1) {
          wx.showModal({
            content: "您的账号信息已失效，请重新登录",
            success: function (json) {
              // wx.redirectTo({
              //   url: "../authorizeLogin/authorizeLogin"
              // });
            }
          });
          return reject();
        }
        resolve(res.data);
      },
      fail: err => {
        if(!hideError) queryError('网络错误请重试');
        reject(err);
      },
      complete: res => {
      }
    })
  })
}

export const getOpen = params => {
  return request({ ...params }, configInfo.baseUrl, 'GET');
}

export const postOpen = (params, hideError) => {
  return request({ ...params }, configInfo.baseUrl, 'POST', hideError);
}

export const getAct = (params, hideError) => {
  return request({ ...params }, configInfo.activityUrl, 'GET', hideError);
}

export const postAct = params => {
  return request({ ...params }, configInfo.activityUrl, 'POST', );
}

export const getProxy = params => {
  return request({ ...params }, configInfo.daijiaoUrl, 'GET');
}

export const postProxy = params => {
  return request({ ...params }, configInfo.daijiaoUrl, 'POST');
}

