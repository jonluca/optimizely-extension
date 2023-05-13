// GA Tracking
// var _gaq = _gaq || [];
// _gaq.push(['_setAccount', 'UA-66263902-1']);
// _gaq.push(['_trackPageview']);
// (function() {
//   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//   ga.src = 'https://ssl.google-analytics.com/ga.js';
//   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
// })();
// _gaq.push(['_trackEvent', 'pageview', 'lead_gen', 'seen']);

$(document).ready(function () {
  $(".footer .copyright").text(new Date().getFullYear());

  $.fn.validateField = function () {
    var id = this.attr("id");
    var parent = this.parent();
    var error = false;
    parent.removeClass("valid").removeClass("error");
    $("." + id + "-message").hide();

    switch (id) {
      case "name":
      case "company":
      case "enquiry":
        error = this.val() === "";
        break;
      case "email":
        error = this.val() === "" || this.val().match(/^\S+@\S+$/) === null;
        break;
      case "phone":
        if (this.val() !== "") {
          parent.addClass("valid");
        }
        return this;
    }

    if (error) {
      parent.addClass("error");
      $("." + id + "-message").show();
    } else {
      parent.addClass("valid");
    }

    return this;
  };

  $('input[type="text"],input[type="email"],textarea').focusin(function (
    event
  ) {
    $(this).parent().addClass("focus");
  });
  $('input[type="text"],input[type="email"],textarea').focusout(function (
    event
  ) {
    $(this).parent().removeClass("focus");

    $(this).validateField();
  });

  $('form input[type="submit"]').click(function (event) {
    event.preventDefault();

    _gaq.push(["_trackEvent", "click", "lead_gen_form", "submitted"]);

    $('input[type="text"],input[type="email"],textarea').each(function (
      index,
      el
    ) {
      $(this).validateField();
    });

    if ($(".input-field.error").length === 0) {
      $("#content .intro").animate(
        {
          opacity: "0",
        },
        400,
        function () {
          $("#content .text").css("height", $("#content .text").css("height"));
          $("#content .text").addClass("thanks");
          $("#content .intro").hide();
          $("#content .thank-you, #content div.img").show();
          $("#content .thank-you").animate(
            {
              opacity: "1",
            },
            400
          );
        }
      );

      _gaq.push(["_trackEvent", "click", "lead_gen_form", "valid submission"]);

      $.ajax({
        url: "https://docs.google.com/forms/d/e/1FAIpQLSfOofgoCPEN8_9Zgtl55YxgcflYu3Ze09HfFov2ds1XZsliMg/formResponse",
        type: "POST",
        dataType: "jsonp",
        data: {
          "entry.1011706251": $('form input[name="name"]').val(), // Name
          "entry.501899751": $('form input[name="email"]').val(), // Email
          "entry.372991109": $('form textarea[name="enquiry"]').val(), // Enquiry
        },
      });
    }
  });

  $("#currVersion").text(chrome.runtime.getManifest().version);
});
