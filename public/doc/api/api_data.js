define({ "api": [
  {
    "type": "post",
    "url": "/:base/projects/:project/jobs",
    "title": "Create job",
    "name": "CreateJob",
    "group": "Jobs",
    "description": "<p>Starts a new job in a project, returns job id.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "job_name",
            "description": "<p>(string) Job name - need not be unique</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "max_msgs",
            "description": "<p>(string) Max messages to retain per location</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "timestamp",
            "description": "<p>(string) Job creation time - any format</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'job': (string) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Jobs"
  },
  {
    "type": "delete",
    "url": "/:base/projects/:project/jobs/:jobid",
    "title": "Delete job",
    "name": "DeleteJob",
    "group": "Jobs",
    "description": "<p>Deletes a job and all its related data</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK' }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Jobs"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/jobs/:jobid",
    "title": "End job",
    "name": "EndJob",
    "group": "Jobs",
    "description": "<p>Ends a job - no more messages can be added to it</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "timestamp",
            "description": "<p>(string)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK' }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Jobs"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid",
    "title": "Job properties",
    "name": "GetJob",
    "group": "Jobs",
    "description": "<p>Returns parameters for a job</p>",
    "success": {
      "fields": {
        "string": [
          {
            "group": "string",
            "optional": false,
            "field": "job_name",
            "description": "<p>User-assigned job name</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "max_msgs",
            "description": "<p>Max messages retained per location</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "description",
            "description": "<p>Project description</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "timestamp",
            "description": "<p>Job creation time</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "end",
            "description": "<p>Flag indicating if job has ended</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "timestamp_end",
            "description": "<p>Job end time</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK',\n  'job_name': (string), \n  'description': (string),\n  'max_msgs': (number), \n  'timestamp': (string),\n  'end': (boolean), \n  'timestamp_end': (string) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Jobs"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/jobs/:job/description",
    "title": "Job description",
    "name": "JobDescription",
    "group": "Jobs",
    "description": "<p>Updates the description of a job</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "description",
            "description": "<p>(string)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK' }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Jobs"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs",
    "title": "Jobs belonging to a project",
    "name": "ProjectJobs",
    "group": "Jobs",
    "description": "<p>Returns array of jobs of a project, including ^ id, name, and timestamp</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'jobs': [{'id':(string), 'name':(string), 'timestamp':(string)},...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Jobs"
  },
  {
    "type": "post",
    "url": "/:base/projects/:project/jobs/:jobid/locations",
    "title": "Create location",
    "name": "CreateLocation",
    "group": "Locations",
    "description": "<p>Starts a new location in a job</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "location_name",
            "description": "<p>(string) Location name - must be unique</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "timestamp",
            "description": "<p>(string) Location creation time - any format</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Locations"
  },
  {
    "type": "delete",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location",
    "title": "Delete location",
    "name": "DeleteLocation",
    "group": "Locations",
    "description": "<p>Deletes a location and all its related data</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Locations"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location",
    "title": "Location properties",
    "name": "GetLocation",
    "group": "Locations",
    "description": "<p>Returns parameters of a location</p>",
    "success": {
      "fields": {
        "string": [
          {
            "group": "string",
            "optional": false,
            "field": "timestamp",
            "description": "<p>Location creation time</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "description",
            "description": "<p>Location description</p>"
          }
        ],
        "integer": [
          {
            "group": "integer",
            "optional": false,
            "field": "msgcnt",
            "description": "<p>Messages at the location</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'timestamp': (string), 'msgcnt': (integer), 'description': (string) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Locations"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations",
    "title": "Locations of a job",
    "name": "GetLocations",
    "group": "Locations",
    "description": "<p>Returns array of location names for a job</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'locations': [(string),...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Locations"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/description",
    "title": "Location description",
    "name": "LocationDescription",
    "group": "Locations",
    "description": "<p>Updates the description of a location</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "description",
            "description": "<p>(string)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Locations"
  },
  {
    "type": "post",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/files",
    "title": "Add file",
    "name": "AddFile",
    "group": "Messages",
    "description": "<p>Uploads a file to attach to a message, using multipart/form-data encoding. The first part is the file key which is an identifer that can be referenced in other message content or later request url's. The remaining parts contain the file contents.</p>",
    "header": {
      "fields": {
        "string": [
          {
            "group": "string",
            "optional": false,
            "field": "Content-Type:",
            "description": "<p>multipart/form-data; boundary=(boundary)</p> <p>--(boundary)--</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "Content-Disposition:",
            "description": "<p>form-data; name=&quot;file_key&quot; </br>(string) </br>--(boundary)--</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "content-disposition:",
            "description": "<p>form-data; name=&quot;file&quot;; filename=&quot;(string)&quot;</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "content-type:",
            "description": "<p>text/plain | image/png | image/svg+xml </br>... contents of file ... </br>--(boundary)--</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK' }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "post",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs",
    "title": "Create message",
    "name": "CreateMessage",
    "group": "Messages",
    "description": "<p>Adds a new message to given job/location. Location may already exist or be new. Returns new message id.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": true,
            "field": "content",
            "description": "<p>(json) Message content</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "is_reply",
            "description": "<p>(boolean) Flag indicating if browser reply is requested</p>"
          },
          {
            "group": "Parameter",
            "optional": true,
            "field": "reply_content",
            "description": "<p>(json) Initial reply content</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "timestamp",
            "description": "<p>(string) Message creation time - any format</p> <p>is_reply values are strings 'true', 'false' or case variations.</p> <p>The browser client expects content and reply_content to be empty strings or arrays of objects of the form {'name': (string), 'value': (string)}.</p> <p>For reply messages (is_reply = 'true') browser and script clients can use a handshake sequence to confirm reply is received by script:</p> <ul>  <li>script sends POST message with reply request  <li>script sends long-polling GET to wait for reply  <li>browser eventually sends GET to retrieve new message  <li>browser eventually sends PUT to update message reply  <li>script receives GET response and sends PUT to acknowledge  <li>browser eventually sends GET to check for acknowledge </ul> The browser displays the status of the message for feedback, but the browser actions only occur if the user initiates them."
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'message': (string) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/files",
    "title": "File keys",
    "name": "FileKeys",
    "group": "Messages",
    "description": "<p>Returns array of the file keys for the attachments of a message. The keys are indentifiers that were defined in the requests that uploaded the files.</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'file_keys': [(string),...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply_ack",
    "title": "Get acknowledge",
    "name": "GetAck",
    "group": "Messages",
    "description": "<p>Returns reply_ack value of the message. A true value indicates successful GET occurred following a reply PUT. Normally used by browser clients.</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'reply_ack': (boolean) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/files/:file_key",
    "title": "Get file",
    "name": "GetFile",
    "group": "Messages",
    "description": "<p>Downloads a file attachment of a message using its key. Returns file type in the Content-Type header and file content as the response body.</p>",
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid",
    "title": "Message content",
    "name": "GetMessage",
    "group": "Messages",
    "description": "<p>Returns the contents of a message:</p>",
    "success": {
      "fields": {
        "json": [
          {
            "group": "json",
            "optional": false,
            "field": "content",
            "description": "<p>Sent message data</p>"
          },
          {
            "group": "json",
            "optional": true,
            "field": "reply_content",
            "description": "<p>Initial reply data from script or final from browser</p>"
          }
        ],
        "boolean": [
          {
            "group": "boolean",
            "optional": false,
            "field": "is_reply",
            "description": "<p>Flag indicating if reply requested</p>"
          },
          {
            "group": "boolean",
            "optional": true,
            "field": "reply_done",
            "description": "<p>Flag indicating if reply sent from browser</p>"
          },
          {
            "group": "boolean",
            "optional": true,
            "field": "reply_ack",
            "description": "<p>Flag indicating if reply received by script</p>"
          }
        ],
        "string": [
          {
            "group": "string",
            "optional": false,
            "field": "timestamp",
            "description": "<p>Message creation time</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response - no reply requested",
          "content": "{ ''SR_status': 'OK', content': (json), 'is_reply': (false), 'timestamp': (string) }",
          "type": "json"
        },
        {
          "title": "Success-Response - reply requested",
          "content": "{ 'SR_status': 'OK', 'content': (json), 'is_reply': (true), 'reply_content': (json), \n    'reply_done': (boolean), 'reply_ack': (boolean), 'timestamp': (string) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs",
    "title": "Messages at location",
    "name": "GetMessages",
    "group": "Messages",
    "description": "<p>Returns array of message id's and timestamps for a location</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'messages': [{'id': (string), 'timestamp': (string)},...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply",
    "title": "Get reply",
    "name": "GetReply",
    "group": "Messages",
    "description": "<p>Waits until a PUT reply to a message has occurred then returns the new reply content.  Normally used by script clients. The request may timeout or be killed during very long waits.  Client should allow for this and also implement any desired time limits.</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'reply_content': (json) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply_ack",
    "title": "Put acknowledge",
    "name": "PutAck",
    "group": "Messages",
    "description": "<p>Acknowledges a successful GET of reply following a reply PUT. Normally used by script clients.</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK' }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/:msgid/reply",
    "title": "Put reply",
    "name": "PutReply",
    "group": "Messages",
    "description": "<p>Replaces the original reply content of a message. Fails if a reply PUT was done previously. Normally used by browser clients.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "reply_content",
            "description": "<p>(json)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK' }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project/jobs/:jobid/locations/:location/msgs/shorts",
    "title": "Message short url's",
    "name": "Shorts",
    "group": "Messages",
    "description": "<p>Returns json array of shortened url keys for a message. This is mainly for testing.</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'keys': [(string),...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "",
    "url": "/:base",
    "title": "",
    "group": "Overview",
    "description": "<p>Following are endpoints to access project data for both browser and script clients. The browser client is used mainly to read messages and respond to reply requests from script clients. Script clients create projects, jobs, and send messages to them.</p> <p>  This does not include endpoints that are used only by browser client to controll the UI. <p> All endpoints have a <tt>:base</tt> route parameter that depends on the type of client, corresponding to the fact that browser and script clients use different authentication methods.. Browser clients should use <tt>'/brsapi/projects/...'</tt> url's,  which require login/session authentication. <p> Script clients should use <tt>'/api/projects/...'</tt> url's, which require a Basic Auth header. The name and password fields of the header are the user id and api token, respectively, obtained from the  <tt>Settings</tt> page of the website. Each time a token is generated on the <tt>Settings</tt> page it becomes the current token value.  The  token value used in the request that creates a job is stored with the job.  Later requests  that address a specific job can use either the job's stored token value  or the current user value in the auth header. Requests not addressing  a job need to use the current user token value. This permits a new token  to be generated anytime without affecting existing jobs. <p> Endpoints that are project-specific use a <tt>:project</tt> route parameter that depends on the project ownership. A project is owned by the user who created it. For a project owned by the authenticated user the project route  parameter is just the project name.  For a project owned by a  different user the project route parameter is the project name  followed by the owner's email address, separated by a '~'. The  project owner controls the list of other users permitted to access the project. <p> Route params defined by the client (project, location, file_key) should use url encoding when needed. <p> For <tt>/brsapi</tt> routes, requests that include data must use json.  For <tt>/api</tt> routes requests with data can use json or form encoding.  Requests that upload files use multipart/form-data encoding. <p> Responses are json objects except for file downloads. The json includes a  field 'SR_status' with value 'OK' if successful or a  message if not. For file downloads the response body is the file contents. <p> Response result codes: <ul>  <li>200 - success  <li>400 - input error other than \"url not found\"  <li>401 - auth error  <li>404 - resource url not found  <li>500 - server error </ul> <p> Encryption <p> For an encrypted project the url's will contain encrypted items. The server is mostly unaffected by the encryption, except for some additional flags and hashes added to the data. Script clients  that implement encryption need to manage the conversion between encrypted and unencrypted url's. The script client also needs to be consistent with the browser client, which expects all  the user-defined data items to be encrypted: <ul>  <li>project names  <li>job names  <li>location names  <li>message content name  <li>message content values  <li>reply message content name  <li>reply message content values  <li>file tags  <li>file contents </ul> <p>The user-defined items that can occur in url's are project names, location names, and file tags. Jobs and messages are identified by server-generated id's and these do not need to be encrypted.</p> <p>The encryption method is aes-256 ctr and the formatting must be either:</p> <p> 1) openssl enc <p> This is the format produced by the openssl command with  an 8-byte salt and a passphrase, using base64 output.  Any slash ('/') characters in the base64 output are then replaced by dash ('-') characters for url safety. <p> 2) 'normal' format <p> This is a format that can be produced using common crypto  libraries: 12-byte-salt + ciphertext, in modified base64 with '+-' as the additional characters instead of '+/'. The encryption iv is the 12-byte salt + 4-byte counter, initially zero. The salt is longer than the usual 8 bytes to reduce the possibility of a repeat within the lifetime of a project since the passphrase remains constant.  A 4 byte counter  still allows encrypting items up to 64GB, much larger than  expected in practice. <p> The encryption key is generated from the passphrase and an 8-byte salt using pbkdf2 with a sha256 hash and 10000 rounds. Like the passphrase, the 8-byte salt and key for a project are fixed at the time of creation. The 8-byte salt is stored with the project in the server. <p> For either encryption format, reply content is also expected to be  authenticated in both directions using a sha256 digest in hex format,  with the passphrase used as the key. The string to be authenticated  is formed by concatenating the encrypted key-value pairs, in order.  The computed digest is added as an extra key-value pair with a  key of 'hmac'.  <p>For encrypted shared projects the <tt>:project</tt> route parameter is the encrypted project name followed by the plaintext owner's email, separated by a tilde character.</p>",
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Overview",
    "name": "Base"
  },
  {
    "type": "post",
    "url": "/:base/projects",
    "title": "Create project",
    "name": "CreateProject",
    "group": "Projects",
    "description": "<p>Starts a new project with user as owner.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "project_name",
            "description": "<p>(string) Unique new name - fails if name already exists</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "is_encrypted",
            "description": "<p>(boolean) Flag indicating project data (including project_name) is encrypted. Values are strings 'true', 'false', or case variations</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "timestamp",
            "description": "<p>(string) Project creation time - any format</p>"
          },
          {
            "group": "Parameter",
            "optional": true,
            "field": "salt",
            "description": "<p>(string) AES key generation salt, if required</p> <p>is_encrypted values are 'true', 'false' or case variations.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "delete",
    "url": "/:base/projects/:project",
    "title": "Delete project",
    "name": "DeleteProject",
    "group": "Projects",
    "description": "<p>Deletes a project and all its related data</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "get",
    "url": "/:base/projects/:project",
    "title": "Project properties",
    "name": "GetProject",
    "group": "Projects",
    "description": "<p>Returns parameters of a project</p>",
    "success": {
      "fields": {
        "string": [
          {
            "group": "string",
            "optional": false,
            "field": "owner",
            "description": "<p>Email of project owner</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "timestamp",
            "description": "<p>Project creation time</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "description",
            "description": "<p>Project description</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "salt",
            "description": "<p>Project aes key generation salt or empty string</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "authUsers",
            "description": "<p>Array of other users authorized for project and their access level</p>"
          },
          {
            "group": "string",
            "optional": false,
            "field": "notifyTo",
            "description": "<p>Array of users to receive notifications of project messages</p>"
          }
        ],
        "boolean": [
          {
            "group": "boolean",
            "optional": false,
            "field": "encrypted",
            "description": "<p>Flag indicating if project is encrypted</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response - non-shared project",
          "content": "{ 'SR_status': 'OK', 'owner': (string), 'timestamp': (string), 'description': (string), 'encrypted': (boolean), 'salt': (string) }",
          "type": "json"
        },
        {
          "title": "Success-Response - shared project",
          "content": "{ 'SR_status': 'OK', 'owner': (string), 'authUsers': [{email:(string), access:(string)},...], 'notifyTo': [(string), ...], 'timestamp': (string), 'description': (string), 'encrypted': (boolean), 'salt': (string) }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "get",
    "url": "/:base/projects",
    "title": "Projects owned by user",
    "name": "GetProjects",
    "group": "Projects",
    "description": "<p>Returns array of projects owned by the user. Array elements are tuples containing name, flag indicating if project is encrypted, and AES key generation salt (empty string for openssl format).</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'projects': [[(string),(boolean),(string)],...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "get",
    "url": "/:base/projects-share/:user",
    "title": "Projects shared by another user",
    "name": "GetProjectsShare",
    "group": "Projects",
    "description": "<p>Returns array of projects owned by another user that are shared to authenticating user.  The :owner parameter is the email of owner. Array elements are tuples containing name, flag indicating if project is encrypted, and AES key generation salt (empty string if none). This is mainly used to determine the encrypted project name corresponding to a plaintext name.</p>",
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{ 'SR_status': 'OK', 'projects': [[(string),(boolean),(string)],...] }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/description",
    "title": "Project description",
    "name": "ProjectDescription",
    "group": "Projects",
    "description": "<p>Updates the description of a project.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "description",
            "description": "<p>(string)</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/notify",
    "title": "Project notifications",
    "name": "ProjectNotifications",
    "group": "Projects",
    "description": "<p>Updates the notification subscribers of a project</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "nickname",
            "description": "<p>(string) Project nickname displayed in notifications</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "action",
            "description": "<p>(string='on','off') Turn notification on or off</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  },
  {
    "type": "put",
    "url": "/:base/projects/:project/share",
    "title": "Project sharing",
    "name": "ShareProject",
    "group": "Projects",
    "description": "<p>Updates the authorized users of a project. When adding a user the access level determines the actions permitted for the user. 'read' does not allow creating jobs in the project or replying to messages. 'reply' adds permission to reply to messages for any job in the project. 'write' adds permission to create or delete jobs.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "optional": false,
            "field": "email",
            "description": "<p>(string)</p>"
          },
          {
            "group": "Parameter",
            "optional": false,
            "field": "action",
            "description": "<p>(string = 'add', 'remove')</p>"
          },
          {
            "group": "Parameter",
            "optional": true,
            "field": "access",
            "description": "<p>(string ='read', 'reply', 'write') Permission when adding a user</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response",
          "content": "{'SR_status': 'OK'}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "app/routes/api/api.server.routes.js",
    "groupTitle": "Projects"
  }
] });
