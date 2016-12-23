#
# Shared project unknown 
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
        projName = 'TEST(suite1)-Project21' + '~' + credentials.SREMAIL
        jobName = 'Job'

        result1 = srio.SR_start(user, token, projName, jobName)
        if (result1[0] != srio.SR_ERR) or (result1[1] != u'ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION'):
            self.fail()

