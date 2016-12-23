#
# Incorrect user id
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = 'xxx'

        result = srio.SR_start(user, credentials.SRTOKEN, 'TEST(suite1)-Project1', 'Job')

        if (result[0] != srio.SR_ERR) or (result[1] != u'ERROR: Invalid user id'):
            print result
            self.fail()



