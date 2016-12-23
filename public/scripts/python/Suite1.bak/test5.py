#
# Missing SR_start
#
import os
import unittest
import srutil
import srjob
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        try:
            srjob.SR_send('Location1')
            self.fail()
        except Exception as e:
            print str(e)

