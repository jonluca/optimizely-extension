window.cf_push = window.cf_push || false;

function getMvtVarIndex(number, lastIndex) {
  var nmr = (number >>> 0).toString(2);
  var varIdx = "";
  for (var i = 0; i < nmr.length; i++) {
    if (varIdx.length) {
      varIdx += "_";
    }
    varIdx += nmr[i];
  }

  for (var i = varIdx.length; i < (lastIndex >>> 0).toString(2).length; i++) {
    varIdx = "0_" + varIdx;
  }

  return varIdx;
}

function addVariationsInfo(experiment) {
  // Add all variation info (id and name) to all experiments in a new property called 'variations'
  if (typeof experiment.variation_ids !== "undefined") {
    experiment.variations = {};
    for (var j = 0; j < experiment.variation_ids.length; j++) {
      experiment.variations[j] = {
        id: experiment.variation_ids[j],
        name: window.optimizely.allVariations[experiment.variation_ids[j]].name,
        code: window.optimizely.allVariations[experiment.variation_ids[j]].code,
      };
    }
  } else if (typeof experiment.enabled_variation_ids !== "undefined") {
    experiment.variations = {};
    for (var j = 0; j < experiment.enabled_variation_ids.length; j++) {
      var multiVariations = experiment.enabled_variation_ids[j];
      var multiVariations_split =
        experiment.enabled_variation_ids[j].split("_");

      experiment.variations[
        getMvtVarIndex(j, experiment.enabled_variation_ids.length - 1)
      ] = {
        id: multiVariations,
        name:
          window.optimizely.allVariations[multiVariations_split[0]].name +
          " : " +
          window.optimizely.allVariations[multiVariations_split[1]].name,
        code: undefined,
      };
    }
  }
}

function cloneIt(object) {
  return JSON.parse(JSON.stringify(object));
}

