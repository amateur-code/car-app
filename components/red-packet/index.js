// components/red-packet.js
let app = getApp();

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    acceptData: {
      type: Object,
      value: {}
    },
    showMapView: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    renderData: {},
    showMapView: false, //判断是否是地图弹出
    showHeiJin: true,
    showViewType: 1, //控制弹出类型  1：消息通知 2：自动领取优惠券 3：手动领取
    bonusListHeight: 422, // 422：一张优惠券 614：2张优惠券 810：3张优惠券
    bonusHeightList: [422, 614, 810],
    tipsHei: 0,
    isTouchMove: false,
    animationData: {}
  },

  ready() {
    console.log('!')
    console.log(this.properties.acceptData)
    this.setData({
      renderData: this.properties.acceptData,
      showMapView: this.properties.showMapView,
      showViewType: this.properties.acceptData.showViewType,
      showHeiJin: this.properties.acceptData.showHeiJin,
      bonusListHeight: this.getBonusHeight(this.properties.acceptData.awardInfo.couponList)
    })

    if (this.data.renderData.showViewType == 1) {
      if (!this.data.showMapView){
        this.handlerSelectTipsDom()
      }else{
        setTimeout(()=>{
          this.closeNotice()
        },5000)
      }
    }
  },
  detached() {
    this.aniTimer && clearTimeout(this.aniTimer)
  },
  /**
   * 组件的方法列表
   */
  methods: {
    getBonusHeight(list) {
      if (!list || list.length <= 0) {
        return this.data.bonusListHeight;
      }
      let num = list.length - 1;
      return this.data.bonusHeightList[num > 2 ? 2 : num];
    },
    closeNotice() {
      this.setData({
        showViewType: 999
      })
      this.triggerEvent('closeEvent', this.data.renderData.triggerAction);
    },
    popupManualAction() {
      let rd = this.data.renderData;
      let param = {
        activityId: rd.activityId,
        awardId: rd.awardInfo.awardId,
        triggerChannel: rd.triggerChannel,
        triggerAction: rd.triggerAction,
        city_id: app.globalData.cityId,
        cityId: app.globalData.cityId,
        phone: app.globalData.userInfo.phone,
        token: app.globalData.userInfo.token,
        platform: 'wxapp',
        drawAwardUrl: rd.triggerContent.drawAwardUrl
      }
      this.closeNotice();
      wx.navigateTo({
        url: '../webview/webview?ecrmRedpacket=' + JSON.stringify(param) + '&path=user-app-client/surprised-gift/index.html'
      })
    },
    handlerSelectTipsDom() {
      console.log('q')
      this.createSelectorQuery()
        .select(".red-packet-tips")
        .boundingClientRect()
        .exec((res) => {
          console.log(res)
          this.setData({
            tipsHei: res[0].height
          })
          this.handlerAnimation('down', res[0].height);
          this.aniTimer = setTimeout(() => {
            this.handlerAnimation('up', res[0].height)
            this.closeNotice()
          }, 5000)
        })

    },
    handlerAnimation(type, h) {
      let animation = wx.createAnimation({
        duration: 1000,
        timingFunction: 'ease-out',
        delay: 0
      })
      console.log(type)
      if (type == 'up') {
        animation.translateY(-h).step()
      } else {
        animation.translateY(h).step()
      }
      this.setData({
        animationData: animation.export()
      })
    },
    touchstart(event) {
      console.log(event)
      this.data.lastX = event.touches[0].pageX;
      this.data.lastY = event.touches[0].pageY;
    },
    touchmove(event) {
      this.data.currentX = event.touches[0].pageX;
      this.data.currentY = event.touches[0].pageY;
      let tx = currentX - this.data.lastX;
      let ty = currentY - this.data.lastY
      if (ty < -10) {
        this.setData({
          isTouchMove: true
        })
      }
    },
    touchend(event) {
      if (this.data.isTouchMove) {
        this.handlerAnimation('up', this.data.tipsHei)
        setTimeout(() => {
          this.setData({
            showViewType: 999
          })
        }, 1000)
      }
    }

  }
})