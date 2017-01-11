# -*- coding: utf-8 -*-

#
# Python 2.7 utilities for Scriptremote, Version 1.0.2
#
# Dependencies: urllib2, hashlib, hmac, requests, pycrypto, passlib
#
# Set environment variable SRSERVER to the protocol (http or https)
# domain or IP (and port if not 80 or 443) of your server. If the
# script will run behind a proxy server you also may need to set the
# HTTP_PROXY or HTTPS_PROXY environment variable.
#
import os
global sr_server
if 'SRSERVER' in os.environ:
    sr_server = os.environ['SRSERVER']
else:
    sr_server = 'https://scriptremote.com'

######################################################################
#
# SR_start(user_id, token, project_name, job_name, passphrase='', max_msgs=100)
#
# Starts job communication with the server. The parent project for the job will
# be created with name project_name if it does not already exist. user_id 
# and token may be obtained from the Settings main menu item of the website. 
# project_name and job_name are user-selected text strings(*). job_name does 
# not need to be unique since the server assigns a unique id to each job
# within a project.
#
# Parameter passphrase enables end-to-end script-browser encryption if it has
# a non-empty string value (*) - it will be used to generate the symetric encryption
# key. All user-defined data is encrypted before transmission to the server.
# The reply part, if any, of an outgoing message is both encrypted and 
# cryptographically signed.  Likewise any reply data received from the 
# server must have been encrypted and signed using the same passphrase.
#
# The passphrase for a project is fixed at the time the project is created.  
# If a later job attempts to use a different passphrase with the same project 
# name it will actually create a new project with the same plaintext name 
# but a different encrypted name in the server.
#
# max_msgs is the maximum number of messages per location to retain in the 
# server - the oldest messages will be deleted to stay within this limit.
#
# Returns a tuple [status, message] where status is SR_OK or SR_ERR. (***)
# If status is SR_ERR then string message returns an error message.
#
######################################################################
#
# SR_send(location_name, data_array=None, file_array=None, reply=False, 
#               reply_data_array=None, reply_timeout=600)
#
# Sends a message to the server. location_name is a
# user-selected text string(*). data_array is an array of name-value
# pairs {'name': name, 'value': value}, to include in the message,
# where name and value are user-selected text strings(*).
#
# file_array is an array of key-path file specifiers(**),
# {'key': key, 'path': path}, of files to attach to the message.
#
# If reply is True then reply_data_array can be an additional array
# of name-value pairs to include in the message and SR_send
# waits for a reply from the user before returning. The user
# can optionally modify the values for those pairs when sending
# the reply.
#
# Parameter reply_timeout is maximum time (in minutes)
# to wait for a reply - the default is 600. If reply_timeout 
# is exceeded SR_send returns with no modifications to data
# and tuple [SR_ERR, 'TIMEOUT']. In this case SR_clear should 
# be called to clear the status before continuing with the script.
#
# Return is a tuple [status, message] where status is SR_OK or SR_ERR. (***)
# If status is SR_ERR then string message returns an error message.
#
######################################################################
#
# SR_end
#
# Ends job communication - no more messages for the job are allowed.
#
# Returns a tuple [status, message] where status is SR_END or SR_ERR.
# If status is SR_ERR then string message returns an error message.
#
######################################################################
#
# Notes:
#
# (*) User-selected text strings consist of utf8-encoded or
#   unicode characters with these limitations:
#
#   1) project_name, location_name, and file_array key names
#   may not contain the slash (/) character.
#
#   2) The tilde (~) character has a special meaning
#   within <project_name> as indicating a shared project that
#   is owned by another user. A shared project reference consists
#   of the project name proper, followed by the owners email
#   address, separated by a tilde.
#
#   3) unicode type strings are converted to utf-8 before sending to
#   the server.
#   
# (**) File specifiers are used to send the contents of text or
# image files. The key part of a file specifier is a tag used to
# refer to the file and is independent of the actual file name. The 
# path part of the specifier is the path to the file. The supported 
# image types are '.svg' and '.png'. Files not having those extensions
# are assumed to be utf8-encoded text.
# 
# (***) An unsuccessful call causes a sticky error flag to be set
# and all succeeding calls will return immediately. Call SR_clear
# to clear the sticky flag.