var cv_optimizely = {};
function checkOptimizely() {
  if (
    typeof window.springBoard === "undefined" &&
    typeof window.optimizely !== "undefined" &&
    typeof cv_optimizely.data === "undefined"
  ) {
    if (
      typeof window.optimizely.get === "function" &&
      typeof window.optimizely.get("data") === "object" &&
      typeof window.optimizely.get("data").projectId !== "undefined"
    ) {
      // has Optimizely X?

      cv_optimizely.data = cloneIt(window.optimizely.get("data"));
      cv_optimizely.projectId = cv_optimizely.data.projectId;
      cv_optimizely.activationId = window.optimizely
        .get("state")
        .getActivationId();
      cv_optimizely.activeExperiments =
        typeof window.optimizely.activeExperiments !== "undefined"
          ? cloneIt(window.optimizely.activeExperiments)
          : [];
      cv_optimizely.holdbackExperiments = [];

      // Concat the Optimizely X active experiments to the 'activeExperiments' property
      var optimizelyX_activeExperiments = cloneIt(
        window.optimizely.get("state").getActiveExperimentIds()
      );

      var optimizelyXExperimentStates = cloneIt(
        window.optimizely.get("state").getExperimentStates()
      );

      for (var i = 0; i < optimizelyX_activeExperiments.length; i++) {
        if (
          cv_optimizely.activeExperiments.indexOf(
            optimizelyX_activeExperiments[i]
          ) === -1
        ) {
          cv_optimizely.activeExperiments.push(
            optimizelyX_activeExperiments[i]
          );
        }

        // Check if in holdback in experiment
        if (
          typeof optimizelyXExperimentStates[
            optimizelyX_activeExperiments[i]
          ] !== "undefined" &&
          optimizelyXExperimentStates[optimizelyX_activeExperiments[i]]
            .isInExperimentHoldback &&
          cv_optimizely.holdbackExperiments.indexOf(
            optimizelyX_activeExperiments[i]
          ) === -1
        ) {
          cv_optimizely.holdbackExperiments.push(
            optimizelyX_activeExperiments[i]
          );
        }
      }

      for (
        var i = 0;
        i < Object.keys(cv_optimizely.data.experiments).length;
        i++
      ) {
        cv_optimizely.data.experiments[
          Object.keys(cv_optimizely.data.experiments)[i]
        ].isX = true;
      }

      cv_optimizely.campaignStates = cloneIt(
        window.optimizely.get("state").getCampaignStates()
      );
      cv_optimizely.pageStates = cloneIt(
        window.optimizely.get("state").getPageStates()
      );

      if (
        typeof cv_optimizely.variationMap !== "undefined" &&
        typeof cv_optimizely.oldVariationMap === "undefined"
      ) {
        cv_optimizely.oldVariationMap = cv_optimizely.variationMap;
      }
      cv_optimizely.variationMap = cloneIt(
        window.optimizely.get("state").getVariationMap()
      );
    }

    if (typeof window.optimizely.getProjectId !== "undefined") {
      // has old optimizely?
      cv_optimizely.projectId = cloneIt(window.optimizely.getProjectId());
      cv_optimizely.variationMap =
        cv_optimizely.variationMap || cloneIt(window.optimizely.variationMap);

      if (typeof cv_optimizely.oldVariationMap === "undefined") {
        cv_optimizely.oldVariationMap = cloneIt(window.optimizely.variationMap);
      }

      cv_optimizely.variationIdsMap = cloneIt(
        window.optimizely.variationIdsMap
      );
      cv_optimizely.variationNamesMap = cloneIt(
        window.optimizely.variationNamesMap
      );
      cv_optimizely.revision = cloneIt(window.optimizely.revision);

      // Add variations map with Optimizely X obj structure
      for (
        var i = 0;
        i < Object.keys(cv_optimizely.variationIdsMap).length;
        i++
      ) {
        cv_optimizely.variationMap[
          Object.keys(window.optimizely.variationIdsMap)[i]
        ] = {
          id: cv_optimizely.variationIdsMap[
            Object.keys(window.optimizely.variationIdsMap)[i]
          ][0],
          name: cv_optimizely.variationNamesMap[
            Object.keys(window.optimizely.variationIdsMap)[i]
          ],
        };
      }

      cv_optimizely.data =
        cv_optimizely.data || cloneIt(window.optimizely.data);
      cv_optimizely.activeExperiments =
        cv_optimizely.activeExperiments ||
        cloneIt(window.optimizely.activeExperiments);

      // Audiences
      if (typeof window.optimizely.data.audiences !== "undefined") {
        cv_optimizely.allAudiences =
          cv_optimizely.allAudiences ||
          cloneIt(window.optimizely.data.audiences);
      }

      cv_optimizely.allVariations = cloneIt(window.optimizely.allVariations);

      // Add all the experiments info to the optimizely X obj
      var allExperiments_keys = Object.keys(window.optimizely.allExperiments);
      for (var i = 0; i < allExperiments_keys.length; i++) {
        if (
          Object.keys(cv_optimizely.data.experiments).indexOf(
            allExperiments_keys[i]
          ) === -1
        ) {
          var new_experiment = cloneIt(
            window.optimizely.allExperiments[allExperiments_keys[i]]
          );
          cv_optimizely.data.experiments[allExperiments_keys[i]] =
            new_experiment;

          // Is not Optimizely X
          new_experiment.isX = false;

          if (typeof new_experiment.variations === "undefined") {
            addVariationsInfo(new_experiment);
          }
        } else {
          var _experiment =
            cv_optimizely.data.experiments[allExperiments_keys[i]];

          // Is not Optimizely X
          _experiment.isX = false;
          if (typeof _experiment.urls !== "undefined") {
            _experiment.urls = cloneIt(
              window.optimizely.allExperiments[allExperiments_keys[i]].urls
            );
          }

          if (typeof _experiment.variations === "undefined") {
            addVariationsInfo(_experiment);
          }
        }
      }
    }
  }

  document.dispatchEvent(
    new CustomEvent("cF_connectExtension", {
      detail: JSON.stringify(JSON.parse(JSON.stringify(cv_optimizely))),
    })
  );
}

var pushArray = [];

