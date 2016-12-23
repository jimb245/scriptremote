#
# Incorrect user token
#
import os
import unittest
import srutil
import srjob
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER;
        token = 'xxx'

        result = srjob.SR_start(user, token, 'TEST(suite1)-Project2', 'Job')

        if (result[0] != srjob.SR_ERR) or (result[1] != u'ERROR: Invalid user token'):
            self.fail()



