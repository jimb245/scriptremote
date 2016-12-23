#
# Send data and text file message
#
import os
import unittest
import srutil
import srjob
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN

        result1 = srjob.SR_start(user, token, 'TESTsuite2Debug1', 'Job', '12345')
        if (result1[0] != srjob.SR_OK):
            self.fail()

        result2 = srjob.SR_send('Location1', data_array=[{'name':'a','value':'Hello world'}], reply=False)
        if (result2[0] != srjob.SR_OK):
            self.fail()

        reply_data = [{'name':'b', 'value':'Modify me'}]
        result3 = srjob.SR_send('Location2', reply_data_array = reply_data, reply=True)
        if (result3[0] != srjob.SR_OK):
            self.fail()

        print reply_data

        srjob.SR_end()


t = Test()
t.runTest()

