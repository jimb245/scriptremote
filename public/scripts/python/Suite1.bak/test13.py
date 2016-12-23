#
# Reply timeout
#
import os
import unittest
import srutil
import srjob
import credentials
import time
import urllib
import json

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(suite1)-Project13'
        jobName = 'Job'
        locName = 'Location'
        fieldName = 'a'
        fieldValue = 'Hello World'

        result1 = srjob.SR_start(user, token, projName, jobName)
        if (result1[0] != srjob.SR_OK):
            sys.exit(1)

        reply_data = [{'name':fieldName,'value':fieldValue}]
        result2 = srjob.SR_send(locName, reply_data_array=reply_data, reply=True, reply_timeout=1)

        if (result2[0] != srjob.SR_ERR) or (result2[1] != 'REPLY TIMEOUT'):
            sys.exit(1)

        new_reply = reply_data[0]
        if (new_reply['value'] != fieldValue):
            sys.exit(1)

        srjob.SR_end()
