var s = document.createElement("script");
s.src = chrome.extension.getURL("js/functions.js");
var head;

var headReady = setInterval(function () {
  head = document.head || document.getElementsByTagName("head")[0];
  if (head !== null && typeof head !== "undefined") {
    clearInterval(headReady);

    head.appendChild(s);

    s.onload = function () {
      s.parentNode.removeChild(s);
    };
  }
});

function addEventsInBrowser(collapsed) {
  var bodyExists = setInterval(function () {
    if ($("body").length) {
      clearInterval(bodyExists);
      $("body").append(
        '<div id="cv-optimizely-events"' +
          (collapsed ? ' class="collapsed forceCollapsed"' : "") +
          '> <div id="cv-box-header"> <a id="cv-clear-events" href="javascript:;">Clear events</a> <a id="cv-close" href="javascript:;"><img src="https://cfactory-img.s3.amazonaws.com/chrome-extension/images/close.png"/></a> <a id="cv-exp-coll" href="javascript:;"><img src="https://cfactory-img.s3.amazonaws.com/chrome-extension/images/expand.png"/></a> </div> <div id="cv-events"></div>'
      );
    }
  }, 25);
}

chrome.runtime.sendMessage({ getEventsLog: null }, function (response) {});

function addEventsLog(log) {
  var eventsBoxExists = setInterval(function () {
    if ($("div#cv-optimizely-events div#cv-events").length) {
      clearInterval(eventsBoxExists);

      for (var i = 0; i < log.length; i++) {
        $("div#cv-optimizely-events div#cv-events").prepend(
          '<div class="cv-opt-event ' +
            log[i].type +
            '"> <i/> <strong>' +
            log[i].type +
            '</strong> <span title="' +
            log[i].info +
            '">' +
            log[i].info +
            "</span> </div>"
        );
      }

      $("div#cv-optimizely-events a#cv-clear-events").text(
        "Clear events (" + $(".cv-opt-event").length + ")"
      );
    }
  }, 25);
}