######################################################################
#
# Example:
#
# import srio
# import os
# 
# srio.SR_start(os.environ['SRUSER'], os.environ['SRTOKEN'], 'myproject', 'myjob')
# 
# srio.SR_send('Location1', data_array=[{'a':'Hello world'}], reply=False)
# 
# my_reply_data = [{'b': 'Modify me'}]
# srio.SR_send('Location2', reply_data_array = my_reply_data, reply=True)
# 
# print my_reply_data[0]
#
# srio.SR_end()
# 
# 
######################################################################

import requests
import urllib2
import datetime
import json
import time
import base64
import hmac
import hashlib
import passlib
import passlib.utils
import passlib.utils.pbkdf2
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util import Counter
from Crypto.Hash import HMAC

SR_OK = 0
SR_ERR = 1
SR_END = 2

sr_userid = None
sr_token = None
sr_aeskey = None
sr_project = None
sr_project_encoded = None
sr_job = None
sr_jobid = None
sr_msgid = None
sr_location_map = {}
sr_status = None
sr_reply_data = []
sr_agent = 'ScriptRemote'
sr_api_url = sr_server + '/api'

#
# Wrapper for requests lib calls.
# rtype is expected return type: 'text', 'binary', 'json'
# 'json' is default, 'text' and 'binary' are mainly for testing.
# 'text' should only be used for GET's of text or svg files.
# 'binary' should only be used for GET's of png files.
# Return:
# {SR_OK, json} if successful json
# {SR_OK, text} if successful text
# {SR_OK, encoded_binary} if successful binary
# {SR_ERR, error_message} if error
#
def do_request(url, method, data=None, files=None, timeout=None, rtype='json'):

    global sr_userid, sr_token

    auth = (sr_userid, sr_token)
    headers = {'user-agent': sr_agent}
    r = None
    try:
        if method == 'get':
            stream = True
            if rtype == 'json':
                stream = False

            if timeout == None: 
                r=requests.get(url, auth=auth, headers=headers, stream=stream);
            else:
                r=requests.get(url, auth=auth, headers=headers, timeout=timeout, stream=stream)

        elif method == 'post':
            if files == None:
                r=requests.post(url, data=data, auth=auth, headers=headers);
            else:
                r=requests.post(url, data=data, files=files, auth=auth, headers=headers)

        elif method == 'put':
            r=requests.put(url, data=data, auth=auth, headers=headers)

        elif method == 'delete':
            r=requests.delete(url, auth=auth, headers=headers)

        else:
            return (SR_ERR, 'REQUEST ERROR')

    except 'Timeout': 
        return (SR_ERR, 'TIMEOUT')

    except Exception as e:
        if (r != None) and (r.status_code != 200):
            return (SR_ERR, 'REQUEST ERROR, STATUS CODE ' + str(r.status_code) + ',' + str(r.text))
        else:
            return (SR_ERR, 'REQUEST ERROR, ' + str(e))

    if (method == 'get'):
        headers = r.headers
        if (rtype == 'text'):
            if 'text' not in headers['Content-Type'] and 'svg' not in headers['Content-Type']:
                return (SR_ERR, 'REQUEST ERROR, CONTENT: ' + str(headers['Content-Type']))
            text = ''
            for chunk in r.iter_content():
                text += chunk
            return (SR_OK, text)

        elif (rtype == 'binary'):
            if 'png' not in headers['Content-Type']:
                return (SR_ERR, 'REQUEST ERROR, CONTENT: ' + str(headers['Content-Type']))
            bin = ''
            for chunk in r.iter_content():
                bin += chunk
            return (SR_OK, bin)

        else:
            if 'json' not in headers['Content-Type']:
                return (SR_ERR, 'REQUEST ERROR, CONTENT: ' + str(headers['Content-Type']))

    try:
        response = r.json();
    except:
        if (r != None) and (r.status_code != 200):
            return (SR_ERR, 'REQUEST ERROR, STATUS CODE ' + str(r.status_code) + ',' + str(r.text))
        else:
            return (SR_ERR, 'REQUEST ERROR, JSON DECODE')

    if not 'SR_status' in response:
        return (SR_ERR, 'SERVER ERROR')
    else:
        status = response['SR_status']

    if status != 'OK':
        return (SR_ERR, 'ERROR: ' + status)
    else:
        return (SR_OK, response)


