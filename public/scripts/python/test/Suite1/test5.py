#
# Missing SR_start
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        try:
            srio.SR_send('Location1')
            self.fail()
        except Exception as e:
            print str(e)

        srutil.SR_delete_project()
