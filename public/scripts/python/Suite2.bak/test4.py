#
# SR_send incomplete args
#
import os
import unittest
import srutil
import srjob
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(Suite2)-Project4'
        jobName = 'Job'
        passphrase = '12345'

        result = srjob.SR_start(user, token, projName, jobName, passphrase)
        if (result[0] != srjob.SR_OK):
            self.fail()
        try:
            srjob.SR_send()
            self.fail()
        except Exception as e:
            print str(e)

