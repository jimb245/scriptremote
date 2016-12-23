#
# Slash in file key
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
        projName = 'TEST(Suite2)-Project11'
        jobName = 'Job'
        passphrase = '12345'

        path = os.getcwd() + '/Suite2/data.txt'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send('Location1', file_array=[{'key': 'fil/e', 'path': path}], reply=False)
        if (result2[0] != srio.SR_ERR) or (result2[1] != u'ERROR: SLASH IN FILE KEY'):
            self.fail()

        srutil.SR_delete_project()
