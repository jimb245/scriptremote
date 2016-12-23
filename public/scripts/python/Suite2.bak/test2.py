#
# Incorrect user token
#
import os
import unittest
import srutil
import srjob
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER;
        token = 'xxx'
        projName = 'TEST(Suite2)-Project2'
        jobName = 'Job'
        passphrase = '12345'

        result = srjob.SR_start(user, token, projName, jobName, passphrase)

        if (result[0] != srjob.SR_ERR) or (result[1] != u'ERROR: Invalid user token'):
            self.fail()



