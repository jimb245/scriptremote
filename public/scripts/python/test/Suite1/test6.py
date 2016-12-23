#
# Send empty message
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        proj_name = 'TEST(suite1)-Project6'
        job_name = 'Job'
        loc_name = 'Location1'
        user = credentials.SRUSER
        token = credentials.SRTOKEN

        result1 = srio.SR_start(user, token, proj_name, job_name)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send(loc_name)
        if (result2[0] != srio.SR_OK):
            self.fail()

        result3 = srutil.SR_get_jobs()
        if result3[0] != srio.SR_OK:
            self.fail()

        data = result3[1]
        jobs = data[u'jobs']
        job = jobs[0]
        if (u'id' not in job) or (job[u'id'] != u'Job1'):
            self.fail()
        if (u'name' not in job) or (job[u'name'] != u'Job'):
            self.fail()

        result4 = srutil.SR_get_content(loc_name, srio.sr_msgid)
        if result4[0] != srio.SR_OK:
            self.fail()

        data = result4[1]
        if (u'content' not in data) or (data[u'content'] != u'{}'):
            self.fail()

        result5 = srio.SR_end()
        if (result5[0] != srio.SR_END):
            self.fail()

        srutil.SR_delete_project()
