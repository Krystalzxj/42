/**
  * form: https://raw.githubusercontent.com/Rabbit-Spec/Surge/Master/Panel/Network-Info/Network-Info.js
 */

class httpMethod {
  /**
   * 回调函数
   * @param {*} resolve 
   * @param {*} reject 
   * @param {*} error 
   * @param {*} response 
   * @param {*} data 
   */
  static _httpRequestCallback(resolve, reject, error, response, data) {
    if (error) {
      reject(error);
    } else {
      resolve(Object.assign(response, { data }));
    }
  }

  /**
   * HTTP GET
   * @param {Object} option 选项
   * @returns 
   */
  static get(option = {}) {
    return new Promise((resolve, reject) => {
      $httpClient.get(option, (error, response, data) => {
        this._httpRequestCallback(resolve, reject, error, response, data);
      });
    });
  }

  /**
   * HTTP POST
   * @param {Object} option 选项
   * @returns 
   */
  static post(option = {}) {
    return new Promise((resolve, reject) => {
      $httpClient.post(option, (error, response, data) => {
        this._httpRequestCallback(resolve, reject, error, response, data);
      });
    });
  }
}

class logger {
  static id = randomString();

  static log(message) {
    message = `[${this.id}] [ LOG ] ${message}`;
    console.log(message);
  }

  static error(message) {
    message = `[${this.id}] [ERROR] ${message}`;
    console.log(message);
  }
}

function randomString(e = 6) {
  var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
    a = t.length,
    n = "";
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function loadCarrierNames() {
  //整理逻辑:前三码相同->后两码相同运营商->剩下的
  return {
    //台湾运营商 Taiwan
    '466-11': '中華電信', '466-92': '中華電信',
    '466-01': '遠傳電信', '466-03': '遠傳電信',
    '466-97': '台灣大哥大', '466-89': '台灣之星', '466-05': 'GT',
    //大陆运营商 China
    '460-03': '中国电信', '460-05': '中国电信', '460-11': '中国电信',
    '460-01': '中国联通', '460-06': '中国联通', '460-09': '中国联通',
    '460-00': '中国移动', '460-02': '中国移动', '460-04': '中国移动', '460-07': '中国移动', '460-08': '中国移动',
    '460-15': '中国广电', '460-20': '中移铁通',
    //香港运营商 HongKong
    '454-00': 'CSL', '454-02': 'CSL', '454-10': 'CSL', '454-18': 'CSL',
    '454-03': '3', '454-04': '3', '454-05': '3',
    '454-06': 'SMC HK', '454-15': 'SMC HK', '454-17': 'SMC HK',
    '454-09': 'CMHK', '454-12': 'CMHK', '454-13': 'CMHK', '454-28': 'CMHK', '454-31': 'CMHK',
    '454-16': 'csl.', '454-19': 'csl.', '454-20': 'csl.', '454-29': 'csl.',
    '454-01': '中信國際電訊', '454-07': 'UNICOM HK', '454-08': 'Truphone', '454-11': 'CHKTL', '454-23': 'Lycamobile',
  };
}

//获取手机运营商信息(通过内置的 API 调用设备信息)
function getCellularInfo() {
  const radioGeneration = {
    'GPRS': '2.5G',
    'CDMA1x': '2.5G',
    'EDGE': '2.75G',
    'WCDMA': '3G',
    'HSDPA': '3.5G',
    'CDMAEVDORev0': '3.5G',
    'CDMAEVDORevA': '3.5G',
    'CDMAEVDORevB': '3.75G',
    'HSUPA': '3.75G',
    'eHRPD': '3.9G',
    'LTE': '4G',
    'NRNSA': '5G',
    'NR': '5G',
  };

  let cellularInfo = '';
  const carrierNames = loadCarrierNames();
  if ($network['cellular-data']) {
    const carrierId = $network['cellular-data'].carrier;
    const radio = $network['cellular-data'].radio;
    if (carrierId && radio) {
      cellularInfo = carrierNames[carrierId] ?
        carrierNames[carrierId] + ' | ' + radioGeneration[radio] + ' - ' + radio :
        '蜂窝数据 | ' + radioGeneration[radio] + ' - ' + radio;
    }
  }
  return cellularInfo;
}

function getSSID() {
  return $network.wifi?.ssid;
}

function getIP() {
  const { v4 } = $network;
  let info = [];
  if (!v4) {
    info = ['网路可能中断', '请手动刷新以重新获取 IP'];
  } else {
    if (v4?.primaryRouter && getSSID()) info.push(`[网关𝙄𝙋]：${v4?.primaryRouter}`);
    if (v4?.primaryAddress) info.push(`[设备𝙄𝙋]：${v4?.primaryAddress}`);
  }
  info = info.join("\n");
  return info + "\n";
}

/**
 * 获取 IP 信息
 * @param {*} retryTimes // 重试次数
 * @param {*} retryInterval // 重试间隔 ms
 */
function getNetworkInfo(retryTimes = 5, retryInterval = 1000) {
  // 发送网络请求
  httpMethod.get('http://ip-api.com/json/?lang=zh-CN').then(response => {
    if (Number(response.status) > 300) {
      throw new Error(`Request error with http status code: ${response.status}\n${response.data}`);
    }
    const info = JSON.parse(response.data);
    $done({
      title: getSSID() ?? getCellularInfo(),
      content:
        getIP() +
        `[节点𝙄𝙋]：${info.query}\n` +
        `[节点𝙄𝙎𝙋]：${info.isp}\n` +
        `[节点位置]：${getFlagEmoji(info.countryCode)} | ${info.country} - ${info.city}`,
      icon: getSSID() ? 'wifi' : 'simcard',
      'icon-color': getSSID() ? '#5A9AF9' : '#8AB8DD',
    });
  }).catch(error => {
    // 网络切换
    if (String(error).startsWith("Network changed")) {
      if (getSSID()) {
        $network.wifi = undefined;
        $network.v4 = undefined;
      }
    }
    // 判断是否还有重试机会
    if (retryTimes > 0) {
      logger.error(error);
      logger.log(`Retry after ${retryInterval}ms`);
      // retryInterval 时间后再次执行该函数
      setTimeout(() => getNetworkInfo(--retryTimes, retryInterval), retryInterval);
    } else {
      // 打印日志
      logger.error(error);
      $done({
        title: '发生错误',
        content: '无法获取当前网络信息\n请检查网络状态后重试',
        icon: 'wifi.exclamationmark',
        'icon-color': '#CB1B45',
      });
    }
  });
}

/**
 * 主要逻辑，程序入口
 */
(() => {
  const retryTimes = 5;
  const retryInterval = 1000;
  // Surge 脚本超时时间设置为 30s
  // 提前 500ms 手动结束进程
  const surgeMaxTimeout = 29500;
  // 脚本超时时间
  // retryTimes * 5000 为每次网络请求超时时间（Surge 网络请求超时为 5s）
  const scriptTimeout = retryTimes * 5000 + retryTimes * retryInterval;
  setTimeout(() => {
    logger.log("Script timeout");
    $done({
      title: "请求超时",
      content: "连接请求超时\n请检查网络状态后重试",
      icon: 'wifi.exclamationmark',
      'icon-color': '#CB1B45',
    });
  }, scriptTimeout > surgeMaxTimeout ? surgeMaxTimeout : scriptTimeout);

  // 获取网络信息
  logger.log("Script start");
  getNetworkInfo(retryTimes, retryInterval);
})();
