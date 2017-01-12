
<h2>
Installation On DigitalOcean Ubuntu 14.04 Droplet
</h2>

<p>
<a href="http://digitalocean.com">DigitalOcean</a> is a provider of VPS services.
For small applications the server can run on a single Droplet.
The references at the end provide some pointers for setting up
production installations. 
<p>
Since the website will be public it will use a free 
<a href="https://letsencrypt.org">Lets Encrypt</a> certificate to secure the traffic.
DigitalOcean does not provide public domain names for Droplets so 
you will need to own or register a domain for the certificate.
</p>

<ol>
<li>
<b>Create a <a href="http://digitalocean.com">DigitalOcean</a> account if you do not already have one.</b>
</li>
<br>

<li>
<b>Create a MEAN droplet as described in:</b>
<p>
<a href="https://www.digitalocean.com/community/tutorials/how-to-use-the-mean-one-click-install-image">How To Use the MEAN One-Click Install Image</a>
<p>
<b>NOTE:</b> To avoid install problems it's best to choose a <b>1GB</b> or larger droplet.
<p>
Try the sample application if desired but skim over the later sections on developing and deploying your own application.
</li>
<br>

<li>
<b>Do recommended server setup as described in:</b>
<p>
a) <a href="https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-14-04"> Initial Server Setup with Ubuntu 14.04</a>
<p>
b) <a href="https://www.digitalocean.com/community/tutorials/additional-recommended-steps-for-new-ubuntu-14-04-servers">Additional Recommended Steps for New Ubuntu 14.04 Servers</a>
<p>
When setting up a firewall as described in b), be sure to allow access on ports 80, 443, and 25.
</li>
<br>

<li>
<b>Install ScriptRemote</b>
<p>
Connect to the droplet as the non-root user created in step 3, then:

<pre>
>$ cd ~ (or your preferred install location)
>$ npm install scriptremote --production
>$ mv node_modules/scriptremote .
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
Then copy the sample credentials file and substitue your values 
for the <code>MAILER</code> dummy values:
<p>
<pre>
>$ cd ~/scriptremote
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
Secondly, generate a random string for the session middleware.
For example:
<pre>
>$ openssl rand -base64 32
</pre>

Substitute the result for the SESSION_SECRET value in .env
</li>
<br>

<li>
<b>Make it possible to run node as non-root</b>
<pre>
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/nodejs
</pre>
</li>
<br>

<li>
<b>Test the server</b>

<pre>
>$ cd ~/scriptremote
>$ npm run production
</pre>

This should start the server listening on port 80. Check that you can
access the site with a browser by entering http://&lt;droplet-ip&gt;
<p>
Use ctrl-c to terminate the server when done.
</li>
<br>

<li>
<b>Set up domain DNS records</b> 
<p>
Use the controls panels at your domain registrar and at Digital Ocean 
to set up DNS records for your domain, as described in:
<p>
<a href="https://www.digitalocean.com/community/tutorials/how-to-set-up-a-host-name-with-digitalocean">How To Set Up a Hostname with Digital Ocean</a>
<p>
Allow time for the changes to propagate. The ping and dig commands can be used to check
DNS and reverse DNS lookup are working.
</li>
<br>


<li>
<b>Test the domain</b>
<p>
Start the server and check that you can access the site by entering http://&lt;your-domain&gt;
<p>
Use ctrl-c to terminate the server when done.
</li>
<br>

<li>
<b>Create a certificate</b>
<p>
First install the letsencrypt client:

<pre>
>$ cd ~
>$ git clone https://github.com/letsencrypt/letsencrypt
>$ cd letsencrypt
>$ ./letsencrypt-auto --help
</pre>

Create the certificate and copy the key files to server directory:

