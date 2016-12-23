'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting Location Mode
angular.module(ApplicationConfiguration.applicationModuleName)

.config(['$locationProvider', '$routeProvider',
	function($locationProvider, $routeProvider) {
		//$locationProvider.hashPrefix('!');
        $locationProvider.html5Mode(false);
        $routeProvider.otherwise({redirectTo: '/home'});
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	//if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
