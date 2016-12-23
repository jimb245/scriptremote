#
# Multiple messages per location
#
import os
import unittest
import srutil
import srio
import credentials

class Test(unittest.TestCase):
    def runTest(self):

        proj_name = 'TEST(suite2)-Project26'
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

        result = srio.SR_send(loc_name, data_array=[{'name':'a2','value':'Hello world 2'}], reply=False)
        if (result[0] != srio.SR_OK):
            self.fail()

        msgid2 = srio.sr_msgid

        result = srio.SR_send(loc_name, data_array=[{'name':'a3','value':'Hello world 3'}], reply=False)
        if (result[0] != srio.SR_OK):
            self.fail()

        msgid3 = srio.sr_msgid

        result = srio.SR_end()
        if (result[0] != srio.SR_END):
            self.fail()

        result = srutil.SR_get_content(loc_name, msgid1)
        if result[0] != srio.SR_OK:
            self.fail()

        data = result[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a1", "value": "Hello world 1"}]'):
            self.fail()

        result = srutil.SR_get_content(loc_name, msgid2)
        if result[0] != srio.SR_OK:
            self.fail()

        data = result[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a2", "value": "Hello world 2"}]'):
            self.fail()

        result = srutil.SR_get_content(loc_name, msgid3)
        if result[0] != srio.SR_OK:
            self.fail()

        data = result[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a3", "value": "Hello world 3"}]'):
            self.fail()


        srutil.SR_delete_project()
