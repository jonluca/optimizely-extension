// GA Tracking
var _gaq = _gaq || [];
_gaq.push(["_setAccount", "UA-66263902-1"]);
_gaq.push(["_trackPageview"]);
(function () {
  var ga = document.createElement("script");
  ga.type = "text/javascript";
  ga.async = true;
  ga.src = "https://ssl.google-analytics.com/ga.js";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(ga, s);
})();

var domainURL = "";
var https = false;
var dataObject, optObject, optEvents;
var tabId = 0;
var cookieChecked = false;
var background;
var fullURL = "";
var tabIndex = -1;

setTimeout(function () {
  // 500ms delay
  try {
    background = chrome.extension.getBackgroundPage();

    chrome.storage.sync.get(
      {
        qaCookieName: "",
        qaCookieValue: "",
        domains: "",
      },
      function (items) {
        cookieName = items.qaCookieName;
        cookieValue = items.qaCookieValue;
      }
    );

    var nmrActiveExp = 0;

    var interval = setInterval(function () {
      try {
        chrome.tabs.query(
          { currentWindow: true, active: true },
          function (tabs) {
            var tab = tabs[0];
            fullURL = tab.url;
            domainURL = tab.url.match(/^(http|https):\/\/(www)?([^/]+)/)
              ? tab.url.match(/^(http|https):\/\/(www)?([^/]+)/)[0]
              : null;
            https = tab.url.match(/^[a-z]*/)[0] == "https" ? true : false;
            tabId = tab.id;
            tabIndex = tab.index;

            if (domainURL == null) {
              $("div#experiments").html(
                '<h1 class="not-running">Optimizely isn&#039;t running on this page.</h1><div class="sad-face"><img src="images/sad.png" alt="sad face"/></div>'
              );

              clearInterval(interval);
            }

            dataObject = background.getOptimizelyObj(tabId);
            optEvents = background.getOptimizelyEvents(tabId);

            if (dataObject != null && dataObject.loaded) {
              clearInterval(interval);
              loadPopupInfo();
            }
          }
        );
      } catch (e) {
        //console.log(e.message);
      }
    }, 250);

    function loadPopupInfo() {
      $html = "";

      if (domainURL != null) {
        chrome.cookies.get(
          {
            url: domainURL,
            name: cookieName,
          },
          function (cookie) {
            cookieChecked = true;
            if (typeof cookie != "undefined" && cookie != null) {
              // If there is cookie
              $("input#qaMode").prop("checked", true);
              _gaq.push(["_trackEvent", "info", "qa_status", "enable"]);
            } else {
              _gaq.push(["_trackEvent", "info", "qa_status", "disable"]);
            }
          }
        );
      }

      try {
        if (fullURL.match(/www\.optimizely\.com\/results/) != null) {
          // Optimizely Results page
          $html += '<button id="toggleResults">Better Results</button>'; // Create Better Results button
        }

        // Process optimizely object
        if (
          dataObject != undefined &&
          typeof (optObject = dataObject.optimizely) == "object" &&
          typeof optObject.activeExperiments != "undefined"
        ) {
          $html +=
            '<h1 class="running">Optimizely is running on this page.</h1>'; // Optimizely is running on the page

          $("div.bottom-line, #experiments").addClass("running");

          if (
            optObject.activeExperiments.length > 0 &&
            optObject.activeExperiments != "[]"
          ) {
            // There are active experiments

            _gaq.push([
              "_trackEvent",
              "info",
              "nmr_experiments",
              optObject.activeExperiments.length,
            ]);

            $html +=
              "<h3>Active Experiments (" +
              optObject.activeExperiments.length +
              "):</h3>";

            if (optObject.activeExperiments.length > 2) {
              $("#experiments").addClass("many");
            }

            // Create experiment list]
            var tempHtml, multiVariationsTemp;
            var experimentList = "<div class='wrapper'><ul>";
            for (var i = 0; i < optObject.activeExperiments.length; i++) {
              tempHtml = "";
              var selectedVariation =
                optObject.variationMap[optObject.activeExperiments[i]].id;

              var isMVT =
                typeof optObject.data.experiments[
                  optObject.activeExperiments[i]
                ].section_ids != "undefined" &&
                optObject.data.experiments[optObject.activeExperiments[i]]
                  .section_ids.length;

              if (isMVT) {
                selectedVariation =
                  optObject.variationIdsMap[
                    optObject.activeExperiments[i]
                  ].join("_");
              }

              var name;
              if (
                typeof optObject.data.experiments[
                  optObject.activeExperiments[i]
                ].name == "undefined" ||
                optObject.data.experiments[optObject.activeExperiments[i]]
                  .name === null
              ) {
                name =
                  optObject.data.experiments[optObject.activeExperiments[i]].id;
              } else if (
                optObject.data.experiments[optObject.activeExperiments[i]]
                  .name === "Exp" &&
                typeof optObject.data.experiments[
                  optObject.activeExperiments[i]
                ].campaignName !== "undefined"
              ) {
                name =
                  optObject.data.experiments[optObject.activeExperiments[i]]
                    .campaignName;
              } else {
                name =
                  optObject.data.experiments[optObject.activeExperiments[i]]
                    .name;
              }

              experimentList +=
                "<li><div title='" +
                name +
                "' class='experiment-name'>" +
                (optObject.data.experiments[optObject.activeExperiments[i]].isX
                  ? '<img alt="Optimizely X" src="images/optimizely-x-blue.png"/> '
                  : "") +
                "<span>" +
                name +
                "</span></div>";

              // Check if in holdback for the experiment
              if (
                optObject.holdbackExperiments.indexOf(
                  optObject.activeExperiments[i]
                ) > -1
              ) {
                experimentList +=
                  "<div class='left-side'><div class='changeVariation disabled' id='experiment-" +
                  optObject.activeExperiments[i] +
                  "'>";

                tempHtml =
                  "<span value='null' index='0'>Holdback <i>&nbsp;</i></span><div class='list'  id='experiment-" +
                  optObject.activeExperiments[i] +
                  "'><div value='null' index='0' class='selected'>Holdback</div>";
              } else {
                experimentList +=
                  "<div class='left-side'><div class='changeVariation' id='experiment-" +
                  optObject.activeExperiments[i] +
                  "'>";

                var variations =
                  optObject.data.experiments[optObject.activeExperiments[i]]
                    .variations;

                var variations_keys = Object.keys(variations);

                for (var j = 0; j < variations_keys.length; j++) {
                  tempHtml +=
                    "<div value='" +
                    variations[variations_keys[j]].id +
                    "' index='" +
                    variations_keys[j] +
                    "'";
                  tempHtml +=
                    variations[variations_keys[j]].id == selectedVariation
                      ? " class='selected'>"
                      : ">";

                  tempHtml +=
                    (variations[variations_keys[j]].name === null ||
                    typeof variations[variations_keys[j]].name === "undefined"
                      ? variations[variations_keys[j]].id
                      : variations[variations_keys[j]].name) + "</div>";

                  if (variations[variations_keys[j]].id == selectedVariation) {
                    experimentList +=
                      "<span value='" +
                      variations[variations_keys[j]].id +
                      "' index='" +
                      variations_keys[j] +
                      "'>" +
                      (variations[variations_keys[j]].name === null ||
                      typeof variations[variations_keys[j]].name === "undefined"
                        ? variations[variations_keys[j]].id
                        : variations[variations_keys[j]].name) +
                      "<i>&nbsp;</i></span><div class='list' id='experiment-" +
                      optObject.activeExperiments[i] +
                      "'>";
                  }
                }
              }

              experimentList += tempHtml;
              experimentList += "</div></div>";

              experimentList +=
                '<div class="experiment-links"><a href="javascript:;" class="individual-url" data-experiment="' +
                optObject.activeExperiments[i] +
                '">Copy Url</a><a href="javascript:;" class="open-variations" data-experiment="' +
                optObject.activeExperiments[i] +
                '">Open All</a><a href="javascript:;" data-experiment="' +
                optObject.activeExperiments[i] +
                '" class="qr-code">QR code</a></div></div>';

              experimentList +=
                '<div class="right-side"><div class="optimizely-links"><button class="editor" data-experiment="' +
                optObject.activeExperiments[i] +
                '">Go to Editor</button><button class="results" data-experiment="' +
                optObject.activeExperiments[i] +
                '">Go to Results</button></div></div>';

              experimentList += "</li>";
            }
            experimentList += "</ul></div>";

            $html += experimentList;

            $html +=
              '<div class="full-url"><span>All active experiments:</span><a href="javascript:;" class="qr-code">QR code</a><a href="javascript:;" id="copyFullUrl">Copy Url</a></div>'; // Create Copy FULL URL Link
          } else {
            // No active experiments
            $("#experiments").addClass("no-experiments");
            $html +=
              "<h2>There are <span>no active</span> experiments on this page.</h2>";
          }

          // Add event listeners to dropdowns
          if (
            optObject.activeExperiments.length > 0 &&
            optObject.activeExperiments != "[]"
          ) {
            for (var i = 0; i < optObject.activeExperiments.length; i++) {
              if (
                typeof optObject.data.experiments[
                  optObject.activeExperiments[i]
                ].variation_ids != "undefined"
              ) {
                var activeExperiment = optObject.activeExperiments[i];
              } else if (
                typeof optObject.data.experiments[
                  optObject.activeExperiments[i]
                ].section_ids != "undefined"
              ) {
                var activeExperiment = optObject.activeExperiments[i];
              }
            }
          }

          nmrActiveExp = optObject.activeExperiments.length;

          var projectId = optObject.projectId;
          var currentRevision =
            typeof optObject.revision !== "undefined"
              ? optObject.revision
              : optObject.data.revision;

          $("#revision").html(
            '<span class="revision-loading-icon"> <svg class="spinner" width="12px" height="12px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"> <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle> </svg> </span><span id="revision-text">Checking revision...<span>'
          );

          var verified = false;

          var verifyAmazon = setInterval(function () {
            try {
              $.ajax({
                url:
                  "https://app.optimizely.com/api/client/" +
                  projectId +
                  "/revision.json",
                data: { level: "amazon" },
              }).done(function (amazonResult) {
                if (amazonResult.revision > currentRevision) {
                  clearInterval(verifyAmazon);

                  var verifyCDN = setInterval(function () {
                    try {
                      $.ajax({
                        url:
                          "https://app.optimizely.com/api/client/" +
                          projectId +
                          "/revision.json",
                        data: { level: "cdn" },
                      }).done(function (cdnResult) {
                        if (verified) {
                          return false;
                        }

                        if (amazonResult.revision != cdnResult.revision) {
                          if (!$(".revision-icon").length) {
                            $("#revision").html(
                              '<span class="revision-loading-icon revision-icon"> <svg class="spinner" width="12px" height="12px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"> <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle> </svg> </span><span id="revision-text">Uploading new changes to CDN...<span>'
                            );
                          }
                        } else {
                          clearInterval(verifyCDN);
                          verified = true;

                          $("#revision").html(
                            'New changes uploaded! <a href="javascript:;">Refresh the page.</a>'
                          );

                          $("#revision a").click(function (event) {
                            chrome.tabs.reload(tabId);
                            window.close();
                            return false;
                          });
                        }
                      });
                    } catch (e) {
                      //console.log(chrome.runtime.lastError);
                    }
                  }, 250);
                } else {
                  $("#revision").html("REVISION " + currentRevision);
                }
              });
            } catch (e) {
              //console.log(chrome.runtime.lastError);
            }
          }, 3000);
        } else {
          // No Optimizely on page
          $("#experiments").addClass("no-optimizely");
          $html +=
            '<h1 class="not-running">Optimizely isn&#039;t running on this page.</h1>';
          $html +=
            '<div class="sad-face"><img src="images/sad.png" alt="sad face"/></div>';
        }

        // Create Event textarea
        var events =
          '<div id="events-section"><h4>Events' +
          (typeof optEvents != "undefined"
            ? "(" + optEvents.length + ")"
            : "") +
          ':</h4><span>In-browser</span><div class="onoffswitch"> <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" ' +
          (typeof background.getEventsInBrowser(tabId) === "undefined" ||
          background.getEventsInBrowser(tabId) === 0
            ? ""
            : 'checked="checked"') +
          ' id="eventsInBrowser"> <label class="onoffswitch-label" for="eventsInBrowser"> <span class="onoffswitch-inner"></span> <span class="onoffswitch-switch"></span> </label> </div><a href="javascript:;"><img alt="Clear Events" src="images/bin.png"/></a><div id="events" onclick="return false;" readonly id="eventLog">';
        if (typeof optEvents != "undefined") {
          for (var i = optEvents.length - 1; i >= 0; i--) {
            events +=
              '<div class="cv-opt-event ' +
              optEvents[i].type +
              '"> <i/> <strong>' +
              optEvents[i].type +
              '</strong> <span title="' +
              optEvents[i].info +
              '">' +
              optEvents[i].info +
              "</span> </div>";
          }
        }
        events += "</div></div>";

        $html += events;

        $("div#experiments").html($html);

        var _height = 0;

        switch (nmrActiveExp) {
          case 0:
            _height = 0;
            break;
          case 1:
            _height = 397;
            break;
          default:
            _height = 522;
        }

        if (_height > 0) {
          $("div.bottom-line").addClass("invisible");
          $("div#experiments").animate({ height: _height }, 250, function () {
            $("div.bottom-line").removeClass("invisible");
          });
        }

        // Event listener for Better Results button
        if (fullURL.match(/www\.optimizely\.com\/results/) != null) {
          $("button#toggleResults").click(function (event) {
            chrome.extension.sendMessage(
              { betterResults: true },
              function (response) {}
            );
            window.close(); // Close popup
          });
        }

        // Scroll within the active experiments list we need to reposition the variation list for each experiment
        $("div.wrapper ul").scroll(function () {
          try {
            _gaq.push([
              "_trackEvent",
              "scroll",
              "list",
              "Experiment list Scroll",
            ]);

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
          } catch (e) {
            //console.log(e);
          }
        });

        var popup_events_scrolled = false;
        $("#events").scroll(function () {
          if (!popup_events_scrolled) {
            popup_events_scrolled = true;
            _gaq.push(["_trackEvent", "Events", "Popup Textarea", "scrolled"]);
          }
        });

        $('label[for="eventsInBrowser"]').click(function (event) {
          _gaq.push([
            "_trackEvent",
            "Events",
            "In-Browser",
            $("input#eventsInBrowser").prop("checked")
              ? "Deactivated"
              : "Activated",
          ]);
        });

        $(".bottom-info a").click(function (event) {
          try {
            _gaq.push([
              "_trackEvent",
              "click",
              "link",
              "Conversion.com Website",
            ]);
          } catch (e) {
            //console.log(chrome.runtime.lastError);
          }
        });
      } catch (e) {
        //console.log(e.stack);
        //console.log(chrome.runtime.lastError);
      }
    }
  } catch (e) {
    //console.log(chrome.runtime.lastError);
  }
}, 500);
