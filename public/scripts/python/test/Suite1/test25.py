#
# Try adding job to shared project with no access 
#
import os
import time
import unittest
import srutil
import srio
import credentials
import urllib

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(suite1)-Project25'
        projShare = projName + '~' + credentials.SREMAIL
        locName = 'location'
        jobName = 'Job'
        jobNameShare = 'JobShare'

        result1 = srio.SR_start(user, token, projName, jobName)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send(locName, data_array=[{'name':'A','value':'Hello World'}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        time.sleep(5)

        projects = srutil.SR_get_projects()
        print projects

        srio.SR_end()

        result3 = srio.SR_start(credentials.SRSHAREUSER, credentials.SRSHARETOKEN, projShare, jobNameShare )
        if (result3[0] != srio.SR_ERR) or (result3[1] != u'ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION'):
            self.fail()
        

        srio.sr_userid = user
        srio.sr_token = token
        srio.sr_project_encoded=urllib.quote_plus(projName)
        srutil.SR_delete_project()

