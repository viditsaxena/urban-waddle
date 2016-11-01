
// Global Variables
var elements = [];
var iframe;
var iframeLoaded = 0;
// add eventListener for right-click
document.addEventListener('contextmenu', function(e){
    var right_click_object ={'text':null,'current_url':null};
    // if elements length > 0, pop and add !
    if ( elements.length > 0) {
            elements.pop();
            }
    elements.push(e.target);
     console.log(elements[elements.length-1].outerText);
     console.log(window.location.href);
    right_click_object.text = elements[elements.length-1].outerText ;
    right_click_object.current_url = window.location.href ;
    //console.log(right_click_object);
    //sending message to background script with parameter value of last text from element
    chrome.runtime.sendMessage(right_click_object) ;
})
//Button functionality to be added on the pages or some pages.
function addButtonToPage() {
	//matches.appendChild(btn) ;
	var hostname = (location.host).split('.')[1] ;
	var web_scraping_websites = {	yelp:['a.biz-name.js-analytics-click','h1.biz-page-title.embossed-text-white.shortenough','h1.biz-page-title.embossed-text-white'],
									tripadvisor:['div.property_title > a','h1#HEADING.heading_name'],
									zabihah:['div.titlebs','div.titleBL'],
									zomato:['a.result-title.hover_feedback.zred.bold.ln24.fontsize0 ','.ui.large.header.left'],
									lonelyplanet:['h1.copy--h1']};
	var selectors = web_scraping_websites[hostname]
	var divs = document.querySelectorAll(selectors), i;
	for (i = 0; i < divs.length; ++i) {
		var btn = document.createElement("BUTTON");
		btn.className = "uw-" + hostname ;
		if(hostname !== 'zabihah'){
			btn.href = (divs[i].href ? divs[i].href : window.location.href);
			btn.id = hostname + btn.href + divs[i] ;
			btn.innerHTML = '&#9986;';
			btn.style.height = "22px";
		}
		else {
			btn.href = divs[i].innerHTML
			btn.href = btn.href.match(/href="([^"]*)/)[1];
			btn.href = (btn.href ? btn.href : window.location.href);
			btn.id = hostname + btn.href + divs[i] ;
			btn.innerHTML = '&#9986;';
		}
		if( document.getElementById(btn.id) == null) {
			//console.log(btn.href);
			var Span = document.createElement('span')
			Span.appendChild(btn);
			divs[i].parentNode.insertBefore(Span, divs[i].nextSibling);
		}
		btn.addEventListener('click',function(e){
			var inside_url = e.target.href;
			console.log(inside_url);
			var url =  inside_url ;
			chrome.runtime.sendMessage({greeting: "button_api" , button_url:url}) ;
		})
		};
	}
addButtonToPage();

function add_iframe() {

    var existingFrame = document.getElementsByClassName("unwander-sidebar-iframe");
    if (existingFrame.length === 0) {
      iframe = document.createElement('iframe');
      iframe.src = chrome.runtime.getURL('content.html');
      iframe.className = 'unwander-sidebar-iframe';
      iframe.frameBorder = 0;
      document.body.appendChild(iframe);
    } else {
      $( ".unwander-sidebar-iframe" ).remove();
      iframe = document.createElement('iframe');
      iframe.src = chrome.runtime.getURL('content.html');
      iframe.className = 'unwander-sidebar-iframe';
      iframe.frameBorder = 0;
      document.body.appendChild(iframe);
    }
}
  //When someone clicks on the X on the side bar, the iframe(app.js) sends a message to the events.js file,
  //which can send it to contentscript.js here and tell it to close the iframe.
  chrome.runtime.onMessage.addListener(function(message) {
    if (message == 'hide_popup') {
      $( ".unwander-sidebar-iframe" ).remove();
      // var existingFrame = document.getElementsByClassName("unwander-sidebar-iframe");
    }
  });

  //recieving message from background and propting iframe to open up
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting === "hello"){
		console.log(request.name);
		add_iframe()

		}
		sendResponse({farewell: "goodbye"});

  });

//Google
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting === "google"){
		console.log(request.name);
		add_iframe()
		}
    console.log("added Iframe to route to Google.");
		sendResponse({farewell: "called_google_api"});

  });
