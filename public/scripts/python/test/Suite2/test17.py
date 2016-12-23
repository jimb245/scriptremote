#
# Send data and svg file message
#
import os
import unittest
import srutil
import srio
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        proj_name = 'TEST(suite2)-Project16'
        job_name = 'Job'
        loc_name = 'Location1'
        file_key = 'file'
        user = credentials.SRUSER
        token = credentials.SRTOKEN
        passphrase = '12345'

        path = os.getcwd() + '/Suite2/tiger.svg'
        newpath = os.getcwd() + '/Suite2/test17.svg'

        result1 = srio.SR_start(user, token, proj_name, job_name, passphrase)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send(loc_name, data_array=[{'name':'a','value':'Hello world'}], file_array=[{'key': 'file', 'path': path}], reply=False)
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
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a", "value": "Hello world"}]'):
            self.fail()

        result5 = srutil.SR_get_file(loc_name, srio.sr_msgid, file_key, 'text', newpath)
        if result5[0] != srio.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path, newpath):
            self.fail()

        result6 = srio.SR_end()
        if (result6[0] != srio.SR_END):
            self.fail()

        srutil.SR_delete_project()
