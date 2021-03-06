#
# Simple unicode test
#
import os
import unittest
import srutil
import srio
import credentials
import filecmp
import time

class Test(unittest.TestCase):
    def runTest(self):

        projName = u"TEST(Suite2)-Pro\xE2\x98\xA0ject8"
        jobName = u"Jo\xE2\x98\xA0b"
        locName = u"Loc\xE2\x98\xA0ation"
        fieldName = u"A\xE2\x98\xA0B"
        fieldVal = u"Hello \xE2\x98\xA0 World"
        fileTag = u"fi\xE2\x98\xA0le"
        passphrase = '12345'

        user = credentials.SRUSER
        token = credentials.SRTOKEN

        path = os.getcwd() + '/Suite2/utf8.txt'
        newpath = os.getcwd() + '/Suite2/test8.txt'

        result1 = srio.SR_start(user, token, projName, jobName, passphrase)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send(locName, data_array=[{'name':fieldName,'value':fieldVal}], file_array=[{'key': fileTag, 'path': path}], reply=False)
        if (result2[0] != srio.SR_OK):
            self.fail()

        result3 = srutil.SR_get_jobs()
        if result3[0] != srio.SR_OK:
            self.fail()

        data = result3[1]
        jobs = data[u'jobs']
        job = jobs[0]

        jobName1 = job[u'name']
        if isinstance(jobName1, unicode):
            jobName1 = jobName1.encode('utf8')

        if (u'id' not in job) or (job[u'id'] != u'Job1'):
            self.fail()
        if (u'name' not in job) or (jobName1 != jobName.encode('utf8')):
            self.fail()

        result4 = srutil.SR_get_content(locName, srio.sr_msgid)
        if result4[0] != srio.SR_OK:
            self.fail()

        data = result4[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "A\\u00e2\\u0098\\u00a0B", "value": "Hello \\u00e2\\u0098\\u00a0 World"}]'):
            self.fail()

        result5 = srutil.SR_get_file(locName, srio.sr_msgid, fileTag, 'text', newpath)
        if result5[0] != srio.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path, newpath):
            self.fail()

        result6 = srio.SR_end()
        if (result6[0] != srio.SR_END):
            self.fail()

        srutil.SR_delete_project()
