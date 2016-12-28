'use strict';

module.exports = {
	app: {
		title: 'ScriptRemote',
		description: 'Server providing messaging between scripts and browsers',
		keywords: 'MongoDB, Express, AngularJS, Node.js',
        version: '1.0.1'
	},
	sessionSecret: process.env.SESSION_SECRET,
	sessionCollection: 'sessions', // mongo sessions name

    mongoUser: process.env.MONGO_USER,
    mongoPassword: process.env.MONGO_PASSWORD,

    tokenLifetime: 15, // registration or password change token timeout, minutes

	mailer: {
		from: process.env.MAILER_FROM,
		options: {
			service: process.env.MAILER_SERVICE_PROVIDER,
            host: process.env.MAILER_SMTP_HOST,
            port: process.env.MAILER_SMTP_PORT,
            TLS: process.env.MAILER_SMTP_TLS,
			auth: {
				user: process.env.MAILER_EMAIL_ID,
				pass: process.env.MAILER_PASSWORD
			}
		}
	},

    limits: {
        // Optional limits on data usage
        maxUsers: process.env.SR_MAX_USERS,
        projectsPerUser: process.env.SR_PROJECTS_PER_USER,
        jobsPerProject: process.env.SR_JOBS_PER_PROJECT,
        locationsPerJob: process.env.SR_LOCATIONS_PER_JOB,
        messagesPerLocation: process.env.SR_MESSAGES_PER_LOCATION,
        // Message size limit in bytes - approximate, applies to 
        // encoded/uploaded data including attachments
        messageSize: process.env.SR_MESSAGE_SIZE,
        // Job message size limit in bytes -  approximate, applies to 
        // encoded/uploaded data including attachments. Limit may be 
        // overshot due to concurrent DB requests.
        messageSizeJob: process.env.SR_MESSAGE_SIZE_PER_JOB
    }
};
