#
# Simple unicode test
#
import os
import unittest
import srutil
import srjob
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        projName = u"TEST(Suite1)-Pro\xE2\x98\xA0ject8"
        jobName = u"Jo\xE2\x98\xA0b"
        locName = u"Loc\xE2\x98\xA0ation"
        fieldName = u"A\xE2\x98\xA0B"
        fieldVal = u"Hello \xE2\x98\xA0 World"
        fileTag = u"fi\xE2\x98\xA0le"

        user = credentials.SRUSER
        token = credentials.SRTOKEN

        path = os.getcwd() + '/Suite1/utf8.txt'
        newpath = os.getcwd() + '/Suite1/test8.txt'

        result1 = srjob.SR_start(user, token, projName, jobName)
        if (result1[0] != srjob.SR_OK):
            self.fail()

        result2 = srjob.SR_send(locName, data_array=[{'name':fieldName,'value':fieldVal}], file_array=[{'key': fileTag, 'path': path}], reply=False)
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
        if (u'name' not in job) or (job[u'name'] != jobName):
            self.fail()

        result4 = srutil.SR_get_content(locName, srjob.sr_msgid)
        if result4[0] != srjob.SR_OK:
            self.fail()

        data = result4[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "A\\u00e2\\u0098\\u00a0B", "value": "Hello \\u00e2\\u0098\\u00a0 World"}]'):
            self.fail()

        result5 = srutil.SR_get_file(locName, srjob.sr_msgid, fileTag, 'text', newpath)
        if result5[0] != srjob.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path, newpath):
            self.fail()

        result6 = srjob.SR_end()
        if (result6[0] != srjob.SR_END):
            self.fail()
