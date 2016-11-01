angular.module('googlePlacesFactoryModule', [])
  .factory('googlePlacesFactory', [function () {
    return {
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
      }
    };
  }]);
