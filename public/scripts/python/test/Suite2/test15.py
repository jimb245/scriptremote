# -*- coding: utf-8 -*-
#
# Simple utf-8 test
#
import os
import unittest
import srutil
import srio
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        projName = '✞ℰϟ†(ϟʊ☤☂℮2)✏ℙґ◎ʝ℮¢⊥15'
        jobName = 'Ⓙ◎ß'
        locName = 'ℒ☺¢α⊥ї☺η'
        fieldName = 'ḟїℯℓḓℕαмε'
        fieldVal = '√αʟü℮'
        fileTag = 'ƒ☤ʟε✝αℊ'
        passphrase = '12345'

        user = credentials.SRUSER
        token = credentials.SRTOKEN

        path = os.getcwd() + '/Suite2/utf8.txt'
        newpath = os.getcwd() + '/Suite2/test8.txt'

        result1 = srio.SR_start(user, token, projName, jobName)
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
        if (u'name' not in job) or (jobName1 != jobName):
            self.fail()

        result4 = srutil.SR_get_content(locName, srio.sr_msgid)
        if result4[0] != srio.SR_OK:
            self.fail()

        data = result4[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "\\u1e1f\\u0457\\u212f\\u2113\\u1e13\\u2115\\u03b1\\u043c\\u03b5", "value": "\\u221a\\u03b1\\u029f\\u00fc\\u212e"}]'):
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
