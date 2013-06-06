// The main flow of the app goes here...

var TokesApp = (function () {

  'use strict';

  var debugTokes = true;

  var debug = debugTokes?Utils.debug.bind(undefined, "tsimplepush:TokesApp"):function (msg) {};

  // This can/have to be changed to allow different kind of servers easily
  var Server = TokesServer;

  var self = this;
    
  var selfNick = "";

  // Form elements and the rest...
  var selfNickField = null;
  var loginButton = null;
  var mainWrapper = null;
  var selfNickWrapper = null;
  var addFriendButton = null;
  var friendsContainer = null;
  var friendNickField = null;

//  var IMG_SEND = "style/icons/send@2x.png";
  var IMG_SEND = "style/icons/out.jpg";
  var IMG_ERASE = "style/icons/clear.png";

  var myFriends = [];

  // Return false also if the friend exist but isn't registered (so we can talk to him but not the reverse)
  // And yeah, I know, for some value of 'talk'
  function isAlreadyAFriend(aNick) {
    for (var i in myFriends) {
      if ((myFriends[i].nick === aNick) && (myFriends[i].endpoint)) {
        return true;
      }
    }
    return false;
  }

  /** 
   *  What should the LI have? something like
   *  <aside class="pack-end"> <!-- only if it's a local friend -->
   *    <img alt="placeholder" src="erase.jpg" onclick="eraseFriend">
   *  </aside>
   *  <aside class="icon"> 
   *    <img src="typeoffriend.jpg">
   *  </aside>
   *  <p onclick="sendToke"> Friend Nick </p>
   * 
   */

  function createLIContent(aUl, aFriend) {
    var li = Utils.createElementAt(aUl, "li", {id: "li-nick-" + aFriend.nick});

    // Add the send button...
    var sendToke = undefined;
    if (aFriend.remoteEndpoint) {
      var asideTOF = Utils.createElementAt(li, "aside", 
        { 
          id: "aside-tof-nick-" + aFriend.nick
        }
      );
      var imgTOF = Utils.createElementAt(asideTOF, "img", 
        {
          id: "img-nick-" + aFriend.nick, 
          src: IMG_SEND
        }
      );
      sendToke = function() {
        debug("Somebody clicked! Sending Toke to " + arguments[1] + " on " + arguments[0]);
        Push.sendPushTo(arguments[0]);
      }.bind(undefined, aFriend.remoteEndpoint, aFriend.nick);
      asideTOF.onclick = sendToke; 
    }

    // Add the erase button
    if (aFriend.endpoint){
      var asideErase = Utils.createElementAt(li, "aside", 
          {
            id: "aside-erase-nick-" + aFriend.nick, 
            "class": "pack-end"
          }
      );
      var imgErase = Utils.createElementAt(asideErase, "img", 
        { 
          id: "img-nick-" + aFriend.nick, 
          src: IMG_ERASE
        }
      );
      asideErase.onclick = function () {
        eraseLocalFriend(arguments[0]);        
      }.bind(undefined, aFriend.nick);
    }
    // And finally the name
    var nameHolder = Utils.createElementAt(li, "p",
                                           { id: "txt-nick-" + aFriend.nick },
                                           aFriend.nick);
    if (sendToke) {
      nameHolder.onclick = sendToke;
    }

    return li;
  }

  function getFriendFromList(aNick) {
    for (var i in myFriends) {
      if (myFriends[i].nick === aNick) {
        return i;
      }
    }
    return undefined;
  }

  // This should: 
  // 1. Erase the remote endpoint
  // 2. Unregister the endpoint
  // 3. Erase the endpoint from the local friend (and from the database)
  // On this version, we're going to happily assume no failures...
  function eraseLocalFriend(aNick) {
    var i = getFriendFromList(aNick);
    function eraseFromDb(aUnregisterSuccess) {
      // Ignoring aUnregisterSuccess for the time being
      PushDb.eraseEP(myFriends[i].endpoint, function () {
        if (myFriends[i].remoteEndpoint === undefined) {
          delete myFriends[i];
        } else {
          myFriends[i].endpoint = undefined;
        }
        updateFriendList(); // Programmer efficiency FTW :P
      });
    }
    if (i !== undefined) {
      Server.eraseEndpoint(selfNick, myFriends[i].nick, myFriends[i].endpoint,
                                     Push.deleteEndpoint.bind(undefined, myFriends[i].endpoint, eraseFromDb));
    }
  }

  
  /**
   * What I'll have on the HTML:
   * <ul id='all-friends-lists' class="whatever">
   *   <li id='friend-id-' + nick onclick="clickOnFriend(ep);"> LI-CONTENT </li>
   * </ul>
   */
  function updateFriendList() {
    // I could prolly do this on a nicer way, but this works also...
    friendsContainer.innerHTML = '';
    
    // The way this works is: 
    var ul = Utils.createElementAt(friendsContainer, "ul", {id:"ul-friend-list"});
    for (var i in myFriends) {
      createLIContent(ul, myFriends[i]);
    }
  }

  function addFriendEP(aNick, aEndpoint) {
    var ul = document.getElementById("ul-friend-list") || Utils.createElementAt(friendsContainer, "ul", {id:"ul-friend-list"});
    PushDb.setNickForEP(aEndpoint, aNick);
    Server.sendEndpoint(selfNick, aNick, aEndpoint);
    var i = getFriendFromList(aNick);
    if (i !== undefined) {
      myFriends[i].endpoint = aEndpoint;
    } else {
      var newFriend = {
          nick: aNick,
          endpoint: aEndpoint,
          remoteEndpoint: undefined
      }; 
      myFriends.push(newFriend);
      createLIContent(ul, newFriend);
    }    
  }

  function mixFriends(myRemoteFriends) {
    for (var i in myRemoteFriends) {
      var j = getFriendFromList(myRemoteFriends[i].nick);
      if (j !== undefined) {
        if (myFriends[j].remoteEndpoint != myRemoteFriends[i].endpoint) {
          myFriends[j].remoteEndpoint = myRemoteFriends[i].endpoint;
          PushDb.setNickForEP(myFriends[j].endpoint, myFriends[j].nick, myFriends[j].remoteEndpoint);
        }
      } else {
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

  // Self explanatory :P
  function onLoginClick(evt) {
    if (evt && evt.preventDefault) {
      evt.preventDefault();
    }
    debug("onLoginClick called");
    if (selfNickField.value !== selfNick) {
      selfNick = selfNickField.value;
      PushDb.setSelfNick(selfNick);
    }
    selfNickWrapper.style.display = 'none';
    mainWrapper.style.display = '';
    PushDb.getRegisteredNicks(function (internalFriends) {
      myFriends = internalFriends;
      Server.saveFriendsToRemote(selfNick, myFriends);
      Server.loadMyRemoteFriends(selfNick, mixFriends, updateFriendList);
    });    
  }

  function setSelfNick(aNick) {
    debug("setSelfNick called with: " + JSON.stringify(aNick));
    if (aNick && aNick.nick) {
      debug("setting selfNick to " + aNick.nick);
      selfNick = aNick.nick;
    } else {
      selfNick = "";
    }
    selfNickField.value = selfNick;
  }

  function onAddFriendClick(evt) {
    if (evt && evt.preventDefault) {
      evt.preventDefault();
    }
    var aNick = friendNickField.value;
    // If this fails this isn't going to be funny
    friendNickField.value = ""; 
    addFriendButton.disabled = true;

    if (isAlreadyAFriend(aNick)) {
      // Should probably inform the user... naaaah
      debug("Nasty user! Trying to add an existing friend " + aNick + " no cookie!");
    } else {
        Push.getNewEndpoint(true, addFriendEP.bind(undefined, aNick));
    }
  }

  function onFriendNickChange() {
    addFriendButton.disabled = friendNickField.value === "";
  }

  function init() {
    debug("init called");

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
    // TO-DO TO-DO TO-DO: Add the push-register handler here!!!
    Push.setPushHandlers(function (e) { processNotification(e.pushEndpoint);}, 
                         function (e) { processPushRegister(e);});
  }

  function processPushRegister(e) {  
    PushDb.getRegisteredNicks(function(internalFriends) {
      for (var i in internalFriends) {
        //This verification should no be necessary, if it doesn't have an ep then it will not be in db.
        //But it doesn't hurt either
        if (internalFriends[i].endpoint !== undefined) {
          PushDb.eraseEP(internalFriends[i].endpoint, function() {
             Push.getNewEndpoint(true, addFriendEP.bind(undefined, internalFriends[i].nick));
          });          
        }          
      }
    });
  }

  function processNotification(aEndpoint) {
    // This should work on an uninitialized app...
    PushDb.getNickForEP(aEndpoint,function (aValue) {
      if (aValue && aValue.nick) {        
        var notification = window.navigator.mozNotification.createNotification('Tokes App', 
                               'Got a Toke from ' + aValue.nick);

        notification.onclick = function test_notificationClick() {
          // To-do: we should bring ourselves to foreground, maybe
          debug("notification clicked!");
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
        debug("Got an unexpected notification!");
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
