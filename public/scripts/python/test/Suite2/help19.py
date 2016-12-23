#
# Multiple content/reply items - helper
#
import sys
import srio
import credentials
import json

user = credentials.SRUSER
token = credentials.SRTOKEN
projName = 'TEST(suite2)-Project19'
jobName = 'Job'
locName = 'Location'
passphrase = '12345'

result1 = srio.SR_start(user, token, projName, jobName, passphrase)
if (result1[0] != srio.SR_OK):
    sys.exit(1)

data = [{'name':'a1', 'value':'Hello World 1'}, {'name':'a2', 'value':'Hello World 2'}, {'name':'a3', 'value':'Hello World 3'}]
reply_data = [{'name':'a1', 'value':'Hello World 1'}, {'name':'a2', 'value':'Hello World 2'}, {'name':'a3', 'value':'Hello World 3'}]
result2 = srio.SR_send(locName, data_array=data, reply_data_array=reply_data, reply=True)
if (result2[0] != srio.SR_OK):
    sys.exit(1)

new_reply1 = reply_data[0]
new_reply2 = reply_data[1]
new_reply3 = reply_data[2]

if (new_reply1['name'] != 'a1') or (new_reply1['value'] != 'Goodbye World 1'):
    sys.exit(1)
if (new_reply2['name'] != 'a2') or (new_reply2['value'] != 'Goodbye World 2'):
    sys.exit(1)
if (new_reply3['name'] != 'a3') or (new_reply3['value'] != 'Goodbye World 3'):
    sys.exit(1)

srio.SR_end()
