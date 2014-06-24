
four51.app.controller('AddressListCtrl', ['$scope', '$location', '$451', 'AddressList', 'Address',
function ($scope, $location, $451, AddressList, Address) {
	$scope.settings = {
		currentPage: 1,
		pageSize: 10
	};
	function Query() {
		$scope.pagedIndicator = true;
		AddressList.query(function (list, count) {
			$scope.addresses = list;
			$scope.settings.listCount = count;
			$scope.pagedIndicator = false;
		}, $scope.settings.currentPage, $scope.settings.pageSize);
	}

    $scope.deleteSelected = function() {
	    $scope.displayLoadingIndicator = true;
        AddressList.delete($scope.addresses, function() {
	        $scope.displayLoadingIndicator = false;
	        Query();
        });
    };

	$scope.$watch('settings.currentPage', function(n,o) {
		Query();
	});
    $scope.newAddress = function() {
        $location.path('address');
    };
    $scope.checkAll = function(event) {
        angular.forEach($scope.addresses, function(add) {
            add.Selected = event.currentTarget.checked;
        });
    }

    $scope.generateRecipients = function(list) {
        $scope.savingRecipientsLoadingIndicator = true;
        this.recipientPasteList = [];
        var addresses = [];
        for (var i = 0; i < list.length; i++) {
            var recipient = {};
            recipient = list[i];
            recipient['ID'] = randomString();

            var address = {};
            address.AddressName = recipient.AddressName;
            address.FirstName = recipient.ShipToFirstName;
            address.LastName = recipient.ShipToLastName;
            address.Street1 = recipient.Street1;
            address.Street2 = recipient.Street2;
            address.City = recipient.City;
            address.State = recipient.State;
            address.Zip = recipient.Zip;
            address.Country = recipient.Country;
            address.Phone = recipient.Phone;
            address.IsShipping = true;
            address.IsBilling = false;

            ExistingAddress.check($scope.addresses,address);


            if (!recipient.AddressInvalid) {
                if (!address.IsExisting) {
                    recipient.ShipAddressID = null;
                    if (addresses.length == 0) {
                        addresses.push(address);
                    }
                    else {
                        address.matchCount = 0;
                        for (var a = 0; a < addresses.length; a++) {
                            var add = addresses[a];
                            if (address.AddressName == add.AddressName &&
                                address.FirstName == add.FirstName &&
                                address.LastName == add.LastName &&
                                address.Street1 == add.Street1 &&
                                address.Street2 == add.Street2 &&
                                address.City == add.City &&
                                address.State == add.State &&
                                address.Zip == add.Zip &&
                                address.Country == add.Country &&
                                address.Phone == add.Phone)
                            {
                                address.matchCount++;
                            }
                        }
                        if (address.matchCount == 0) {
                            addresses.push(address);
                        }
                    }
                }
                else {
                    recipient.ShipAddressID = address.AddressID;
                }
            }

            $scope.recipientList.push(recipient);
        };

        var assignAddresses = function() {
            for (var r = 0; r < $scope.recipientList.length; r++) {
                if (!$scope.recipientList[r].ShipAddressID && !$scope.recipientList[r].Invalid) {
                    var recip = $scope.recipientList[r];
                    if (!recip.ShipAddressID) {
                        for (var a = 0; a < $scope.addresses.length; a++) {
                            var add = $scope.addresses[a];
                            if (recip.Street1 == add.AddressName &&
                                recip.ShipToFirstName == add.FirstName &&
                                recip.ShipToLastName == add.LastName &&
                                recip.Street1 == add.Street1 &&
                                recip.Street2 == add.Street2 &&
                                recip.City == add.City &&
                                recip.State == add.State &&
                                recip.Zip == add.Zip &&
                                recip.Country == add.Country)
                            {
                                $scope.recipientList[r].ShipAddressID = add.ID;
                            }
                        }
                    }
                }
            }
            RecipientList.validate($scope.recipientList,$scope.digitalProduct);
            store.set("451Cache.RecipientList",[]);
            store.set("451Cache.RecipientList",$scope.recipientList);
            $("#myPasteBox").val('');
            $scope.savingRecipientsLoadingIndicator = false;
        }

        for (var i = 0; i < addresses.length; i++) {
            addresses[i].Phone = addresses[i].Phone == "" ? " " : addresses[i].Phone;
            Address.save(addresses[i], function(add) {
                $scope.addresses.push(add);
                if (i == addresses.length) assignAddresses();
            });
        }
        if (addresses.length == 0) {
            RecipientList.validate($scope.recipientList,$scope.digitalProduct);
            store.set("451Cache.RecipientList",[]);
            store.set("451Cache.RecipientList",$scope.recipientList);
            $("#myPasteBox").val('');
            $scope.savingRecipientsLoadingIndicator = false;
        }
    }
}]);