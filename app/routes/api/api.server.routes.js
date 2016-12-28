'use strict';

// Comments are structured for apidoc

/**
 * @api /:base
 * @apiGroup Overview
 *
 * @apiDescription
 * Following are endpoints to access project data for both 
 * browser and script clients. The browser client is
 * used mainly to read messages and respond to reply
 * requests from script clients. Script clients create
 * projects, jobs, and send messages to them.
 * <p> 
 * This does not include endpoints that are used only by browser
 * client to controll the UI.
 * <p>
 * All endpoints have a <tt>:base</tt> route parameter that depends
 * on the type of client, corresponding to the fact that browser
 * and script clients use different authentication methods..
 * Browser clients should use <tt>'/brsapi/projects/...'</tt> url's, 
 * which require login/session authentication.
 * <p>
 * Script clients should use <tt>'/api/projects/...'</tt> url's, which
 * require a Basic Auth header. The name and password fields of the header
 * are the user id and api token, respectively, obtained from the 
 * <tt>Settings</tt> page of the website. Each time a token is generated
 * on the <tt>Settings</tt> page it becomes the current token value.  The 
 * token value used in the request that creates a job is stored with the job. 
 * Later requests 
 * that address a specific job can use either the job's stored token value 
 * or the current user value in the auth header. Requests not addressing 
 * a job need to use the current user token value. This permits a new token 
 * to be generated anytime without affecting existing jobs.
 * <p>
 * Endpoints that are project-specific use a <tt>:project</tt> route
 * parameter that depends on the project ownership.
 * A project is owned by the user who created it.
 * For a project owned by the authenticated user the project route 
 * parameter is just the project name.  For a project owned by a 
 * different user the project route parameter is the project name 
 * followed by the owner's email address, separated by a '~'. The 
 * project owner controls the list of other users permitted
 * to access the project.
 * <p>
 * Route params defined by the client (project,
 * location, file_key) should use url encoding when needed.
 * <p>
 * For <tt>/brsapi</tt> routes, requests that include data must use json. 
 * For <tt>/api</tt> routes requests with data can use json or form encoding. 
 * Requests that upload files use multipart/form-data encoding.
 * <p>
 * Responses are json objects except for file downloads. The json includes a 
 * field 'SR_status' with value 'OK' if successful or a 
 * message if not. For file downloads the response body is
 * the file contents.
 * <p>
 * Response result codes:
 * <ul>
 *  <li>200 - success
 *  <li>400 - input error other than "url not found"
 *  <li>401 - auth error
 *  <li>404 - resource url not found
 *  <li>500 - server error
 * </ul>
 * <p>
 * Encryption
 * <p>
 * For an encrypted project the url's will contain encrypted items.
 * The server is mostly unaffected by the encryption, except for some
 * additional flags and hashes added to the data. Script clients 
 * that implement encryption need to manage the conversion between
 * encrypted and unencrypted url's. The script client also needs
 * to be consistent with the browser client, which expects all 
 * the user-defined data items to be encrypted:
 * <ul>
 *  <li>project names
 *  <li>job names
 *  <li>location names
 *  <li>message content name
 *  <li>message content values
 *  <li>reply message content name
 *  <li>reply message content values
 *  <li>file tags
 *  <li>file contents
 * </ul>
 *
 * The user-defined items that can occur in url's are project names, location
 * names, and file tags. Jobs and messages are identified by server-generated
 * id's and these do not need to be encrypted.
 *
 * The encryption method is aes-256 ctr and the formatting 
 * must be either:
 * <p>
 * 1) openssl enc
 * <p>
 * This is the format produced by the openssl command with 
 * an 8-byte salt and a passphrase, using base64 output. 
 * Any slash ('/') characters in the base64 output
 * are then replaced by dash ('-') characters for url safety.
 * <p>
 * 2) 'normal' format
 * <p>
 * This is a format that can be produced using common crypto 
 * libraries: 12-byte-salt + ciphertext, in modified base64 with '+-'
 * as the additional characters instead of '+/'. The encryption
 * iv is the 12-byte salt + 4-byte counter, initially zero.
 * The salt is longer than the usual 8 bytes to reduce the
 * possibility of a repeat within the lifetime of a project
 * since the passphrase remains constant.  A 4 byte counter 
 * still allows encrypting items up to 64GB, much larger than 
 * expected in practice.
 * <p>
 * The encryption key is generated from the passphrase and an
 * 8-byte salt using pbkdf2 with a sha256 hash and 10000 rounds.
 * Like the passphrase, the 8-byte salt and key for a project
 * are fixed at the time of creation. The 8-byte salt is stored
 * with the project in the server.
 * <p>
 * For either encryption format, reply content is also expected to be 
 * authenticated in both directions using a sha256 digest in hex format, 
 * with the passphrase used as the key. The string to be authenticated 
 * is formed by concatenating the encrypted key-value pairs, in order. 
 * The computed digest is added as an extra key-value pair with a 
 * key of 'hmac'. 
 *
 * For encrypted shared projects the <tt>:project</tt> route parameter
 * is the encrypted project name followed by the plaintext owner's
 * email, separated by a tilde character.
 */

