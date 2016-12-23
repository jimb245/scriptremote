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

        user = credentials.SRUSER
        token = credentials.SRTOKEN

        path = os.getcwd() + '/Suite1/utf8.txt'
        newpath = os.getcwd() + '/Suite1/test8.txt'

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

        result4 = srutil.SR_get_file(locName, srio.sr_msgid, fileTag, 'text', newpath)
        if result4[0] != srio.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path, newpath):
            self.fail()

        result5 = srio.SR_end()
        if (result5[0] != srio.SR_END):
            self.fail()

        srutil.SR_delete_project()
