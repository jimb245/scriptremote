#
# Attempt to access shared project with non-existent email
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
        projName = 'TEST(suite1)-Project20~user@xyz.com'
        jobName = 'Job'

        result1 = srjob.SR_start(user, token, projName, jobName)
        if (result1[0] != srjob.SR_ERR) or (result1[1] != u'ERROR: Sharing user not found'):
            self.fail()
