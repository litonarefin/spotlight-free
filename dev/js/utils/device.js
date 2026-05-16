function checkBrowser() {
  let browser = "";
  let c = navigator.userAgent.search("Chrome");
  let f = navigator.userAgent.search("Firefox");
  let m8 = navigator.userAgent.search("MSIE 8.0");
  let m9 = navigator.userAgent.search("MSIE 9.0");
  if (c > -1) {
    browser = "Chrome";
  } else if (f > -1) {
    browser = "Firefox";
  } else if (m9 > -1) {
    browser = "MSIE 9.0";
  } else if (m8 > -1) {
    browser = "MSIE 8.0";
  }
  return browser;
}

export const isMac =
  checkBrowser() == "Chrome"
    ? /(Mac|iPhone|iPod|iPad)/i.test(
        navigator.userAgentData?.platform || navigator.userAgent?.platform || navigator.userAgent
      )
    : navigator?.platform.toUpperCase().indexOf("MAC") >= 0;
