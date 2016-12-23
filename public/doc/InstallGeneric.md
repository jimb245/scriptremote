
<div align="right" style="display:none">
<a href="/">Home</a>
</div>

<h2>
Installation On Generic Private Server
</h2>
<p>
This method assumes that browser or script clients that are outside the
private network will access the server using an existing VPN gateway.

<ol>
<li>
<b>Install MEAN-stack components nodejs/npm and mongodb on the server</b>
<p>
<a href="https://nodejs.org/en">nodejs</a>
<br>
<a href="https://docs.mongodb.com/master/administration/install-community">Install MongoDB Community Edition</a>
<p>
Also install <a href="https://git-scm.com">git </a>if not already present.
<p>
<p>
Installation may require root access.
If the ScriptRemote server needs to use an existing, networked MongoDB service
then the procedure below needs to be slightly modified. You will need to set
the <code>MONGO_URL</code> or <code>MONGO_HOST_PORT</code> environment variable (see config/env/production.js)
and you may need to add MongoDB credentials to the .env file.
</li>
<li>
<b>Clone ScriptRemote</b>
<p>
Login as a non-root user

<pre>
>$ cd ~
>$ git clone ...
>$ cd scriptremote
>$ npm install --production
</pre>
</li>
<br>

<li>
<b>Set up credentials/secrets</b>
<p>
First set up an email forwarding account. This will be used to 
send security-related messages and user notifications.
Rather than using an existing account, you may want to create one 
just for this purpose.
<p>
Then copy the sample credentials file and substitue your values 
for the MAILER dummy values:

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
If users will have a variety of email providers then
consider using a service like mailgun.  Any mailing errors 
will be logged to the console.  If there is a problem it 
will probably first show up when registering the admin 
user below.
<p>

Second, generate a random string for the session middleware.
For example:

<pre>
>$ openssl rand -base64 32
</pre>

Substitute the result for the SESSION_SECRET value in .env
</li>
<br>

<li>
<b>Make it possible to run node as non-root</b>
<p>
Skip this if root access is not possible

<pre>
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node
</pre>

</li>
<br>

<li>
<b>Start the server</b>

<pre>
>$ cd ~/scriptremote
</pre>

If root access is possible:

<pre>
>$ npm run production
</pre>

This should start the server listening on port 80. 
<p>
If root access is not possible:

<pre>
>$ export SRPORT=3000 
>$ npm run production
</pre>

This should start the server listening on port 3000, which
normally does not require root access.
</li>
<br>

<li>
<b>Register the admin user</b>
<p>
Connect to the server in your browser.
<p>
Select <b>Login/Register</b> on the home screen and then
<b>Register Here</b> on the login screen. The registration screen should
display a message that the admin account is being registered. 
<p>
Continue the registration by entering at least an email and password,
and by selecting one of the options for registration of other users. The
default is to allow other users to register themselves. You can also
select a timeout for idle sessions.
<p>
A confirmation email should be sent to the registered address.
Complete the registration by submitting the token value from the 
email into the form displayed when attempting to login.
<p>
Return to the home page and login using the admin account.
<p>
Get script credentials by selecting <b>Settings</b> in menu bar and
then selecting <b>Generate</b> in the <b>API Credentials</b> section. The
<b>User Id</b> and <b>Token</b> values will be needed to authenticate messages
to the server from scripts.
</li>
<br>


<li>
<b>Check that the server can be reached from the private network</b>
<p>
Copy the API credentials obtained above to a test machine,
then copy the bash utility script from the local scriptremote 
repository or download it:

<pre>
>$ wget https://scriptremote/dist/srio.sh
</pre>

Set <code>SRSERVER</code> to the IP address and port or url of your server, by editing the script
or as an environment variables. The protocol should be <code>http</code>. If there is a web proxy between the 
script and your server it may also be necesary to set the http_proxy environment variable.

<pre>
>$ export SRSERVER=&lt;your-url&gt;
</pre>

Create a simple test:

<pre>
>$ cat > test.sh
#!/bin/bash
. ./srio.sh
SR_start ${SRUSER} ${SRTOKEN} 'myproject' 'myjob'
SR_set 'msg1' 'Hello World' 'False'
SR_send 'mylocation'
SR_end
</pre>

Export the API credentials to the test script and run it:

<pre>
>$ export SRUSER=&lt;your-userid&gt;
>$ export SRTOKEN=&lt;your-token&gt;
>$ bash test.sh
</pre>

Check that the test message can be viewed in the browser by
selecting <b>Projects</b> in the menu bar.
</li>
<br>

<li>
<b>Create non-admin user</b>
<p>
Since the admin has elevated priviledges to do things
like viewing user details and registering new users, it is best
for security purposes to minimize use of that account.
Instead register as a normal user for actual projects.
</li>
<br>

<li>
<b>Optional: Enable MongoDB authentication</b>
<p>
If the ScriptRemote server is a shared system you may want to enable authentication for
MongoDB. Without authentication anyone with user access to the
system can also access the database.
MongoDB supports elaborate authentication/authorization schemes
but for simplicity the following just sets up a "root" user
with all access.
<p>
Create the user in the mongo shell:

<pre>
>$mongo
> use admin
> db.createUser(
>    {
>      user: "&lt;mongo-user&gt;",
>      pwd: "&lt;mongo-password&gt;",
>      roles: [ "root" ]
>    }
>)
>exit
</pre>

Then enable authentication in the mongo config file, which is often
located at /etc/mongod.conf. Depending on the file format add either:

<pre>
security:
  authorization: enabled
</pre>

or

<pre>
auth = true
</pre>

Then restart mongod:

<pre>
>$ sudo restart mongod
</pre>

Check that the credentials work in the mongo shell:

<pre>
>$ mongo -u "mongo-user" -p "mongo-password" --authenticationDatabase "admin"
</pre>

Edit the ~/scriptremote/.env file to uncomment the mongo credentials
and substitute your values, then restart the ScriptRemote server.
</li>
<br>

<li>
<b>Optional: Enable project data limits</b>
<p>
You may want to enable limits on the amount of message data that can be
sent to the server, for example to help protect against scripting errors
that could produce very large or very many messages.
The available limits are defined in <pre>config/env/all.js</pre>
Any of them may be set as environment variables or added to .env prior to starting
the server.
</li>
<br>
</ol>

<b>Additional References:</b>
<p>
<a href="https://www.sitepoint.com/introduction-mean-stack">An Introduction To The MEAN Stack</a>
<br>
<a href="http://meanjs.org">MEAN.JS</a>
<br>
<a href="http://mean.io">MEAN.IO</a>
<p>
