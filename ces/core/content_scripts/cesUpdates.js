var cesUpdates = (function(){
  var currentPatch = "0.5.0";
  var storageString = currentPatch + "-patch-notes";
  chrome.storage.local.get("disable-patch-notes", function(response) {

    // Note: never ever change this to a different name, you'll bypass the setting
    // and serve patch notes to people who disabled them which is super obnoxious
    if (!!response[ "disable-patch-notes" ]) {
      return;
    } else {
      chrome.storage.local.get(storageString, function(response) {
        if (!response[ storageString ]) {
          init();
        }
      });
    }
  });

  function init() {
    var notes = `
                <h5>New Features</h5>
                <ul>
                  <li>Added a small visiual indicator when new items are added to your activity feed.</li>
                </ul>
                  <a class="ces__update-modal__cta" target="_blank" href="https://github.com/alexzaworski/CodePen-Enhancement-Suite">See what's new »</a>
                <div class="ces__update__actions ces__clearfix">
                  <button id="ces__hide-forever" class="ces__text-like-button">Never show patch notes</button>
                  <button id="ces__dismiss" class="ces__update__dismiss button button-medium green">Dismiss</button>
                </div>`;
    var template = `<div id="ces__updates" class="ces__update-modal">
                      <h3 class="ces__update__title">CodePen Enhancement Suite ${currentPatch}</h3>
                      <div class="ces__update__notes">
                        ${notes}
                      </div>
                    </div>`;

    var modal = document.createElement("div");
    modal.innerHTML = template;
    modal = modal.firstChild;
    document.body.appendChild(modal);
    var dismissButton = document.getElementById("ces__dismiss");
    dismissButton.addEventListener("click", function() {
      modal.parentNode.removeChild(modal);
      var settingsObj = {};
      settingsObj[ storageString ] = true;
      chrome.storage.local.set(settingsObj);
    });

    var hideForever = document.getElementById("ces__hide-forever");
    hideForever.addEventListener("click", function() {
      modal.parentNode.removeChild(modal);
      chrome.storage.local.set({"disable-patch-notes": true});
    });
  }
})();