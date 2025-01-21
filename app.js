let app = angular.module('myApp', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('landing', {
            url: '/',
            templateUrl: 'views/landingPage.html',
            controller: 'LandingPageController',
            data: {
                css: './styles/landingPage.css'
            }
        })
        .state('signup', {
            url: '/signup',
            templateUrl: 'views/signup.html',
            controller: 'AuthController',
            data: {
                css: './styles/signup.css'
            }

        })
        .state('signin', {
            url: '/signin',
            templateUrl: 'views/signin.html',
            controller: 'AuthController',
            data: {
                css: './styles/signin.css'
            }
        })
        .state('game', {
            url: '/game',
            templateUrl: 'views/game.html',
            controller: 'GameController',
            data: {
                css: './styles/game.css'
            }
        })
        .state('dashboard', {
            url: '/dashboard',
            templateUrl: 'views/dashboard.html',
            controller: 'dashboardController',
        });
}]);