var bodyParser = require('body-parser'),
    csrf = require('csurf'),
    middleModule = require('../../../app/controllers/lib/middle.server.js'),
    projectsController = require('../../../app/controllers/api/projects.server.controller.js'),
    jobsController = require('../../../app/controllers/api/jobs.server.controller.js'),
    locationsController = require('../../../app/controllers/api/locations.server.controller.js'),
    msgsController = require('../../../app/controllers/api/messages.server.controller.js'),
    filesController = require('../../../app/controllers/api/files.server.controller.js');

module.exports = function(app) {

    app.use('/api', bodyParser.urlencoded({extended: true, limit:'50mb'}));

    // Add csrf token for routes handled by Angular
    var csrfProtect = csrf(app.locals.csurf);
    app.use('/brsapi', csrfProtect, function(req, res, next) {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {'secure': app.locals.secureCookies});
        next();
    });

    /**
     * Projects
     */

    /**
     * @api {get} /:base/projects Projects owned by user
     * @apiName GetProjects
     * @apiGroup Projects
     *
     * @apiDescription Returns array of projects owned by the user. Array elements are
     * tuples containing name, flag indicating if project is encrypted, and
     * AES key generation salt (empty string for openssl format).
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'projects': [[(string),(boolean),(string)],...] }
     */
    app.get('/:base/projects',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'projects', [])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.get, middleModule.errHandler);
    /**
     * @api {get} /:base/projects/:project Project properties
     * @apiName GetProject
     * @apiGroup Projects
     *
     * @apiDescription Returns parameters of a project
     *
     * @apiSuccess (string) owner Email of project owner
     * @apiSuccess (string) timestamp Project creation time
     * @apiSuccess (string) description Project description
     * @apiSuccess (boolean) encrypted Flag indicating if project is encrypted
     * @apiSuccess (string) salt Project aes key generation salt or empty string
     * @apiSuccess (string) authUsers Array of other users authorized for project and their access level
     * @apiSuccess (string) notifyTo Array of users to receive notifications of project messages
     *
     * @apiSuccessExample {json} Success-Response - non-shared project
     * { 'SR_status': 'OK', 'owner': (string), 'timestamp': (string), 'description': (string), 'encrypted': (boolean), 'salt': (string) }
     *
     * @apiSuccessExample {json} Success-Response - shared project
     * { 'SR_status': 'OK', 'owner': (string), 'authUsers': [{email:(string), access:(string)},...], 'notifyTo': [(string), ...], 'timestamp': (string), 'description': (string), 'encrypted': (boolean), 'salt': (string) }
     */
    app.get('/:base/projects/:project',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'project', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.get, middleModule.errHandler);

    /**
     * @api {post} /:base/projects Create project
     * @apiName CreateProject
     * @apiGroup Projects
     *
     * @apiDescription Starts a new project with user as owner.  
     * 
     * @apiParam project_name (string) Unique new name - fails if name already exists
     * @apiParam is_encrypted (boolean) Flag indicating project data (including project_name) is encrypted. Values are strings 'true', 'false', or case variations
     * @apiParam timestamp (string) Project creation time - any format
     * @apiParam [salt] (string) AES key generation salt, if required
     *
     * is_encrypted values are 'true', 'false' or case variations.
     *
     * @apiSuccessExample {json} Success-Response
     * {'SR_status': 'OK'}
     */
    app.post('/:base/projects',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'owner', 'project-post', [])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.post, middleModule.errHandler);
    /**
     * @api {put} /:base/projects/:project/share Project sharing
     * @apiName ShareProject
     * @apiGroup Projects
     *
     * @apiDescription Updates the authorized users of a project.
     * When adding a user the access level determines the actions 
     * permitted for the user. 'read' does not allow creating jobs
     * in the project or replying to messages. 'reply' adds 
     * permission to reply to messages for any job in the project. 
     * 'write' adds permission to create or delete jobs.
     *
     * @apiParam email (string)
     * @apiParam action (string = 'add', 'remove')
     * @apiParam [access] (string ='read', 'reply', 'write') Permission when adding a user
     *
     * @apiSuccessExample {json} Success-Response
     * {'SR_status': 'OK'}
     */
    app.put('/:base/projects/:project/share',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'owner', 'share', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.patch, middleModule.errHandler);

    /**
     * @api {put} /:base/projects/:project/description Project description
     * @apiName ProjectDescription
     * @apiGroup Projects
     *
     * @apiDescription Updates the description of a project.
     *
     * @apiParam description (string)
     *
     * @apiSuccessExample {json} Success-Response
     * {'SR_status': 'OK'}
     */
    app.put('/:base/projects/:project/description',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', 'description', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.patch, middleModule.errHandler);

    /**
     * @api {put} /:base/projects/:project/notify Project notifications
     * @apiName ProjectNotifications
     * @apiGroup Projects
     *
     * @apiDescription Updates the notification subscribers of a project
     *
     * @apiParam nickname (string) Project nickname displayed in notifications
     * @apiParam action (string='on','off') Turn notification on or off
     *
     * @apiSuccessExample {json} Success-Response
     * {'SR_status': 'OK'}
     */
    app.put('/:base/projects/:project/notify',
        function(req, res, next) {
             // Project permission required is only 'read' even though it's
             // a 'put' so that notification is possible for readers
            middleModule.copyParams(req, res, next, 'read', 'notify', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.patch, middleModule.errHandler);

    /**
     * @api {delete} /:base/projects/:project Delete project
     * @apiName DeleteProject
     * @apiGroup Projects
     *
     * @apiDescription Deletes a project and all its related data
     *
     * @apiSuccessExample {json} Success-Response
     * {'SR_status': 'OK'}
     */
    app.delete('/:base/projects/:project',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'owner', 'delete', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.delete, middleModule.errHandler);

    /**
     * @api {get} /:base/projects-share/:user Projects shared by another user
     * @apiName GetProjectsShare
     * @apiGroup Projects
     *
     * @apiDescription Returns array of projects owned by another user that are shared to
     * authenticating user.  The :owner parameter is the email of owner. Array elements are 
     * tuples containing name, flag indicating if project is encrypted, and AES key generation 
     * salt (empty string if none). This is mainly used to determine the encrypted project 
     * name corresponding to a plaintext name.
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'projects': [[(string),(boolean),(string)],...] }
     */
    app.get('/:base/projects-share/:owner',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'projects-share', ['owner'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, projectsController.get, middleModule.errHandler);

    /**
     * Jobs
     */

    /**
     * @api {get} /:base/projects/:project/jobs Jobs belonging to a project
     * @apiName ProjectJobs
     * @apiGroup Jobs
     *
     * @apiDescription Returns array of jobs of a project, including
     ^ id, name, and timestamp
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'jobs': [{'id':(string), 'name':(string), 'timestamp':(string)},...] }
     */
    app.get('/:base/projects/:project/jobs', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'jobs', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, jobsController.get, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid Job properties
     * @apiName GetJob
     * @apiGroup Jobs
     *
     * @apiDescription Returns parameters for a job
     *
     * @apiSuccess (string) job_name User-assigned job name
     * @apiSuccess (string) max_msgs Max messages retained per location
     * @apiSuccess (string) description Project description
     * @apiSuccess (string) timestamp Job creation time
     * @apiSuccess (string) end Flag indicating if job has ended
     * @apiSuccess (string) timestamp_end Job end time
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK',
     *   'job_name': (string), 
     *   'description': (string),
     *   'max_msgs': (number), 
     *   'timestamp': (string),
     *   'end': (boolean), 
     *   'timestamp_end': (string) }
     */
    app.get('/:base/projects/:project/jobs/:job',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'job', ['project', 'job'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, jobsController.get, middleModule.errHandler);

    /**
     * @api {post} /:base/projects/:project/jobs Create job
     * @apiName CreateJob
     * @apiGroup Jobs
     *
     * @apiDescription Starts a new job in a project, returns job id.  
     *
     * @apiParam job_name (string) Job name - need not be unique
     * @apiParam max_msgs (string) Max messages to retain per location
     * @apiParam timestamp (string) Job creation time - any format
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'job': (string) }
     */
    app.post('/:base/projects/:project/jobs',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', '', ['project'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, jobsController.post, middleModule.errHandler);

    /**
     * @api {put} /:base/projects/:project/jobs/:job/description Job description
     * @apiName JobDescription
     * @apiGroup Jobs
     *
     * @apiDescription Updates the description of a job
     *
     * @apiParam description (string)
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK' }
     */
    app.put('/:base/projects/:project/jobs/:job/description',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', 'description', ['project', 'job'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, jobsController.patch, middleModule.errHandler);

    /**
     * @api {put} /:base/projects/:project/jobs/:jobid End job
     * @apiName EndJob
     * @apiGroup Jobs
     *
     * @apiDescription Ends a job - no more messages can be added to it
     *
     * @apiParam timestamp (string)
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK' }
     */
    app.put('/:base/projects/:project/jobs/:job/end',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', 'end', ['project', 'job'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, jobsController.patch, middleModule.errHandler);

    /**
     * @api {delete} /:base/projects/:project/jobs/:jobid Delete job
     * @apiName DeleteJob
     * @apiGroup Jobs
     *
     * @apiDescription Deletes a job and all its related data
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK' }
     */
    app.delete('/:base/projects/:project/jobs/:job',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', '', ['project', 'job'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, jobsController.delete, middleModule.errHandler);

    /**
     * Locations
     */

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations Locations of a job
     * @apiName GetLocations
     * @apiGroup Locations
     *
     * @apiDescription Returns array of location names for a job
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'locations': [(string),...] }
     */
    app.get('/:base/projects/:project/jobs/:job/locations',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'locations', ['project', 'job'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, locationsController.get, middleModule.errHandler);

    /**
     * @api {post} /:base/projects/:project/jobs/:jobid/locations Create location
     * @apiName CreateLocation
     * @apiGroup Locations
     *
     * @apiDescription Starts a new location in a job  
     *
     * @apiParam location_name (string) Location name - must be unique
     * @apiParam timestamp (string) Location creation time - any format
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK'}
     */
    app.post('/:base/projects/:project/jobs/:job/locations',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', '', ['project', 'job'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, locationsController.post, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location Location properties
     * @apiName GetLocation
     * @apiGroup Locations
     *
     * @apiDescription Returns parameters of a location
     *
     * @apiSuccess (string) timestamp Location creation time
     * @apiSuccess (integer) msgcnt Messages at the location
     * @apiSuccess (string) description Location description
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK', 'timestamp': (string), 'msgcnt': (integer), 'description': (string) }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'location', ['project', 'job', 'location'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, locationsController.get, middleModule.errHandler);

    /**
     * @api {put} /:base/projects/:project/jobs/:jobid/locations/:location/description Location description
     * @apiName LocationDescription
     * @apiGroup Locations
     *
     * @apiDescription Updates the description of a location
     *
     * @apiParam description (string)
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK'}
     */
    app.put('/:base/projects/:project/jobs/:job/locations/:location/description',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write',  '', ['project', 'job', 'location'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, locationsController.patch, middleModule.errHandler);

    /**
     * @api {delete} /:base/projects/:project/jobs/:jobid/locations/:location Delete location
     * @apiName DeleteLocation
     * @apiGroup Locations
     *
     * @apiDescription Deletes a location and all its related data
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK'}
     */
    app.delete('/:base/projects/:project/jobs/:job/locations/:location',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', '', ['project', 'job', 'location'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, locationsController.delete, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs Messages at location
     * @apiName GetMessages
     * @apiGroup Messages
     *
     * @apiDescription Returns array of message id's and timestamps for a location
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK', 'messages': [{'id': (string), 'timestamp': (string)},...] }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'msgs', ['project', 'job', 'location'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.get, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid Message content
     * @apiName GetMessage
     * @apiGroup Messages
     *
     * @apiDescription Returns the contents of a message:
     *
     * @apiSuccess (json) content Sent message data
     * @apiSuccess (boolean) is_reply Flag indicating if reply requested
     * @apiSuccess (json) [reply_content] Initial reply data from script or final from browser
     * @apiSuccess (boolean) [reply_done] Flag indicating if reply sent from browser
     * @apiSuccess (boolean) [reply_ack] Flag indicating if reply received by script
     * @apiSuccess (string) timestamp Message creation time
     *
     * @apiSuccessExample {json} Success-Response - no reply requested
     *  { ''SR_status': 'OK', content': (json), 'is_reply': (false), 'timestamp': (string) }
     *
     * @apiSuccessExample {json} Success-Response - reply requested
     *  { 'SR_status': 'OK', 'content': (json), 'is_reply': (true), 'reply_content': (json), 
     *      'reply_done': (boolean), 'reply_ack': (boolean), 'timestamp': (string) }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'msg', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.get, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/shorts Message short url's
     * @apiName Shorts
     * @apiGroup Messages
     *
     * @apiDescription Returns json array of shortened url keys for a message.
     *                      This is mainly for testing.
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK', 'keys': [(string),...] }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/shorts',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'shorts', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.get, middleModule.errHandler);

    /**
     * @api {post} /:base/projects/:project/jobs/:jobid/locations/:location/msgs Create message
     * @apiName CreateMessage
     * @apiGroup Messages
     *
     * @apiDescription Adds a new message to given job/location. Location may already
     *  exist or be new. Returns new message id.
     *
     * @apiParam [content] (json) Message content
     * @apiParam is_reply (boolean) Flag indicating if browser reply is requested
     * @apiParam [reply_content] (json) Initial reply content
     * @apiParam timestamp (string) Message creation time - any format
     *
     * is_reply values are strings 'true', 'false' or case variations.
     *
     * The browser client expects content and reply_content to be
     * empty strings or arrays of objects of the form 
     * {'name': (string), 'value': (string)}.
     *
     * For reply messages (is_reply = 'true') browser and script
     * clients can use a handshake sequence to confirm reply
     * is received by script:
     * <ul>
     *  <li>script sends POST message with reply request
     *  <li>script sends long-polling GET to wait for reply
     *  <li>browser eventually sends GET to retrieve new message
     *  <li>browser eventually sends PUT to update message reply
     *  <li>script receives GET response and sends PUT to acknowledge
     *  <li>browser eventually sends GET to check for acknowledge
     * </ul>
     * The browser displays the status of the message for feedback,
     * but the browser actions only occur if the user initiates them.
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'message': (string) }
     *
     */
    app.post('/:base/projects/:project/jobs/:job/locations/:location/msgs',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', 'msg', ['project', 'job', 'location'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.post, middleModule.errHandler);

    /**
     * @api {post} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/files Add file
     * @apiName AddFile
     * @apiGroup Messages
     *
     * @apiDescription Uploads a file to attach to a message,
     * using multipart/form-data encoding. The first part is the file
     * key which is an identifer that can be referenced in other message
     * content or later request url's. The remaining parts contain the file
     * contents.
     *
     * @apiHeader (string) Content-Type: multipart/form-data; boundary=(boundary)
     *
     * --(boundary)--
     *
     * @apiHeader (string) Content-Disposition: form-data; name="file_key"
     * </br>(string)
     * </br>--(boundary)--
     *
     * @apiHeader (string) content-disposition: form-data; name="file"; filename="(string)"
     * @apiHeader (string) content-type: text/plain | image/png | image/svg+xml
     * </br>... contents of file ...
     * </br>--(boundary)--
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK' }
     */
    app.post('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/files',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', '', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, filesController.upload, middleModule.errHandler);

    /**
     * @api {put} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply Put reply
     * @apiName PutReply
     * @apiGroup Messages
     *
     * @apiDescription Replaces the original reply content of a message. Fails if a reply PUT
     * was done previously. Normally used by browser clients.
     *
     * @apiParam reply_content (json)
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK' }
     */
    app.put('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/reply',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'reply', 'reply', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.patch, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply Get reply
     * @apiName GetReply
     * @apiGroup Messages
     *
     * @apiDescription Waits until a PUT reply to a message has occurred then returns the 
     * new reply content.  Normally used by script clients. The request may timeout or be 
     * killed during very long waits.  Client should allow for this and also implement 
     * any desired time limits.
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'reply_content': (json) }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/reply',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'reply', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.get, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply_ack Get acknowledge
     * @apiName GetAck
     * @apiGroup Messages
     *
     * @apiDescription Returns reply_ack value of the message. A true value indicates successful
     * GET occurred following a reply PUT. Normally used by browser clients.
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK', 'reply_ack': (boolean) }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/reply_ack',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'reply_ack', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.get, middleModule.errHandler);


   /**
     * @api {put} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply_ack Put acknowledge
     * @apiName PutAck
     * @apiGroup Messages
     *
     * @apiDescription Acknowledges a successful GET of reply following a reply PUT. Normally used by script clients.
     *
     * @apiSuccessExample {json} Success-Response
     *  { 'SR_status': 'OK' }
    */
    app.put('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/reply_ack',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', 'reply_ack', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, msgsController.patch, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/files File keys
     * @apiName FileKeys
     * @apiGroup Messages
     *
     * @apiDescription Returns array of the file keys for the attachments of a message. The keys are indentifiers that were defined in the requests that uploaded the files.
     *
     * @apiSuccessExample {json} Success-Response
     * { 'SR_status': 'OK', 'file_keys': [(string),...] }
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/files',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'list', ['project', 'job', 'location', 'msg'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, filesController.download, middleModule.errHandler);

    /**
     * @api {get} /:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/files/:file_key Get file
     * @apiName GetFile
     * @apiGroup Messages
     *
     * @apiDescription Downloads a file attachment of a message using its key. Returns file type in the
     * Content-Type header and file content as the response body.
     */
    app.get('/:base/projects/:project/jobs/:job/locations/:location/msgs/:msg/files/:file_key',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'file', ['project', 'job', 'location', 'msg', 'file_key'])
        },
        middleModule.authRest, middleModule.validateParams, middleModule.parse, filesController.download, middleModule.errHandler);

}
