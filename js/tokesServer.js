var TokesServer = (function() {

  'use strict';

  // Toggle this if/when the server side is installed
  //  var server = undefined;
  // This one should work but there's no warranty though. Better to use your own one
  // see https://github.com/TelefonicaPushServer/example_tokes_simplepush_server for the server code
  var server = "http://push.sigsegv.es:8123";

  var debugTServer = true;

  var debug = debugTServer?Utils.debug.bind(undefined,'tsimplepush:TokesServer'):function () { };

  function isConfigured() {
    return (server != null && server != undefined && server != "");
  }

  function sendEndpoint(aSelfNick, aNick, aEndpoint) {
    // should URLize aSelfNick, aNick and aEndPoint... definitely aEndpoint
    var dataToSend = 'endpoint=' + aEndpoint;
    debug ("Sending PUT " + dataToSend + "to " + server );
    if (server) {
      Utils.sendXHR("PUT", server + "/friend/" + encodeURIComponent(aNick) + "/" + 
                           encodeURIComponent(aSelfNick), dataToSend);
    }
  }

  function eraseEndpoint(aSelfNick, aNick, aEndpoint, aSuccessCallback, aFailureCallback) {
    // should URLize aSelfNick, aNick and aEndPoint... definitely aEndpoint
    var dataToSend = 'endpoint=' + aEndpoint;
    debug ("Sending DELETE " + dataToSend + " to " + server );
    if (server) {
      Utils.sendXHR("DELETE", server + "/friend/" + encodeURIComponent(aNick) + "/" + 
                           encodeURIComponent(aSelfNick), dataToSend, aSuccessCallback, aFailureCallback);
    }
  }

  function loadMyRemoteFriends(aSelfNick, aSuccessCallback, aFailureCallback) {
    // To-Do: This should load the data remotely... if the server is configured and up
    if (isConfigured()) { // Server side not done yet
      Utils.sendXHR("GET", server + "/friend/" + encodeURIComponent(aSelfNick), null, 
                     aSuccessCallback, aFailureCallback);
    } else {
        // Simulation FTW!
      var myRemoteFriends = [
        { 
          nick: "joselito",
          endpoint: "ep_joselito"
        },
        {
          nick: "jaimito",
          endpoint: "ep_jaimito"
        },
        {
          nick: "julito",
          endpoint: "ep_julito"
        }
      ];
      aSuccessCallback(myRemoteFriends);
    }
  }

  function saveFriendsToRemote(aSelfNick, aFriendList) {
    for (var i in aFriendList) {
      sendEndpoint(aSelfNick, aFriendList[i].nick, aFriendList[i].endpoint);
    }
  }

  return {
    sendEndpoint: sendEndpoint,
    saveFriendsToRemote: saveFriendsToRemote,
    loadMyRemoteFriends: loadMyRemoteFriends,
    eraseEndpoint: eraseEndpoint,
    isConfigured: isConfigured
  }

})();