#
# SR_start
#
def SR_start(user_id, token, project_name, job_name, passphrase='', max_msgs=100):

    global sr_status, sr_api_url, sr_userid, sr_token, sr_project, sr_project_encoded, sr_job, sr_jobid, sr_passphrase, sr_aeskey

    sr_userid = user_id
    sr_token = token
    sr_aeskey = None
    sr_passphrase = None
    sr_project = None
    sr_project_encoded = None
    sr_job = None
    sr_jobid = None
    sr_msgid = None
    sr_location_map = {}
    sr_status = None
    sr_reply_data = []

    if ((type(project_name) != str) and (type(project_name) != unicode)):
        sr_status = (SR_ERR, 'ERROR: INVALID PROJECT NAME TYPE')
        print sr_status[1]
        return sr_status
    if '/' in project_name:
        sr_status = (SR_ERR, 'ERROR: SLASH IN PROJECT NAME')
        print sr_status[1]
        return sr_status
    if (type(project_name) == unicode):
        project_name = project_name.encode('utf8')
    sr_project = project_name

    if ((type(job_name) != str) and (type(job_name) != unicode)):
        sr_status = (SR_ERR, 'ERROR: INVALID JOB NAME TYPE')
        print sr_status[1]
        return sr_status
    if (type(job_name) == unicode):
        job_name = job_name.encode('utf8')
    sr_job = job_name

    if passphrase != '':
        if ((type(passphrase) != str) and (type(passphrase) != unicode)):
            sr_status = (SR_ERR, 'ERROR: INVALID PASSPHRASE TYPE')
            print sr_status[1]
            return sr_status
        if (type(passphrase) == unicode):
            passphrase = passphrase.encode('utf8')
        sr_passphrase = passphrase
    else:
        sr_passphrase = None

    #
    # Get existing user projects
    #
    url=sr_api_url + '/projects'
    result = do_request(url, 'get')
    if result[0] == SR_ERR:
        sr_status = result
        print sr_status[1]
        return sr_status

    response = result[1]
    projects = response['projects']
    new_project = True
    salt = None
    for i in range(len(projects)):
        project = projects[i]
        name = project[0]
        if (type(name) == unicode):
            name = name.encode('utf8')
        encrypted = project[1]
        if encrypted and sr_passphrase:
            salt = project[2]
            if (type(salt) == unicode):
                salt = salt.encode('utf8')
            compute_aeskey(salt)
            plain_name = decrypt_var(name)
        elif (encrypted and not sr_passphrase) or (not encrypted and sr_passphrase):
            plain_name = ''
        else:
            plain_name = name

        if plain_name == sr_project:
            # Got a match to existing project
            new_project = False
            # Encoded project name is used in url's
            sr_project_encoded = urllib2.quote(name);
            is_encrypted = encrypted
            break

    if new_project:
        # No match to owned project - check for shared project
        if '~' in sr_project:
            indx = sr_project.find('~')
            email = sr_project[indx+1:]
            email_encoded = urllib2.quote(email)
            plain_name = sr_project[:indx]
            url=sr_api_url + '/projects-share/' + email_encoded
            result = do_request(url, 'get')
            if result[0] == SR_OK:
                response = result[1]
                projects = response['projects']
                for i in range(len(projects)):
                    project = projects[i]
                    res_name = project[0]
                    if (type(res_name) == unicode):
                        res_name = res_name.encode('utf8')
                    encrypted = project[1]
                    if encrypted and sr_passphrase:
                        salt = project[2]
                        if (type(salt) == unicode):
                            salt = salt.encode('utf8')
                        compute_aeskey(salt)
                        name = decrypt_var(res_name)
                    elif (encrypted and not sr_passphrase) or (not encrypted and sr_passphrase):
                        name = ''
                    else:
                        name = res_name

                    if name == plain_name:
                        # Got a match to existing project
                        new_project = False
                        # Encoded project name is used in url's
                        sr_project_encoded = urllib2.quote(res_name + '~' + email);
                        is_encrypted = encrypted
                        break

            else:
                sr_status = result
                print sr_status[1]
                return sr_status

            if new_project:
                sr_status = (SR_ERR, 'ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION')
                print sr_status[1]
                return sr_status

            url=sr_api_url + '/projects/' + sr_project_encoded
            result = do_request(url, 'get')
            if result[0] == SR_ERR:
                sr_status = result
                print sr_status[1]
                return sr_status

    if new_project:
        # Create new project
        project = sr_project
        is_encrypted = False
        salt = ''
        if sr_passphrase:
            # Generate new encryption key and save salt
            salt = compute_aeskey()
            # Encrypt project name
            project = encrypt_var(project)
            is_encrypted = True

        sr_project_encoded = urllib2.quote(project);
        if 'SRTESTMODE' in os.environ and os.environ['SRTESTMODE']:
            f = open('srio.project_encoded', 'w')
            f.write(sr_project_encoded)
            f.close()

        ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
        data = {'project_name': project, 'timestamp': ts, 'is_encrypted': is_encrypted, 'salt': salt}
        url=sr_api_url + '/projects'
        result = do_request(url, 'post', data=data)
        if result[0] == SR_ERR:
            sr_status = result
            print sr_status[1]
            return sr_status

    elif sr_passphrase and not is_encrypted:
        sr_status = (SR_ERR, 'ERROR: PASSPHRASE PROVIDED BUT PROJECT IS NOT ENCRYPTED')
        print sr_status[1]
        return sr_status


    # Start job
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    job = sr_job
    if sr_passphrase:
        job = encrypt_var(job)
    data = {'job_name': job, 'timestamp': ts, 'max_msgs': max_msgs}
    url=sr_api_url + '/projects/' + sr_project_encoded + '/jobs'
    result = do_request(url, 'post', data=data)
    if result[0] == SR_ERR:
        sr_status = result
        print sr_status[1]
        return sr_status

    response = result[1]
    sr_jobid = response['job']
    if 'SRTESTMODE' in os.environ and os.environ['SRTESTMODE']:
        f = open('srio.jobid', 'w')
        f.write(sr_jobid)
        f.close()

    sr_status = (SR_OK, '')
    return sr_status


