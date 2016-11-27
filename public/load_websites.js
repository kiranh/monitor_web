var webPage = require('webpage'),
    fs = require('fs');

function loadWebsite(currentUrl, timeFunc) {
  var t = Date.now()
  var page = webPage.create();
  var timeTaken = 0;
  page.open(currentUrl.url);
  page.onLoadFinished = function(status) {
    if (status != "success")  {
      timeFunc(currentUrl, -1);
    } else {
      timeTaken = Date.now() - t;
      console.log("** Loading time is " + timeTaken + " msec" + " for url: " + currentUrl.url);
      window.setTimeout(function () {
        page.render(currentUrl.name + ".png");
        phantom.exit();
      }, 1000);
      timeFunc(currentUrl, timeTaken);
    }
  };
}


function loadConfig() {
  var content = fs.read("website.json");
  var configData = JSON.parse(content);
  var timingData = {};
  for (var i = 0; i < configData.length; i++) {
    var urlObject = configData[i];
    loadWebsite(urlObject, function(currentUrl, timeTaken) {
      console.log("++ Calling this crap with " + currentUrl.url + " and current count is " + Object.keys(timingData).length);
      timingData[currentUrl.name] = {"name": currentUrl.name, "url": currentUrl.url, "time_taken": timeTaken};

      if (Object.keys(timingData).length == configData.length) {
        var outputContent = JSON.stringify(timingData);
        console.log("Writing timing data" + outputContent);
        fs.write("website_timing.json", outputContent, 'w');
        timingData = {};
        rescheduleLoad();
      }
    });
  }
}

function rescheduleLoad() {
  setTimeout(loadConfig, 10*60*1000);
}

loadConfig();
