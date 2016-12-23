#
# Existing owned project, attempt to add job using wrong passphrase
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
        projName = 'TEST(suite2)-Project29'
        projShare = projName + '~' + credentials.SREMAIL
        locName = 'location'
        jobName1 = 'Job1'
        jobName2 = 'Job2'
        jobName3 = 'Job3'
        passphrase1 = '12345'
        passphrase2 = 'abc'

        result1 = srio.SR_start(user, token, projName, jobName1, passphrase1)
        if (result1[0] != srio.SR_OK):
            self.fail()

        proj1 = srio.sr_project_encoded

        result2 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        srio.SR_end()

        result3 = srio.SR_start(user, token, projName, jobName2, passphrase2 )
        if (result3[0] != srio.SR_OK):
            self.fail()

        result4 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result4[0] != srio.SR_OK):
            self.fail()


        result5 = srutil.SR_get_jobs()

        if (result5[0] != srio.SR_OK):
            self.fail()

        data = result5[1]
        jobs = data[u'jobs']
        if len(jobs) != 1:
            self.fail()

        srio.SR_end()

        result6 = srio.SR_start(user, token, projName, jobName3, passphrase1)
        if (result6[0] != srio.SR_OK):
            self.fail()

        result7 = srutil.SR_get_jobs()

        if (result7[0] != srio.SR_OK):
            self.fail()

        data = result7[1]
        jobs = data[u'jobs']
        if len(jobs) != 2:
            self.fail()

        srio.sr_userid = user
        srio.sr_token = token
        srio.sr_project_encoded=proj1
        srutil.SR_delete_project()
