
import config  from './config';

let showQueryError = false;

let getParams = (_param, isActivity) => {
  let APPKEY = config.appkey;
  let MD5KEY = config.MD5KEY;
  if (isActivity && isActivity == 'isActivity') {
    APPKEY = config.activityAPPKEY;
    MD5KEY = config.activityMD5KEY;
  }

  let configInfo = {
    appkey: APPKEY,
    from: config.from,
    udid: config.udid,
    from_type: config.fromType,
    app_ver: config.appVer,
    ver: config.ver,
    timestamp: new Date().Format('yyyy-MM-dd hh:mm:ss')
  };
  let param = Object.assign({}, configInfo, _param);
  let paramStr = [], paramStrSorted = [];
  for (let n in param) {
    paramStr.push(n);
  }
  paramStr = paramStr.sort();
  paramStr.forEach(function (key) {
    paramStrSorted.push(key + param[key]);
  });
  let text = MD5KEY + paramStrSorted.join('') + MD5KEY;
  param.sig = md5(text).slice(0, 30);
  // param.timestamp = param.timestamp.replace(/ /g,'%20');
  return param;
}
// 请求fail失败
let showToat = (str, callback, time) => {
  let that = this;
  let hideTime = time ? time : 2000;
  wx.showToast({
    title: str || '网络错误请重试',
    image: '../../res/fail.png',
    duration: 2000,
    complete: function () {
      console.log('弹窗成功')
      let timer = setTimeout(function () {
        if (callback) callback();
        clearTimeout(timer);
      }, hideTime);
    }
  })
}

// 请求错误
let queryError = (str, back) => {
  if (showQueryError) {
    return;
  }
  showQueryError = true;
  wx.showModal({
    content: str || '网络错误请重试',
    showCancel: false,
    complete: function () {
      showQueryError = false;
      if (back) wx.navigateBack({ delta: 1 })
    }
  });
}

// 二次封装的请求
let openRequest = (url, params, success, fail, failCallback, scanCode, driverId) => {// success是状态码200之后的回调
  let method = params.method || 'GET';
  delete params.method;
  // let data = getParams(params);
  let data = '';
  if (url == 'weixin/v2/bind') {  // 后台appkey和sceret写死  必须用500013
    data = getParams(params, 'isActivity');
  } else {
    data = getParams(params);
  }

  data = Object.keys(data).map(function (key) { return key + '=' + encodeURI(data[key]) }).join('&');
  wx.request({
    url: config.baseUrl + url + '?' + data,
    method,
    success: function (res) {

      if (parseInt(res.statusCode) != 200) {
        console.log("util下res.statusCode!=200的情况下：=" + res.statusCode)
        return fail && fail('status:' + res.statusCode + ', 请求错误，请重试。');
      }

      if (res.data.message == '验证失败') { // token验证失败问题
        loading.hide();
        wx.showModal({
          content: '您的账号信息已失效，请重新登录',
          showCancel: false,
          complete: function () {
            if (scanCode && scanCode == 'scanCode') {
              wx.redirectTo({ url: '../login/login?mode=scanCode&driverId=' + driverId });
            } else {
              wx.redirectTo({ url: '../login/login' });
            }
          }
        })
        return;
      }

      // 用openid获取用户token
      if (url == 'weixin/v2/user/get'
        || url == "driver/idle/list"
        || url == "gps/baidu/street"
        || url == "customer/comment/add"
        || url == "customer/info/drivers"
        || url == "order/commit"
        || url == "order/cancel") {
        return typeof success == 'function' && success(res.data);
      }

      let json = res.data;
      if (success) {
        success && success(json)
      }
    },
    fail: function (error) {
      console.log("util中fail测试报错点");
      console.log(error);
      showToat('网络错误请重试', function () { // 回调函数 处理轮询
        console.log('接口调用失败执行函数')
        if (failCallback) failCallback();
      }, 10000);
    }
  });
}