#
# SR_send
#
def SR_send(location_name, data_array=None, file_array=None, reply=False, reply_data_array=None, reply_timeout=600):

    global sr_status, sr_api_url, sr_userid, sr_token, sr_project, sr_project_encoded, sr_job, sr_jobid, sr_msgid, sr_location_map, sr_passphrase, sr_aeskey, sr_reply_data

    if sr_status[0] != SR_OK:
        print sr_status[1]
        return sr_status
    if sr_userid == None:
        sr_status = (SR_ERR, 'ERROR: JOB NOT STARTED')
        print sr_status[1]
        return sr_status

    if (type(location_name) != str) and (type(location_name) != unicode):
        sr_status = (SR_ERR, 'ERROR: INVALID LOCATION NAME TYPE')
        print sr_status[1]
        return sr_status
    if '/' in location_name:
        sr_status = (SR_ERR, 'ERROR: SLASH IN LOCATION NAME')
        print sr_status[1]
        return sr_status
    if (type(location_name) == unicode):
        location_name = location_name.encode('utf8')

    if (data_array != None) and (type(data_array) != list):
        sr_status = (SR_ERR, 'ERROR: INVALID DATA ARRAY TYPE')
        print sr_status[1]
        return sr_status
    if (reply_data_array != None) and (type(reply_data_array) != list):
        sr_status = (SR_ERR, 'ERROR: INVALID REPLY DATA ARRAY TYPE')
        print sr_status[1]
        return sr_status
    if (file_array != None) and (type(file_array) != list):
        sr_status = (SR_ERR, 'ERROR: INVALID FILE ARRAY TYPE')
        print sr_status[1]
        return sr_status

    if location_name in sr_location_map:
        location_encoded = sr_location_map[location_name]
    else:
        location = location_name
        # Encrypt location name if needed, base64 output.
        # The url uses the encrypted value and and re-encrypting
        # would not produce the same result so sr_location_map
        # saves it to use for later SR_send calls to
        # same location.
        if sr_passphrase:
            location = encrypt_var(location)
        location_encoded = urllib2.quote(location)
        sr_location_map[location_name] = location_encoded

    if 'SRTESTMODE' in os.environ and os.environ['SRTESTMODE']:
        f = open('srio.loc_encoded', 'w')
        f.write(location_encoded)
        f.close()


    # Scan data to build outgoing json content
    jvalues = "{}"
    if data_array != None:
        content = []
        for i in range(len(data_array)):
            entry = data_array[i]
            if ((type(entry) != dict) or ('name' not in entry) or ('value' not in entry)):
                sr_status = (SR_ERR, 'ERROR: INVALID DATA TYPE')
                print sr_status[1]
                return sr_status
            name = entry['name']
            value = entry['value']
            if ((type(name) != str) and (type(name) != unicode)) or ((type(value) != str) and (type(value) != unicode)):
                sr_status = (SR_ERR, 'ERROR: INVALID DATA TYPE')
                print sr_status[1]
                return sr_status
            if (type(name) == unicode):
                name = name.encode('utf8')
            if (type(value) == unicode):
                value = value.encode('utf8')
            if sr_passphrase:
                name = encrypt_var(name)
                value = encrypt_var(value)
            content.append({'name': name, 'value': value})

        try:
            jvalues = json.dumps(content)
        except:
            sr_status = (SR_ERR, 'ERROR: JSON')
            print sr_status[1]
            return sr_status

    # Build outgoing json reply content
    reply_jvalues = "{}"

    if (reply):
        reply_content = []
        msg_concat = ''
        for i in range(len(reply_data_array)):
            entry = reply_data_array[i]
            if ((type(entry) != dict) or ('name' not in entry) or ('value' not in entry)):
                sr_status = (SR_ERR, 'ERROR: INVALID REPLY DATA TYPE')
                print sr_status[1]
                return sr_status
            name = entry['name']
            value = entry['value']
            if ((type(name) != str) and (type(name) != unicode)) or ((type(value) != str) and (type(value) != unicode)):
                sr_status = (SR_ERR, 'ERROR: INVALID REPLY DATA TYPE')
                print sr_status[1]
                return sr_status
            if (type(name) == unicode):
                name = name.encode('utf8')
            if (type(value) == unicode):
                value = value.encode('utf8')

            if sr_passphrase:
                name = encrypt_var(name)
                value = encrypt_var(value)
                msg_concat = msg_concat + name + value

            reply_content.append({'name': name, 'value': value})

        if sr_passphrase:
            # Calculate reply message hmac and append to array
            hmac = hmac_var(sr_passphrase, msg_concat)
            reply_content.append({'name': 'hmac', 'value': hmac})

        try:
            reply_jvalues = json.dumps(reply_content)
        except:
            sr_status = (SR_ERR, 'ERROR: JSON')
            print sr_status[1]
            return sr_status
        

    # Send non-file message data to server
    is_reply = 'false'
    if reply:
        is_reply = 'true'

    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    data = {'content': jvalues, 'is_reply': is_reply, 'reply_content': reply_jvalues, 'timestamp': ts}
    url = sr_api_url + '/projects/' + sr_project_encoded + '/jobs/' + sr_jobid + '/locations/' + location_encoded + '/msgs' 
    result = do_request(url, 'post', data)
    if result[0] == SR_ERR:
        print sr_status[1]
        sr_status = result
        return sr_status
    else:
        response = result[1]
        sr_msgid = response['message'] 
        if 'SRTESTMODE' in os.environ and os.environ['SRTESTMODE']:
            f = open('srio.msgid', 'w')
            f.write(sr_msgid)
            f.close()


    # Process file uploads
    if file_array != None:
        keysSeen = {}
        for i in range(len(file_array)):
            entry = file_array[i]
            if ((type(entry) != dict) or ('key' not in entry) or ('path' not in entry)):
                sr_status = (SR_ERR, 'ERROR: INVALID FILE ARRAY ELEMENT')
                print sr_status[1]
                return sr_status
            key = entry['key']
            path = entry['path']
            if ((type(key) != str) and (type(key) != unicode)) or ((type(path) != str) and (type(path) != unicode)):
                sr_status = (SR_ERR, 'ERROR: INVALID FILE ARRAY ELEMENT TYPE')
                print sr_status[1]
                return sr_status
            if '/' in key:
                sr_status = (SR_ERR, 'ERROR: SLASH IN FILE KEY')
                print sr_status[1]
                return sr_status
            if (type(key) == unicode):
                key = key.encode('utf8')
            if key in keysSeen:
                sr_status = (SR_ERR, 'ERROR: DUPLICATE FILE KEY')
                print sr_status[1]
                return sr_status
            else:
                keysSeen[key] = 1

            split = os.path.splitext(path)
            encrypted = 'false'
            if split[1] == '.png':
                file_type = 'image/png'
                try:
                    with open(path, 'rb') as f:
                        if sr_passphrase:
                            data = encrypt_var(f.read())
                            key = encrypt_var(key)
                            encrypted = 'true'
                        else:
                            data = base64.b64encode(f.read())
                except:
                    sr_status = (SR_ERR, 'ERROR: READING ' + path)
                    print sr_status[1]
                    return sr_status

                files = {'file': (path, data, file_type)}

            elif split[1] == '.svg':
                file_type = 'image/svg+xml'
                try:
                    with open(path, 'rb') as f:
                        if sr_passphrase:
                            data = encrypt_var(f.read())
                            key = encrypt_var(key)
                            encrypted = 'true'
                        else:
                            data = f.read()
                except:
                    sr_status = (SR_ERR, 'ERROR: READING ' + path)
                    print sr_status[1]
                    return sr_status

                files = {'file': (path, data, file_type)}

            else:
                file_type = 'text/plain'
                try:
                    with open(path, 'rb') as f:
                        if sr_passphrase:
                            data = encrypt_var(f.read())
                            key = encrypt_var(key)
                            encrypted = 'true'
                        else:
                            data = f.read()
                except:
                    sr_status = (SR_ERR, 'ERROR: READING ' + path)
                    print sr_status[1]
                    return sr_status

                files = {'file': (path, data, file_type)}

            data = {'file_key': key, 'encrypted': encrypted}
            url = sr_api_url + '/projects/' + sr_project_encoded + '/jobs/' + sr_jobid + '/locations/' + location_encoded + '/msgs/' + sr_msgid + '/files'
            result = do_request(url, 'post', data=data, files=files)
            if result[0] == SR_ERR:
                sr_status = result
                print sr_status[1]
                return sr_status

        
    # All done if no reply needed
    if not reply:
        sr_status = (SR_OK, '')
        return sr_status

    start_time = time.time()
    current_time = start_time
    timeout = 60*reply_timeout

    reply_sleep = 1
    sleep1 = 60*reply_sleep
    #
    # Wait for a reply until timeout is reached. Using 
    # long-polling so the loop is for fallback if the 
    # connection dies before reply is sent.
    #
    while (current_time - start_time < timeout):

        url = sr_api_url + '/projects/' + sr_project_encoded + '/jobs/' + sr_jobid + '/locations/' + location_encoded + '/msgs/' + sr_msgid + '/reply'
        result = do_request(url, 'get', timeout=timeout)

        if result[0] == SR_OK:
            # Got a reply
            response = result[1]
            reply_content = json.loads(response['reply_content'])
            expected_len = len(reply_data_array)
            if sr_passphrase:
                # +1 for hmac
                expected_len +=1
            if len(reply_content) != expected_len:
                sr_status = (SR_ERR, 'ERROR: REPLY DATA LENGTH MISMATCH')
                print sr_status[1]
                return sr_status

            msg_concat = ''
            for i in range(len(reply_content)):
                new_entry = reply_content[i]
                if ((type(new_entry) != dict) or ('name' not in new_entry) or ('value' not in new_entry)):
                    sr_status = (SR_ERR, 'ERROR: INVALID REPLY DATA TYPE')
                    print sr_status[1]
                    return sr_status
                new_name = new_entry['name']
                new_value = new_entry['value']
                if ((type(new_name) != str) and (type(new_name) != unicode)) or ((type(new_value) != str) and (type(new_value) != unicode)):
                    sr_status = (SR_ERR, 'ERROR: INVALID REPLY DATA TYPE')
                    print sr_status[1]
                    return sr_status

                if sr_passphrase:
                    # Check in case json.loads() outputs unicode -
                    # encrypt/decrypt is done on utf8
                    if (type(new_name) == unicode):
                        new_name = new_name.encode('utf8')
                    if (type(new_value) == unicode):
                        new_value = new_value.encode('utf8')

                    # Concatentate encrypted content for hmac check
                    if i < len(reply_content) - 1:
                        msg_concat += new_name + new_value
                        new_name = decrypt_var(new_name)
                        new_value = decrypt_var(new_value)
                    else:
                        remote_hmac = new_value

                if (not sr_passphrase or (i < len(reply_content) - 1)):

                    # Update reply_data_array value, keeping original type
                    prev_entry = reply_data_array[i]
                    prev_name = prev_entry['name']

                    if (type(prev_name) == str):
                        if (type(new_name) != str):
                            new_name = str(new_name)
                            new_value = str(new_value)
                    elif (type(prev_name) == unicode):
                        if (type(new_name) != unicode):
                            new_name = unicode(new_name)
                            new_value = unicode(new_value)

                    if new_name != prev_name:
                        sr_status = (SR_ERR, 'ERROR: REPLY DATA NAME MISMATCH')
                        print sr_status[1]
                        return sr_status

                    prev_entry['value'] = new_value

            if sr_passphrase:
                # Confirm message authentication
                hmac = hmac_var(sr_passphrase, msg_concat)
                if hmac != remote_hmac:
                    sr_reply_data = []
                    sr_status = (SR_ERR, 'ERROR: REPLY FAILS AUTHENTICATION')
                    print sr_status[1]
                    return sr_status

            # Reply successful, send acknowleggement
            url = sr_api_url + '/projects/' + sr_project_encoded + '/jobs/' + sr_jobid + '/locations/' + location_encoded + '/msgs/' + sr_msgid + '/reply_ack'
            result = do_request(url, 'put')

            if result[0] == SR_ERR:
                sr_status = result
                print sr_status[1]
                return sr_status

            # All done
            sr_status = (SR_OK, '')
            return sr_status

        elif (result[0] == SR_ERR) and (result[1] == 'TIMEOUT'):
            break

        prev_time = current_time
        current_time = time.time()

        # Rate limit requests if connection dies before min elapsed time
        if (current_time - prev_time < sleep1):
            time.sleep(sleep1)
            current_time = time.time()

    # Dropped out of loop because of timeout
    sr_status = (SR_ERR, 'REPLY TIMEOUT')
    print sr_status[1]
    return sr_status


