var TokesServer = (function() {

  'use strict';
  // Toggle this if/when the server side is installed
  //  var server = undefined;
  var server = "http://sigsegv.es:8123";

  var debugTServer = true,
      debug = debugTServer?Utils.debug.bind(undefined,'tsimplepush:TokesServer'):function () { };

  function isConfigured() {

    return (server != null && server != undefined && server != "");
  }

  function sendEndpointToServer(aSelfNick, aNick, aEndpoint) {

    // should URLize aSelfNick, aNick and aEndPoint... definitely aEndpoint
    var dataToSend = 'endpoint=' + aEndpoint;
    debug ("Sending " + dataToSend + "to " + server + " (or I will someday anyway) ");
    if (server) {
      Utils.sendXHR("PUT", server + "/friend/" + encodeURIComponent(aNick) + "/" + 
                           encodeURIComponent(aSelfNick), dataToSend);
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
      sendEndpointToServer(aSelfNick, aFriendList[i].nick, aFriendList[i].endpoint);
    }
  }

  return {
    sendEndpointToServer: sendEndpointToServer,
    saveFriendsToRemote: saveFriendsToRemote,
    loadMyRemoteFriends: loadMyRemoteFriends,
    isConfigured: isConfigured
  }

})();
