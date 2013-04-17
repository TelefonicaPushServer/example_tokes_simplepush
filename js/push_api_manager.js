/* -*- Mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
 /* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var PushManager = {
  debug: true,
  
  registrations : [],
  init: function pm_init() {
    // TODO Check if needed
  },
  getRegistrations: function pm_getRegistrations() {
    this.debug && console.log("PushManager.getRegistrations called, registered: "+this.registered);
    if (this.registered) {
      return this.registrations;
    }
    var self = this;
    asyncStorage.getItem('push.registrations', function _onValue(registrations) {
                           if (!registrations) {
	                           return false;
                           }
                           this.registered = true;
                           self.registrations = registrations;
                           return registrations;
                         });
  },
  register: function pm_register(registrations) {
    this.debug && console.log("On PushManager.register");
    // Clean registrations
    this.registrations = [];
    var self = this;
    // Per each Im gonna create a registration to push API
    registrations.forEach(function(registration) {
                            if (navigator.push && navigator.push.register) {
	                            var request = navigator.push.register();
	                            request.onsuccess = function successManager(e) {
                                // endPoint is the only thing returned as result
                                // TODO: Remove this hack once it's correctly... but for now...
	                              var endPoint = e.target.result.      
		                              replace('localhost','pushdev.srv.openwebdevice.com');

                                this.debug && console.log("Register success: " + endPoint);
	                              self.registrations.push({
	                                                        'name': name,
	                                                        'pushEndpoint': endPoint,
	                                                        'handler': registration.handler
	                                                      });
	                              registration.callback(endPoint);
	                              // If we manage to register at least once we can accept us as registered
                                // It's not perfect but few things are :P
	                              self.registered = true;
	                            };
                              request.onerror = function errorManager(e) {
                                this.debug && console.log("There was an error registering for push!");
                              }
                            } else {
                              this.debug && console.log("Theres no navigator.push support! Or we don't have permission");
                            }
                          });
    // We store all registrations
    asyncStorage.setItem('push.registrations', this.registrations, function() {
                           // TODO Add callback if needed
                         });
  },

  unregister: function pm_unregister() {
    this.debug && console.log("push_api_manager.js: unregister called");
    this.registrations.forEach(function(registration){
                                 navigator.push.unregister(registration.pushEndpoint);
                               });
  }
}
