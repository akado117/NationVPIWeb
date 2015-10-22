var user = {
	useName : "default",
	password : "default"
}; // terrible practice but using for the time being until $rootscope is
// figured out

(function() {

	var app = angular.module('main', [ 'ngRoute', 'ui.bootstrap' ]);

	app.config([ '$routeProvider', '$locationProvider',
			function($routeProvider, $locationProvider) {

				$routeProvider.when('/login', {
					templateUrl : '/frags/login.html',
					controller : 'LoginController',
					controllerAs : 'loginCntrl'
				}).when('/add', {
					templateUrl : '/frags/add-form.html',
					controller : 'addController',
					controllerAs : 'addCntrl'
				}).when('/info', {
					templateUrl : '/frags/info-screen.html',
					controller : 'InfoController',
					controllerAs : 'infoCntrl'
				}).when('/list', {
					templateUrl : '/frags/list-of-stuff.html',
					controller : 'ListController',
					controllerAs : 'listCntrl'
				}).otherwise({
					redirectTo : '/login'
				});

				$locationProvider.html5Mode({
					enabled : false,
					requireBase : false
				});
			} ]);

	// event statuses
	app.constant('AUTH_EVENTS', {
		loginSuccess : 'auth-login-success',
		loginFailed : 'auth-login-failed',
		logoutSuccess : 'auth-logout-success',
		sessionTimeout : 'auth-session-timeout',
		notAuthenticated : 'auth-not-authenticated',
		notAuthorized : 'auth-not-authorized'
	});
	// various role levels
	app.constant('USER_ROLES', {
		all : '*',
		admin : 'admin',
		editor : 'editor',
		guest : 'guest'
	});
	

	// singleton to carry user info throughout this module
	app.service('Session', function() {
		this.create = function(sessionId, userId, userRole) {
			this.id = sessionId;
			this.userId = userId;
			this.userRole = userRole;
		};
		this.destroy = function() {
			this.id = null;
			this.userId = null;
			this.userRole = null;
		};
		return this;
	});

	app.service('LoadedAppsService', function() {
		this.create = function(apps) {
			this.apps = apps;
		};
		this.destroy = function() {
			this.apps = null;
		};

		this.deleteApp = function() {

			if (this.apps[this.appToUse]) {
				delete this.apps[this.appToUse];
			}
			;
		}

		this.saveApp = function(appName,userId, password) {
			debugger;
			
			if (this.apps[this.appToUse]) {
				var tempAppId = this.apps[this.appToUse].appId;
				var appKey = appName + tempAppId;
				this.deleteApp(this.appToUse);
				
				this.apps[tempAppId] = 
					{'appName' : appName,
					'userId' : userId,
					'password' : password,
					'appId' : tempAppId}
				this.appToUse = null;
			}else {
				var newId = this.returnHighestIdNumber();
				this.apps[appName + newId] = 
				{'appName' : appName,
				'userId' : userId,
				'password' : password,
				'appId' : newId};
			};

		};
		
		
		
		this.returnHighestIdNumber = function(){
			debugger;
			var highest = 0;
			for(var key in this.apps){
				
				var curAppId = parseInt(this.apps[key].appId);
				if(curAppId > highest){
					highest = curAppId;
				}; 
				
			};
			return highest;
		};
		

		return this;
	});

	// where login logic can be added
	app.factory('AuthService', [
			'$http',
			'Session',
			function($http, Session) {
				var authService = {};
				var user = {
					'id' : 'admin',
					'role' : 'admin'
				}

				authService.login = function(credentials) {
					/*
					 * //later change to backend call that will send back user
					 * info return $http.post('/login', credentials)
					 * .then(function (res) { Session.create(res.data.id,
					 * res.data.user.id, res.data.user.role); return
					 * res.data.user; });
					 */

					return user;

				};

				authService.isAuthenticated = function() {
					return !!Session.userId;
				};

				authService.isAuthorized = function(authorizedRoles) {
					if (!angular.isArray(authorizedRoles)) {
						authorizedRoles = [ authorizedRoles ];
					}
					return (authService.isAuthenticated() && authorizedRoles
							.indexOf(Session.userRole) !== -1);
				};

				return authService;
			} ]);

	app.controller('MainCtrl', [
			'$route',
			'$routeParams',
			'$location',
			'$scope',
			'USER_ROLES',
			'AuthService',
			function($route, $routeParams, $location, $scope, USER_ROLES,
					AuthService) {
				this.$route = $route;
				this.$location = $location;
				this.$routeParams = $routeParams;

				$scope.currentUser = null;
				$scope.userRoles = USER_ROLES;
				$scope.isAuthorized = AuthService.isAuthorized;

				$scope.setCurrentUser = function(user) {
					$scope.currentUser = user;
				};
			} ]);

	app.controller('ApplicationController', [ '$scope', 'USER_ROLES',
			'AuthService', function($scope, USER_ROLES, AuthService) {

			} ]);

	app.controller('LoginController', [ '$scope', '$rootScope', 'AUTH_EVENTS',
			'AuthService', '$location',
			function($scope, $rootScope, AUTH_EVENTS, AuthService, $location) {
				$scope.credentials = {
					userName : '',
					password : ''
				};
				$scope.login = function(credentials) {

					/*
					 * will need to utilize when backend is created
					 * AuthService.login(credentials).then(function (user) {
					 * $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
					 * $scope.setCurrentUser(user); }, function () {
					 * $rootScope.$broadcast(AUTH_EVENTS.loginFailed); });
					 */
					$scope.setCurrentUser(AuthService.login(credentials));

					$location.path('/list');

				};
			} ]);

	app.controller('ListController', [
			'$scope',
			'$rootScope',
			'AUTH_EVENTS',
			'AuthService',
			'$location',
			'LoadedAppsService',
			'$http',
			function($scope, $rootScope, AUTH_EVENTS, AuthService, $location,
					LoadedAppsService, $http) {

				var user = $scope.currentUser;
				this.listErrorMessage = false;

				if (!LoadedAppsService.apps) {
					$http.get('/Data/TestDataApps.json').then(function(apps) {
						LoadedAppsService.create(apps.data);
						this.listErrorMessage = false;
					}, function() {
						LoadedAppsService.destroy();
						console.log('failed to retrieve users');
						this.listErrorMessage = true;
					});
				}
				;

				this.appServ = LoadedAppsService;
				this.listLetter = "1";
				this.isNewLetter = true;

				this.checkForListLetter = function(newLetter) {
					if (newLetter != this.listLetter) {
						this.isNewLetter = true;
						this.listLetter = newLetter;

					} else {
						this.isNewLetter = false;
					}
				};

				this.add = function() {
					$location.path('/add');
				};

				// this will be bound to each of the list elements on the list
				// page
				this.info = function(savedAppKey) {

					this.appServ.appToUse = savedAppKey;
					$location.path('/info');
				}

			} ]);

	app
			.controller(
					'InfoController',
					[
							'$scope',
							'$rootScope',
							'AUTH_EVENTS',
							'AuthService',
							'$location',
							'LoadedAppsService',
							'$http',
							function($scope, $rootScope, AUTH_EVENTS,
									AuthService, $location, LoadedAppsService,
									$http) {

								var user = $scope.currentUser;
								this.appKey = LoadedAppsService.appToUse;
								this.counter

								if (LoadedAppsService.appToUse != null
										&& LoadedAppsService.appToUse != "") {
									this.appName = LoadedAppsService.apps[this.appKey].appName;
									this.appId = LoadedAppsService.apps[this.appKey].userId;
									this.password = LoadedAppsService.apps[this.appKey].password;
								}

								this.cancel = function() {
									$location.path('/list');
								};

								// this will be bound to each of the list
								// elements on the list
								// page
								this.edit = function() {
									$location.path('/add');
								}

							} ]);

	app
			.controller(
					'addController',
					[
							'$scope',
							'$rootScope',
							'AUTH_EVENTS',
							'AuthService',
							'$location',
							'$modal',
							'LoadedAppsService',
							function($scope, $rootScope, AUTH_EVENTS,
									AuthService, $location, $modal,
									LoadedAppsService) {

								var user = $scope.currentUser;

								$scope.errorMessageEnable = false;

								$scope.appServ = LoadedAppsService;

								if (LoadedAppsService.apps) {
									if (LoadedAppsService.apps[LoadedAppsService.appToUse]) {
										this.appName = LoadedAppsService.apps[LoadedAppsService.appToUse].appName
												|| '';
										this.userId = LoadedAppsService.apps[LoadedAppsService.appToUse].userId
												|| '';
										this.password = LoadedAppsService.apps[LoadedAppsService.appToUse].password
												|| '';
										this.confPass = LoadedAppsService.apps[LoadedAppsService.appToUse].password
												|| '';
									}
									;
								}
								;

								this.open = function() {

									var modalInstance = $modal
											.open({
												templateUrl : '/frags/cancelModal.html',
												controller : 'ModalInstanceCtrl',
												size : 'sm'

											});

									modalInstance.result.then(function() {

										$scope.deleteApp = true;

										$scope.appServ.deleteApp();
										// someservice to delete the app then on
										// success
										$scope.errorMessageEnable = false;
										$location.path('/list');
										// on fail
										// $scope.errorMessageEnable = true;
										// $scope.errorMessage = "Delete Failed"
									}, function() {
										$scope.deleteApp = false;
									});

								};

								this.save = function() {
									

									if (this.password === this.confPass) {
										this.appName = this.appName.substring(0,1).toUpperCase() + this.appName.substring(1);
										$scope.appServ.saveApp(this.appName, this.userId, this.password)
										// some post to the server
										// success
									}
									;

									$location.path('/list');
									// failure
									// $scope.errorMessageEnable = true;
									// $scope.errorMessage = "Save Failed";

								};

								this.cancel = function() {
									$location.path('/list');
								}

							} ]);

	// cancel modal controller
	app.controller('ModalInstanceCtrl', function($scope, $modalInstance) {

		$scope.ok = function() {
			$scope.deleteEntry = true;
			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	});

})();