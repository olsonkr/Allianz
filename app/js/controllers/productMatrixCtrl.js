four51.app.controller('ProductMatrixCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User',
    function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User) {
        $scope.selected = 1;
        $scope.qtyError = null;
        $scope.LineItem = {};
        $scope.addToOrderText = "Add To Cart";
        $scope.loadingIndicator = true;
        $scope.loadingImage = true;
        $scope.searchTerm = null;
        $scope.currentOrder = $scope.$parent.$parent.currentOrder;
        $scope.settings = {
            currentPage: 1,
            pageSize: 10
        };

        function init(searchTerm) {
            ProductDisplayService.getProductAndVariant($routeParams.productInteropID, $routeParams.variantInteropID, function (data) {
                $scope.product= data.product;
                if ($scope.product.IsVBOSS) {
                    buildProductMatrix($scope.product);
                }
            }, 1, 100, searchTerm);
        }
        $scope.$watch('settings.currentPage', function(n, o) {
            if (n != o || (n == 1 && o == 1))
                init($scope.searchTerm);
        });

        function buildProductMatrix(product) {
            var specCombos = {};
            angular.forEach(product.Specs, function(spec) {
                if (spec.ListOrder == 1) {
                    angular.forEach(product.Specs, function(s) {
                        if (s.ListOrder == 2) {
                            angular.forEach(spec.Options, function(option) {
                                specCombos[option.Value] = [];
                                angular.forEach(s.Options, function(o) {
                                    var combo = [option.ID, o.ID];
                                    combo.Markup = option.Markup + o.Markup;
                                    combo.Specs = {};
                                    combo.Specs[spec.Name] = spec;
                                    combo.Specs[s.Name] = s;
                                    specCombos[option.Value].push(combo);
                                });
                            });
                        }
                    });
                }
            });

            $scope.comboVariants = {};
            for (var option in specCombos) {
                $scope.comboVariants[option] = [];
                angular.forEach(specCombos[option], function(combo) {
                    getVariantData(product, combo, option, combo.Specs);
                });
                console.log();
            }

            function countVariantInOrder(variant) {
                var count = 0;
                angular.forEach($scope.currentOrder.LineItems, function(item) {
                    if (item.Variant && item.Variant.ExternalID == variant.ExternalID) {
                        count = count + item.Quantity;
                    }
                });
                return count;
            }

            function getVariantData(p, params, group, specs) {
                Variant.get({'ProductInteropID': p.InteropID, 'SpecOptionIDs': params}, function(variant){
                    variant.DisplayName = [];
                    variant.Markup = params.Markup;
                    variant.tempSpecs = {};
                    angular.forEach($scope.product.Specs, function(spec) {
                        angular.forEach(spec.Options, function(option) {
                            if (option.ID == params[0]) {
                                variant.tempSpecs[spec.Name] = {};
                                variant.tempSpecs[spec.Name].Value = option.Value;
                                variant.DisplayName[0] = option.Value;
                            }
                            if (option.ID == params[1]) {
                                variant.tempSpecs[spec.Name] = {};
                                variant.tempSpecs[spec.Name].Value = option.Value;
                                variant.DisplayName[1] = option.Value;
                            }
                        });
                    });
                    variant.OrderQuantity = $scope.currentOrder ? countVariantInOrder(variant) : 0;
                    $scope.comboVariants[group].DisplayName = group;
                    $scope.comboVariants[group].push(variant);
                });
            }
        }

        $scope.qtyChanged = function() {
            $scope.qtyError = "";
            angular.forEach($scope.comboVariants, function(group) {
                angular.forEach(group, function(variant) {
                    if (variant.Quantity) {
                        if(!$451.isPositiveInteger(variant.Quantity))
                        {
                            $scope.qtyError += "<p>Please select a valid quantity for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                        }
                    }
                });
            });
        }

        $scope.addVariantsToOrder = function(){
            if(!$scope.currentOrder){
                $scope.currentOrder = {};
                $scope.currentOrder.LineItems = [];
            }
            angular.forEach($scope.comboVariants, function(group) {
                angular.forEach(group, function(item) {
                    if (item.Quantity > 0) {
                        var liSpecs = {};
                        for (var spec in $scope.product.Specs) {
                            liSpecs[spec] = angular.copy($scope.product.Specs[spec]);
                            liSpecs[spec].Value = item.tempSpecs[spec].Value;
                        }
                        var li = {
                            "PriceSchedule":$scope.product.StandardPriceSchedule,
                            "Product":$scope.product,
                            "Quantity":item.Quantity,
                            "Specs":liSpecs,
                            "Variant":item,
                            "qtyError":null
                        }
                        $scope.currentOrder.LineItems.push(li);
                    }
                });
            });
            $scope.addToOrderIndicator = true;
            Order.save($scope.currentOrder,
                function(o){
                    $scope.$parent.$parent.user.CurrentOrderID = o.ID;
                    User.save($scope.$parent.$parent.user, function(){
                        $scope.addToOrderIndicator = true;
                        $location.path('/cart');
                    });
                },
                function(ex) {
                    $scope.addToOrderIndicator = false;
                    $scope.addToOrderError = ex.Message;
                    $route.reload();
                }
            );
        }
    }]);

/* product matrix control
 four51.app.controller('CustomProductCtrlMatrix', function($scope, $451, Variant, ProductDisplayService){
 //just a little experiment on extending the product view
 $scope.matrixLineTotal = 0;
 $scope.LineItems = {};
 $scope.LineKeys = [];
 $scope.lineChanged = function(){
 var addToOrderTotal = 0;
 angular.forEach($scope.LineKeys, function(key){
 if($scope.LineItems[key].Variant){
 ProductDisplayService.calculateLineTotal($scope.LineItems[key]);
 addToOrderTotal += $scope.LineItems[key].LineTotal;
 }
 $scope.matrixLineTotal = addToOrderTotal;

 });
 };

 $scope.addMatrixToOrder = function(){ };

 $scope.setFocusVariant = function(opt1, opt2){

 if($scope.LineItems[opt1.Value.toString() + opt2.Value.toString()].Variant){
 $scope.LineItem.Variant = $scope.LineItems[opt1.Value.toString() + opt2.Value.toString()].Variant;
 return;
 }

 Variant.get({'ProductInteropID': $scope.LineItem.Product.InteropID, 'SpecOptionIDs': [opt1.ID, opt2.ID]}, function(data){
 $scope.LineItem.Variant = data;
 });
 };
 $scope.$watch("LineItems", function(){
 $scope.lineChanged();
 }, true);

 $scope.$on('ProductGetComplete', function(){
 var specs = $451.filter($scope.LineItem.Product.Specs, {Property: 'DefinesVariant', Value: true});
 $scope.matrixSpec1 = specs[0];
 $scope.matrixSpec2 = specs[1];
 angular.forEach(specs[0].Options, function(option1){
 angular.forEach(specs[1].Options, function(option2){
 $scope.LineKeys.push(option1.Value.toString() + option2.Value.toString());
 $scope.LineItems[option1.Value.toString() + option2.Value.toString()] = {
 Product: $scope.LineItem.Product,
 PriceSchedule: $scope.LineItem.PriceSchedule,
 };
 });
 });
 });
 });
 */

