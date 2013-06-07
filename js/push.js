'use strict';

var DB_NAME = 'tsimplepush_db';
var STORE_NAME = 'push_app_store';

var Push = (function() {

  var debugPush = true;
  var debug = debugPush?Utils.debug.bind(undefined,"tsimplepush:Push"):function () { };

  var pushEnabled = navigator.push && navigator.push.register;
  var pushUnregEnabled = navigator.push && navigator.push.unregister;

  function isPushEnabled() {
    return pushEnabled;
  }

  // aCallback: Must receive a string parameter on which the new endpoint will be passed
  // simulate: specify if we should return a fake endpoint if there's no support or just fail
  function getNewEndpoint(simulate, aCallback) {
    if (pushEnabled) {
      var self = this;
      var req = navigator.push.register();

      req.onsuccess = function(e) {
          var endpoint = req.result;
          debug("New endpoint: " + endpoint );
          aCallback(endpoint);
      };

      req.onerror = function(e) {
        debug("Error getting a new endpoint: " + JSON.stringify(e));
      }
    } else {
      // No push on the DOM, just simulate it and be done...
      debug ("Push is not enabled!!!");
      aCallback(simulate ? "http://anurl.with.com/" + Math.floor(Math.random() * 10000) : undefined);
    }
  }

  function deleteEndpoint(aEndpoint, aCallback) {
    debug("deleteEndpoint: " + aEndpoint);
    if (pushUnregEnabled) {
      var self = this;
      var req = navigator.push.unregister(aEndpoint);

      req.onsuccess = function(e) {
        aCallback(true);
      };

      req.onerror = function(e){
        debug("Error unregistering endpoint: " + JSON.stringify(e));
        aCallback(false);
      };
    } else {
      debug("Unregister Push is not enabled!!!");
      aCallback(false);
    }
  }

  function sendPushTo(aEndpoint) {
    // We can do this even if the platform doesn't support push. We cannot receive
    // but we can still send notifications...
    Utils.sendXHR('PUT', aEndpoint, "version=" + new Date().getTime(),
                  function (e) { debug("Push successfully sent to " + aEndpoint);},
                  function (e) { debug("Got an error while sending a push notification to " + aEndpoint + ": " +
                                       JSON.stringify(e));});
  }

  function setPushHandlers(aPushHandler, aPushRegisterHandler) {
    if (pushEnabled && window.navigator.mozSetMessageHandler) {
      aPushHandler && window.navigator.mozSetMessageHandler('push', aPushHandler);
      aPushRegisterHandler &&  window.navigator.mozSetMessageHandler('push-register', aPushRegisterHandler);
    } // Else?...
  }


  return {
    sendPushTo: sendPushTo,
    isPushEnabled: isPushEnabled,
    getNewEndpoint: getNewEndpoint,
    setPushHandlers: setPushHandlers,
    deleteEndpoint: deleteEndpoint
  }
})();
