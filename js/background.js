/**
 * Update badge number
 * @param  {integer} 	number 		Number to update
 */
function updateNumber(number) {
  var canvas = document.createElement("CANVAS");
  var context = canvas.getContext("2d");
  context.beginPath();
  context.arc(9, 9, 9, 0, Math.PI * 2, true);
  context.fillStyle = number == "X" ? "#999999" : "#009fe3";
  context.closePath();
  context.fill();
  context.fillStyle = "#FFFFFF";
  context.font = number == "X" ? "10px Arial" : "11px Arial";
  context.fillText(number, number == "X" ? 5.6 : number > 9 ? 2.8 : 6, 13);
  var imageData = context.getImageData(0, 0, 19, 19);
  chrome.browserAction.setIcon({
    imageData: imageData,
  });
}

var tabEvents = {};
var tabOptimizely = {};
var eventsInBrowser = {}; //0=FALSE; 1=TRUE; 2=COLLAPSED

function getOptimizelyObj(tabId) {
  return tabOptimizely[tabId];
}

function getOptimizelyEvents(tabId) {
  return tabEvents[tabId];
}

function clearOptimizelyEvents(tabId) {
  delete tabEvents[tabId];

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (typeof tabs[0] != "undefined") {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { clearEventsLog: null },
        function (response) {}
      );
    }
  });
}

function setEventsInBrowser(state, tabId) {
  eventsInBrowser[tabId] = state;
}

function getEventsInBrowser(tabId) {
  return eventsInBrowser[tabId];
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  try {
    if (typeof sender.tab !== "undefined") {
      if (typeof request.stringObject !== "undefined") {
        // Optimizely Object

        if (request.stringObject == null) {
          //Optimizely data is not ready yet
          if (typeof getOptimizelyObj(sender.tab.id) === "undefined") {
            delete tabOptimizely[sender.tab.id];
          }

          chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabs) {
              if (
                typeof tabs[0] != "undefined" &&
                tabs[0].id == sender.tab.id
              ) {
                updateNumber("X");
              }
            }
          );
        } else {
          // Parse optimizely data
          var optObject = JSON.parse(request.stringObject);

          if (typeof optObject !== "undefined") {
            tabOptimizely[sender.tab.id] = tabOptimizely[sender.tab.id] || {};
            tabOptimizely[sender.tab.id].optimizely = optObject;
            tabOptimizely[sender.tab.id].loaded = true;
            tabOptimizely[sender.tab.id].domain =
              sender.tab.url.indexOf("#") > -1
                ? sender.tab.url.substring(0, sender.tab.url.indexOf("#"))
                : sender.tab.url;

            // Check if data is there
            if (
              typeof tabOptimizely[sender.tab.id] !== "undefined" &&
              typeof tabOptimizely[sender.tab.id].optimizely === "object" &&
              Object.keys(tabOptimizely[sender.tab.id].optimizely).length > 0
            ) {
              if (
                typeof tabOptimizely[sender.tab.id].optimizely
                  .activeExperiments == "string"
              ) {
                tabOptimizely[sender.tab.id].optimizely.activeExperiments =
                  JSON.parse(
                    tabOptimizely[sender.tab.id].optimizely.activeExperiments
                  );
              }

              chrome.tabs.query(
                { currentWindow: true, active: true },
                function (tabs) {
                  if (
                    typeof tabs[0] != "undefined" &&
                    tabs[0].id == sender.tab.id &&
                    typeof tabOptimizely[sender.tab.id].optimizely !==
                      "undefined"
                  ) {
                    updateNumber(
                      tabOptimizely[sender.tab.id].optimizely.activeExperiments
                        .length
                    );
                  }
                }
              );
            } else {
              chrome.tabs.query(
                { currentWindow: true, active: true },
                function (tabs) {
                  if (
                    typeof tabs[0] != "undefined" &&
                    tabs[0].id == sender.tab.id
                  ) {
                    updateNumber("X");
                  }
                }
              );
            }
          }
        }
      } else if (typeof request.betterResults !== "undefined") {
        // Better Results
        // Send better results to content
        chrome.tabs.sendMessage(
          sender.tab.id,
          { betterResults: request.betterResults },
          function (response) {}
        );
      } else if (typeof request.eventArray !== "undefined") {
        // Optimizely Events
        tabEvents[sender.tab.id] = tabEvents[sender.tab.id] || [];
        tabEvents[sender.tab.id].push(request.eventArray);
      } else if (typeof request.createTab !== "undefined") {
        chrome.tabs.create({ url: request.createTab });
      } else if (typeof request.updateEventsInBrowser !== "undefined") {
        //Turn off "Events in Browser"
        eventsInBrowser[sender.tab.id] = request.updateEventsInBrowser;
      } else if (typeof request.isEventsInBrowserActive !== "undefined") {
        //Tell the content.js if the "Events in Browser" are active
        chrome.tabs.sendMessage(
          sender.tab.id,
          { eventsInBrowser: eventsInBrowser[sender.tab.id] },
          function (response) {}
        );
      } else if (typeof request.getEventsLog !== "undefined") {
        //Send Events log to the browser

        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (typeof tabs[0] != "undefined") {
              chrome.tabs.sendMessage(
                tabs[0].id,
                { addEventsLog: getOptimizelyEvents(tabs[0].id) },
                function (response) {}
              );
            }
          }
        );
      } else if (typeof request.clearEventsLog !== "undefined") {
        //Send Events log to the browser

        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (typeof tabs[0] != "undefined") {
              clearOptimizelyEvents(tabs[0].id);
            }
          }
        );
      }
    } else if (typeof request.variationChange !== "undefined") {
      // Variation Change
      // Send variation change to content
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (typeof tabs[0] != "undefined") {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { variationChange: request.variationChange },
            function (response) {}
          );
        }
      });
    } else if (typeof request.betterResults !== "undefined") {
      // Better Results
      // Send better results to content
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (typeof tabs[0] != "undefined") {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { betterResults: request.betterResults },
            function (response) {}
          );
        }
      });
    }
  } catch (e) {
    //console.log(e.stack);
  }
});

