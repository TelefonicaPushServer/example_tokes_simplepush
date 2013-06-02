// Bag of diverse things... all the ugliness, only one place to check :P
var Utils = (function() {

  'use strict';

  var debugUtils = true;
  var debug = debugUtils ? genericDebug.bind(undefined, "tsimplepush:Utils"): function () {};

  function genericDebug (topic, msg) {
    console.log('[DEBUG] '+ new Date().toString() + " - " + topic + ': ' + msg + '\n');
  }

  // Doing it generic isn't worth the problem... this expects to get a JSON and will bork otherwise
  function sendXHR(aType, aURL, aData, aSuccessCallback, aFailureCallback, aDataType) {
    var xhr = new XMLHttpRequest();
    xhr.open(aType, aURL);
    xhr.responseType = "json";
    xhr.overrideMimeType("application/json");
    if (aDataType) {
      xhr.setRequestHeader("Content-Type", aDataType); // Note that this requires 
      xhr.setRequestHeader("Content-Length", aData.length);
    }

    xhr.onload = function (aEvt) {
      debug("sendXHR. XHR success");
      // Error control is for other people... :P
      if (aSuccessCallback) {  
        aSuccessCallback(xhr.response);
      }
    }

    xhr.onerror = function (aEvt) {
      debug("sendXHR. XHR failed " + JSON.stringify(aEvt) + "url: "+ aURL + " Data: " + aData + " RC: " + xhr.responseCode);
      if (aFailureCallback) {
        aFailureCallback(aEvt);
      }
    }

    xhr.send(aData);    
  }

//////////////////////////////////////////////////////////////////////////////
// This exists only so I don't have to keep remembering how to do it...
//////////////////////////////////////////////////////////////////////////////
  function addText(aElem, aText) {
    aElem.appendChild(document.createTextNode(aText));
  }

  function createElementAt(aMainBody, aType, aAttrs, aOptionalText, aOptionalImg, aBefore) {
    var elem = document.createElement(aType);

    // Add all the requested attributes
    if (aAttrs){
      for (var i in aAttrs){
        elem.setAttribute(i, aAttrs[i]);
      }        
    }

    if (!aBefore) {
      aMainBody.appendChild(elem);
    } else {
      mainBody.insertBefore(elem, aBefore);
    }

    if (aOptionalText) {
      addText(elem, aOptionalText);
    }

    return elem;
  }

//////////////////////////////////////////////////////////////////////////////
// End of useful DOM manipulation...
//////////////////////////////////////////////////////////////////////////////
  return {
    sendXHR: sendXHR,
    debug: genericDebug,
    addText: addText,
    createElementAt: createElementAt
  }

})();
