#
# Test Support Functions
#
import requests
import urllib2
import datetime
import json
import time
import base64

import srio

SR_OK = 0
SR_ERR = 1

#
# Outputs list of project names
#
def SR_get_projects():
    url = srio.sr_api_url + '/projects'
    result = srio.do_request(url, 'get')
    if result[0] == SR_ERR:
        sr_status = result
        return sr_status

    return result

#
# Outputs list of job ids for current project
#
def SR_get_jobs():
    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs'
    result = srio.do_request(url, 'get')
    if result[0] == SR_ERR:
        sr_status = result
        return sr_status

    if not srio.sr_passphrase:
        return result

    data = result[1]
    jobs = data[u'jobs']
    for i in range(len(jobs)):
        job = jobs[i]
        name = job[u'name']
        if isinstance(name, unicode):
            name = name.encode('utf8')
        plain_name = srio.decrypt_var(name)
        job[u'name'] = plain_name

    return result 

#
# Outputs list of locations for current job
#
def SR_get_locations():
    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs/' + srio.sr_jobid + '/locations'
    result = srio.do_request(url, 'get')
    
    return result

#
# Outputs a list of messages for a location in current job
#
def SR_get_msgs(location_name):
    loc_encoded=srio.SR_location_map[location_name]
    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs/' + srio.sr_jobid + '/locations/' + loc_encoded + '/msgs' 
    result = srio.do_request(url, 'get')
    
    return result

#
# SR_get_content(location_name, msg_id)
#
# Outputs the contents of a message in current job
#
def SR_get_content (location_name, msg_id):
    if isinstance(location_name, unicode):
        location_name = location_name.encode('utf8')
    loc_encoded=srio.sr_location_map[location_name]
    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs/' + srio.sr_jobid + '/locations/' + loc_encoded + '/msgs/' + msg_id 
    result = srio.do_request(url, 'get')

    if result[0] == SR_ERR:
        sr_status = result
        return sr_status

    if not srio.sr_passphrase:
        return result

    response = result[1]
    content = json.loads(response['content'])
    new_content = []
    for i in range(len(content)):
        entry = content[i]

        name = entry['name']
        if type(name) == unicode:
            name = name.encode('utf8')
        name = srio.decrypt_var(name)

        value = entry['value']
        if type(value) == unicode:
            value = value.encode('utf8')
        value = srio.decrypt_var(value)

        new_content.append({'name': name, 'value': value})

    response['content'] = json.dumps(new_content)

    if 'reply_content' in response:
        reply_content = json.loads(response['reply_content'])
        new_reply_content = []
        for i in range(len(reply_content)) -1:
            entry = reply_content[i]

            name = entry['name']
            if type(name) == unicode:
                name = name.encode('utf8')
            name = srio.decrypt_var(name)

            value = entry['value']
            if type(value) == unicode:
                value = value.encode('utf8')
            value = srio.decrypt_var(value)

            new_reply_content.append({'name': name, 'value': value})

        entry = reply_content[len(reply_content) - 1]
        new_reply_content.append(entry)
        response['reply_content'] = json.dumps(new_reply_content)

    return result

#
# SR_get_file(location_name, msg_id, file_key, output_file)
#
# Gets the contents of a file belonging to a message in current job
# and writes it to a file
#

def SR_get_file(location_name, msg_id, file_key, type, output_file):
    if isinstance(location_name, unicode):
        location_name = location_name.encode('utf8')
    loc_encoded=srio.sr_location_map[location_name]

    # To handle encryption case, download the key list
    # and decrypt them to look for match to the argument

    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs/' + srio.sr_jobid + '/locations/' + loc_encoded + '/msgs/' + msg_id + '/files'
    result1 = srio.do_request(url, 'get')

    if result1[0] == SR_ERR:
        sr_status = result1
        return sr_status

    if isinstance(file_key, unicode):
        file_key = file_key.encode('utf8')

    data = result1[1]
    keys = data[u'file_keys']
    match = False
    for i in range(len(keys)):
        key = keys[i]
        if isinstance(key, unicode):
            key = key.encode('utf8')
        plain_key = key
        if srio.sr_passphrase:
            plain_key = srio.decrypt_var(key)
        if plain_key == file_key:
            match = True
            break

    if match:
        key_encoded = urllib2.quote(key)
        url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs/' + srio.sr_jobid + '/locations/' + loc_encoded + '/msgs/' + msg_id + '/files/' + key_encoded
        result2 = srio.do_request(url, 'get', rtype=type)
        if result2[0] == SR_ERR:
            sr_status = result2
            return sr_status

        data = result2[1]
        if isinstance(data, unicode):
            data = data.encode('utf8')
        if srio.sr_passphrase:
            data = srio.decrypt_var(data)
        elif type == 'binary':
            data = base64.b64decode(data)
        f = open(output_file, 'w')
        f.write(str(data))
        f.close()
        return (SR_OK, '')

    return (SR_ERR, 'ERROR: FILE KEY NOT FOUND')

#
# Send a reply to a message in current job.
#
def SR_put_reply(location_name, msg_id, reply_content_json):
    loc_encoded=srio.sr_location_map[location_name]

    new_reply_content = []
    reply_content = json.loads(reply_content_json)
    msg_concat = ''
    for i in range(len(reply_content)):
        entry = reply_content[i]

        name = entry['name']
        if type(name) == unicode:
            name = name.encode('utf8')

        value = entry['value']
        if type(value) == unicode:
            value = value.encode('utf8')

        if srio.sr_passphrase:
            name = srio.encrypt_var(name)
            value = srio.encrypt_var(value)
            msg_concat += name + value

        new_reply_content.append({'name': name, 'value': value})

    if srio.sr_passphrase:
        hmac = srio.hmac_var(srio.sr_passphrase, msg_concat)
        entry = {'name': 'hmac', 'value': hmac}
        new_reply_content.append(entry)

    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/jobs/' + srio.sr_jobid + '/locations/' + loc_encoded + '/msgs/' + msg_id + '/reply' 
    result = srio.do_request(url, 'put', data={'reply_content': json.dumps(new_reply_content)})

    return result


#
# Delete current project
#
def SR_delete_project():
    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded
    result = srio.do_request(url, 'delete')
    return result


#
# Add email to share list for current project
#
def SR_add_share(email, access):
    url = srio.sr_api_url + '/projects/' + srio.sr_project_encoded + '/share'
    data = {'email': email, 'action': 'add', 'access': access}
    result = srio.do_request(url, 'put', data=data)
    return result

