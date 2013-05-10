
// Bag of diverse things... all the ugliness, only one place to check :P
var Utils = (function() {
  'use strict';

  function debug (topic, msg) {
    console.log('[DEBUG] '+ new Date.toString() + " - " + topic + ': ' + msg + '\n');
  }

  // Doing it generic isn't worth the problem... this expects to get a JSON and will bork otherwise
  function sendXHR(aType, aURL, aData, aSuccessCallback, aFailureCallback) {
      var xhr = new XMLHttpRequest();
      xhr.open(aType, aURL);
      xhr.responseType = "json";
      xhr.overrideMimeType("application/json");
      if (aData) {
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhr.setRequestHeader("Content-Length", aData.length);
      }
      xhr.onload = function (evt) {
        debugUtils && debug("sendXHR. XHR success");
        // Error control is for other people... :P
        if (aSuccessCallback)
          aSuccessCallback(xhr.response);
      }
      xhr.onerror = function (evt){
        debugUtils && debug("sendXHR. XHR failed " + JSON.stringify(evt) + "url: "+ aURL + " Data: " + aData + "RC: " + xhr.responseCode);
        if (aFailureCallback)
          aFailureCallback(evt);
      }

      xhr.send(aData);
    
  }


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



  return {
    sendXHR: sendXHR,
    debug: debug,
    addText: addText,
    createElementAt: createElementAt
  }

})();
