/*
* ---
* PROFILE PREVIEWS MODULE
* ---
*
* Opens up an inline preview of a user profile on hover
*
*/

(function() {
  "use strict";
  var profileLinks;
  var selectors = {
    default: ".user a",
    pen: ".pen-owner-link, .comment-username",
    full: ".pen-owner-link",
    // nth-of-type makes sure the link to the user's blog isn't also
    // included (they have the same class applied)
    posts: ".author-link:nth-of-type(2), .comment-username",
    details: ".comment-username, .pen-owner-name",
    collection: ".username, .author-link"
  };
  var selector = selectors[ INIT_DATA.__pageType ] || selectors.default;
  var penCommentsHandled = false;
  var isGridView = (function() {
    return !!INIT_DATA.__pageType.match(/^(home|explore-posts|explore-pens|explore-collections|collection)$/);
  })();

  (function init() {
    updateProfileLinks();
    if (isGridView) {
      subscribeToGrid();
    }
    if (INIT_DATA.__pageType === "pen") {
      subscribeToCommentModal();
    }
  })();

  // Listens for an event fired by CodePen whenever
  // the grid updates. This fires on pagination and also
  // the first time the grid loads
  function subscribeToGrid() {
    Hub.sub("grid-changed", function() {
      updateProfileLinks();
    });
  }

  function subscribeToCommentModal() {
    $("#view-details-button").one("click", function() {
      if (!penCommentsHandled) {
        Hub.sub("popup-open", function() {
          updateProfileLinks();
        });
      }
      penCommentsHandled = true;
    });
  }

  function updateProfileLinks() {
    // Necessary for any situation in which some of the existing profile
    // links are in place but new ones are added
    if (profileLinks) {
      profileLinks.unbind();
    }

    profileLinks = $(selector);

    // Remove all existing profile previews
    $(".ces__profile-preview").remove();

    addListeners();
  }

  function addListeners() {
    profileLinks.one("mouseenter", function() {
      var profilePreview = new Preview($(this));
    });
  }

  // Object that contains the entire profile preview
  var Preview = function(profileLink) {
    this.profileLink = profileLink;
    this.baseURL = location.origin + this.profileLink.attr("href");
    this.init();
  };

  // Grabs a blank template to fill with profile info. Since the template is
  // stored locally, there isn't any problem with making a new AJAX request
  // for the same file repeatedly.
  Preview.prototype.getTemplate = function(callback) {
    U_REQUEST_EXTENSION_URL("modules/html/profile-preview.html", function(response) {
      $.get(response, function(response) {
        this.template = $(response);
        callback();
      }.bind(this));
    }.bind(this));
  };

  // Grabs an entire profile page. It would be great to make a smaller request
  // but until CodePen publishes an API this is all we can do.
  Preview.prototype.getProfileData = function(callback) {
    $.get(this.baseURL, function(response) {
      this.parseProfileData($(response));
      callback();
    }.bind(this));
  };

  Preview.prototype.parseProfileData = function(page) {
    var profile = {};
    profile.name = page.find("#profile-name-header").text().trim();
    profile.username = page.find("#profile-username").text().trim();
    profile.isPro = !!profile.name.match(/PRO$/);
    if (profile.isPro) {
      profile.name = profile.name.replace(/PRO$/, "").trim();
    }
    profile.avatar = page.find("#profile-image").attr("src");
    profile.followers = page.find("#followers-count").text();
    profile.following = page.find("#following-count").text();
    profile.isFollowing = (page.find("#follow-this-user").css("display") === "none");
    this.profile = profile;
  };

  // Grabs popular Pens via the user's RSS feed (provided by CodePen)
  Preview.prototype.getPenData = function(callback) {
    $.get(this.baseURL + "/popular/feed", function(response) {
      var pens = this.parsePenData(response);
      callback();
    }.bind(this));
  };

  Preview.prototype.parsePenData = function(data) {
    var $data = $(data);
    var pens = [];

    $data.find("item").each(function() {
      if (pens.length == 3) { return false; } // bail after 3rd Pen
      var pen = {};
      var $this = $(this);
      pen.title = $this.find("title").text();
      pen.url = $this.find("link").text();
      pen.slug = pen.url.substr(pen.url.lastIndexOf("/") + 1);
      pen.iframe = $("<iframe>");
      pen.iframe.attr("src", location.protocol + "//s.codepen.io/derekjp/fullcpgrid/" + pen.slug);
      pen.iframe.attr("data-title", pen.title);
      pen.iframe.attr("sandbox", INIT_DATA.__CPDATA.iframe_sandbox);
      pen.iframe.attr("scrolling", "no");
      pen.iframe.attr("frameborder", "0");
      pen.iframe.attr("allowtransparency", "true");
      pen.iframe.addClass("ces__iframe");
      pens.push(pen);
    });
    this.pens = pens;
  };

  // Responsible for rendering Pens to the preview
  Preview.prototype.addProfileToPreview = function() {
    var profile = this.profile;
    var template = this.template;
    var name =  template.find(".ces__profile__name");

    name.html(U_ESCAPE_HTML(profile.name) + " ");
    if (profile.isPro) {
      name.append($("<span class='ces__pro-badge badge badge-pro'>Pro</span>"));
    }
    template.find(".ces__profile__link").attr("href", this.baseURL);
    template.find(".ces__profile__username").html(U_ESCAPE_HTML(profile.username));
    template.find(".ces__profile__avatar").attr("src", profile.avatar);
    template.find(".ces__profile__followers-stat").html(profile.followers);
    template.find(".ces__profile__followers-link").attr("href", this.baseURL + "/followers");
    template.find(".ces__profile__following-stat").html(profile.following);
    template.find(".ces__profile__following-link").attr("href", this.baseURL + "/following");

    // Controls toggling of follow/unfollow state
    var handleFollowEvents = function(initialState) {
      var username = this.profile.username.substring(1); //removes "@"

      // Strip away follow buttons if it's the user's own profile
      // (or if you're not logged in)
      if (username === INIT_DATA.__user.username || INIT_DATA.__user.username === "anon") {
        template.find(".ces__profile__follow-buttons").remove();
        return;
      }

      var state = initialState;
      var followButtons = template.find(".ces__profile__follow-buttons");
      var followBaseURL = location.protocol + "//codepen.io/follow/user/" + username;
      var followersEl = template.find(".ces__profile__followers-stat");
      var followersNum = parseInt(followersEl.html());

      followButtons.toggleClass("ces__isFollowing", state);
      followButtons.click(function() {
        state = !state;
        $(this).toggleClass("ces__isFollowing", state);
      });

      template.find(".ces__follow-user").click(function() {
        U_CP(followBaseURL + "/follow");
        followersNum++;
        followersEl.html(followersNum);
      });

      template.find(".ces__unfollow-user").click(function() {
        U_CP(followBaseURL + "/unfollow");
        followersNum--;
        followersEl.html(followersNum);
      });
    }.bind(this);

    handleFollowEvents(profile.isFollowing);
  };

  // Responsible for rendering Pens to the preview
  Preview.prototype.addPensToPreview = function() {
    var pens = this.pens;
    var pensWrapper = this.template.find(".ces__profile__pens");
    for (var i = 0; i < pens.length; i++) {
      var penWrapper = $("<div class='ces__pen'>");
      var iframeWrapper = $("<div class='ces__iframe-wrap'>");
      var titleWrapper = $("<div class='ces__pen__title'>");
      var penLink = $("<a class='ces__pen__link'>");
      penLink.attr("href", pens[ i ].url);
      iframeWrapper.append(pens[ i ].iframe);
      titleWrapper.html(U_ESCAPE_HTML(pens[ i ].title));
      penWrapper
        .append(penLink)
        .append(iframeWrapper)
        .append(titleWrapper);

      pensWrapper.append(penWrapper);
    }
  };

  Preview.prototype.display = function() {
    this.position();
    this.template.addClass("active");
  };

  Preview.prototype.hide = function() {
    this.template.removeClass("active");
  };

  Preview.prototype.position = function() {
    var offset = this.profileLink.offset();
    var height = this.profileLink.height();

    this.template.css("left", offset.left);
    this.template.css("top", offset.top + height);
  };

  Preview.prototype.addListeners = function() {
    var timer;
    this.profileLink.mouseenter(function() {
      this.startDisplayTimer();
    }.bind(this));

    // We need to wait until neither the profile link *nor* the
    // preview is hovered to  hide everything.
    //
    // By adding a 0ms timeout we prevent the preview
    // from instantly collapsing when the user moves
    // their cursor from the link to the preview.
    this.profileLink.add(this.template).mouseenter(function() {
      if (timer) {
        clearTimeout(timer);
      }
    }).mouseleave(function() {
      timer = setTimeout(function() {
        this.stopDisplayTimer();
        this.hide();
      }.bind(this), 0);
    }.bind(this));
  };

  Preview.prototype.startDisplayTimer = function() {
    this.displayTimer = setTimeout(function() {
      this.display();
    }.bind(this), 1000);
  };

  Preview.prototype.stopDisplayTimer = function() {
    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
    }
  };

  Preview.prototype.fillTemplate = function() {
    // Holy callback hell
    this.getProfileData(function() {
      this.getPenData(function() {
        this.addProfileToPreview();
        this.addPensToPreview();
        $("body").append(this.template);
      }.bind(this));
    }.bind(this));
  };

  Preview.prototype.init = function() {
    this.getTemplate(function() {
      this.addListeners();
      this.startDisplayTimer();
      this.fillTemplate();
    }.bind(this));
  };
})();