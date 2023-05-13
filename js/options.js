$(document).ready(function () {
  chrome.storage.sync.get(
    {
      qaCookieName: "",
      qaCookieValue: "",
      qaCookieAnyValue: true,
    },
    function (items) {
      $("input[name=cookie-name]").val(items.qaCookieName);

      if (items.qaCookieAnyValue) {
        $("#cookie-value-options").parent().addClass("any");
        $("input[name=cookie-value]").prop("disabled", true);
        $("input[name=cookie-value]").parent().addClass("invisible");
        $("div.cookie-value-option[value=any]").click();
      } else {
        $("input[name=cookie-value]").val(items.qaCookieValue);
        $("input[name=cookie-value]").parent().removeClass("invisible");
        $("div.cookie-value-option[value=equals]").click();
      }
    }
  );

  $("form#setQAcookie").submit(function (event) {
    var valid = true;

    $(this).find("span.message").css("display", "none");
    $(this).find(".input-field").removeClass("error");

    var qaCookieName = $(this).find("input[name=cookie-name]").val();
    var qaCookieValue = "";

    if (!$.trim(qaCookieName).length) {
      $(this).find("input[name=cookie-name]").val("");
      $(this).find("#cookie-name-field").addClass("error");
      $(this).find("span.cookie-name-message").css("display", "inline");
      valid = false;
    }

    if ($("div#cookie-value-options > span").attr("value") === "equals") {
      qaCookieValue = $(this).find("input[name=cookie-value]").val();

      if (!$.trim(qaCookieValue).length) {
        $(this).find("input[name=cookie-value]").val("");
        $(this).find("#cookie-value-field").addClass("error");
        $(this).find("span.cookie-value-message").css("display", "inline");
        valid = false;
      }
    }

    if (valid) {
      try {
        chrome.storage.sync.get(
          {
            qaCookieName: "",
            domains: "",
          },
          function (item) {
            var domains = item.domains.split(",");
            var counter = domains.length;
            domains.forEach(function (domain) {
              if (domain.length) {
                chrome.cookies.remove(
                  {
                    url: domain,
                    name: item.qaCookieName,
                  },
                  function () {
                    if (--counter == 0) {
                      chrome.storage.sync.set(
                        {
                          qaCookieName: qaCookieName,
                          qaCookieAnyValue:
                            $("div#cookie-value-options > span").attr(
                              "value"
                            ) === "any",
                          qaCookieValue: qaCookieValue,
                        },
                        function () {
                          $(
                            "#cv-modal-overlay, .cv-modal-box.setup-qa-confirmation"
                          ).addClass("cv-visible");
                        }
                      );
                    }
                  }
                );
              } else {
                chrome.storage.sync.set(
                  {
                    qaCookieName: qaCookieName,
                    qaCookieAnyValue:
                      $("div#cookie-value-options > span").attr("value") ===
                      "any",
                    qaCookieValue: qaCookieValue,
                  },
                  function () {
                    $(
                      "#cv-modal-overlay, .cv-modal-box.setup-qa-confirmation"
                    ).addClass("cv-visible");
                  }
                );
              }
            });
          }
        );
      } catch (e) {
        //console.log(e.message);
      }
    }

    return false;
  });

  $("form#getInTouch input[type=text], form#getInTouch textarea").focus(
    function (event) {
      $(this).parent().addClass("focus");
    }
  );

  $("form#getInTouch input[type=text], form#getInTouch textarea").blur(
    function (event) {
      $(this).parent().removeClass("focus");
      $(this).parent().removeClass("error success");

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

  $("form#getInTouch").submit(function (event) {
    $(this).find("input[type=text], textarea").blur();

    if (!$(this).find("div.input-field.error").length) {
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
        $(".cv-modal-box.get-in-touch")
          .removeClass("cv-visible")
          .addClass("cv-invisible");
        $(".cv-modal-box.get-in-touch-confirmation")
          .removeClass("cv-invisible")
          .addClass("cv-visible");
      });
    }

    return false;
  });

  $("#cookie-value-options span").click(function (event) {
    if ($(this).parent().hasClass("open")) {
      $(this).siblings("div").slideUp("fast");
      $(this).parent().removeClass("open");
    } else {
      $(this).siblings("div").slideDown("fast");
      $(this).parent().addClass("open");
    }
  });

  $("div.cookie-value-option").click(function (event) {
    $(this).parent().siblings("span").attr("value", $(this).attr("value"));
    $(this)
      .parent()
      .siblings("span")
      .html($(this).text() + "<i></i>");
    $(this)
      .parents(".input-container")
      .removeClass("any equals")
      .addClass($(this).attr("value"));
    $("div.cookie-value-option").removeClass("selected");
    $("div.cookie-value-option[value=" + $(this).attr("value") + "]").addClass(
      "selected"
    );
    $("input[name=cookie-value]").prop(
      "disabled",
      $(this).attr("value") === "any"
    );
    if ($(this).attr("value") === "any") {
      $("input[name=cookie-value]").parent().addClass("invisible");
    } else {
      $("input[name=cookie-value]").parent().removeClass("invisible");
    }
  });

  $("form#setQAcookie input[type=text]").focus(function (event) {
    $(this).parent().addClass("focus");
  });

  $("form#setQAcookie input[type=text]").blur(function (event) {
    $(this).parent().removeClass("focus");

    if (!$.trim($(this).val()).length) {
      $(this).val("");
      $(this).parent().removeClass("success").addClass("error");
      $(this)
        .parents(".input-container")
        .children(".message")
        .css("display", "inline");
      valid = false;
    } else {
      $(this).parent().removeClass("error").addClass("success");
    }
  });

  $(".cv-modal-box #cv-button, .cv-modal-box #cv-close").click(function (
    event
  ) {
    $("#cv-modal-overlay").removeClass("cv-visible");
  });

  $("#menu #contact-us").click(function (event) {
    $("#cv-modal-overlay, .cv-modal-box").removeClass("cv-visible");
    $("#cv-modal-overlay, .cv-modal-box.get-in-touch").addClass("cv-visible");

    return false;
  });

  $(document).click(function (event) {
    if (!$(event.target).closest("#cookie-value-options span").length) {
      if ($("#cookie-value-options").hasClass("open")) {
        $("#cookie-value-options > div").slideUp("fast");
        $("#cookie-value-options").removeClass("open");
      }
    }

    if (
      $("#cv-modal-overlay").is(":visible") &&
      !$(event.target).closest(".cv-modal-box").length
    ) {
      $("#cv-modal-overlay").removeClass("cv-visible");
    }
  });
});
