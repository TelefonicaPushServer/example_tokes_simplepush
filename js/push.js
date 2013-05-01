'use strict';

var DB_NAME = 'tsimplepush_db';
var STORE_NAME = 'push_app_store';

var Push = (function() {

  var debugPush = true;

  var pushEnabled = navigator.push && navigator.push.register;

  function isPushEnabled() {
    return pushEnabled;
  }

  function debug(msg) {
    dump('[DEBUG] tsimplepush. Push: ' + msg + '\n');
  }

  // aCallback: Must receive a string parameter on which the new endpoint will be passed
  // simulate: specify if we should return a fake endpoint if there's no support or just fail
  function getNewEndpoint(simulate, aCallback) {
    if (pushEnabled) {
      var self = this;
      var req = navigator.push.register();
      
      req.onsuccess = function(e) {
          var endpoint = req.result;
          debugPush && debug("New endpoint: " + endpoint );
          aCallback(endpoint);
      };

      req.onerror = function(e) {
        debug("Error getting a new endpoint: " + JSON.stringify(e));
      }
        
    } else {
      // No push on the DOM, just simulate it and be done...
      debugPush && debug ("Push is not enabled!!!");
      aCallback(simulate ? "http://anurl.with.com/" + Math.floor(Math.random() * 10000) : undefined);
    }
  }

  function sendPushTo(aEndpoint) {
    // We can do this even if the platform doesn't support push. We cannot receive
    // but we can still send notifications...
    var xhr = new XMLHttpRequest();
    xhr.open("PUT",aEndpoint);
    xhr.onload = function () {
      // We won't really do anything here...
      debugPush && console.log("Push successfully sent to " + aEndpoint);
    }
    xhr.onerror = function (e) {
      // And we should probably process this...
      debugPush && debug("Got an error while sending a push notification to " + aEndpoint + ": " + 
                          JSON.stringify(e));
    }
    debugPush && debug("Sending Toke to " + aEndpoint);

    xhr.send("version=" + new Date().getTime());
  }

  function setPushHandler(aHandler) {
    if (pushEnabled && window.navigator.mozSetMessageHandler) {
      window.navigator.mozSetMessageHandler('push', aHandler);
    } // Else?...
  }
    

  return {
    sendPushTo: sendPushTo,
    isPushEnabled: isPushEnabled,
    getNewEndpoint: getNewEndpoint,
    setPushHandler: setPushHandler
    
  }

})();
