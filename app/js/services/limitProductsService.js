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

    var _analyzerepeatorder = function(order, user) {
        var result = true;

        function extractProductID(product) {
            if (product.Type == 'VariableText') {
                return product.ExternalID.split(' - ')[0];
            }
            else {
                return product.ExternalID;
            }
        }

        if ($filter('getfieldbyname')('LimitedProducts')) {
            var _user = angular.copy(user);
            var limitedProducts = $filter('getfieldbyname')(_user.CustomFields, 'LimitedProducts').Value;
            limitedProducts = limitedProducts ? JSON.parse(limitedProducts) : {};

            angular.forEach(limitedProducts, function(value, key) {
                if ($filter('getfieldbyname')(_user.CustomFields, key)) {
                    var limit = +($filter('getfieldbyname')(_user.CustomFields, key).Value);
                    var ordered = value;
                    var remaining = limit - value;
                    limitedProducts[key] = {Remaining: remaining, Limit: limit, Ordered: ordered};
                }
            });

            angular.forEach(order.LineItems, function(item) {
                var itemID = extractProductID(item.Product);
                if (limitedProducts[itemID]) {
                    limitedProducts[itemID].Remaining -= +(item.Quantity);
                    if (limitedProducts[itemID].Remaining <= 0) result = false;
                }
            });
        }

        return result;
    };

    return {
        update: _update,
        analyzerepeatorder: _analyzerepeatorder
    }
}]);
