import { mMyInfosaveApi} from '../../common/actions';
import { loading, queryError} from '../../common/util';

const app = getApp();
const regId = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;

Page({
  data: {

  },
  handlerSubmit(e){
    let that = this,
      inputVal = e.detail.value;
    console.log(e.detail.value);
    if (inputVal.userName == '') return that.formHint('请输入姓名');
    else if (inputVal.idcard == '') return that.formHint('请输入身份证号');
    else if (!regId.test(inputVal.idcard)) return that.formHint('请输入正确的身份证号');
    that.setUserInfo(inputVal.userName, inputVal.idcard);
  },
  setUserInfo(userName, idcard){
    loading.show('提交中...');
    let params = {
      token: app.globalData.userInfo.token,
      name: app.globalData.userInfo.name,
      gender: app.globalData.userInfo.gender,
      user_name: userName,
      id_card_number: idcard,
      is_open_authentication: 1,
      certi_type: 1
    }
    mMyInfosaveApi(params).then(function (json){
      loading.hide();
      if (json.code != '0' && json.status != 0) {
        queryError(json.message);
        return;
      }
      app.globalData.isFirstVerify = true;
      wx.showToast({
        title: '认证成功',
        icon: 'success',
        duration: 1000
      })
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        })
      }, 1000);
    });
  },
  formHint(txt){
    let that = this;
    wx.showToast({
      title: txt,
      icon: 'none',
      duration: 1000
    })
  },
  onLoad(){

  },
  onShareAppMessage: app.shareConfig
})