var checkJquery = setInterval(function () {
  try {
    if (typeof $ != "undefined") {
      clearInterval(checkJquery);

      $(document).on(
        "change",
        "form#getInTouch input[name=options]:radio",
        function () {
          try {
            var placeholders = [
              {
                option: "option1",
                title: "e.g. QR Code",
                desc: "e.g. This functionality is not working",
                link: "http://conversion.com/image.png",
              },
              {
                option: "option2",
                title: "e.g. Events box",
                desc: "e.g. Would be great to have a button to clear the events box",
                link: "e.g. http://conversion.com/image.png",
              },
              {
                option: "option3",
                title: "e.g. A/B testing",
                desc: "e.g. I would like to know more about your services. (reply to: example@example.com)",
                link: "e.g. http://conversion.com/image.png",
              },
            ];

            var option = $.grep(placeholders, function (e) {
              return (
                e.option ==
                $("form#getInTouch input[name=options]:checked").attr("id")
              );
            });

            $("form#getInTouch input[name=title]").attr(
              "placeholder",
              option[0].title
            );
            $("form#getInTouch textarea").attr("placeholder", option[0].desc);
            $("form#getInTouch input[name=image]").attr(
              "placeholder",
              option[0].link
            );
          } catch (e) {
            //console.log(e.message);
          }
        }
      );

      $(document).on(
        "focus",
        "form#getInTouch input[type=text], form#getInTouch textarea",
        function (event) {
          $(this).parent().addClass("focus");
        }
      );

      $(document).on(
        "blur",
        "form#getInTouch input[type=text], form#getInTouch textarea",
        function (event) {
          $(this).parent().removeClass("focus");
          $(this).parent().removeClass("error success");
          $(this).parent().siblings(".message").css({ display: "none" });

          if (!$.trim($(this).val()).length) {
            if (!$(this).hasClass("optional")) {
              $(this).val("");
              $(this).parent().removeClass("success").addClass("error");
              $(this)
                .parents(".input-container")
                .children(".message")
                .css("display", "inline");
              valid = false;
            }
          } else {
            $(this).parent().removeClass("error").addClass("success");
          }
        }
      );

      $(document).on("submit", "form#getInTouch", function (event) {
        event.stopPropagation();

        $("form#getInTouch").find("input[type=text], textarea").blur();

        if (!$("form#getInTouch").find("div.input-field.error").length) {
          var type = $(this)
            .find("input[name=options]:checked")
            .attr("messageType");
          var title = $(this).find("input[name=title]").val();
          var desc = $(this).find("textarea").val();
          var imgLink = $(this).find("input[name=image]").val();

          $.ajax({
            url: "https://docs.google.com/a/conversion.com/forms/d/1DZ4HNzMVWORexaX8kFfzMP4yt3kG0Gk41PK25R3uHgE/formResponse",
            type: "POST",
            dataType: "jsonp",
            data: {
              "entry.530914854": type, // Field 1
              "entry.1349232571": title, // Field 2
              "entry.1420010213": desc, // Field 3
              "entry.152484064": imgLink, // Field 4
            },
          }).always(function () {
            $("#cv-modal-box.get-in-touch").addClass("cv-invisible");
            $("#cv-modal-box.get-in-touch-confirmation").addClass("cv-visible");
          });
        }

        return false;
      });

      $(document).on("click", ".options-page", function (event) {
        try {
          chrome.runtime.sendMessage(
            { createTab: chrome.extension.getURL("options.html") },
            function (response) {}
          );
        } catch (e) {
          //console.log(e.message);
        }
      });

      $(document).on(
        "click",
        "a#cv-button.close, span#cv-close",
        function (event) {
          try {
            $(this).parents("#cv-modal-overlay").remove();
          } catch (e) {
            //console.log(e.message);
          }
        }
      );

      // Check if "Events in Browser" is active
      chrome.runtime.sendMessage(
        { isEventsInBrowserActive: null },
        function (response) {}
      );

      $(document).on(
        "click",
        "a#cv-button.close, span#cv-close",
        function (event) {
          try {
            $(this).parents("#cv-modal-overlay").remove();
          } catch (e) {
            //console.log(e.message);
          }
        }
      );

      $(document).on("click", "a#cv-clear-events", function (event) {
        try {
          chrome.runtime.sendMessage(
            { clearEventsLog: null },
            function (response) {}
          );
          $(".cv-opt-event").remove();
        } catch (e) {
          //console.log(e.message);
        }
      });

      $(document).on(
        "click",
        "#cv-qr-overlay, #cv-modal-overlay",
        function (event) {
          try {
            if (
              !$(event.target).closest("#cv-qr-code > div").length &&
              !$(event.target).closest("#cv-modal-box").length
            ) {
              $(this).remove();
            }
          } catch (e) {
            //console.log(e.message);
          }
        }
      );

      $(document).on(
        "click",
        "div#cv-optimizely-events a#cv-exp-coll",
        function (event) {
          try {
            $("div#cv-optimizely-events")
              .removeClass("forceCollapsed")
              .toggleClass("collapsed");

            $("div#cv-optimizely-events").animate(
              {
                height: $("div#cv-optimizely-events").hasClass("collapsed")
                  ? 40
                  : 388,
              },
              1000,
              function () {}
            );
            $("div#cv-optimizely-events div#cv-events").fadeTo(
              1000,
              $("div#cv-optimizely-events").hasClass("collapsed") ? 0 : 1,
              function () {}
            );

            chrome.runtime.sendMessage(
              {
                updateEventsInBrowser: $("div#cv-optimizely-events").hasClass(
                  "collapsed"
                )
                  ? 2
                  : 1,
              },
              function (response) {}
            );
          } catch (e) {
            //console.log(e.message);
          }
        }
      );

      $(document).on(
        "click",
        "div#cv-optimizely-events a#cv-close",
        function (event) {
          try {
            $("div#cv-optimizely-events").remove();
            chrome.runtime.sendMessage(
              { updateEventsInBrowser: 0 },
              function (response) {}
            );
          } catch (e) {
            //console.log(e.message);
          }
        }
      );
    }
  } catch (e) {
    //console.log('Error: ' + e.message);
  }
}, 25);