var optimizelyAvailable = setInterval(function () {
  if (
    typeof window.optimizely !== "undefined" &&
    typeof window.optimizely.push === "function"
  ) {
    clearInterval(optimizelyAvailable);

    var optimizelyPushAvailable = setInterval(function () {
      if (
        typeof window.optimizely.push === "function" &&
        window.optimizely.push + "" !== "function push() { [native code] }" &&
        (typeof window.optimizely.data.projectId !== "undefined" ||
          typeof window.optimizely.getProjectId !== "undefined")
      ) {
        clearInterval(optimizelyPushAvailable);

        var optProjectId = window.optimizely.data.projectId;
        if (typeof optProjectId === "undefined") {
          optProjectId = window.optimizely.getProjectId();
        }

        window.optimizely.push = (function (data) {
          var oldPush = window.optimizely.push;

          return function (data) {
            oldPush.apply(this, arguments);

            if (typeof data.indexOf === "function") {
              if (data.indexOf("bucketVisitor") > -1) {
                document.dispatchEvent(
                  new CustomEvent("cF_optimizelyEvent", {
                    detail: {
                      type: "bucketing",
                      info: data[1] + ", " + data[2],
                    },
                  })
                );
              } else if (data.indexOf("setDimensionValue") > -1) {
                document.dispatchEvent(
                  new CustomEvent("cF_optimizelyEvent", {
                    detail: {
                      type: "segmentation",
                      info: data[1] + ", " + data[2],
                    },
                  })
                );
              } else if (
                data.length > 1 &&
                typeof data[1].indexOf === "function" &&
                data[1].indexOf("_pageview") > -1
              ) {
                document.dispatchEvent(
                  new CustomEvent("cF_optimizelyEvent", {
                    detail: {
                      type: "pageview",
                      info: data[1],
                    },
                  })
                );
              } else if (
                data.length > 1 &&
                [
                  "add_to_cart",
                  "save",
                  "share",
                  "search",
                  "purchase",
                  "convert",
                  "sign_up",
                  "subscribe",
                ].indexOf(data[1]) > -1
              ) {
                document.dispatchEvent(
                  new CustomEvent("cF_optimizelyEvent", {
                    detail: {
                      type: "custom",
                      info: data[1],
                    },
                  })
                );
              } else {
                if (pushArray.indexOf(optProjectId + "." + data[1]) === -1) {
                  pushArray.push(optProjectId + "." + data[1]);
                }
              }
            }
          };
        })();
      }
    }, 5);
  }
}, 5);

function areSiblingVars(var1Id, var2Id) {
  var matchTimes = 0;
  for (var exp_key in cv_optimizely.data.experiments) {
    for (var var_key in cv_optimizely.data.experiments[exp_key].variations) {
      if (
        cv_optimizely.data.experiments[exp_key].variations[var_key].id ===
        var1Id
      ) {
        matchTimes++;
      } else if (
        cv_optimizely.data.experiments[exp_key].variations[var_key].id ===
        var2Id
      ) {
        matchTimes++;
      }
    }
    if (matchTimes > 1) {
      return true;
    } else if (matchTimes > 0) {
      return false;
    }
  }

  return false;
}

function changeVariation() {
  var experimentId = arguments[0].detail.experimentId;
  var variationId = arguments[0].detail.variationId;
  var variationIndex = arguments[0].detail.variationIndex;
  var href = location.href;

  if (href.indexOf("optimizely_x" + experimentId) > -1) {
    //override Forced URL - Optimizely Classic
    location.replace(
      href.substring(
        0,
        href.indexOf("optimizely_x" + experimentId) + 13 + experimentId.length
      ) +
        variationIndex +
        href.substring(
          href.indexOf("optimizely_x" + experimentId) +
            13 +
            experimentId.length +
            variationIndex.length
        )
    );

    return;
  } else if (
    typeof window.optimizely.get === "function" &&
    typeof window.optimizely.get("data") === "object" &&
    typeof window.optimizely.get("data").projectId !== "undefined"
  ) {
    //has Optimizely X
    var regex = /optimizely_x=/gi,
      result;
    while ((result = regex.exec(href))) {
      if (areSiblingVars(href.substr(result.index + 13, 10), variationId)) {
        location.replace(
          href.substring(0, result.index + 13) +
            variationId +
            href.substring(result.index + 13 + 10)
        );
        return;
      }
    }
  }

  // Assign to new variation
  if (typeof variationId == "object") {
    // MVT
    for (var i = 0; i < variationId.length; i++) {
      window.optimizely.push(["bucketVisitor", experimentId, variationId[i]]);
    }
  } else {
    // A/B
    window.optimizely.push(["bucketVisitor", experimentId, variationId]);
  }

  location.reload();
}

