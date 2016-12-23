#
# Reply timeout
#
import os
import unittest
import srutil
import srio
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

        result1 = srio.SR_start(user, token, projName, jobName)
        if (result1[0] != srio.SR_OK):
            self.fail()

        reply_data = [{'name':fieldName,'value':fieldValue}]
        result2 = srio.SR_send(locName, reply_data_array=reply_data, reply=True, reply_timeout=1)

        if (result2[0] != srio.SR_ERR) or (result2[1] != 'REPLY TIMEOUT'):
            self.fail()

        new_reply = reply_data[0]
        if (new_reply['value'] != fieldValue):
            self.fail()

        srio.SR_end()

        srutil.SR_delete_project()
