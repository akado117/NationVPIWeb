/*
 * Licensed Materials - Property of IBM
 * 5725-I43 (C) Copyright IBM Corp. 2012 - 2014. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

var ngn = {};

var vars = window.location.search.substring(1).split('&');
for(var i = 0; i < vars.length; i++){
    var pair = vars[i].split('=');
   
    switch(pair[0]){
       case 'app':
           ngn.app = decodeURIComponent(pair[1]);
           break;
    }
}

ngn.app = ngn.app || './application.json';

if(WL.Client.Push) {	
	ngn.readyToSubScribeToPush = false;
	WL.Client.Push.onReadyToSubscribe = function(){ ngn.readyToSubScribeToPush = true; };
}

var dojoConfig = (function(){
    var base = location.href.split('/');
    base.pop();
    base = base.join('/');
    
    var mblUserAgent = undefined;
    if(location.pathname.indexOf('/android/') > -1){
        mblUserAgent = 'Android';
    }
    else{
        var ua = navigator.userAgent;
        if(ua.match(new RegExp('Android 3')) || ua.match(new RegExp('Android 4'))){
            mblUserAgent = 'Android'; // override holodark theme
        }
    }
    
    return{
        async: true,
        parseOnLoad: false,
        mblUserAgent: mblUserAgent,
        packages: [{
            name: 'ngn',
            location: base + '/js/ngn'
        }]
    };
})();


function ngnInitPhase2(){
    require(
        [
            'dojox/mobile',
            'dojo/json',
            'dojo/_base/window',
            'dojo/string',
            'ngn/controller/main',
            'ngn/view/ViewFetcher',
            'dojo/i18n!ngn/nls/ngn_messages',
            'dojo/text!'+ngn.app,
            'dojo/i18n!nls/messages',
            'ngn/base',
            'dojo/domReady!'
        ],
        function(mobile, json, win, string, Controller, ViewFetcher, messages, appJson, bundle){
        	if(bundle && bundle.$locale ){	
        		var language = bundle.$locale.split('-')[0].toLowerCase();
        		rtlLanguages = ['he' /* Hebrew */, 'ar' /* Arabic */, 'ur' /* Urdu */, 'yi' /* Yiddish */, 
        		                'fa' /* Farsi */];
        		if(rtlLanguages.indexOf(language) != -1){
    				win.body().dir ='rtl';
        		}
        	}
            try{
                var app = json.parse(appJson);
                app.url = ngn.app;
                
                var controller = new Controller();
                var viewFetcher = new ViewFetcher(app.url);
                viewFetcher.fetch(function(response) {
                    var status = response.status;
                    var message = response.message;
                    if(status) {                   
                        controller.init(app, response.html, function(result){
                            status = result.status;
                            message = result.message;
                            if(status){
                                controller.startup();
                            }
                        });
                    }
                    if(!status){
                    	console.log(string.substitute(messages.error, {error: message}));
                        alert(string.substitute(messages.error, {error: message}));
                    }                        
                });
            }
            catch(err){
            	console.log(string.substitute(messages.error, {error: err.message}));
                alert(string.substitute(messages.error, {error: err.message}));
            }
        }
    );
}


function ngnInit(){
    require(
        [
            'js/OpenLayers/OpenLayers'
        ],
        function() {ngnInitPhase2();});
}
