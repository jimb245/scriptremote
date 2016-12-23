#
# Slash in project name
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
        projName = 'TEST(suite1)-Pro/ject9'
        jobName = 'Job'

        result = srjob.SR_start(user, token, projName, jobName)
        if (result[0] != srjob.SR_ERR) or (result[1] != u'ERROR: SLASH IN PROJECT NAME'):
            self.fail()

