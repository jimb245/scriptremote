'use strict'

// Service to manage Angular dynamic templates
//
angular.module('tmplMod')

.service('TmplSvc', ['$http', '$resource', function($http, $resource ) {

    var baseUrl = '/templates/';

    var locationUrl = function(project, jobid, location) {
        return baseUrl + 'location' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }

    var filesUrl = baseUrl + 'files';
    var filesSharedUrl = function(project, jobid, location) {
        return filesUrl + '/' + 'share' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }

    var listUrl = baseUrl + 'list';
    var listSharedUrl = function(project, jobid, location) {
        return listUrl + '/' + 'share' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }

    var defaultsUrl = baseUrl + 'defaults';
    var defaultsSharedUrl = function(project, jobid, location) {
        return defaultsUrl + '/' + 'share' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }

    var deleteUrl = function(key) {
        return filesUrl + '/' + key;
    }

    this.isShared = function(project) {
        return (project.indexOf('~') > 0);
    }

    this.isEncrypted = function(key, project, jobId, location) {
        var url = filesUrl + '/' + key;
        if (project && this.isShared(project)) {
            url = filesSharedUrl(project, jobId, location) + '/' + key;
        }
        return $http.get(url, {transformResponse: angular.identity});
    }

    // Get or set the templates for a location.
    // get returns array of names:
    //      { 'templates': [content, reply] }
    // save form params:
    //      content_template (string)
    //      reply_template (string)
    this.locationTmpl = function(project, jobId, location) {
        var url = locationUrl(project, jobId, location);
        return $resource(url, {}, {
            get: {method: 'GET'},
            save: {method: 'PUT'},
        })
    }

    // Template file upload/download uses $http because $resource 
    // doesnt handle streamed files.
    // Upload form params:
    //  key (string)
    //  file or blob object
    //  encrypted (boolean)
    this.fileUpload = function(key, file, encrypted) {
        var fd = new FormData();
        fd.append('file', file);
        fd.append('encrypted', encrypted);
        fd.append('file_key', key);

        return $http.post(filesUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
    }

    this.fileDownload = function(key, project, jobId, location) {
        var url = filesUrl + '/' + key + '/contents';
        if (project && this.isShared(project)) {
            url = filesSharedUrl(project, jobId, location) + '/' + key + '/contents';
        }
        return $http.get(url, {transformResponse: angular.identity});
    }

    this.fileDownloadDefault = function(key) {
        var url = filesUrl + '/global/' + key + '/contents';
        return $http.get(url, {transformResponse: angular.identity});
    }

    // User defaults are the initial templates assigned to a location.
    // get returns array of names:
    //      { 'templates': [content, reply] }
    // save form params:
    //      content_template (string)
    //      reply_template (string)
    this.userDefaults = function(project, jobId, location) {
        var url = defaultsUrl;
        if (project && this.isShared(project)) {
            url = defaultsSharedUrl(project, jobId, location);
        }
        return $resource(url, {}, {
            get: {method: 'GET'},
            save: {method: 'PUT'},
        })
    }


    // Find all available templates,  returns arrays of keys, types, encryption 
    // flags: { 'file_keys': [(string), ...], 'file_types': [(string), ...], 
    //                      encrypted: [(boolean), ...] }
    this.listTmpl = function(project, jobId, location) {
        var url = listUrl;
        if (project && this.isShared(project)) {
            url = listSharedUrl(project, jobId, location);
        }
        return $resource(url, {}, {
            get: {method: 'GET'},
        })
    }

    // Delete a template
    this.deleteTmpl = function(name) {
        return $resource(deleteUrl(name), {}, {
            delete: {method: 'DELETE'},
        })
    }
}]);
