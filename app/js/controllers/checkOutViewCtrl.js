four51.app.controller('CheckOutViewCtrl', ['$scope', '$location', '$filter', '$rootScope', '$451', 'Analytics', 'User', 'Order', 'OrderConfig', 'FavoriteOrder', 'AddressList', 'CustomAddressList', 'LimitProducts',
function ($scope, $location, $filter, $rootScope, $451, Analytics, User, Order, OrderConfig, FavoriteOrder, AddressList, CustomAddressList, LimitProducts) {
	if (!$scope.currentOrder) {
        $location.path('catalog');
    }

    CustomAddressList.getall(function(list) {
        $scope.addresses = list;
    });

	$scope.hasOrderConfig = OrderConfig.hasConfig($scope.currentOrder, $scope.user);
	$scope.checkOutSection = $scope.hasOrderConfig ? 'order' : 'shipping';

	$scope.shipaddress = { Country: 'US', IsShipping: true, IsBilling: false };
	$scope.billaddress = { Country: 'US', IsShipping: false, IsBilling: true };

	$scope.$on('event:AddressSaved', function(event, address) {
		if (address.IsShipping) {
			$scope.currentOrder.ShipAddressID = address.ID;
			if (!$scope.shipToMultipleAddresses)
				$scope.setShipAddressAtOrderLevel();
			$scope.addressform = false;
		}
		if (address.IsBilling) {
			$scope.currentOrder.BillAddressID = address.ID;
			$scope.billaddressform = false;
		}
        CustomAddressList.getall(function(list) {
            $scope.addresses = list;
        });
		$scope.shipaddress = { Country: 'US', IsShipping: true, IsBilling: false };
		$scope.billaddress = { Country: 'US', IsShipping: false, IsBilling: true };
	});

    function submitOrder() {
	    $scope.displayLoadingIndicator = true;
	    $scope.errorMessage = null;
        Order.submit($scope.currentOrder,
	        function(data) {
                var orderID = data.ID;
				$scope.user.CurrentOrderID = null;
				User.save($scope.user, function(data) {
			        $scope.user = data;
	                $scope.displayLoadingIndicator = false;
                    LimitProducts.update($scope.user, $scope.currentOrder, function() {
                        $scope.currentOrder = null;
                        $location.path('/order/' + orderID);
                    });
		        });
	        },
	        function(ex) {
		        $scope.errorMessage = ex.Message;
		        $scope.displayLoadingIndicator = false;
		        $scope.shippingUpdatingIndicator = false;
		        $scope.shippingFetchIndicator = false;
	        }
        );
    };

	$scope.$watch('currentOrder.CostCenter', function() {
		OrderConfig.address($scope.currentOrder, $scope.user);
	});

    function saveChanges(callback) {
	    $scope.displayLoadingIndicator = true;
	    $scope.errorMessage = null;
	    $scope.actionMessage = null;
	    var auto = $scope.currentOrder.autoID;
	    Order.save($scope.currentOrder,
	        function(data) {
		        $scope.currentOrder = data;
		        if (auto) {
			        $scope.currentOrder.autoID = true;
			        $scope.currentOrder.ExternalID = 'auto';
		        }
		        $scope.displayLoadingIndicator = false;
		        if (callback) callback($scope.currentOrder);
	            $scope.actionMessage = "Your changes have been saved";
	        },
	        function(ex) {
		        $scope.currentOrder.ExternalID = null;
		        $scope.errorMessage = ex.Message;
		        $scope.displayLoadingIndicator = false;
		        $scope.shippingUpdatingIndicator = false;
		        $scope.shippingFetchIndicator = false;
	        }
        );
    };

    $scope.continueShopping = function() {
	    if (confirm('Do you want to save changes to your order before continuing?') == true)
	        saveChanges(function() { $location.path('catalog') });
        else
		    $location.path('catalog');
    };

    $scope.cancelOrder = function() {
	    if (confirm('Are you sure you wish to cancel your order?') == true) {
		    $scope.displayLoadingIndicator = true;
	        Order.delete($scope.currentOrder,
		        function() {
		            $scope.user.CurrentOrderID = null;
		            $scope.currentOrder = null;
			        User.save($scope.user, function(data) {
				        $scope.user = data;
				        $scope.displayLoadingIndicator = false;
				        $location.path('catalog');
			        });
		        },
		        function(ex) {
			        $scope.actionMessage = ex.Message;
			        $scope.displayLoadingIndicator = false;
		        }
	        );
	    }
    };

    $scope.saveChanges = function() {
        saveChanges();
    };

    $scope.submitOrder = function() {
       submitOrder();
    };

    $scope.saveFavorite = function() {
        FavoriteOrder.save($scope.currentOrder);
    };

    /*angular.forEach($scope.currentOrder.OrderFields, function(field) {
        if (field.Name == 'Rep ID' && !field.Value) {
            angular.forEach($scope.user.CustomFields, function(f) {
                if (f.Name == 'Rep ID') {
                    field.Value = f.Value;
                }
            });
        }
    });*/
}]);