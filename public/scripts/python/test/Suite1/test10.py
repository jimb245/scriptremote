#
# Slash in locaton name
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
        projName = 'TEST(suite1)-Project10'
        jobName = 'Job'

        result1 = srio.SR_start(user, token, projName, jobName)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send('Location/1')
        if (result2[0] != srio.SR_ERR) or (result2[1] != u'ERROR: SLASH IN LOCATION NAME'):
            self.fail()

        srutil.SR_delete_project()
