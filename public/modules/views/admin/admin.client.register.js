'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('adminMod', ['ngRoute', 'ngResource', 'apiMod', 'adminSvcMod', 'authMod', 'alertMod']);
