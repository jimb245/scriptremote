#
# Send data and text file message
#
import os
import unittest
import srutil
import srjob
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(Suite2)-Project7'
        jobName = 'Job'
        loc_name = 'Location1'
        file_key = 'file'
        passphrase = '12345'

        path = os.getcwd() + '/Suite2/data.txt'
        newpath = os.getcwd() + '/Suite2/test7.txt'

        result1 = srjob.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srjob.SR_OK):
            self.fail()

        result2 = srjob.SR_send(loc_name, data_array=[{'name':'a','value':'Hello world'}], file_array=[{'key': 'file', 'path': path}], reply=False)
        if (result2[0] != srjob.SR_OK):
            self.fail()

        result3 = srutil.SR_get_jobs()
        if result3[0] != srjob.SR_OK:
            self.fail()

        data = result3[1]
        jobs = data[u'jobs']
        job = jobs[0]
        if (u'id' not in job) or (job[u'id'] != u'Job1'):
            self.fail()
        if (u'name' not in job) or (job[u'name'] != u'Job'):
            self.fail()

        result4 = srutil.SR_get_content(loc_name, srjob.sr_msgid)
        if result4[0] != srjob.SR_OK:
            self.fail()

        data = result4[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a", "value": "Hello world"}]'):
            self.fail()

        result5 = srutil.SR_get_file(loc_name, srjob.sr_msgid, file_key, 'text', newpath)
        if result5[0] != srjob.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path, newpath):
            self.fail()

        result6 = srjob.SR_end()
        if (result6[0] != srjob.SR_END):
            self.fail()
