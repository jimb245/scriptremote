#
# Incorrect user id
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = 'xxx'
        projName = 'TEST(Suite2)-Project1'
        jobName = 'Job'
        passphrase = '12345'

        result = srio.SR_start(user, credentials.SRTOKEN, projName, jobName, passphrase)

        if (result[0] != srio.SR_ERR) or (result[1] != u'ERROR: Invalid user id'):
            print result
            self.fail()



