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
      xhr.setRequestHeader("Content-Type", aDataType);
      xhr.setRequestHeader("Content-Length", aData.length);
    }
    xhr.onload = function (evt) {
      debug("sendXHR. XHR success");
      // Error control is for other people... :P
      if (aSuccessCallback) {  
        aSuccessCallback(xhr.response);
      }
    }
    xhr.onerror = function (evt) {
      debug("sendXHR. XHR failed " + JSON.stringify(evt) + "url: "+ aURL + " Data: " + aData + " RC: " + xhr.responseCode);
      if (aFailureCallback) {
        aFailureCallback(evt);
      }
    }
    xhr.send(aData);    
  }

//////////////////////////////////////////////////////////////////////////////
// This exist so I don't have to keep remembering how to do it...
//////////////////////////////////////////////////////////////////////////////
  function addText(elem,text) {

    elem.appendChild(document.createTextNode(text));
  }

    function createElementAt(mainBody, type, attrs, optionalText, optionalImg, before) {

    var elem = document.createElement(type);

    //elem.setAttribute("id", id);
    //because I need to write in english there are no comments
    if (attrs){
      for (var i in attrs){
        elem.setAttribute(i, attrs[i]);
      }        
    }
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
    debug: genericDebug,
    addText: addText,
    createElementAt: createElementAt
  }

})();
