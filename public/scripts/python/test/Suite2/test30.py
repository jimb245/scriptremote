#
# Try adding job to shared project with wrong passphrase
#
import os
import time
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(suite2)-Project30'
        projShare = projName + '~' + credentials.SREMAIL
        locName = 'location'
        jobName = 'Job'
        jobNameShare = 'JobShare'
        passphrase1 = '12345'
        passphrase2 = 'abc'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase1)
        if (result1[0] != srio.SR_OK):
            self.fail()

        proj1 = srio.sr_project_encoded

        result2 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        time.sleep(5)

        srio.SR_end()

        result3 = srio.SR_start(credentials.SRSHAREUSER, credentials.SRSHARETOKEN, projShare, jobNameShare, passphrase2 )
        if (result3[0] != srio.SR_ERR) or (result3[1] != u'ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION'):
            self.fail()

        srio.sr_userid = user
        srio.sr_token = token
        srio.sr_project_encoded=proj1
        srutil.SR_delete_project
