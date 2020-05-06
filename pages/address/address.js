import {
  mGpsStreet,
  mGpsLocation,
  mGetNearbypois,
  mGetEndbypois
} from "../../common/actions";
import {
  loading,
  queryError
} from "../../common/util";
import {
  GPS
} from "../../common/GPS";
import config from "../../common/config";
let app = getApp();
Page({
  data: {
    addressList: [],
    enterTxt: "请输入出发地",
    cityListStatus: false,
    value: '',
    textareaPadding: false
  },
  locTip: "",
  enterTxt: '',
  currentPosHide: true,
  startAddress: {
    name: "",
    region: "",
    latitude: 0,
    longitude: 0
  },
  inputTimer: null,
  //点击取消
  cancelClick() {
    wx.navigateBack({
      delta: 1
    });
  },
  //监听输入地址
  changeAddress: function (e) {
    if (e.detail.value == "") {
      this.setData({
        enterTxt: this.enterTxt
      });
      if(this.locTip == 'start'){
        this.getRecommendAddressStart();
      }else{
        this.getRecommendAddressEnd();
      }
      return;
    }

    this.setData({
      enterTxt: ''
    });
    if (this.inputTimer) clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.getAddressList(e.detail.value);
    }, 300);
  },
  //选中address
  selectAddress: function (e) {
    let that = this;
    let index = e.target.dataset.index || e.currentTarget.dataset.index;
    let address = that.data.addressList[index]; //region:this.data.loc.region修改为address.city
    // console.log(address);
    mGpsLocation({
      latitude: address.location.lat,
      longitude: address.location.lng
    }).then(json => {
      if (json.code != "0") {
        queryError(json.message);
        return;
      }
      let data = {
        name: address.name,
        region: json.location.street.component.city,
        latitude: address.location.lat,
        longitude: address.location.lng
      }; // console.log(data)

      let query = Object.keys(data).map(function (key) {
        return key + "=" + data[key];
      }).join("&");
      let coord = GPS.bd_decrypt(
        address.location.lat,
        address.location.lng
      );

      if (that.locTip == "start") {
        app.globalData.cityId = json.location.street.component.cityId;
        config.cityId = json.location.street.component.cityId;
        app.globalData.storeStartAddress = {
          name: address.name,
          region: json.location.street.component.city,
          latitude: coord.lat,
          longitude: coord.lon
        };
        app.globalData.action = "selectStartAddress";
        wx.navigateBack({
          delta: 1
        });
      } else {
        app.globalData.storeEndAddress = {
          name: address.name,
          region: json.location.street.component.city,
          latitude: coord.lat,
          longitude: coord.lon
        };
        console.log(app.globalData)
        wx.redirectTo({
          url: '../commitConfirm/commitConfirm'
        });
      }
    })

  },
  //请求addressList
  getAddressList: function (query) {
    let _this = this;
    if (query == "请输入目的地") {
      mGpsStreet({
        token: app.globalData.userInfo.token,
        type: 2
      }).then(res => {
        let list = res.data;
        if (res.code != "0" && res.status != 0) {
          list = [];
        }
        that.handleAddressList(list);
      })
    } else {
      mGpsStreet({
        query: query,
        region: app.globalData.storeStartAddress && app.globalData.storeStartAddress.region
      }).then(res => {
        let list = res.result;
        if (res.code != "0" && res.status != 0) {
          list = [];
        }

        this.setData({
          addressList: list
        });
      })
    }
  },
  getRecommendAddressEnd() {
    mGetEndbypois({
      token: app.globalData.userInfo.token,
      edjCityId: app.globalData.cityId,
      lat: this.startAddress.latitude,
      lon: this.startAddress.longitude
    }).then(res => {
      let list = res.data;
      if (res.code != "0" && res.status != 0) {
        list = [];
      }
      list = list.filter(item => item.source == 2 || item.source == 3);
      this.handleAddressList(list);
    })
  },
  getRecommendAddressStart() {
    let params = {
      latitude: this.startAddress.latitude,
      longitude: this.startAddress.longitude
    }
    mGetNearbypois(params).then(res => {
      if (res.code != "0" && res.status != 0) {
        list = [];
      }
      let list = res.data;
      this.handleAddressList(list);
    })
  },
  handleAddressList(list = [], type) {
    if (list.length > 0) {
      list.map((item, index) => {
        item.name = item.name,
          item.location = {
            lat: item.lat,
            lng: item.lng
          },
          item.city = '',
          item.district = ''
      });
    }
    if (type == 'end') {
      list = list.filter(item => item.source == 2);
    }
    this.setData({
      addressList: list
    });
  },
  //监听页面加载
  onLoad(option) {
    this.enterTxt = '';
    this.locTip = option.locTip;
    if (option.locTip === "end") {
      this.enterTxt = "请输入目的地";
      this.currentPosHide = false;
      this.startAddress = app.globalData.storeStartAddress || {};
      this.setData({
        enterTxt: this.enterTxt
      });
      this.getRecommendAddressEnd();
    } else {
      this.enterTxt = "请输入出发地";
      this.currentPosHide = true;
      this.startAddress = app.globalData.storeStartAddress || {};

      this.setData({
        enterTxt: this.enterTxt,
      });

      this.getRecommendAddressStart();
    }
  },
  onShareAppMessage: app.shareConfig
});