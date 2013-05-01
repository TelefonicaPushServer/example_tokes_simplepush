// The main flow of the app goes here...

'use strict';

var TokesApp = (function () {
  var debugTokes = true;

  // Toggle this if/when the server side is installed
//  var server = undefined;
  var server = "http://sigsegv.es:8123";
// GET -> Get friends remote data
// PUT -> Put friends endpoints and nicks for me
                


  function debug (msg) {
    console.log('[DEBUG] tsimplepush.tokesApp: ' + msg + '\n');
    
  }
  var self = this;
  var selfNick = "";


//////////////////////////////////////////////////////////////////////////////
// This exist so I don't have to keep remembering how to do it...
//////////////////////////////////////////////////////////////////////////////
  function addText(elem,text) {
    elem.appendChild(document.createTextNode(text));
  }

  function createElementAt(mainBody,type,id,optionalText,before) {
    var elem=document.createElement(type);
    elem.setAttribute("id",id);
    if (!before) {
        mainBody.appendChild(elem);
    } else {
        mainBody.insertBefore(elem,before);
    }
    if (optionalText) {
        addText(elem,optionalText);
    }
    return elem;
  }
//////////////////////////////////////////////////////////////////////////////
// End of useful DOM manipulation...
//////////////////////////////////////////////////////////////////////////////


  // Form elements and the rest...

  var selfNickField = null;
  var loginButton = null;
  var mainWrapper = null;
  var selfNickWrapper = null;
  var addFriendButton = null;
  var friendsContainer = null;
  var friendNickField = null;

  var myFriends = [];

  // Return false also if the friend exist but isn't registered (so we can talk to him but not the reverse)
  // And yeah, I know, for some value of 'talk'
  function isAlreadyAFriend(aNick) {
    for (var i in myFriends) {
      if ((myFriends[i].nick === aNick) && (myFriends[i].endpoint))
        return true;
    }
    return false;
  }

  // What I'll have on the HTML:
  // <ul id='all-friends-lists' class="whatever">
  //   <li id='friend-id-' + nick onclick="clickOnFriend(ep);"> Nick </li>
  // </ul>
  function updateFriendList() {
    // I could prolly do this on a nicer way, but this works also...
    friendsContainer.innerHtml = '';
    
    // The way this works is: 
    var ul = createElementAt(friendsContainer, "ul", "ul-friend-list");
    for (var i in myFriends) {
      var canToke = myFriends[i].remoteEndpoint?". Send Toke!":"";
      var li = createElementAt(ul, "li", "li-nick-"+myFriends[i].nick, myFriends[i].nick + canToke );
      if (myFriends[i].remoteEndpoint) {
        li.onclick = function() {
          debugTokes && debug("Somebody clicked! Sending Toke to " + arguments[1] + " on " + arguments[0]);
          Push.sendPushTo(arguments[0]);
        }.bind(undefined, myFriends[i].remoteEndpoint, myFriends[i].nick);
      }
    }
  }

  function addFriendEP(aNick, aEndpoint) {
    var ul=document.getElementById("ul-friend-list") || createElementAt(friendsContainer, "ul", "ul-friend-list");
    var li = document.getElementById("li-nick-" + aNick) || createElementAt(ul, "li", "li-nick-" + aNick, aNick);
    PushDb.setNickForEP(aEndpoint, aNick);
    sendEndpointToServer(aNick, aEndpoint);
    var added = false;
    for (var i in myFriends) {
      if (myFriends[i].nick === aNick) {
        myFriends[i].endpoint = aEndpoint;
        added = true; 
        break;
      }
    }
    if (!added) {
      myFriends.push({
          nick: aNick,
          endpoint: aEndpoint,
          remoteEndpoint: undefined
      });
    }
    
  }

  // Doing it generic isn't worth the problem... this expects to get a JSON and will bork otherwise
  function sendXHR(aType, aURL, aData, aSuccessCallback, aFailureCallback) {
      var xhr = new XMLHttpRequest();
      xhr.open(aType, aURL);
      xhr.responseType = "json";
      xhr.overrideMimeType("application/json");
      xhr.onload = function (evt) {
        debugTokes && debug("sendXHR. XHR success");
        // Error control is for other people... :P
        if (aSuccessCallback)
          aSuccessCallback(xhr.response);
      }
      xhr.onerror = function (evt){
        debugTokes && debug("sendXHR. XHR failed " + JSON.stringify(evt));
        if (aFailureCallback)
          aFailureCallback(evt);
      }

      xhr.send(aData);
    
  }

  function mixFriends(myRemoteFriends) {
    for (var i in myRemoteFriends) {
      for(var j in myFriends) {
        if (myFriends[j].nick === myRemoteFriends[i].nick) {
          if (myFriends[j].remoteEndpoint != myRemoteFriends[i].endpoint) {
            myFriends[j].remoteEndpoint = myRemoteFriends[i].endpoint;
            PushDb.setNickForEP(myFriends[j].endpoint, myFriends[j].nick, myFriends[j].remoteEndpoint);
          }
          myRemoteFriends[i].alreadyAdded = true;
          break; // We found it, no need to continue
        }
      }
    }
    for (var i in myRemoteFriends) {
      if (!myRemoteFriends[i].alreadyAdded) {
        // Should I add it without a local endpoint? I could but not with the DB as currently defined
        // So tough luck...
        // I could use a trick here but let's leave that for V2. Or for the reader. Whatever.
        myFriends.push({
          nick: myRemoteFriends[i].nick, 
          remoteEndpoint: myRemoteFriends[i].endpoint, 
          endpoint: undefined
        });
      }
    }
    
    updateFriendList();
    
  }


  function loadMyRemoteFriends() {
    // To-Do: This should load the data remotely... if the server is configured and up
    if (server) { // Server side not done yet
      sendXHR("GET", server + "/friend/" + encodeURIComponent(selfNick), null, mixFriends, updateFriendList);

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
      mixFriends(myRemoteFriends);
    }
  }

  function saveFriendsToRemote() {
    for (var i in myFriends) {
      sendEndpointToServer(myFriends[i].nick, myFriends[i].endpoint);
    }
  }


  // Self explanatory :P
  function onLoginClick(evt) {
    if (evt && evt.preventDefault)
      evt.preventDefault();
    debugTokes && debug("onLoginClick called");
    if (selfNickField.value !== selfNick) {
      selfNick = selfNickField.value;
      PushDb.setSelfNick(selfNick);
    }
    selfNickWrapper.style.display = 'none';
    mainWrapper.style.display = '';
    PushDb.getRegisteredNicks(function (internalFriends) {
      myFriends = internalFriends;
      saveFriendsToRemote();
      loadMyRemoteFriends();
    });
    
  }


  function setSelfNick(aNick) {
    debugTokes && debug("setSelfNick called with: " + JSON.stringify(aNick));
    if (aNick && aNick.nick) {
      debugTokes && debug("setting selfNick to " + aNick.nick);
      selfNick = aNick.nick;
    } else {
      selfNick = "";
    }
    selfNickField.value = selfNick;
  }

  function sendEndpointToServer(aNick, aEndpoint) {
    // should URLize selfNick, aNick and aEndPoint... definitely aEndpoint
    var dataToSend = 'endpoint=' + aEndpoint;
    debugTokes && debug ("Sending " + dataToSend + "to " + server + " (or I will someday anyway) ");
    if (server)
      sendXHR("PUT", server + "/friend/" + encodeURIComponent(aNick) + "/" + encodeURIComponent(selfNick), dataToSend);
  }

  function onAddFriendClick(evt) {
    if (evt && evt.preventDefault)
      evt.preventDefault();
    var aNick = friendNickField.value;
    // If this fails this isn't going to be funny
    friendNickField.value = ""; 
    addFriendButton.disabled = true;

    if (isAlreadyAFriend(aNick)) {
      // Should probably inform the user... naaaah
      debugTokes && debug("Nasty user! Trying to add an existing friend " + aNick + " no cookie!");
    } else {
        Push.getNewEndpoint(true, addFriendEP.bind(undefined, aNick));
    }

  }

  function onFriendNickChange() {
    addFriendButton.disabled = friendNickField.value === "";
  }

  function init() {
    debugTokes && debug("init called");

    selfNickField = document.getElementById("self-nick");
    loginButton = document.getElementById("login-button");
    addFriendButton = document.getElementById("add-friend-button");
    mainWrapper = document.getElementById("main-window");
    friendsContainer = document.getElementById("friends-container");
    mainWrapper.style.display = 'none'; // I'm pretty sure there's a better way to do this!!!
    selfNickWrapper = document.getElementById("self-nick-wrapper");
    friendNickField = document.getElementById("friend-to-add");


    // Event Listeners
    document.getElementById("login-form").addEventListener('submit',onLoginClick);
    document.getElementById("add-friend-form").addEventListener('submit',onAddFriendClick);
    loginButton.addEventListener('click',onLoginClick);
    friendNickField.addEventListener('input', onFriendNickChange);

    // Register the push handler
    Push.setPushHandler(function (e) {
      processNotification(e.pushEndpoint);
    });

  }

  function processNotification(aEndpoint) {
    // This should work on an uninitialized app...
    PushDb.getNickForEP(aEndpoint,function (aValue) {
      if (aValue && aValue.nick) {
        
        var notification = window.navigator.mozNotification.createNotification('Tokes App', 'Got a Toke from ' + aValue.nick);

        notification.onclick = function test_notificationClick() {
          // To-do: we should bring ourselves to foreground, maybe
          debugTokes && debug("notification clicked!");
          // Bring app to foreground
          /*
          navigator.mozApps.getSelf().onsuccess = function getSelfCB(evt) {
            var app = evt.target.result;
            app.launch('push');
          };
           */
        };
      
        notification.show();
      } else {
        debugTokes && debug("Got an unexpected notification!");
      }
    });
  }

  return {
    init: init,
    setSelfNick: setSelfNick,
    processNotification: processNotification

  }

})();


window.addEventListener('load', function showBody() {
  console.log("loadHandler called");
  TokesApp.init();
  PushDb.getSelfNick(TokesApp.setSelfNick);

});



