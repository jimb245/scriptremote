#
# Duplicate file tags
#
import os
import unittest
import srutil
import srio
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        proj_name = 'TEST(suite1)-Project29'
        job_name = 'Job'
        loc_name = 'Location1'
        file_key = 'file'
        user = credentials.SRUSER
        token = credentials.SRTOKEN

        path = os.getcwd() + '/Suite1/data.txt'
        newpath = os.getcwd() + '/Suite1/test7.txt'

        result1 = srio.SR_start(user, token, proj_name, job_name)
        if (result1[0] != srio.SR_OK):
            self.fail()

        result2 = srio.SR_send(loc_name, data_array=[{'name':'a','value':'Hello world'}], file_array=[{'key': 'file', 'path': path}, {'key': 'file', 'path': path}], reply=False)

        if (result2[0] == srio.SR_OK):
            self.fail()

        srutil.SR_delete_project()