<pre>
>$ mkdir ~/scriptremote/config/sslcerts
>$ sudo -s
>$ ./letsencrypt-auto certonly --standalone -d &lt;your-domain&gt; -d <www.your-domain>
>$ cp /etc/letsencrypt/live/&lt;your-domain&gt;/fullchain.pem ~/scriptremote/config/sslcerts
>$ cp /etc/letsencrypt/live/&lt;your-domain&gt;/privkey.pem ~/scriptremote/config/sslcerts
>$ chown &lt;your-user:your-user&gt; ~/scriptremote/config/sslcerts/*
>$ ctrl-d
>$ chmod 600 ~/scriptremote/config/sslcerts/*
</pre>

The certificate will be valid for 90 days. It can be renewed within 30 days of
expiration by using the renew subcommand of letsencrypt-auto
</li>
<br>


<li>
<b>Test the certificate</b>

<pre>
>$ cd ~/scriptremote
>$ npm run secure
</pre>

This should start the server listening on port 443. Check that you can
access the site with a browser by entering https://&lt;your-domain&gt;

The 'https' in the url is required the first time a browser loads the site 
since there is no listener on http port 80. (Older browsers that do not support 
strict transport security will require the protocol to be specified every time.) 
<p>
Use ctrl-c to terminate the server when done.
</li>
<br>

<li>
<b>Make it possible to disconnect from the droplet without terminating the server</b>
<p>
There are various ways to do this. Here we use the 'screen' terminal multiplexor,
which is already installed in the droplet.

<pre>
>$ screen
</pre>

This will start a new terminal window to use for the following steps.
</li>
<br>


<li>
<b>Start the server</b>

<pre>
>$ cd ~/scriptremote
>$ npm run secure
</pre>
</li>
<br>

<li>
<b>Check that the mongo database is still clean</b>

<pre>
>$ mongo scriptremote
>$ show collections
</pre>

If there are collections listed other than system.indexes, sessions, or 
startup_log then remove them and also sessions, using:
<pre>
>$ db.&lt;collection&gt;.drop()
</pre>
</li>
<br>

<li>
<b>Register the admin user</b>
<p>
In the browser select <b>Login/Register</b> on the home screen and then
<b>Register Here</b> on the login screen. The registration screen should
display a message that the admin account is being registered. 
<p>
Continue the registration by entering at least an email and password,
and by selecting one of the options for registration of other users. The
default is to allow other users to register themselves. You can also
select a timeout for idle sessions.
<p>
A confirmation email should be sent to the registered address.
Complete the registration by clicking the link in the email or
by submitting the token value from the email into the form
displayed when attempting to login.
<p>
Return to the home page and login using the admin account.
<p>
Get script credentials by selecting <b>Settings</b> in menu bar and
then selecting <b>Generate</b> in the <b>API Credentials</b> section. The
<b>User Id</b> and <b>Token</b> values will be needed to authenticate messages
to the server from scripts running in the private network.
</li>
<br>

<li>
<b>Check that the server can be reached from the private network</b>
<p>
Copy the API credentials obtained above to a machine in the private
network. Get the bash utility script <code>scriptremote/public/dist/srio.sh</code>.
You can copy it from the server installation or it may be easier to
<a href="https://github.com/jimb245/scriptremote/blob/master/public/dist/srio.sh">download it</a>
from github using a browser.
<p>
Set <code>SRSERVER</code> to the url of your server, by editing the script
or as an environment variable. If the script will run behind a web proxy it may
also be necessary to set the HTTPS_PROXY environment variable.

<pre>
>$ export SRSERVER=https://&lt;your-domain&gt;
</pre>

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
<b>Detach the screen window and logout from server
</b>
<p>
<pre>
>$ ctrl-a d
>$ exit
</pre>
</li>
<br>

<li>
<b>To return to the screen window later</b>
<p>
Connect to the droplet as the non-root user and use the screen command:

<pre>
>$ screen -ls
>$ screen -r &lt;screen-id&gt;
</pre>

If you need to scroll up in the window, the command to view the 
window's history buffer is:

<pre>
>$ crtl-a esc
</pre>

To exit the buffer type 'return' twice
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
<b>Server logging</b>
<p>
Logging of server responses is enabled by default. 
The log directory is ~/scriptremote/log. The log file format 
is 'Apache common'. It is recommended to monitor the logs
for signs of instrusion, such as an unknown source ip
successfully accessing an endpoint other than the
root or documentation.
</li>
</br>

<li>
<b>Optional: Enable MongoDB authentication</b>
<p>
For additional security you may want to enable authentication for
MongoDB. Without authentication anyone who manages to obtain user access to the
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
The available limits are defined in <code>scriptremote/config/env/all.js</code>.
Any of them may be set as environment variables or added to the .env file
prior to starting the server.
</li>
<br>

</ol>

<b>References:</b>
<p>
<a href="https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04">How To Set Up a Node.js Application for Production on Ubuntu 14.04</a>
<br>
<a href="https://www.digitalocean.com/community/tutorials/building-for-production-web-applications-overview"> Building for Production: Web Applications</a>
<br>
<a href="https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-using-iptables-on-ubuntu-14-04">How To Set Up a Firewall Using Iptables on Ubuntu 14.04</a>