#
# SR_clear
#
def SR_clear():
    global sr_status

    if sr_status[0] == SR_END:
        print sr_status[1]
        return sr_status

    sr_status = (SR_OK, '')

    
#
# SR_end
#
def SR_end():

    global sr_status, sr_api_url, sr_userid, sr_token, sr_project, sr_project_encoded, sr_job, sr_jobid, sr_passphrase

    if sr_userid == None:
        sr_status = (SR_ERR, 'ERROR: JOB NOT STARTED')
        print sr_status[1]
        return sr_status

    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    data = {'timestamp': ts}
    url = sr_api_url + '/projects/' + sr_project_encoded + '/jobs/' + sr_jobid + '/end'
    result = do_request(url, 'put', data=data)

    if result[0] == SR_ERR:
        sr_status = result
        print sr_status[1]
        return sr_status

    sr_status = (SR_END, 'JOB ENDED')
    print sr_status[1]
    return sr_status


#
# compute_aeskey
#
def compute_aeskey(salt = None):

    global sr_aeskey
    # Encryption is AES-256-CTR
    if not salt or (len(salt) == 0):
        salt = get_random_bytes(8)
        salt64 = base64.b64encode(salt, '+-')
    else:
        salt64 = salt
        dec = base64.b64decode(salt, '+-')
        buf = bytes(dec)
        salt = buf[0:8]

    # https://cryptosense.com/parameter-choice-for-pbkdf2
    sr_aeskey = passlib.utils.pbkdf2.pbkdf2(sr_passphrase, salt, 10000, keylen=32, prf='hmac-sha256')

    if 'SRTESTMODE' in os.environ and os.environ['SRTESTMODE']:
        f = open('srio.aeskey', 'w')
        f.write(sr_aeskey)
        f.close()

    return salt64