// Receive optimizely object and send to background
document.addEventListener("cF_connectExtension", function (e) {
  chrome.runtime.sendMessage({ stringObject: e.detail }, function (response) {
    /*console.log(response);*/
  });
});

// Receive optimizely events
document.addEventListener("cF_optimizelyEvent", function (e) {
  chrome.runtime.sendMessage({ eventArray: e.detail }, function (response) {
    /*console.log(response);*/
  });

  var eventsBoxExists = setInterval(function () {
    if ($("div#cv-optimizely-events div#cv-events").length) {
      clearInterval(eventsBoxExists);

      $("div#cv-optimizely-events div#cv-events").prepend(
        '<div class="cv-opt-event ' +
          e.detail.type +
          '"> <i/> <strong>' +
          e.detail.type +
          '</strong> <span title="' +
          e.detail.info +
          '">' +
          e.detail.info +
          "</span> </div>"
      );

      $("div#cv-optimizely-events a#cv-clear-events").text(
        "Clear events (" + $(".cv-opt-event").length + ")"
      );
    }
  }, 25);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (typeof request.variationChange != "undefined") {
    var variationEvent = new CustomEvent(
      "cF_changeVariation",
      { detail: request.variationChange },
      false
    );
    window.dispatchEvent(variationEvent);
  } else if (typeof request.tabChange != "undefined") {
    var tabEvent = new CustomEvent(
      "cF_changeTab",
      { detail: request.tabChange },
      false
    );
    window.dispatchEvent(tabEvent);
  } else if (typeof request.betterResults != "undefined") {
    var betterEvent = new CustomEvent(
      "cF_betterResults",
      { detail: request.betterResults },
      false
    );
    window.dispatchEvent(betterEvent);
  } else if (typeof request.qrCode != "undefined") {
    $("#cv-modal-overlay, #cv-qr-overlay").remove();

    $("body").append(
      '<div id="cv-qr-overlay" style="background-color: rgba(0,0,0,0.6); position: fixed; bottom: 0; top:0; right:0; left:0; z-index: 999999999999; color: right;"><div id="cv-qr-code" style="left:calc((100% - 300px)/2);top:calc((100% - 315px)/2);position: absolute; "><span style="display: block; width: 30px; height: 30px; position: absolute; top: -15px; right: -15px; background-image: url(https://cfactory-img.s3.amazonaws.com/chrome-extension/images/lightbox-close.png); cursor: pointer;">&nbsp;</span><div id="qr-canvas"></div><div style="background-color:#fff; width:300px; padding:0 7px; position: relative; z-index: 3; top: -14px; box-sizing: border-box; text-align:right; height: 23px;"><a target="_blank" href="http://conversion.com/?utm_source=chrome%20extension&amp;utm_medium=chrome%20extension&amp;utm_campaign=chrome%20extension%20clicks"><img id="cv-official-final-logo" style="max-width: initial !important;max-height: initial !important;display: initial !important;" width="110" src="https://cfactory-img.s3.amazonaws.com/chrome-extension/images/logo.png"/></div></a></div></div>'
    );

    $("#cv-qr-code div#qr-canvas").empty().qrcode({
      render: "canvas",
      minVersion: 0,
      maxVersion: 40,
      ecLevel: "L",
      left: 0,
      top: 0,
      size: 300,
      fill: "#221F1F",
      background: "#fff",
      text: request.qrCode,
      radius: 0,
      quiet: 2,
      mode: 0,
    });
  } else if (typeof request.setupQA != "undefined") {
    $("#cv-modal-overlay, #cv-qr-overlay").remove();

    $("body").append(
      '<div id="cv-modal-overlay"><div id="cv-modal-box"><span id="cv-close">&nbsp;</span><div id="cv-modal"><div id="cv-title">SETUP QA COOKIE</div><h1>To activate QA mode you need to</br>configure your <span>QA cookie</span>.</h1><a id="cv-button" class="options-page" href="javascript:;" target="_blank">SETUP NOW</a><a  href="http://conversion.com/?utm_source=chrome%20extension&amp;utm_medium=chrome%20extension&amp;utm_campaign=chrome%20extension%20clicks" target="_blank" id="cv-logo"><img src="' +
        chrome.extension.getURL("images/logo.png") +
        '" alt="Conversion.com"></a><i id="bottom-line">&nbsp;</i></div></div></div>'
    );
  } else if (typeof request.feedback != "undefined") {
    $("#cv-modal-overlay, #cv-qr-overlay").remove();

    $("body").append(
      '<div id="cv-modal-overlay"> <div id="cv-modal-box" class="get-in-touch"> <span id="cv-close">&nbsp;</span> <div id="cv-modal"> <div id="cv-title">GET IN TOUCH</div> <form id="getInTouch" class="clearfix"> <div id="contact-options"> <span> <input id="option1" name="options" checked type="radio" messageType="Bug"/> <label for="option1">Report a bug</label> </span> <span> <input id="option2" name="options" type="radio" messageType="Request"/> <label for="option2">Feature request</label> </span> <span> <input id="option3" name="options" type="radio" messageType="Contact"/> <label for="option3">Other enquiries</label> </span> </div> <div class="input-container"> <span class="title-message message">This field is required.</span> <label for="title">Title</label> <div class="input-field" id="title-field"> <input type="text" name="title" id="title" placeholder="e.g. QR Code" autocomplete="off"> <i class="validation">&nbsp;</i> </div> </div> <div class="input-container"> <span class="desc-message message">This field is required.</span> <label for="desc">Description</label> <div class="input-field textarea" id="desc-field"> <textarea type="text" name="desc" id="desc" placeholder="e.g. This functionality is not working."></textarea> <i class="validation">&nbsp;</i> </div> </div> <div class="input-container optional"> <label for="desc">Image Url (optional)</label> <div class="input-field" id="image-field"> <input type="text" name="image" id="image" placeholder="e.g. http://conversion.com/image.png" class="optional" autocomplete="off"> </div> </div> <input value="SEND" type="submit"/> </form> <a href="http://conversion.com/?utm_source=chrome%20extension&amp;utm_medium=chrome%20extension&amp;utm_campaign=chrome%20extension%20clicks" target="_blank" id="cv-logo"><img src="' +
        chrome.extension.getURL("images/logo.png") +
        '" alt="Conversion.com"></a> <i id="bottom-line">&nbsp;</i> </div> </div> <div id="cv-modal-box" class="get-in-touch-confirmation"><span id="cv-close">&nbsp;</span><div id="cv-modal"><div id="cv-title">GET IN TOUCH</div><h1>We have received your message.<br/>Thanks for your input.</h1><a id="cv-button" class="close" href="javascript:;" target="_blank">CLOSE</a><a  href="http://conversion.com/?utm_source=chrome%20extension&amp;utm_medium=chrome%20extension&amp;utm_campaign=chrome%20extension%20clicks" target="_blank" id="cv-logo"><img src="' +
        chrome.extension.getURL("images/logo.png") +
        '" alt="Conversion.com"></a><i id="bottom-line">&nbsp;</i></div></div></div>'
    );
  } else if (typeof request.eventsInBrowser !== "undefined") {
    if (request.eventsInBrowser !== 0) {
      addEventsInBrowser(request.eventsInBrowser === 2);
    } else {
      $("div#cv-optimizely-events").remove();
    }
  } else if (typeof request.addEventsLog !== "undefined") {
    addEventsLog(request.addEventsLog);
  } else if (typeof request.clearEventsLog !== "undefined") {
    $(".cv-opt-event").remove();
    $("#cv-clear-events").text("Clear events");
  }
});