// 二次封装的请求
let activityRequest = (url, params, success, fail, failCallback, mode) => {// success是状态码200之后的回调
  let apiUrl = '';
  if (mode == 'shopId') {
    apiUrl = config.daijiaoUrl;
  } else {
    apiUrl = config.activityUrl
  }
  if (url == 'miniProgram/coupon/notice') {
    params.callSource = 'weixin';
  }
  let method = params.method || 'GET';
  delete params.method;
  let data = getParams(params, 'isActivity');

  data = Object.keys(data).map(function (key) { return key + '=' + encodeURI(data[key]) }).join('&');
  wx.request({
    url: apiUrl + url + '?' + data,
    method,
    success: function (res) {

      if (parseInt(res.statusCode) != 200) {
        console.log("util下res.statusCode!=200的情况下：=" + res.statusCode)
        return fail && fail('status:' + res.statusCode + ', 请求错误，请重试。');
      }

      if (res.data.message == '验证失败') { // token验证失败问题
        loading.hide();
        wx.showModal({
          content: '您的账号信息已失效，请重新登录',
          showCancel: false,
          complete: function () {
            wx.redirectTo({ url: '../login/login' });
          }
        })
        return;
      }

      let json = res.data;
      if (success) {
        success && success(json)
      }
    },
    fail: function (error) {
      console.log("util中fail测试报错点");
      console.log(error);
      showToat('网络错误请重试', function () { // 回调函数 处理轮询
        console.log('接口调用失败执行函数')
        if (failCallback) failCallback();
      }, 10000);
    }
  });
}

// 二次封装的请求
let request_noError = (type, url, params, success, fail, failCallback, mode) => {// success是状态码200之后的回调
  let apiUrl = config.activityUrl;
  if (type == 'open') {
    apiUrl = config.baseUrl
  }
  if (url == 'miniProgram/coupon/notice') {
    params.callSource = 'weixin';
  }
  let method = params.method || 'GET';
  delete params.method;
  let data = getParams(params, type);
  data = Object.keys(data).map(function (key) { return key + '=' + encodeURI(data[key]) }).join('&');
  wx.request({
    url: apiUrl + url + '?' + data,
    method,
    success: function (res) {
      let json = res.data;
      if (success) {
        success && success(json)
      }
    },
    fail: function (error) { }
  });
}

// 加密电话号码

let encryptPhone = phone => {
  return phone.substr(0, 3) + phone.substr(3, 4).replace(/\d/g, "*") + phone.substr(7)
}

//loading

let loading = {
  show: function (title) {
    title = title || '加载中';
    wx.showToast({ title, icon: 'loading', mask: true, duration: 10000 })
  },
  hide: function () {
    wx.hideToast()
  },
}

let wxPromisify = (fn) => {
  return (obj = {}) => {
    new Promise((resolve, reject) => {
      obj.success = function (res) {
        resolve(res)
      }
      obj.fail = function (res) {
        reject(res)
      }
      fn(obj)
    })
  }
}

let judgeTime = (nowTime, beginTime, endTime) => {
  let [stra, strb, strc] = [nowTime.split(':'), beginTime.split(':'), endTime.split(':')]
  let [a, b, c] = [new Date(), new Date(), new Date()];
  a.setHours(stra[0]); a.setMinutes(stra[1]); a.setSeconds(stra[2]);
  b.setHours(strb[0]); b.setMinutes(strb[1]); b.setSeconds(strb[2]);
  c.setHours(strc[0]); c.setMinutes(strc[1]); c.setSeconds(strc[2]);
  if (a.getTime() - b.getTime() >= 0 && a.getTime() - c.getTime() <= 0) {
    return true;
  } else {
    return false;
  }
}

let eStorage = {
  set: function (key, data, hour) {
    let millSecond = (new Date()).getTime();
    millSecond += hour * 3600000;
    data.invalidTime = millSecond;
    wx.setStorageSync(key, data);
  },
  get: function (key) {
    if (!key) return null;
    let data = wx.getStorageSync(key);
    if (!data) return null;
    var requireSecond = data.invalidTime;
    let nowSecond = (new Date()).getTime();
    var cha = requireSecond - nowSecond;
    if (nowSecond > requireSecond) {
      wx.removeStorageSync(key);
      return null;
    } else {
      return data;
    }
  }
}

let autoAdpatStyle = (that)=>{
  let app =  getApp();
  console.log(app)
  if(app.globalData.isCar){
    wx.getColorStyle({  success (res) {    
      that.setData({ skin: res.colorStyle })
      app.globalData.skin = res.colorStyle
    }})
    wx.onColorStyleChange(function (res) {  
      that.setData({ skin: res.colorStyle })
      app.globalData.skin = res.colorStyle
    })
  }else{
    that.setData({ skin: 'dark' })
    app.globalData.skin = 'dark'
  }
}


export {
  eStorage,
  queryError,  // 错误返回
  encryptPhone, //电话加密
  loading,  //loading
  wxPromisify, //同步执行
  judgeTime, //判断某个时间是否在一段时间内
  autoAdpatStyle
}
