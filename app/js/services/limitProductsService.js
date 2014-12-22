four51.app.factory('LimitProducts', ['$resource', '$451', '$filter', 'User', function($resource, $451, $filter, User) {
    function _then(fn, data, count, s1, s2) {
        if (angular.isFunction(fn))
            fn(data, count, s1, s2);
    }

    var _update = function(user, order, success) {
        var _user = user;
        if ($filter('getfieldbyname')('LimitedProducts')) {
            var limitedProducts = $filter('getfieldbyname')(_user.CustomFields, 'LimitedProducts').Value;
            limitedProducts = limitedProducts ? JSON.parse(limitedProducts) : {};

            angular.forEach(order.LineItems, function(item) {
                if ($filter('getfieldbyname')(_user.CustomFields, item.Product.ExternalID)) {
                    if (!limitedProducts[item.Product.ExternalID]) {
                        limitedProducts[item.Product.ExternalID] = +(item.Quantity);
                    }
                    else {
                        limitedProducts[item.Product.ExternalID] += +(item.Quantity);
                    }
                }
            });

            angular.forEach(_user.CustomFields, function(field) {
                if (field.Name == 'LimitedProducts') {
                    field.Value = JSON.stringify(limitedProducts);
                }
            });
            User.save(_user, function(data) {
                _then(success);
            });
        }
        else {
            _then(success);
        }
    };

    return {
        update: _update
    }
}]);
