four51.app.factory('SpendingAccount', ['$resource', '$rootScope', '$451', function($resource, $rootScope, $451) {
	function _then(fn, data) {
        if (angular.isFunction(fn)) {
            fn(data);
	        $rootScope.$broadcast('event:SpendingAccountUpdate', data);
        }
    }

	function _extend(list) {
		angular.forEach(list, function(i) {
			i.ForPurchase = i.AccountType.PurchaseCredit;

            if (i.Label.toLowerCase().indexOf('spend') == 0) {
                i.Balance = (i.Balance < 0) ? (i.Balance * -1) : i.Balance;
            }
		});
	}

    var _query = function(success) {
		return $resource($451.api('spendingaccount')).query().$promise.then(function(list) {
			_extend(list);
		   _then(success, list);
		});
    }

    return {
        query: _query
    };
}]);