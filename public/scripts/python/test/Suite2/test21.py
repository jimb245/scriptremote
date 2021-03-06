#
# Attempt to access non-existent shared project
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRSHAREUSER
        token = credentials.SRSHARETOKEN
        projName = 'TEST(suite2)-Project21' + '~' + credentials.SREMAIL
        jobName = 'Job'
        passphrase = '12345'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srio.SR_ERR) or (result1[1] != u'ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION'):
            self.fail()

