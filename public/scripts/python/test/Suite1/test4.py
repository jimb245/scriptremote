#
# SR_send incomplete args
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN

        result = srio.SR_start(user, token, 'TEST(suite1)-Project4', 'Job')
        if (result[0] != srio.SR_OK):
            self.fail()
        try:
            srio.SR_send()
            self.fail()
        except Exception as e:
            print str(e)

        srutil.SR_delete_project()
