#
# Simple reply - helper
#
import sys
#import imp
import srio
import credentials

#srio = imp.load_source('srio', os.getcwd() + '/../srio.py'); 
#credentials = imp.load_source('credentials', os.getcwd() + '/credentials.py'); 

user = credentials.SRUSER
token = credentials.SRTOKEN
projName = 'TEST(Suite2)-Project12'
jobName = 'Job'
locName = 'Location'
fieldName = 'a'
passphrase = '12345'

result1 = srio.SR_start(user, token, projName, jobName, passphrase)
if (result1[0] != srio.SR_OK):
    sys.exit(1)

reply_data = [{'name':fieldName,'value':'Hello World'}]
result2 = srio.SR_send(locName, reply_data_array=reply_data, reply=True)
if (result2[0] != srio.SR_OK):
    sys.exit(1)

new_reply = reply_data[0]
if (new_reply['value'] != 'Goodbye World'):
    sys.exit(1)

srio.SR_end()
