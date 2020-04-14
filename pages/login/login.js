let app = getApp()
import configInfo from '../../common/config';
import { loading, queryError } from '../../common/util';
import { mGetSms, mCLogin, mVerifyVoice, mThirdUserinfo, mThirdBind, mGetToken } from '../../common/actions';

Page({

  /** 
   * 逻辑tips:
   * 1,点击验证码获取授权信息unionID，去拿token
   * 2,区别用户输入的phone和当前有效token中的phone是否一致，一致直接登陆，否则获取验证码去登陆
   * 3，把数据openId phone token unionId 赋值给全局userInfo和user
   *
  */
  silence: 60,
  code: '',
  data: {
    mode: 'normal',
    driverId: '',
    phone: "",
    captcha: "",
    captchaValue: '获取验证码',
    loginTxt: '登录',
    captchaDisabled: true,
    captchaSilence: false,
    submitDisabled: true,
  },
  isClickLogin: false,
  isClickCaptcha: false,
  goBack: function (isNew, mode, driverId) {
    wx.reLaunch({ url: '../index/index?isNew=' + isNew + '&mode=' + mode + '&driverId=' + driverId });
  },
  bindPhoneInput: function (e) { //验证手机号码
    let that = this;
    that.setData({
      phone: e.detail.value,
      captchaDisabled: !/^1\d{10}$/.test(e.detail.value) || that.data.captchaSilence
    });
    that.checkSubmit();
  },
  bindCaptchaInput: function (e) {
    let that = this;
    that.setData({
      captcha: e.detail.value
    });
    that.checkSubmit();
  },
  checkSubmit: function () {
    let that = this;
    let canSubmit = /^1\d{10}$/.test(that.data.phone) && /^\d{4}$/.test(that.data.captcha);
    that.setData({
      submitDisabled: !canSubmit
    });
  },
  bindWx: function (isNew) {  //绑定
    let that = this;
    console.log('bind', app.globalData.userInfo)
    if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1000
      });
      that.goBack(isNew, that.mode, that.driverId);
      return;
    };//兼容wxUnionId为空的情况 
    let par = {
      type: 1,
      // openId: "ohRHq0M1FVIbEiYFNZL9ppT0",
      // phone: '12222222222',
      phone: this.data.phone,
      openId: app.globalData.userInfo.openId,
    }
    mThirdBind({ ...par }).then(function (result) {
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1000
      });
      // isNew 判断是否是新人  mode判断是否是扫司机二维码登录
      that.goBack(isNew, that.mode, that.driverId);
    });
  },
  mLogin() {
    let that = this;
    let params = {
      phone: that.data.phone,
      udid: app.globalData.userInfo.openId,
      passwd: that.data.captcha
    }
    mCLogin(params).then(function (result) {
      that.isClickLogin = false;
      if (result.code == 0) {
        // let user = {
        //   token: result.token,
        //   phone: that.data.phone,
        //   ...app.globalData.userInfo
        // };
        let user = Object.assign({}, app.globalData.userInfo || {}, {
          token: result.token,
          phone: that.data.phone
        })
        app.globalData.userInfo = user;
        app.globalData.user = user;
        that.bindWx(result.isNew);
      } else {
        loading.hide();
        queryError(result.message);
      }
    }).catch(() => {
      loading.hide();
      that.isClickLogin = false;
      that.setData({
        submitDisabled: false
      })
      that.setData({ submitDisabled: false });
    });
  },
  doLogin: function () {
    let that = this;
    loading.show('正在登录');
    if (that.isClickLogin) return;
    that.isClickLogin = true;
    that.mLogin()
  },
  captchaTimer: function (silence) {
    let that = this;
    let timer = setTimeout(function () {
      if (silence <= 0) {
        that.setData({
          captchaDisabled: false,
          submitDisabled: true,
          captchaSilence: false,
          captchaValue: '重新获取'
        });
        clearTimeout(timer);
      } else {
        that.setData({ captchaValue: silence + '秒' });
        that.captchaTimer(--silence);
      }
    }, 1000);
  },
  getCaptcha: function () { // 获取手机验证码
    let that = this;
    if (that.isClickCaptcha) return;
    that.isClickCaptcha = true;
    that.setData({ captchaDisabled: true });
    loading.show();
    console.log(this.data.phone)
    mGetSms({
      phone: this.data.phone,
      udid: app.globalData.userInfo.openId || '20000001'
    }).then(function (result) {
      loading.hide();
      that.isClickCaptcha = false;
      if (result.code * 1 == 0 || result.code * 1 == 20) {
        if (result.code * 1 == 20) {
          wx.showModal({
            content: result.message,
            showCancel: true,
            success: function (res) {
              if (res.confirm) {
                let params = {
                  phone: that.data.phone,
                  udid: app.globalData.userInfo.openId || ''
                }
                mVerifyVoice(params).then(function (json) {
                  if (json.code * 1 == 0) {
                    wx.showToast({ title: '验证码已发送', icon: 'success', duration: 500 });
                    that.setData({ captchaSilence: true });
                    that.captchaTimer(that.silence);
                    that.checkSubmit();
                  }
                })
              } else if (res.cancel) {
                that.isClickCaptcha = false;
                that.setData({
                  captchaDisabled: false
                });
              }
            }
          })
        } else {
          wx.showToast({ title: '验证码已发送', icon: 'success', duration: 500 });
          that.setData({ captchaSilence: true });
          that.captchaTimer(that.silence);
          that.checkSubmit();
        }
      } else {
        that.isClickCaptcha = false;
        that.setData({
          captchaDisabled: false
        });
        queryError(result.message);
      }
    }).catch(err => {
      that.isClickCaptcha = false;
      that.setData({
        captchaDisabled: false
      });
    });
  },
  onLoad: function (options) {
    console.log('currentCityId:' + app.globalData.currentCityId)
    var that = this;
    let loginTxt = '登录',
      captchaDisabled = true;
    if (options.mode && options.driverId) {
      that.mode = options.mode;
      that.driverId = options.driverId;
      console.log(that.mode, that.driverId);
    }
    if (options.exitAccount == 'switch') {
      loginTxt = '切换账号'
    }
    that.setData({
      loginTxt,
      captchaDisabled
    });
  },
  onShareAppMessage: app.shareConfig
})
