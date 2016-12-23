'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('ui.bootstrap', ["ui.bootstrap.tpls","ui.bootstrap.alert", "alertMod"]);
ApplicationConfiguration.registerModule('ui.bootstrap.tpls', ["template/alert/alert.html"]);
ApplicationConfiguration.registerModule('ui.bootstrap.alert', []);
ApplicationConfiguration.registerModule('template/alert/alert.html', []);

