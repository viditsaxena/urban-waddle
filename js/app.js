var unwanderApp = angular.module('unwanderApp', ['gservice', 'ngCookies', 'googleMapFactoryModule', 'googlePlacesFactoryModule']);



unwanderApp.controller('mainController', ['$scope', '$rootScope', '$http',
    '$cookies', '$location', 'gMap', '$q', '$timeout',
    function($scope, $rootScope, $http, $cookies, $location, gMap, $q,
        $timeout) {

        var ENV;

        // *******************************Initialize Variables.
        $scope.token;
        $scope.message;

        //need the user id because of the user reference in plan schema
        $scope.currentUserPlans = []; //for the dropdown to show user plans
        $scope.currentPlan = {};
        $scope.defaultPlan = "Select a plan"; //plan to add the spots to.
        // $rootScope.selectedText = " "; //selected text from the webpage
        $rootScope.place = {};
        $rootScope.spot = {};
        $scope.logInUser = {};
        $scope.last_phone;
        $scope.last_website;
        $scope.last_text;
        $scope.last_street;
        $scope.last_street2;
        $scope.last_postal;
        $scope.last_region;
        $scope.apiResults;
        $scope.selectedText;
        // $scope.displayApiResults;
        var source;

        // chrome.runtime.onMessage.addListener(function(message) {
        //   if (message == 'replace-content') {
        //
        //   }
        // });
        chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if (request.message === "replace-content"){
            console.log(request.message + "in the app.js");
            //Call a function to replace the sidebar content with new values.
            init();          }
         });

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

        //usage:
        readTextFile("properties.json", function(text) {
            ENV = JSON.parse(text);
        });
        //Instead of calling Chrome.storage everytime we can do this one.
        // chrome.storage.sync.get(function(result){
        //        console.log(result);
        //        console.log(result.last_website);
        //        for (variable in props) {
        //                console.log(variable);
        //                props[variable] = result.variable;
        //                }
        //        }
        // )



        chrome.storage.sync.get('unwandertoken', function(items) {
            if (items.unwandertoken.length > 0) {
                $scope.token = items.unwandertoken;
                $scope.$apply();
            }
        });
        chrome.storage.sync.get('apiResults', function(items) {
                $scope.apiResults = items.apiResults;
                $scope.$apply();

        });

        chrome.storage.sync.get('logInUserId', function(items) {
            if (items.logInUserId.length > 0) {
                $scope.logInUser.id = items.logInUserId;
                var url = ENV.BACKEND_ROOT + 'secured/users/' + $scope.logInUser.id;

                chrome.runtime.sendMessage({
                    method: 'GET',
                    action: 'xhttp',
                    headers: {
                      'Authorization': 'Bearer ' + $scope.token
                    },
                    url: url
                }, function(responseText) {
                    // console.log(responseText);
                    var response = JSON.parse(responseText);
                    $scope.user = response;
                });
            }
        });

        chrome.storage.sync.get('currentPlanId', function(items) {
            if (items.currentPlanId.length > 0) {
                $scope.currentPlanId = items.currentPlanId;
            }
        });

        chrome.storage.sync.get('currentUrl', function(item) {
            if (item.currentUrl) {
                source = item.currentUrl;
            }
        });


        function init() {
          console.log("init called.");
            $scope.noPlanError = false;
            $scope.spotAdded = false;
            $scope.newPlan = {};
            if ($scope.token) {
                $scope.currentPlan._id = $scope.currentPlanId || $cookies.get('currentPlanId');
                $scope.newPlan.userId = $scope.logInUser.id;
                $scope.getCurrentUserPlans();
                    //load the map from the service.
                if ($scope.apiResults == 0) {
                  gMap.refresh();
                } else {
                  //Chrome API Usage below. Get the details from the website cookies.

                  chrome.storage.sync.get('last_text', function(items) {
                      if (items.last_text.length > 0) {
                          $scope.last_text = items.last_text;
                          $scope.$apply();
                          console.log($scope.last_text);
                      }
                  });
                  chrome.storage.sync.get('last_street', function(items) {
                      if (items.last_street.length > 0) {
                          $scope.last_street = items.last_street;
                          $scope.$apply();

                      }
                  });
                  chrome.storage.sync.get('last_region', function(items) {
                      if (items.last_region.length > 0) {
                          $scope.last_region = items.last_region;
                          $scope.$apply();

                      }
                  });
                  chrome.storage.sync.get('last_postal', function(items) {
                      if (items.last_postal.length > 0) {
                          $scope.last_postal = items.last_postal;
                          $scope.$apply();

                      }
                  });
                  chrome.storage.sync.get('last_phone', function(items) {
                      if (items.last_phone.length > 0) {
                          $scope.last_phone = items.last_phone;
                          $scope.$apply();

                      }

                  });
                  chrome.storage.sync.get('last_website', function(items) {
                       if (items.last_website.length > 0) {
                         $scope.last_website = items.last_website;
                         $scope.$apply();
                       }
                  });

                }
            } else {
                $scope.message = "You are not logged in. Please log in first."
            }
        };

        angular.element(document).ready(function() {
          //adding it because Chrome.Storage doesnt get the value of token and init doesnt run properly then.
          window.setTimeout(function() {
                    init();
                }, 100);
            });


        //When someone clicks on the X on the side bar, the iframe sends a message to the events.js file,
        //which can send it to contentscript.js file and tell it to close the iframe.
        $scope.closeUnwanderSideBar = function() {
            chrome.runtime.sendMessage('hide_popup');
        }


        // Get Current Users Plans
        $scope.getCurrentUserPlans = function() {

            //route at the back end.
            var url = ENV.BACKEND_ROOT + 'secured/api/plans/search?userId=' + $scope.logInUser.id;
            chrome.runtime.sendMessage({
                method: 'GET',
                action: 'xhttp',
                headers: {
                  'Authorization': 'Bearer ' + $scope.token
                },
                url: url
            }, function(responseText) {
                var response = JSON.parse(responseText);
                $scope.currentUserPlans = response;
                $scope.$apply();
                // Find the current plan object in the current User Plans array from the plan id we have.
                function findCurrentPlan(plan) {
                    return plan._id === $scope.currentPlan._id;
                }
                if ($scope.currentPlan._id) {
                    $scope.currentPlan = $scope.currentUserPlans.find(
                        findCurrentPlan);
                    $scope.$apply();
                } else {
                    $scope.currentPlan = $scope.currentUserPlans[0];
                    $scope.$apply();
                }
            });

        }




        // This is to open the current plan page on the website in a new tab
        $scope.openUnwanderTab = function(plan) {
            window.open(ENV.DOMAIN_ROOT + '#/' + plan.title + '/map?id=' + plan._id);
        }
        $scope.openUnwanderHome = function() {
                window.open(ENV.DOMAIN_ROOT + '#/');
            }


        //If the user wants to add a plan directly from the extension.
        $scope.addNewPlan = function() {
            function setPlanInfo() {
                $scope.newPlan.planInfo = [];
                $scope.newPlan.planDetails = {};
                $scope.newPlan.planDetails.userId = $scope.newPlan.userId;
                $scope.newPlan.planDetails.planStatus = 'Active';
                $scope.newPlan.planInfo.push($scope.newPlan.planDetails);
            }
            if ($scope.newPlan.title) {
                setPlanInfo();
                chrome.runtime.sendMessage({
                    method: 'POST',
                    action: 'xhttp',
                    headers: {
                     'Authorization': 'Bearer ' + $scope.token
                    },
                    url: ENV.BACKEND_ROOT + 'secured/api/plans/',
                    data: JSON.stringify($scope.newPlan)
                }, function(responseText) {
                    var responseData = JSON.parse(responseText);
                    //Get the title and id of the added plan and store it in cookies for use later.
                    $cookies.put("currentPlanId", responseData._id);
                    $cookies.put("currentTitle", responseData.title);

                    $scope.newPlan.title = '';
                    $scope.currentPlan = responseData;
                    $scope.$apply();
                    $scope.currentUserPlans.push($scope.currentPlan);
                });
            } else {
                return;
            }
        };


        //This is for the plans drop down, when user clicks on a plan.
        $scope.selectOnePlan = function(plan) {
            $scope.currentPlan = plan;
            $cookies.put("currentPlanId", plan._id);
        }

        $scope.hideSpotAdded = function() {
             $scope.spotAdded = false;
         }
         $scope.hidenoPlanError = function() {
             $scope.noPlanError = false;
         }

        chrome.storage.sync.get('currentUrl', function(items) {
            $rootScope.currentUrl = items.currentUrl;
        });

        //When user clicks on the add spot button in the info window.
        $rootScope.addSpot = function() {
            if (!$scope.currentPlan || !$scope.place.place_id) {
                $scope.noPlanError = true;
                $timeout(function() {
                    $scope.hidenoPlanError();
                    $timeout.cancel();
                }, 2000);
            } else {
                $rootScope.spot.source = source;
                $rootScope.spot.user_category = $scope.category;
                //push that spot in the showPlan object that holds all the info about the plan.
                var id = $scope.currentPlan._id;
                var url = ENV.BACKEND_ROOT + 'secured/api/plans/' + id + '/add/cards/type/spot';
                chrome.runtime.sendMessage({
                    method: 'post',
                    action: 'xhttp',
                    headers: {
                        'Authorization': 'Bearer ' + $scope.token
                    },
                    url: url,
                    data: JSON.stringify($rootScope.spot)
                }, function(responseText) {
                    var response = JSON.parse(responseText);
                    $scope.spotAdded = true;
                    $scope.$apply();
                    var cardId = response.card._id;
                    if ($scope.notes) {
                        $scope.addNotes(cardId);
                    }
                    // if ($scope.apiResults === 1) && ($scope.last_street) {
                    //    function getLatLong() {
                    //
                    //     var address = '$scope.last_text' + '$scope.last_street' + '$scope.last_region' + '$scope.last_postal';
                    //     var api = "http://127.0.0.1:5000/unwander/latlang/"  ;
                    //
                    //            $.getJSON(api, {
                    //                    address: address
                    //            },function(data) {
                    //            console.log(data);
                    //            })
                    //    };
                    //    getLatLong();
                    // }
                    $timeout(function() {
                        $scope.hideSpotAdded();
                        $timeout.cancel();
                    }, 2000);
                });
            }
            //call the function that updates the database for that plan
        };

        $scope.addNotes = function(cardId) {
            $scope.misc = {};
            $scope.misc.refId = cardId;
            $scope.misc.userId = $scope.logInUser.id;
            $scope.misc.parent = 'Spot';
            $scope.misc.visibility = true;
            $scope.misc.userType = 'Members';
            $scope.misc.firstName = $scope.user.firstName;
            $scope.misc.lastName = $scope.user.lastName;
            $scope.misc.role = 'Write';
            $scope.misc.type = 'Description';
            $scope.misc.text = $scope.notes;
            var id = $scope.currentPlan._id;
            var url = ENV.BACKEND_ROOT + 'secured/api/plans/' + id + '/misc';
            chrome.runtime.sendMessage({
                method: 'POST',
                action: 'xhttp',
                headers: {
                    'Authorization': 'Bearer ' + $scope.token
                },
                url: url,
                data: JSON.stringify($scope.misc)
            }, function(responseText) {
                var responseData = JSON.parse(responseText);
            });
        };


        // $scope.addCategory = function(cardId) {
        //     $scope.misc = {};
        //     $scope.misc.refId = cardId;
        //     $scope.misc.userId = $scope.logInUser.id;
        //     $scope.misc.parent = 'Spot';
        //     $scope.misc.visibility = true;
        //     $scope.misc.userType = 'Members';
        //     $scope.misc.firstName = $scope.user.firstName;
        //     $scope.misc.lastName = $scope.user.lastName;
        //     $scope.misc.role = 'Write';
        //     $scope.misc.type = 'Category';
        //     $scope.misc.text = $scope.category;
        //     var id = $scope.currentPlan._id;
        //     var url = ENV.BACKEND_ROOT + 'api/plans/' + id + '/misc';
        //     chrome.runtime.sendMessage({
        //         method: 'POST',
        //         action: 'xhttp',
        //         headers: {
        //             'x-access-token': $scope.token
        //         },
        //         url: url,
        //         data: JSON.stringify($scope.misc)
        //     }, function(responseText) {
        //         var responseData = JSON.parse(responseText);
        //     });
        // };

    }
]);
