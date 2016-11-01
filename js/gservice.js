// Creates the gservice factory. This will be the primary means by which we interact with Google Maps
angular.module('gservice', [])
  .factory('gMap', ['$rootScope', '$http', '$compile', '$cookies', 'googleMapFactory', 'googlePlacesFactory', function(
    $rootScope, $http, $compile, $cookies, googleMapFactory, googlePlacesFactory) {

    // Initialize Variables
    // -------------------------------------------------------------

    $rootScope.place = {};
    $rootScope.spot = {};
    var googleMapService = {};
    var addressPredictions;
    var selectedAddress;
     $rootScope.hideMessage = false;

    googleMapService.refresh = function() {
      initializeMap();
    };


    function hideSuggestions(suggestions) {
      suggestions.style.display = "none";
    }

    function initService(selectedAddress, infoWindow, place, map, marker) {
      function displaySuggestions(predictions, status) {
        if (!predictions) {
          return;
        }

        var pacInput = document.getElementById('pac-input');
        var suggestions = document.getElementById('uw-predictions');

        suggestions.innerHTML = '';

        if (status != google.maps.places.PlacesServiceStatus.OK) {
          return;
        }
        predictions.forEach(function(prediction) {
          if(prediction){
            $rootScope.prediction = true;
          }else{
             $rootScope.prediction = false;
          }
          var li = document.createElement('li');
          var i = document.createElement('i');
          i.className = 'fa fa-map-marker';

          var span = document.createElement('span');
          span.textContent = prediction.description;
          span.dataset.place = prediction.place_id;
          if(span.dataset.place === predictions[0].place_id) {
            li.className = 'suggestions';
          }
          li.onclick = function(e) {
            pacInput.value = span.textContent;
            $rootScope.hideMessage = true;
            selectedAddress = pacInput.value;
            window.setTimeout(function() {
              suggestions.style.display = "none";
            }, 300);
            loadPlaceDetails(map, prediction.place_id);
            loadMap(selectedAddress);
            $rootScope.spotAdded = false;
          };

          li.appendChild(i);
          li.appendChild(span);
          suggestions.appendChild(li);
        });
      };

      //gets the details of a particular place
      function loadPlaceDetails(map, place_id) {
        var map = new google.maps.Map(document.createElement('div'));
        var service = new google.maps.places.PlacesService(map);
        service.getDetails({
          placeId: place_id
        }, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            $rootScope.placeDetail = place;
            var date = new Date();
            var dayNumber = date.getDay();
            if(place.opening_hours) {
              dayNumber === 0 ? dayNumber = 6 : dayNumber = dayNumber - 1;
              $rootScope.placeDetail.workingHours = $rootScope.placeDetail.opening_hours.weekday_text[dayNumber];
              var weekday=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday','Sunday'];
              $rootScope.working_hours = $rootScope.placeDetail.workingHours.replace(weekday[dayNumber] + ':', '');
            }
            setPlaceInRootScope(place);
            $rootScope.$apply();
          }
        });
      }
      //Using the google maps places's libraries autocomplete feature to predict
      //the locations while user starts typing an address
      var service = new google.maps.places.AutocompleteService();
      if (selectedAddress) {
        service.getPlacePredictions({
          input: selectedAddress
        }, displaySuggestions);
      }
    }


    function setPlaceInRootScope(place) {
      if (place) {
        $rootScope.place = place;
        $rootScope.spot = {
          name: $rootScope.place.name,
          place_id: $rootScope.place.place_id,
          geometry: $rootScope.place.geometry,
          icon: $rootScope.place.icon,
          source: '',
          user_category:''
        }
        if (!$rootScope.place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        $rootScope.$apply();
      } else {
        map = googleMapFactory.createMap(34.5133, -94.1629, 5);
      }

    }

    //specifying content that is to be displayed inside a infowindow
    function setInfoWindowContent(infowindow, address) {
      var place = $rootScope.placeDetail || $rootScope.place;
      var contentString = '<div><strong>' + (place.name || selectedAddress) +
        '</strong><br>' + (place.formatted_address || selectedAddress) + '</div>';

      var compiled = $compile(contentString)($rootScope);
      infowindow.setContent(compiled[0]);
    }
    //opens a info window for a particular marker on a map
    function openInfoWindow(infowindow, map, marker) {
      infowindow.open(map, marker);
    }
    //loads a place on a map and sets a marker for that place(if any) and open the info window for
    //that particular place
    function displayPlaceOnMap(infoWindow, place, map, marker) {
      googleMapFactory.closeInfoWindow(infoWindow);
      if (marker) {
        marker.setVisible(false);
        setPlaceInRootScope(place);
        googleMapFactory.presentPlaceOnMap(map, marker, $rootScope.place);
        var address = googlePlacesFactory.getAddressFromPlace($rootScope.place);
        setInfoWindowContent(infoWindow, address);
        openInfoWindow(infoWindow, map, marker);
      }
    }
    //loads a map for a particular place specified through the selected address and adds markers etc
    //if the selected address is empty then just loads a map with default lat and lon
    function prepareMap(selectedAddress) {
      // This is for the initial load of the extension
      if (selectedAddress) {
        initService(selectedAddress);
        loadMap(selectedAddress);
      }
      // else {
      //   map = googleMapFactory.createMap(34.5133, -94.1629, 5);
      // }

      // We need to display the suggestions and map on key up event
      document.getElementById("pac-input").onkeyup = function() {
        keyedAddress = document.getElementById('pac-input').value;
        var suggestionsDisplay = document.getElementById(
            "uw-predictions")
          .style.display;
        if (suggestionsDisplay === 'none') {
          document.getElementById("uw-predictions").style.display =
            "block";
        }
        initService(keyedAddress);
      };
    }

    function initializeMap() {
      selectedAddress = document.getElementById('pac-input').value;
      if (!selectedAddress || selectedAddress.trim() === '') {
        chrome.storage.sync.get('selectedText', function(items) {
          selectedAddress = items.selectedText;
          prepareMap(selectedAddress);
        });
      } else {
        prepareMap(selectedAddress);
      }
    }

    function displaySuggestionsDropDown() {
      var suggestionsDisplay = document.getElementById("uw-predictions").style.display;
      if (suggestionsDisplay === 'none') {
        document.getElementById("uw-predictions").style.display = "block";
      }
    }
    //loads a map for a specified selected address and sets a marker
    function loadMap(selectedAddress) {
      var place, location, map, latitude, longitude, placeId, marker;
      var selectedText = selectedAddress;

      var service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions({
        input: selectedText
      }, function(predictions, status) {
        if (!predictions || status != google.maps.places.PlacesServiceStatus.OK) {
          return;
        }
        place = predictions[0];

        // Set the first item as the default selecte
        var pacInput = document.getElementById('pac-input');
        pacInput.value = place.description;
        var map = new google.maps.Map(document.createElement('div'));
        var service = new google.maps.places.PlacesService(map);
        service.getDetails({
          placeId: place.place_id
        }, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            $rootScope.place = place;
            if (place) {
              location = place.geometry.location;
              latitude = place.geometry.location.lat();
              longitude = place.geometry.location.lng();
              placeId = place.place_id;
            }

            map = googleMapFactory.createMap(latitude, longitude, 5);

            if (placeId && location) {
              marker = googleMapFactory.placeMarker(map, placeId, location);
            }
            var bounds = new google.maps.LatLngBounds();
            var input = document.getElementById('pac-input');
            var types = document.getElementById('type-selector');

            // INFO-WINDOW
            var infoWindow = googleMapFactory.initializeInfoWindow(map);
            var marker = new google.maps.Marker({
              map: map,
              anchorPoint: new google.maps.Point(0, -29)
            });

            displaySuggestionsDropDown();
            displayPlaceOnMap(infoWindow, place, map, marker);
          }
        });
      });

    }
    return googleMapService;

  }]);
