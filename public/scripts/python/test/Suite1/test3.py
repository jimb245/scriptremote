#
# SR_start incomplete args
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

        try:
            result = srio.SR_start(user, token)
            self.fail()
        except Exception as e:
            print str(e)




