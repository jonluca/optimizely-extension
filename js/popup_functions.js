// Show release notes for the first time the user accesses this version
function show_release_notes() {
  chrome.storage.sync.get(
    {
      usedVersion: "",
    },
    function (result) {
      var currVersion = chrome.runtime.getManifest().version;

      if (result.usedVersion != chrome.runtime.getManifest().version) {
        chrome.storage.sync.set(
          {
            usedVersion: currVersion,
          },
          function () {}
        );

        //TODO _gaq.push(['_trackEvent', 'pageview', 'lead_gen', 'opened']);
        //Show release notes page
        chrome.tabs.create({
          url: chrome.extension.getURL("release-notes.html"),
        });
      }
    }
  );
}

// QA toggle function
$(document).on("click", "input#qaMode", function (event) {
  try {
    if (tabId != 0 && domainURL.length && cookieChecked) {
      var self = $(this);

      if (!$.trim(cookieName).length) {
        chrome.tabs.sendMessage(tabId, { setupQA: "" });
        window.close();
        return false;
      }

      setTimeout(function () {
        var cookieExists = self.is(":checked");

        domainURL =
          domainURL.indexOf("www.") > -1
            ? domainURL.replace("www", "")
            : domainURL;

        if (!cookieExists) {
          chrome.cookies.remove({
            url: domainURL,
            name: cookieName,
          });

          //REMOVE ga segment

          _gaq.push(["_trackEvent", "click", "qa", "Disable QA"]);
        } else {
          chrome.cookies.set(
            {
              url: domainURL,
              name: cookieName,
              value: cookieValue,
              path: "/",
              secure: https,
            },
            function (cookie) {
              if (cookie === null) {
              }
            }
          );

          //ADD ga segment

          _gaq.push(["_trackEvent", "click", "qa", "Enable QA"]);
        }

        chrome.tabs.reload(tabId); // Refresh tab
        window.close(); // Close popup
      }, 300);
    } else {
      return false;
    }
  } catch (e) {
    //console.log(chrome.runtime.lastError);
  }
});

// In browser Events toggle function
$(document).on("click", "input#eventsInBrowser", function (event) {
  try {
    var active = $(this).is(":checked") ? 1 : 0;

    background.setEventsInBrowser(active, tabId);

    // param=eventsInBrowser
    chrome.tabs.sendMessage(tabId, { eventsInBrowser: active });
  } catch (e) {
    //console.log(chrome.runtime.lastError);
  }
});

// Copy to clipboard function
function copyToClipboard(url, ret, extra) {
  url += "?" + ret.join("&");
  chrome.cookies.get(
    {
      url: domainURL,
      name: cookieName,
    },
    function (cookie) {
      try {
        if (typeof cookie != "undefined" && cookie !== null) {
          url += "&" + cookieName + "=" + cookieValue;
        }

        if (extra) {
          url += extra;
        }

        // Copy to clipboard
        document.oncopy = function (event) {
          event.clipboardData.setData("Text", url);
          event.preventDefault();
        };
        document.execCommand("Copy");
        document.oncopy = undefined;

        $("#copyConfirmation").show();
        $("#copyConfirmation").css("opacity", 1);
        $("#copyConfirmation").fadeTo(1500, 0, function () {
          $(this).hide();
        });
      } catch (e) {
        //console.log(chrome.runtime.lastError);
      }
    }
  );
}

// Get the nth occurrence in a string - return index of
function getPosition(string, subString, index) {
  return string.split(subString, index).join(subString).length;
}

