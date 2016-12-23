#
# Attempt to access shared project with non-existent email
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(suite1)-Project20~user@xyz.com'
        jobName = 'Job'
        passphrase = '12345'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srio.SR_ERR) or (result1[1] != u'ERROR: Sharing user not found'):
            self.fail()