function betterResults() {
  $(".summary-toggle.white-button.small.right").click();
  $(".series-chart, .range-chart, .description").hide();
}

function addXMLRequestCallback(callback) {
  var oldSend, i, nmrCB;
  if (XMLHttpRequest.callbacks) {
    XMLHttpRequest.callbacks.push(callback);
  } else {
    oldSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      callback(this, arguments);
      oldSend.apply(this, arguments);
    };
  }
}

function getURLParameterByName(url, name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(url);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

window.addEventListener("cF_changeVariation", changeVariation);

document.onreadystatechange = function () {
  var maxCalls = 10;
  var interval = setInterval(function () {
    if (document.readyState == "complete") {
      clearInterval(interval);

      checkOptimizely();
      var manualActivations = setInterval(function () {
        if (--maxCalls < 0 || typeof cv_optimizely.data !== "undefined") {
          clearInterval(manualActivations);
        } else {
          checkOptimizely();
        }
      }, 1000);
    }
  }, 25);
};

window.addEventListener("cF_changeTab", checkOptimizely);
window.addEventListener("cF_betterResults", betterResults);

addXMLRequestCallback(function (xhr, arguments) {
  var loadend = xhr.onloadend;
  var _arguments = arguments;
  xhr.onloadend = function () {
    try {
      if (xhr.responseURL.match("log.optimizely.com/event") !== null) {
        var eventName = getURLParameterByName(xhr.responseURL, "n");
        var revenueValue = getURLParameterByName(xhr.responseURL, "v");
        var projectId =
          xhr.responseURL.match(/https?:\/\/([0-9]+)/) !== null &&
          typeof xhr.responseURL.match(/https?:\/\/([0-9]+)/)[1] !== "undefined"
            ? xhr.responseURL.match(/https?:\/\/([0-9]+)/)[1]
            : 0;

        if (revenueValue.length) {
          document.dispatchEvent(
            new CustomEvent("cF_optimizelyEvent", {
              detail: {
                type: "revenue",
                info: revenueValue,
              },
            })
          );
        } else if (
          eventName.length &&
          (eventName === document.location.href ||
            (typeof eventName.indexOf === "function" &&
              eventName.indexOf("_pageview") > -1))
        ) {
          document.dispatchEvent(
            new CustomEvent("cF_optimizelyEvent", {
              detail: {
                type: "pageview",
                info: eventName,
              },
            })
          );
        } else if (eventName.length && eventName === "engagement") {
          document.dispatchEvent(
            new CustomEvent("cF_optimizelyEvent", {
              detail: {
                type: "engagement",
                info: "",
              },
            })
          );
        } else if (eventName.length) {
          document.dispatchEvent(
            new CustomEvent("cF_optimizelyEvent", {
              detail: {
                type:
                  pushArray.indexOf(projectId + "." + eventName) > -1
                    ? "custom"
                    : "click",
                info: eventName,
              },
            })
          );
        }
      } else if (
        this.responseURL.match("logx.optimizely.com/log/event") !== null &&
        _arguments.length
      ) {
        var event_info = JSON.parse(_arguments[0]);
        if (event_info.eventType === "view_activated") {
          if (
            window.optimizely &&
            typeof window.optimizely.get === "function" &&
            typeof window.optimizely.get("data") === "object"
          ) {
            document.dispatchEvent(
              new CustomEvent("cF_optimizelyEvent", {
                detail: {
                  type: "pageview",
                  info: window.optimizely.get("data").pages[
                    event_info.eventName
                  ].name,
                },
              })
            );
          }
        } else if (event_info.eventType === "other") {
          document.dispatchEvent(
            new CustomEvent("cF_optimizelyEvent", {
              detail: {
                type: "click",
                info: event_info.eventName,
              },
            })
          );
        }
      }

      if (loadend != null) {
        return loadend.apply(this, arguments);
      }
    } catch (e) {
      //console.log(e.stack);
    }
  };
});
