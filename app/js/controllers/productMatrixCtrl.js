four51.app.controller('ProductMatrixCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User',
    function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User) {
        $scope.selected = 1;
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

        $scope.calcVariantLineItems = function(i){
            $scope.variantLineItemsOrderTotal = 0;
            angular.forEach($scope.variantLineItems, function(item){
                $scope.variantLineItemsOrderTotal += item.LineTotal || 0;
            })
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
                $scope.comboVariants [option] = [];
                angular.forEach(specCombos[option], function(combo) {
                    getVariantData(product, combo, option, combo.Specs);
                });
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

            function getVariantData(p, params, color, specs) {
                Variant.get({'ProductInteropID': p.InteropID, 'SpecOptionIDs': params}, function(variant){
                    variant.DisplayName = color;
                    variant.Markup = params.Markup;
                    angular.forEach($scope.product.Specs, function(spec) {
                        angular.forEach(spec.Options, function(option) {
                            if (option.ID == params[0]) {
                                variant.Specs[spec.Name] = spec;
                                variant.Specs[spec.Name].Value = option.Value;
                            }
                            if (option.ID == params[1]) {
                                variant.Specs[spec.Name] = spec
                                variant.Specs[spec.Name].Value = option.Value;
                            }
                        });
                    });
                    variant.OrderQuantity = $scope.currentOrder ? countVariantInOrder(variant) : 0;
                    $scope.comboVariants[color].DisplayName = color;
                    $scope.comboVariants[color].push(variant);
                });
            }
        }


        $scope.addVariantsToOrder = function(){
            if(!$scope.currentOrder){
                $scope.currentOrder = {};
                $scope.currentOrder.LineItems = [];
            }
            angular.forEach($scope.comboVariants, function(group) {
                angular.forEach(group, function(item) {
                    if (item.Quantity > 0) {
                        var li = {
                            "PriceSchedule":$scope.product.StandardPriceSchedule,
                            "Product":$scope.product,
                            "Quantity":item.Quantity,
                            "Specs":item.Specs,
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

