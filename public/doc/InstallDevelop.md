
<div align="right" style="display:none">
<a href="/">Home</a>
</div>

<h2>
Installation For Development
</h2>

<ol>
<li>
<b>Install the MEAN-stack components nodejs/npm and mongodb</b>
<p>
<a href="https://nodejs.org/en">nodejs</a>
<br>
<a href="https://docs.mongodb.com/master/administration/install-community">Install MongoDB Community Edition</a>
<p>
Installation may require root access.
If the ScriptRemote server will use an existing, shared MongoDB service
then you will need to set
the <code>MONGO_URL</code> or <code>MONGO_HOST_PORT</code> environment variable 
(see <code>config/env/development.js</code>)
and you may need to add MongoDB credentials to the <code>.env</code> file
in Step 3.
<p>
Also if not already present install:
<ul>
<li><a href="https://git-scm.com">git</a></li>
<li><a href="http://gruntjs.com">grunt (install globally)</a></li>
</ul>
<p>
For bash testing install:
<ul>
<li><a href="https://curl.haxx.se">curl</a></li>
<li><a href="https://www.openssl.org/">openssl</a></li>
</ul>
<p>
For python2.7 testing install:
<ul>
<li><a href="https://pip.pypa.io/en/stable/installing">pip</a></li>
<li><a href="https://pypi.python.org/pypi/passlib">passlib</a></li>
<li><a href="https://pypi.python.org/pypi/pycrypto">pycrypto</a></li>
</ul>
</li>
<br>

<li>
<b>Clone ScriptRemote</b>
<p>
If you plan to contribute to the project then the clone would be from
your forked repo instead of scriptremote.

<pre>
>$ cd ~
>$ git clone https://github.com/jimb245/scriptremote | <your-fork>
>$ cd scriptremote
~$ cp npm-shrinkwrap-dev.json npm-shrinkwrap.json
>$ npm install
</pre>
</li>
<br>

<li>
<b>Set up credentials/secrets</b>
<p>
First set up an email forwarding account. This will be used to 
send various security-related messages and user notifications.
Copy the sample credentials file and substitue your values 
for the <code>MAILER</code> dummy values:

<pre>
>$ cp credentials.env .env
>$ chmod 600 .env
>$ vim .env
</pre>
<p>
Some services are stricter than others about relaying mail.
To help ensure that mail can be sent choose the same 
provider as expected for registered user emails, and set 
MAILER_FROM to the same address as MAILER_EMAIL_ID.
Any mailing errors will be logged to the console.  If 
there is a problem it will probably first show up when 
registering the admin user below.
<p>
Second, generate a random string for the session middleware.
For example:
<pre>
>$ openssl rand -base64 32
</pre>

Substitute the result for the <code>SESSION_SECRET</code> value in <code>.env</code>
</li>
<br>

<li>
<b>Test the server</b>

<pre>
>$ grunt development
</pre>

This should start the server listening on localhost:3000. Check that you can
access the site with a browser.
</li>
<br>

</ol>

<h3>
Code Organization
</h3>
<p>
Code organization is roughly similar to <a href="http://meanjs.org/docs/0.3.x">meanjs.org v0.3</a>.
<p>
Server code is in directory <code>app</code>. Registration, login, and password reset pages are handled by the server directly rather than by the Angular framework. The login page is compatible with password managers. The server template manager is <a href="http://handlebarsjs.com">handlebars</a> and the template layouts are in <code>app/views/layouts</code>, one for the server-managed pages and one for Angular. 
<p>
Public files are in directory <code>public</code>. The Angular-based code is in 
<code>public/modules</code>.  The bash and python script utilities and their tests are in 
<code>public/scripts</code>. Doc files other than <code>README.md</code> are in
<code>public/doc</code>.
<p>
Config files are located in <code>config/env</code>.
The server configuration is determined by the <code>NODE_ENV</code> environment
variable. The defined configuration values are:
<ul>
<li>development</li>
<li>test</li>
<li>production (http server)</li>
<li>secure (https server)</li>
<li>cloudfoundry (upload to platform)</li>
</ul>
<p>
The displayed release version is set in <code>config/env/all.js</code>. The 
<code>grunt build</code> task substitutes the version into files <code>package.json</code> and 
<code>public/dist/(srio.sh,srio.py)</code>.
It also renames files <code>application.min.js</code> and <code>application.min.css</code> in 
<code>public/dist</code> to include the version in the names.
<p>
The server startup files are server.js, and server_mod.js which returns a promise that
is useful in test initialization.
<P>
<h3>Grunt Tasks</h3>
<ul>
<li>
<b>Development server</b>
<p>
<pre> >$ grunt </pre>
<p>
Starts a server using the development configuration, on localhost:3000, mongo database <code>scriptremote-dev</code>, plus concurrent watch tasks.
<p>
<pre> >$ grunt development</pre>
<p>
Starts a server using the development configuration, on localhost:3000, mongo database <code>scriptremote-dev</code>, no concurrent tasks.
</li>

<li>
<b>Lint</b>
<p>
<pre> >$ grunt lint</pre>
<p>
Runs jshint, csslint
</li>

<li>
<b>Test</b>
<p>

<pre> >$ grunt testserver</pre>
<p>
Starts a server using the test configuration, on localhost:3000, mongo database <code>scriptremote-test</code>, no concurrent tasks.
<p>
<pre> >$ grunt test</pre>
<p> 
Runs all tests on localhost:3000, mongo database <code>scriptremote-test</code>
Requires pre-registration of admin user in the test database and setting 
environment variables <code>SRADMINEMAIL, SRADMINPASSWORD</code>.
<p>
There are ~400 unit tests, of four types:
<ul>
<li> Bash utility script tests based on bats</li>
<li> Python utility script tests based on nose</li>
<li> Angular client unit tests based on karma, jasmine, phantomjs</li>
<li> Server unit tests based on mocha, should, supertest</li>
</ul>
<p>
There is no automation of end-to-end testing yet.
</li>

<p>
<li>
<b>Build for release configurations (production, secure, cloudfoundry)</b>
<p>
<pre> >$ grunt build</pre>
<p>
Does compression, cache busting, string substitution, document generation, shrinkwrapping.
Outputs are in:
<ul>
<li><code>public/dist</code></li>
<li><code>public/doc</code></li>
<li><code>npm-shrinkwrap.json</code></li>
<li><code>npm-shrinkwrap-dev.json</code></li>
</ul>
</li>
</ul>

<b>Additional References:</b>
<p>
<a href="http://meanjs.org">MEAN.JS</a>
<br>
<a href="http://mean.io">MEAN.IO</a>
<br>
<a href="https://www.sitepoint.com/introduction-mean-stack">An Introduction To The MEAN Stack</a>

