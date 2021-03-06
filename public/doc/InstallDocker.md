
<h2>
Installation On Docker
</h2>

<p>
This method installs ScriptRemote in a <a href="http://docker.com">Docker</a> 
container. It requires a MongoDB service to be available from another container or server.
It assumes that either TLS is not needed or it is handled by an
external proxy.

<ol>
<li>
<b>Copy environment file to Docker host</b>
<p>
You can 
<a href="https://github.com/jimb245/scriptremote/blob/master/public/docker/docker.env">download it</a>
from github using a browser or copy it from the demo website:
<pre>
>$ wget https://scriptremote.com/docker/docker.env
</pre>
</li>


<li>
<b>Set up credentials/secrets</b>
<p>
First set up an email forwarding account. This will be used to 
send security-related messages and user notifications.
Rather than using an existing account, you may want to create one 
just for this purpose.
Substitue your values for the <code>MAILER</code> dummy values
in <code>docker.env</code>.
<p>
Some services are stricter than others about relaying mail.
To help ensure that mail can be sent choose the same 
provider as expected for registered user emails, and set 
<code>MAILER_FROM</code> to the same address as <code>MAILER_EMAIL_ID</code>.
If users will have a variety of email providers then
consider using a service like mailgun.  Any mailing errors 
will be logged to the console.  If there is a problem it 
will probably first show up when registering the admin 
user below.
<p>
Secondly, generate a random string for the session middleware.
For example:
<pre>
>$ openssl rand -base64 32
</pre>

Substitute the result for the <code>SESSION_SECRET</code> value in 
<code>docker.env</code>
</li>
<br>

<li>
<b>Set up MongoDB service</b>
<p>
If no existing service is available create one and determine
its ip address on the default bridge network
<pre>
>$ docker run --name some-mongo -p 27017:27017 -d mongo
>$ docker network inspect bridge
</pre>
<p>
Modify the <code>MONGO_URL</code> environment value in
<code>docker.env</code> if necessary.
<p>
The simple Mongo install above does not persist data beyond
deletion of the container - a Docker Data Volume should be
used if persistence is required.
</li>
<br>

<li>
<b>Create ScriptRemote container</b>

<pre>
>$ docker run -p 3000:3000 --env-file docker.env -d jimb245/scriptremote
</pre>

This should start the server listening on the localhost and external interfaces.
Check that you can access the server with a browser.
<p>
A host port other than 3000 can be selected if necessary. To change the container
port you will need to copy the Dockerfile, modify the EXPOSE setting, and build a
new container. Then modify the <code>SRPORT</code> setting to match in 
<code>docker.env</code> before running.
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
Copy the API credentials obtained above to a machine in the private
network. Get the bash utility script <code>scriptremote/public/dist/srio.sh</code>.
You can 
<a href="https://github.com/jimb245/scriptremote/blob/master/public/dist/srio.sh">download it</a>
from github using a browser or copy it from the demo website:
<pre>
>$ wget https://scriptremote.com/dist/srio.sh
</pre>

Set <code>SRSERVER</code> to the url of your server, by editing the script
or as an environment variable. Be sure to include the protocol, <code>http</code>
or <code>https</code> in the url. If the script will run behind a web proxy it may
also be necessary to set the <code>http_proxy</code> or 
<code>HTTPS_PROXY</code> environment variable.

<p>
Create a simple test:

<pre>
>$ cat > test.sh
#!/bin/bash
. ./srio.sh
SR_start ${SRUSER} ${SRTOKEN} 'myproject' 'myjob'
SR_set 'msg1' 'Hello World' 'false'
SR_send 'mylocation'
SR_end
</pre>

Export the API credentials and run the test:

<pre>
>$ export SRUSER=&lt;your-userid&gt;
>$ export SRTOKEN=&lt;your-token&gt;
>$ bash test.sh
</pre>

Check that the test message can be viewed in the browser by
selecting <b>Projects</b> in the menu bar.
<p>
If the script fails with a certificate verification error
it may mean that there is no CA cert store available in the
test machine OS. In that case you would need to install
a root certificate.
</li>
<br>


<li>
<b>Optional: Create non-admin user</b>
<p>
Since the admin has elevated priviledges to do things
like viewing user details and registering new users, it is best
for security purposes to minimize use of that account.
Instead register as a normal user for actual projects.
This will require a different email address from the
one used to for the admin account.
</li>
<br>

<li>
<b>Optional: Enable project data limits</b>
<p>
You may want to enable limits on the amount of message data that can be
sent to the server, for example to help protect against scripting errors
that could produce very large or very many messages.
The available limits are defined in <code>scriptremote/config/env/all.js</code>.
Any of them may be set as environment variables in <code>docker.env</code> prior 
to starting the server.
</li>
<br>

</ol>

