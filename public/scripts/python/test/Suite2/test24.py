#
# Add job to shared project with write access 
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
        projName = 'TEST(suite2)-Project24'
        projShare = projName + '~' + credentials.SREMAIL
        locName = 'location'
        jobName = 'Job'
        jobNameShare = 'JobShare'
        passphrase = '12345'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srio.SR_OK):
            self.fail()

        proj1 = srio.sr_project_encoded

        result2 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        time.sleep(5)

        srutil.SR_add_share(credentials.SRSHAREEMAIL, 'write')

        srio.SR_end()

        result3 = srio.SR_start(credentials.SRSHAREUSER, credentials.SRSHARETOKEN, projShare, jobNameShare, passphrase )
        if (result3[0] != srio.SR_OK):
            self.fail()

        result4 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        result5 = srutil.SR_get_jobs()
        if (result5[0] != srio.SR_OK):
            self.fail()

        data = result5[1]
        jobs = data[u'jobs']
        job = jobs[1]
        if (u'id' not in job) or (job[u'id'] != u'Job2'):
            self.fail()
        if (u'name' not in job) or (job[u'name'] != jobNameShare):
            self.fail()

        srio.sr_userid = user
        srio.sr_token = token
        srio.sr_project_encoded=proj1
        srutil.SR_delete_project()
