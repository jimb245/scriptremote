#
# Try adding job to shared project with only reply access 
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
        projName = 'TEST(suite2)-Project23'
        projShare = projName + '~' + credentials.SREMAIL
        locName = 'location'
        jobName = 'Job'
        passphrase = '12345'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srio.SR_OK):
            self.fail()

        proj1 = srio.sr_project_encoded

        result2 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        time.sleep(5)

        srutil.SR_add_share(credentials.SRSHAREEMAIL, 'reply')

        srio.SR_end()

        result3 = srio.SR_start(credentials.SRSHAREUSER, credentials.SRSHARETOKEN, projShare, jobName, passphrase)
        if (result3[0] != srio.SR_ERR) or (result3[1] != u'ERROR: Project write not authorized for user'):
            self.fail()

        srio.sr_project_encoded=proj1
        srio.sr_userid = user
        srio.sr_token = token
        srutil.SR_delete_project()

