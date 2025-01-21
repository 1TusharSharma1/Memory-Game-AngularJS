app.controller('LandingPageController', ['$scope', '$state', function($scope, $state) {
    $scope.message = "Welcome to the Landing Page!";
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;
    if (loggedInUser) {
      $state.go('game');
      return;
    }
}]);
