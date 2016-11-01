console.log("Event Page is loaded");
var ENV;
//  //Reads the content of properties.json and reutns it through a callback
 function readTextFile(file, callback) {
     var rawFile = new XMLHttpRequest();
     rawFile.overrideMimeType("application/json");
     rawFile.open("GET", file, true);
     rawFile.onreadystatechange = function() {
         if (rawFile.readyState === 4 && rawFile.status == "200") {
             callback(rawFile.responseText);
         }
     }
     rawFile.send(null);
 }
 //stores the contents inside a variable
 readTextFile("properties.json", function(text) {
     ENV = JSON.parse(text);
 });

 // chrome.runtime.onMessage.addListener(function(message) {
 //   console.log(message);
 //
 //   if (message == 'replace-content') {
 //     console.log("message from content script about reloading");
 //     chrome.tabs.sendMessage(sender.tab.id, message);
 //   }
 // });

 chrome.runtime.onMessage.addListener(
 function(request, sender, sendResponse) {
	 if (request.message === "replace-content"){
     console.log(request.message);
    chrome.tabs.sendMessage(sender.tab.id, message);
   }
  });
//background environment Variables
var last_clicked_text = null ;
var current_url = null ;
var tp_results = {
    name:null,
   phone:null,
   website:null,
   street:null,
   street2:null,
   postal:null,
   region:null
 //  selectedText : null ;
 };
//Listener function for getting right click objects from Content Scripts.
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  last_clicked_text = request.text;
      current_url = request.current_url ;
      console.log(last_clicked_text);
      console.log(current_url) ;
      updatingTokenCookie();
});
//When someone clicks on the X on the side bar, the iframe sends a message to the events.js file, which is here.
//below it is sending the message to contentScript(more like broadcasting the message)and tell it to close the iframe.
 chrome.runtime.onMessage.addListener(function(message, sender) {
  chrome.tabs.sendMessage(sender.tab.id, message);
});
//logged-in user_details
var logged_in_user = {unwandertoken:'',logInUserId:'',currentPlanId:''} ;
//Tracking Cookies for Unwander
chrome.cookies.onChanged.addListener(function (info) {
		  if (info.cookie.domain == "qa.unwander.com" ){
				console.log(info.cookie.name);
				console.log(info.cookie.value);
				if (info.cookie.name == 'logInUserId'){
					chrome.storage.sync.set({
							'logInUserId': info.cookie.value
						}, function() {
							console.log('Current ' + 'logInUserId' + 'saved in chrome storage');
					});
				}
				if (info.cookie.name == 'token'){
					chrome.storage.sync.set({
							'unwandertoken': info.cookie.value
						}, function() {
							console.log('Current ' + 'unwandertoken' + ' saved in chrome storage');
					});
				}
				if (info.cookie.name == 'currentPlanId'){
					chrome.storage.sync.set({
							'currentPlanId': info.cookie.value
						}, function() {
							console.log('Current ' + 'currentPlanId' + ' saved in chrome storage');
					});
				}
			}
    });
    //updating token values
  function updatingTokenCookie() {
    chrome.cookies.get({url: ENV.DOMAIN_ROOT, name: "token"}, function(token) {
          if (token) {
              chrome.storage.sync.set({
                  'unwandertoken': token.value
              }, function() {
                console.log("updated Cookie value in storage");
              });
          } else {
              chrome.storage.sync.set({
                  'unwandertoken': ''
              }, function() {
                console.log("No cookie found");
              });
          }
    });
  };


     // NEW STUFF FOR AJAX
    chrome.webRequest.onCompleted.addListener(function(details) {
       var q = details.url ;
           //string.indexOf(substring) !== -1
           //q.indexOf('/search/snippet?') !== -1
       console.log(details.url);
            if ( q.indexOf('/search/snippet?') !== -1 ||  q.indexOf('/best_of_yelp/') !== -1 ) {
           console.log('New page via AJAX.');
           chrome.tabs.executeScript({'file' : 'js/contentscript.js'},callback);
           function callback(){
           if(chrome.runtime.lastError){
           	console.log(chrome.runtime.lastError.message);
	}
	else{
	//
	}
    }
    }
    }, {urls : ["*://*.yelp.com/*"]});
//button_api
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	 if (request.greeting === "button_api"){
		console.log(request.button_url);
		var domain_name  = request.button_url.replace('http://','').replace('https://','').replace('www.','').replace('.com','').split(/[/?#]/)[0];
		var details = request.button_url ;
		if(domain_name == 'tripadvisor'){
			details = details.replace("Attraction_Review","UpdateListing")
			console.log(details) ;
		}
		var api = "http://127.0.0.1:5000/unwander/" + domain_name ;
		$.getJSON(api, {
			url: details
        	}, function(data) {
        	console.log(data.result.name);
			tp_results.name  = data.result.name ;
			console.log(data.result.phone);
			tp_results.phone = data.result.phone;
			console.log(data.result.website);
			tp_results.website = data.result.website
			tp_results.street = data.result.street
			tp_results.street2 = data.result.street2
			tp_results.postal = data.result.postal
			tp_results.region = data.result.region
			save_results() ;
      updatingTokenCookie();
		 });
	}
  });
//Right Click Functionality
chrome.contextMenus.create({
		"title" : "Save to Unwander",
		"contexts" : ["all"]
		});
