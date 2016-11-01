angular.module('googleMapFactoryModule', [])
  .factory('googleMapFactory', [function () {
    return {
      'createMap': function (latitude, longitude, zoom) {
        return new google.maps.Map(document.getElementById('map'), {
          center: {
            lat: latitude,
            lng: longitude
          },
          zoom: 2,
          disableDefaultUI: true
        });
      },
      'placeMarker': function (map, placeId, location) {
        return new google.maps.Marker({
          map: map,
          place: {
            placeId: placeId,
            location: location
          }
        });
      },
      'initializeInfoWindow': function (map) {
        var infowindow = new google.maps.InfoWindow();
        return infowindow;
      },
      'closeInfoWindow': function (infowindow) {
        if (infowindow) {
          infowindow.close();
        }
      },
      'getAddressFromPlace': function (place) {
        var address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[
              0].short_name || ''), (place.address_components[1] &&
              place.address_components[1].short_name || ''), (
              place.address_components[2] && place.address_components[
                2].short_name || '')
          ].join(' ');
        }
        return address;
      },
      'presentPlaceOnMap': function (map, marker, place) {
        if (place.geometry) {
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(1); // Why 17? Because it looks good.
          }
          marker.setIcon({
            url: '',
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(35, 35),
          });
          marker.setPosition(place.geometry.location);
          marker.setVisible(false);
        }
      }
    };
  }]);
