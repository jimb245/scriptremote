#
# SR_start incomplete args
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
        passphrase = '12345'

        try:
            result = srjob.SR_start(user, token, passphrase=passphrase)
            self.fail()
        except Exception as e:
            print str(e)