// Tab Change
chrome.tabs.onActivated.addListener(function (activeInfo) {
  updateNumber("X"); // set by default

  // Send tab change to content
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    if (typeof tab != "undefined") {
      if (tab.status == "complete") {
        chrome.tabs.sendMessage(
          activeInfo.tabId,
          { tabChange: true },
          function (response) {}
        );
      }

      chrome.storage.sync.get(
        {
          domains: "",
        },
        function (item) {
          var domains = item.domains;
          var domainURL = tab.url.match(/^(http|https):\/\/(www)?([^/]+)/)
            ? tab.url.match(/^(http|https):\/\/(www)?([^/]+)/)[0]
            : null;
          var regex = new RegExp("\\W" + domainURL + ",");

          if (!regex.test("," + domains + ",") && domainURL != null) {
            domains += (domains.length ? "," : "") + domainURL;
          }

          chrome.storage.sync.set(
            {
              domains: domains,
            },
            function () {}
          );
        }
      );
    }
  });
});

// Tab closed
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  // Send tab change to content
  setTimeout(function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (typeof tabs[0] != "undefined" && tabs[0].status == "complete") {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { tabChange: true },
          function (response) {}
        );
      }
    });
  }, 25); //wait a while to make sure the old window closes first
});

// Window Change
chrome.windows.onFocusChanged.addListener(function (windowId) {
  updateNumber("X"); // set by default

  // Send new tab to content
  setTimeout(function () {
    chrome.tabs.query({ active: true, windowId: windowId }, function (tabs) {
      if (typeof tabs[0] != "undefined" && tabs[0].status == "complete") {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { tabChange: true },
          function (response) {}
        );
      }
    });
  }, 25); //wait a while to make sure the new window is active
});

//Reload tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var url =
    typeof changeInfo.url !== "undefined"
      ? changeInfo.url.indexOf("#") > -1
        ? changeInfo.url.substring(0, changeInfo.url.indexOf("#"))
        : changeInfo.url
      : null;
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (typeof tabs[0] != "undefined") {
      if (
        changeInfo.status === "loading" &&
        (typeof tabOptimizely[tabId] === "undefined" ||
          url !== tabOptimizely[tabId].domain) &&
        tabId == tabs[0].id
      ) {
        updateNumber("X");
        delete tabOptimizely[tabId];
      }
    }
  });
});