#
# encrypt_var
#
def encrypt_var(val):

    global sr_aeskey
    # Encryption is AES-256-CTR. Using 12-byte salt and
    # 4-byte counter to safely use a single key per project.
    # To prevent counter rollover val must be less than 64GB
    # which is still much larger than expected in practice.
    # http://crypto.stackexchange.com/questions/10044/aes-ctr-with-similar-ivs-and-same-key
    #
    salt = get_random_bytes(12)
    aes = AES.new(sr_aeskey, AES.MODE_CTR, counter=Counter.new(32, prefix=salt, initial_value=0))
    ciphertext = aes.encrypt(val)
    b64 = base64.b64encode(salt + ciphertext, '+-')
    return b64

#
# decrypt_var
#
def decrypt_var(val):

    global sr_aeskey
    try:
        dec = base64.b64decode(val, '+-')
        buf = bytes(dec)
        salt = buf[0:12]
        ciphertext = buf[12:]
        aes = AES.new(sr_aeskey, AES.MODE_CTR, counter=Counter.new(32, prefix=salt, initial_value=0))
        plaintext = aes.decrypt(ciphertext)
        return plaintext
    except:
        return ''

#
# hmac_var
#
def hmac_var(passphrase, val):

    message = bytes(val).encode('utf-8')
    secret = bytes(passphrase).encode('utf-8')
    mac = hmac.new(secret, message, digestmod=hashlib.sha256).hexdigest()
    return mac
