#
# Message sent after end
#
import os
import unittest
import srutil
import srio
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        proj_name = 'TEST(suite2)-Project27'
        job_name = 'Job'
        loc_name = 'Location'
        user = credentials.SRUSER
        token = credentials.SRTOKEN
        passphrase = '12345'

        result = srio.SR_start(user, token, proj_name, job_name, passphrase)
        if (result[0] != srio.SR_OK):
            self.fail()

        result = srio.SR_send(loc_name, data_array=[{'name':'a1','value':'Hello world 1'}], reply=False)
        if (result[0] != srio.SR_OK):
            self.fail()

        msgid1 = srio.sr_msgid

        srio.SR_end()

        result = srio.SR_send(loc_name, data_array=[{'name':'a2','value':'Hello world 2'}], reply=False)
        msgid2 = srio.sr_msgid
        if (result[0] == srio.SR_OK) or (msgid2 == 'Msg2') or (result[1] != u'JOB ENDED'):
            self.fail()

        srutil.SR_delete_project()
