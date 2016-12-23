#
# Add job to existing owned project
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
        projName = 'TEST(suite2)-Project28'
        projShare = projName + '~' + credentials.SREMAIL
        locName = 'location'
        jobName1 = 'Job1'
        jobName2 = 'Job2'
        passphrase = '12345'

        result1 = srio.SR_start(user, token, projName, jobName1, passphrase)
        if (result1[0] != srio.SR_OK):
            self.fail()

        proj1 = srio.sr_project_encoded

        result2 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        srio.SR_end()

        result3 = srio.SR_start(user, token, projName, jobName2, passphrase )
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
        if (u'name' not in job) or (job[u'name'] != jobName2):
            self.fail()

        srio.sr_userid = user
        srio.sr_token = token
        srio.sr_project_encoded=proj1
        srutil.SR_delete_project()

