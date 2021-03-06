var webPage = require('webpage'),
    fs = require('fs');
var content = "",
    configData = [],
    timingData = {};

function loadWebsite(currentUrl, currentIndex, timeFunc) {
  var startTime
  var page = webPage.create();
  page.onLoadStarted = function() {
    startTime = new Date();
  }
  console.log("$$$$$$$$$$ Calling loadWebsite for " + currentUrl.url + " with index " + currentIndex);

  //page.includeJS('https://js.maxmind.com/js/apis/geoip2/v2.1/geoip2.js');
  page.open(currentUrl.url);

  page.onLoadFinished = function(status) {
    if (status != "success") {
      timeFunc(currentUrl, currentIndex, -1);
    } else {
      var timeNow = new Date();
      var timeTaken = timeNow - startTime;
      console.log("** Loading time is " + timeTaken + " msec" + " for url: " + currentUrl.url + " and index :" + currentIndex);
      window.setTimeout(function () {
        page.render(currentUrl.name + ".png");
      }, 1500);
      timeFunc(currentUrl, currentIndex, timeTaken);
    }
  };
}

function loadConfig() {
  content = fs.read("website.json");
  configData = JSON.parse(content);
  timingData = {};
  var urlObject = configData[0];
  loadWebsite(urlObject, 0, webSiteLoaded);
}

function webSiteLoaded(currentUrl, websiteIndex, timeTaken) {
  if (currentUrl.name in timingData) {
    // timingData[currentUrl.name] = {"name": currentUrl.name, "url": currentUrl.url, "time_taken": timeTaken};
    return;
  }

  timingData[currentUrl.name] = {"name": currentUrl.name, "url": currentUrl.url, "time_taken": timeTaken};
  console.log("++ Calling index " + websiteIndex + " name "+ currentUrl.name + " and current count is " + Object.keys(timingData).length);

  if (Object.keys(timingData).length == configData.length) {
    var outputContent = JSON.stringify(timingData);
    console.log("Writing timing data" + outputContent);
    fs.write("website_timing.json", outputContent, 'w');
    timingData = {};
    // rescheduleLoad();
    phantom.exit();
  } else {
    var nextIndex = websiteIndex+1;
    if (nextIndex < configData.length) {
      var nextUrl = configData[nextIndex];
      loadWebsite(nextUrl, nextIndex, webSiteLoaded);
    }
  }
}

function rescheduleLoad() {
  setTimeout(loadConfig, 10*60*1000);
}

loadConfig();
