#
# Incorrect user token
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER;
        token = 'xxx'

        result = srio.SR_start(user, token, 'TEST(suite1)-Project2', 'Job')

        if (result[0] != srio.SR_ERR) or (result[1] != u'ERROR: Invalid user token'):
            self.fail()



