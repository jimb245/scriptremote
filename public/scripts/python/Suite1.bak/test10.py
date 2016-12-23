#
# Slash in locaton name
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
        projName = 'TEST(suite1)-Project10'
        jobName = 'Job'

        result1 = srjob.SR_start(user, token, projName, jobName)
        if (result1[0] != srjob.SR_OK):
            self.fail()

        result2 = srjob.SR_send('Location/1')
        if (result2[0] != srjob.SR_ERR) or (result2[1] != u'ERROR: SLASH IN LOCATION NAME'):
            self.fail()