// Get info from the current URL (url, query params and extra values)
// Extra: includes hastags and extra question marks
function cleanseURL() {
  var url = "",
    params = {},
    extra = "",
    search = "";

  if (fullURL.indexOf("?") != -1) {
    // We have URL params
    var search = fullURL.substring(fullURL.indexOf("?") + 1);

    if (search != "") {
      var justQueryString =
        search.indexOf("#") > -1
          ? search.substring(0, search.indexOf("#"))
          : search.indexOf("?") > -1
          ? search.substring(0, search.indexOf("?"))
          : search;

      var parseString =
        '{"' +
        decodeURI(justQueryString)
          .replace(/"/g, '\\"')
          .replace(/&/g, '","')
          .replace(/#\?/g, '","#?')
          .replace(/=(?![^{]*})/g, '":"') +
        '"}';

      if (parseString.length > 4) {
        params = JSON.parse(parseString); // Create params object

        for (var key in params) {
          if (params.hasOwnProperty(key)) {
            if (key.match(/optimizely_x/)) {
              delete params[key];
            } else if (key == cookieName) {
              delete params[key];
            }
          }
        }
      }
    }

    url = fullURL.substring(0, fullURL.indexOf("?"));
  } else {
    url = fullURL;
  }

  extra =
    typeof fullURL.split("#")[1] === "undefined"
      ? ""
      : fullURL.substring(fullURL.indexOf("#"));
  extra =
    search.indexOf("?") > -1
      ? search.indexOf("#") > -1
        ? search.indexOf("?") > search.indexOf("#")
          ? fullURL.substring(fullURL.indexOf("#"))
          : fullURL.substring(getPosition(fullURL, "?", 2))
        : fullURL.substring(getPosition(fullURL, "?", 2))
      : extra;
  url = url.split("#")[0];

  return [url, params, extra];
}

// Get variation index by variation ID
function getVariationIndex(experimentId, variationId) {
  var variation_ids = optObject.data.experiments[experimentId].variation_ids;

  if (typeof variation_ids !== "undefined") {
    for (var i = 0; i < variation_ids.length; i++) {
      if (variation_ids[i] === variationId) {
        return i;
      }
    }
  } else {
    // MVT
    return optObject.oldVariationMap[experimentId].join("_");
  }
}

// Get campaign ID by experiment ID
function getCampaignId(experimentId) {
  for (campIdx in optObject.data.campaigns) {
    for (expIdx in optObject.data.campaigns[campIdx].experiments) {
      if (
        optObject.data.campaigns[campIdx].experiments[expIdx].id ===
        experimentId
      ) {
        return campIdx;
      }
    }
  }
}

// Get the force link for a single experiment
function individualUrlInfo(dataExperiment) {
  var cleansedURL = cleanseURL();
  var url = cleansedURL[0];
  var params = cleansedURL[1];
  var extra = cleansedURL[2];
  var isX = optObject.data.experiments[dataExperiment].isX;

  params["optimizely_x" + (isX ? "" : dataExperiment)] = isX
    ? optObject.variationMap[dataExperiment].id
    : getVariationIndex(
        dataExperiment,
        optObject.variationMap[dataExperiment].id
      );

  //params['optimizely_x' + dataExperiment] = typeof optObject.variationMap[dataExperiment] == 'object' ? optObject.variationMap[dataExperiment].join('_') : optObject.variationMap[dataExperiment];

  var ret = [];
  for (var d in params) {
    ret.push(d + "=" + params[d]);
  }

  return {
    url: url,
    ret: ret,
    extra: extra,
  };
}

// Get the force link for all active experiments on the page
function fulllUrlInfo() {
  var cleansedURL = cleanseURL();
  var url = cleansedURL[0];
  var params = cleansedURL[1];
  var extra = cleansedURL[2];
  var isX;

  var ret = [];
  for (var d in params) {
    ret.push(d + "=" + params[d]);
  }

  // Add experiments to params
  for (var i = 0; i < optObject.activeExperiments.length; i++) {
    var isX = optObject.data.experiments[optObject.activeExperiments[i]].isX;

    ret.push(
      "optimizely_x" +
        (isX ? "" : optObject.activeExperiments[i]) +
        "=" +
        (isX
          ? optObject.variationMap[optObject.activeExperiments[i]].id
          : getVariationIndex(
              optObject.activeExperiments[i],
              optObject.variationMap[optObject.activeExperiments[i]].id
            ))
    );

    //params['optimizely_x'+optObject.activeExperiments[i]] = typeof optObject.variationMap[optObject.activeExperiments[i]] == 'object' ? optObject.variationMap[optObject.activeExperiments[i]].join('_') : optObject.variationMap[optObject.activeExperiments[i]];
  }

  return {
    url: url,
    ret: ret,
    extra: extra,
  };
}

// When the user clicks on the 'get in touch' (letter icon)
$(document).on("click", "a#get-in-touch", function (event) {
  chrome.tabs.sendMessage(tabId, { feedback: "" }); // param=feedback allows to identify the 'get in touch'
  window.close();
  return false;
});

// Scroll within the active experiments list we need to reposition the variation list for each experiment
$(document).on("scroll", "div.wrapper ul", function () {
  _gaq.push(["_trackEvent", "scroll", "list", "Experiment list Scroll"]);

  $("div.changeVariation > div.list").each(function (index, el) {
    try {
      var offsetTop = $(this).siblings("span").offset().top - 120;
      $(this).css("top", offsetTop);
      if (offsetTop < 0 || offsetTop > 255) {
        $(this).css("visibility", "hidden");
      } else {
        $(this).css("visibility", "visible");
      }
    } catch (e) {
      //console.log(e);
    }
  });
});

// When the user clicks opens/closes the dropdown variation list for an experiment
$(document).on("click", "div.changeVariation > span", function (event) {
  try {
    event.preventDefault();

    _gaq.push(["_trackEvent", "click", "variation", "Open variation list"]);

    var id = $(this).siblings("div.list").attr("id");

    $('div.list[id!="' + id + '"]').slideUp("fast");
    $('div.list[id="' + id + '"]').slideToggle("fast");
  } catch (e) {
    //console.log(e);
  }
});

// When the user clicks in one of the variation from the dropdown variation list for an experiment - Change variation
$(document).on(
  "click",
  "div.changeVariation > div.list > div",
  function (event) {
    try {
      if (!$(this).parent().parent().hasClass("disabled")) {
        // Only run if the popup isn't disabled
        event.preventDefault();

        _gaq.push(["_trackEvent", "click", "variation", "Change variation"]);

        var change = {
          experimentId: $(this)
            .parents(".changeVariation")
            .attr("id")
            .replace(/experiment\-/, ""),
          variationId: $(this).attr("value"),
          variationIndex: $(this).attr("index"),
        };

        // Send message to background with variation change details
        chrome.extension.sendMessage(
          { variationChange: change },
          function (response) {}
        );

        window.close(); // Close popup
      }
    } catch (e) {
      //console.log(e);
    }
  }
);

// When the user copies the forcing url for a single experiment
$(document).on("click", "a.individual-url", function (e) {
  try {
    _gaq.push(["_trackEvent", "click", "link", "Copy individual URL"]);

    e.preventDefault();

    var obj = individualUrlInfo($(this).attr("data-experiment"));

    copyToClipboard(obj.url, obj.ret, obj.extra);
  } catch (e) {
    //console.log(e.stack);
  }
});

// Open All - When the user clicks it opens every single variation - including control - in a separate tab
$(document).on("click", "a.open-variations", function (event) {
  _gaq.push(["_trackEvent", "click", "link", "Open all variations"]);

  var experimentId = $(this).attr("data-experiment");
  var isX = optObject.data.experiments[experimentId].isX;

  var cleansedURL = cleanseURL();
  var url = cleansedURL[0];
  var params = cleansedURL[1];
  var extra = cleansedURL[2];

  var ret = [];
  for (var d in params) {
    ret.push(d + "=" + params[d]);
  }

  var createIndex = tabIndex + 1;
  var first_index;
  var optParam;

  $(this)
    .parents("div.wrapper")
    .find("div.changeVariation#experiment-" + experimentId)
    .children("div.list")
    .children()
    .each(function (index, el) {
      if (index == 0) {
        first_index = isX ? $(this).attr("value") : $(this).attr("index");
      } else {
        optParam =
          "optimizely_x" +
          (isX ? "" : experimentId) +
          "=" +
          (isX ? $(this).attr("value") : $(this).attr("index"));

        chrome.tabs.create({
          url:
            url +
            (ret.length > 0
              ? "?" + ret.join("&") + "&" + optParam
              : "?" + optParam),
          index: createIndex,
        });
        createIndex++;
      }
    });

  optParam = "optimizely_x" + (isX ? "" : experimentId) + "=" + first_index;

  chrome.tabs.update(tabId, {
    url:
      url +
      (ret.length > 0 ? "?" + ret.join("&") + "&" + optParam : "?" + optParam),
  });

  return false;
});

// When the user clicks on the 'QR code' for a certain experiment/variation
$(document).on("click", "a.qr-code", function (e) {
  try {
    var attr = $(this).attr("data-experiment");
    var obj;

    if (typeof attr !== "undefined" && attr !== false) {
      obj = individualUrlInfo($(this).attr("data-experiment"));
      _gaq.push(["_trackEvent", "click", "link", "QR code"]);
    } else {
      obj = fulllUrlInfo();
      _gaq.push(["_trackEvent", "click", "link", "QR code (overall)"]);
    }

    obj.url += "?" + obj.ret.join("&");
    chrome.cookies.get(
      {
        url: domainURL,
        name: cookieName,
      },
      function (cookie) {
        try {
          if (typeof cookie !== "undefined" && cookie !== null) {
            obj.url += "&" + cookieName + "=" + cookieValue;
          }

          if (obj.extra) {
            obj.url += obj.extra;
          }

          chrome.tabs.sendMessage(tabId, { qrCode: obj.url }); // param=qrCode allows to identify the 'QR Code'
        } catch (e) {
          //console.log(chrome.runtime.lastError);
        }
      }
    );

    window.close(); // Close popup
  } catch (e) {
    //console.log(chrome.runtime.lastError);
  }
});

// 'Go to Editor' button
$(document).on("click", "button.editor", function (event) {
  try {
    event.preventDefault();

    _gaq.push(["_trackEvent", "click", "button", "Go to editor"]);

    var experimentId = $(this).attr("data-experiment");
    var isX = optObject.data.experiments[experimentId].isX;

    chrome.tabs.create({
      url: isX
        ? "https://app.optimizely.com/v2/projects/" +
          optObject.data.projectId +
          "/experiments/" +
          experimentId
        : "https://www.optimizely.com/edit?experiment_id=" +
          $(this).attr("data-experiment"),
    });
  } catch (e) {
    //console.log(e);
  }
});

// 'Go to Results' button
$(document).on("click", "button.results", function (event) {
  try {
    event.preventDefault();

    _gaq.push(["_trackEvent", "click", "button", "Go to results"]);

    var experimentId = $(this).attr("data-experiment");
    var isX = optObject.data.experiments[experimentId].isX;

    chrome.tabs.create({
      url: isX
        ? "https://app.optimizely.com/v2/projects/" +
          optObject.data.projectId +
          "/results/" +
          getCampaignId(experimentId) +
          "/experiments/" +
          experimentId
        : "https://www.optimizely.com/results?experiment_id=" +
          $(this).attr("data-experiment"),
    });
  } catch (e) {
    //console.log(e);
  }
});

// When the user copies the forcing url for all active experiments on the page
$(document).on("click", "a#copyFullUrl", function (e) {
  try {
    e.preventDefault();
    _gaq.push(["_trackEvent", "click", "link", "Copy Full Url"]);

    var obj = fulllUrlInfo();

    copyToClipboard(obj.url, obj.ret, obj.extra);
  } catch (e) {
    //console.log(e.stack);
  }
});

// 'Clear events' link on top of the Events box
$(document).on("click", "div#events-section a", function (event) {
  background.clearOptimizelyEvents(tabId);
  $(".cv-opt-event").remove();
  $("#events-section h4").text("Events:");
  return false;
});

// When a variation dropdown list is open and the user clicks outside of it - it collapses the opened list
$(document).click(function (event) {
  try {
    if (!$(event.target).closest("div.changeVariation").length) {
      if ($("div.changeVariation > div.list").is(":visible")) {
        $("div.changeVariation > div.list").slideUp("fast");
      }
    }
  } catch (e) {
    //console.log(e);
  }
});