//On Right-Click assign this function
chrome.contextMenus.onClicked.addListener(getElements) ;
function getElements(info, tab){
	// urls for current's page, link
	var pageURL = info.pageUrl ;
	var linkURL = info.linkUrl ;
	var details = null ;
	//var text_flag = 0 ;
	//var ta_flag = 0 ;
	//domains for which we have web-scraping api's
	var domains = ['tripadvisor','yelp','zabihah','lonelyplanet' ];
	//logic to figure out what url to be sent
	var domain_name  = pageURL.replace('http://','').replace('https://','').replace('www.','').replace('.com','').split(/[/?#]/)[0];
	console.log(domain_name) ;
	function include(arr,obj) {
    return (arr.indexOf(obj) != -1);
	}
	// ONLY IF KNOWN pageURL belongs to a known website and no link !!!
	console.log(linkURL);
	console.log(pageURL) ;
	//new
	if ( !include(domains,domain_name)){
		details = last_clicked_text ;
		domain_name = 'general' ;
		}
	else {
		if ( include(domains,domain_name) && (linkURL ==  undefined) ){
		details = pageURL ;
		console.log(details);
			// if tripadvisor then do this or keep the original page
			if(domain_name == 'tripadvisor'){
				details = details.replace("Attraction_Review","UpdateListing")
				console.log(details) ;
				}
		}
		if ( include(domains,domain_name) && (linkURL !== undefined) ){
		details = linkURL ;
		console.log(details);
			if(domain_name == 'tripadvisor'){
			details = details.replace("Attraction_Review","UpdateListing")
			console.log(details) ;
				}
		}
	}
	// ONLY IF KNOWN pageURL belongs to a website with link !!!
	// if details is null
	//then send it to a different URL , send_last_clicked text as the URL //
	console.log(pageURL) ;
	console.log(linkURL) ;
	console.log(details) ;
	console.log(last_clicked_text) ;
	console.log("calling") ;
	//if tripadvisor call this api.
	var api = "http://127.0.0.1:5000/unwander/" + domain_name ;
	$.getJSON(api, {
        	url: details
      }, function(data) {
			if(data.result.flag == 0){
				console.log(last_clicked_text);
				chrome.storage.sync.set({'selectedText': last_clicked_text})
        chrome.storage.sync.set({'apiResults': 0})
        chrome.storage.sync.remove(
                    [	'last_text',
        							'last_phone',
        							'last_website',
        							'last_street',
        							'last_street2',
        							'last_postal',
        							'last_region']);
				send_to_google() ;
			}
			else {

				console.log(data.result.name);
				tp_results.name  = data.result.name ;
				console.log(data.result.phone);
				tp_results.phone = data.result.phone;
				console.log(data.result.website);
				tp_results.website = data.result.website
				tp_results.street = data.result.street
				tp_results.street2 = data.result.street2
				tp_results.postal = data.result.postal
				tp_results.region = data.result.region
				save_results() ;
			}
		 });
	//save_results() ;
	console.log(tp_results) ;
	//send_results() ;
	}
function send_to_google(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {greeting: "google" , name:last_clicked_text}, function(response) {
			console.log(response.farewell);
			})
		})
	};
  function save_results() {

chrome.storage.sync.set({ 	'last_text': tp_results.name,
							'last_phone': tp_results.phone,
							'last_website':tp_results.website ,
							'last_street':tp_results.street,
							'last_street2':tp_results.street2,
							'last_postal': tp_results.postal,
							'last_region':tp_results.region,
              'selectedText': "",
              'apiResults': 1 }, function() {
      //console.log('Settings saved');
	  send_results() ;
    });

	}
//save_results();
function send_results(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello" , name:last_clicked_text}, function(response) {
			console.log(response.farewell);
			})
		})
	};


//  chrome.runtime.onMessageExternal.addListener(
//     function(request, sender, sendResponse) {
//         if (request) {
//             if (request.message) {
//                 if (request.message == "version") {
//                     sendResponse({version: 1.0});
//                 }
//             }
//         }
//         return true;
//  });
//
//  chrome.runtime.onInstalled.addListener(function(callback) {
//      console.log('installed');
//      console.log(callback);
//      if (callback.reason == "install") {
//          console.log("This is a first install!");
//          var action_url = ENV.DOMAIN_ROOT + "#/login";
//          chrome.tabs.create({
//              url: action_url
//          });
//      } else if (callback.reason == "update") {
//          var thisVersion = chrome.runtime.getManifest().version;
//          console.log("Updated from " + callback.previousVersion + " to " + thisVersion + "!");
//      }
//  });





//
//  //this event is fired wherenever there is a message.
//  //it opens the message and does appropriate action according to the method specified
 chrome.runtime.onMessage.addListener(function(request, sender, callback) {

     if (request.action == "xhttp") {
         var xhttp = new XMLHttpRequest();
         var method = request.method ? request.method.toUpperCase() : 'GET';

         xhttp.onload = function() {
             callback(xhttp.responseText);
         };
         xhttp.onerror = function() {
             // Do whatever you want on error. Don't forget to invoke the
             // callback to clean up the communication port.
             callback();
         };
         xhttp.open(method, request.url, true);
         if (method == 'POST' || method == "PATCH") {
             xhttp.setRequestHeader('Content-Type', 'application/json');
         }
         if (request.headers) {
             var p = request.headers;
             for (var key in p) {
                 if (p.hasOwnProperty(key)) {
                     xhttp.setRequestHeader(key, p[key]);

                 }
             }
         }
         xhttp.send(request.data);
         return true; // prevents the callback from being called too early on return
     }
 });
