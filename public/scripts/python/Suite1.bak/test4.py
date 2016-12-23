#
# SR_send incomplete args
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

        result = srjob.SR_start(user, token, 'TEST(suite1)-Project4', 'Job')
        if (result[0] != srjob.SR_OK):
            self.fail()
        try:
            srjob.SR_send()
            self.fail()
        except Exception as e:
            print str(e)

