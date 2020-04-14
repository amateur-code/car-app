/**
 * 全局配置
 */
import { polyInit } from "./polyfill";
polyInit();
/**
 * 开发、测试 => development 
 * 生产 => production
 */
const MINIAPP_ENV = 'development';
// const MINIAPP_ENV = 'production';

/**
 * ver - api版本 控制签名算法版本
 * version - 小程序版本
 * appVer - 客户端版本（主要是请求优惠券接口添加）
 * udid - 设备唯一ID  开始跟h5同步 小程序用userid全局替换
 * gpstype - 请求接口 用于区分经纬度的类型 默认baidu  有gaode等
 * fromType - 请求优惠券接口添加（后台无法区分优惠券渠道）暂定用客户端优惠券逻辑
 * resource - 订单类型 resource 和 channel 具体信息产品来规定 需要司机端、php来配合修改否则无法接单  默认一键下单是5
 * appkey - 请求接口 key
 * md5key - 请求接口签名md5算法key
 * activityAppkey - 同上 活动key
 * activityMd5key - 同上 活动mdkey
 * from - open对外渠道 目的统计订单 财务 定向渠道营销策略等（包括高德、支付宝、淘宝、钉钉等）
 * shareInfo - 小程序分享的配置信息
 */

const from = {
  from: '02050060',
  daijiaoFrom: ''
},
resource = {
  normal_wechat_resource: 5,
  normal_wechat_resource_female: 173,
  normal_alipay_resource: 6,
  normal_gaode_resource: 7
},
systemInfo = wx.getSystemInfoSync();

let miniappConfig = {
  ver: '3.4.3', 
  version: "1.0.1",
  appVer: "9.6.0",
  udid: "20000001",
  gpsType: "baidu",
  fromType: "mini",
  from: from.from,
  daijiaoFrom: from.daijiaoFrom,
  cityId: '',
  os: systemInfo.platform,
  resource: {
    normalResource: resource.normal_wechat_resource,
    normalResourceFemale: resource.normal_wechat_resource_female
  },
  channel: {
    normalChanel: "01003"
  },
  appkey: "61000211",
  md5key: "00590e77-dfab-4e5f-b6bc-0319eac00238",
  activityAPPKEY: '51000031',
  activityMD5KEY: '0c09bc02-c74e-11e2-a9da-00163e1210d9',
  
  shareInfo: {
    title: 'e代驾',
    desc: '代驾必备安全到家',
    path: '/pages/index/index'
  },
  systemInfo: systemInfo
}

if(MINIAPP_ENV ===  'development'){
  Object.assign(miniappConfig, {
    // baseUrl: 'http://172.16.140.141:8010/',
    baseUrl: 'https://open.d.api.edaijia.cn/',
    activityUrl: 'https://activity.d.edaijia.cn/',
    h5Url: 'https://h5.d.edaijia.cn/',
    daijiaoUrl: 'https://proxyuser.d.edaijia.cn/',
  })
} else {
  Object.assign(miniappConfig, {
    baseUrl: 'https://open.api.edaijia.cn/',
    activityUrl: 'https://activity.edaijia.cn/',
    h5Url: 'https://h5.edaijia.cn/',
    daijiaoUrl: 'https://proxyuser.edaijia.cn/',
  })
}

export default miniappConfig;
