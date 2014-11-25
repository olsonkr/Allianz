four51.app.controller('ProductMatrixCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User', 'ProductMatrix',
    function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User, ProductMatrix) {
        $scope.addToOrderText = "Add To Cart";
        $scope.searchTerm = null;
        $scope.currentOrder = $scope.$parent.$parent.currentOrder;

        $scope.lineItemIndex = $routeParams.lineItemIndex;

        function init(searchTerm) {
            ProductDisplayService.getProductAndVariant($routeParams.productInteropID, $routeParams.variantInteropID, function (data) {
                $scope.product = data.product;
                if ($scope.product.IsVBOSS) {
                    var lineItemEdit = null;
                    if ($scope.lineItemIndex) {
                        lineItemEdit = $scope.currentOrder.LineItems[$scope.lineItemIndex];
                    }
                    ProductMatrix.build($scope.product, $scope.currentOrder, lineItemEdit, function(matrix, specCount, spec1Name, spec2Name) {
                        $scope.specCount = specCount;
                        $scope.spec1Name = spec1Name;
                        $scope.spec2Name = spec2Name;
                        $scope.comboVariants = matrix;
                    });
                }
            }, 1, 100, searchTerm);
        }
        init($scope.searchTerm);

        $scope.qtyChanged = function() {
            $scope.qtyError = "";
            ProductMatrix.validateQuantity($scope.comboVariants, $scope.product, function(message) {
                $scope.qtyError = message;
            });
            $scope.backOrderErrors = "";
            ProductMatrix.backOrderValidate($scope.comboVariants, $scope.product, function(data) {
                $scope.backOrderErrors = data;
            });
        };

        function saveOrder(order) {
            Order.clearshipper($scope.currentOrder).save($scope.currentOrder,
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

        $scope.addVariantsToOrder = function(){
            if(!$scope.currentOrder){
                $scope.currentOrder = {};
                $scope.currentOrder.LineItems = [];
            }
            if (!$scope.lineItemIndex) {
                ProductMatrix.addToOrder($scope.comboVariants, $scope.product, function(lineItems) {
                    $scope.addToOrderIndicator = true;
                    angular.forEach(lineItems, function(li) {
                        $scope.currentOrder.LineItems.push(li);
                    });
                    saveOrder($scope.currentOrder);
                    /*Order.clearshipper($scope.currentOrder).save($scope.currentOrder,
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
                    );*/
                });
            }
            else {
                $scope.addToOrderIndicator = true;
                if ($scope.specCount == 1) {
                    angular.forEach($scope.comboVariants, function(variant) {
                        if (variant[0].Quantity) {
                            $scope.currentOrder.LineItems[$scope.lineItemIndex].Quantity = variant[0].Quantity;
                        }
                    });
                    saveOrder($scope.currentOrder);
                }
                else {
                    angular.forEach($scope.comboVariants, function(group) {
                        angular.forEach(group, function(variant) {
                            if (variant.Quantity) {
                                $scope.currentOrder.LineItems[$scope.lineItemIndex].Quantity = variant.Quantity;
                            }
                        });
                    });
                    saveOrder($scope.currentOrder);
                }
            }
        };
    }]);


