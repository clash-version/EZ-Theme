

import request from './request';
import axios from 'axios';




export function getUserInfo() {

  return request({

    url: '/user/info',

    method: 'get'

  });

}





export function getIpLocationInfo() {
  // 使用独立的 axios 实例，不带 Authorization 头，避免 CORS 问题
  return axios.get('https://ipwho.is/', {
    timeout: 10000
  });

}





export function redeemGiftCard(giftcard) {

  return request({

    url: '/user/redeemgiftcard',

    method: 'post',

    data: { giftcard }

  });

}





export function changePassword(data) {

  return request({

    url: '/user/changePassword',

    method: 'post',

    data

  });

}





export function resetSecurity() {

  return request({

    url: '/user/resetSecurity',

    method: 'get'

  });

}





export function updateRemindSettings(data) {

  return request({

    url: '/user/update',

    method: 'post',

    data

  });

}





export function getActiveSession() {

  return request({

    url: '/user/getActiveSession',

    method: 'get'

  });

}





export function getCommConfig() {

  return request({

    url: '/user/comm/config',

    method: 'get'

  });

}





export function getTelegramBotInfo() {

  return request({

    url: '/user/telegram/getBotInfo',

    method: 'get'

  });

}





export function getUserSubscribe() {

  return request({

    url: '/user/getSubscribe',

    method: 'get'

  });

} 
