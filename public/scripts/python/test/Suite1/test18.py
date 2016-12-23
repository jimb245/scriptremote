#
# Multiple locations with content/files
#
import os
import unittest
import srutil
import srio
import credentials
import filecmp

class Test(unittest.TestCase):
    def runTest(self):

        proj_name = 'TEST(suite1)-Project18'
        job_name = 'Job'
        loc_name1 = 'Location1'
        loc_name2 = 'Location2'
        loc_name3 = 'Location3'
        file_key = 'file'
        user = credentials.SRUSER
        token = credentials.SRTOKEN

        path1 = os.getcwd() + '/Suite1/data.txt'
        newpath1 = os.getcwd() + '/Suite1/test18.txt'
        path2 = os.getcwd() + '/Suite1/heatmaps.png'
        newpath2 = os.getcwd() + '/Suite1/test18.png'
        path3 = os.getcwd() + '/Suite1/tiger.svg'
        newpath3 = os.getcwd() + '/Suite1/test18.svg'

        result = srio.SR_start(user, token, proj_name, job_name)
        if (result[0] != srio.SR_OK):
            self.fail()

        result = srio.SR_send(loc_name1, data_array=[{'name':'a1','value':'Hello world 1'}], file_array=[{'key': file_key, 'path': path1}], reply=False)
        if (result[0] != srio.SR_OK):
            self.fail()

        msgid1 = srio.sr_msgid

        result = srio.SR_send(loc_name2, data_array=[{'name':'a2','value':'Hello world 2'}], file_array=[{'key': file_key, 'path': path2}], reply=False)
        if (result[0] != srio.SR_OK):
            self.fail()

        msgid2 = srio.sr_msgid

        result = srio.SR_send(loc_name3, data_array=[{'name':'a3','value':'Hello world 3'}], file_array=[{'key': file_key, 'path': path3}], reply=False)
        if (result[0] != srio.SR_OK):
            self.fail()

        msgid3 = srio.sr_msgid

        result = srio.SR_end()
        if (result[0] != srio.SR_END):
            self.fail()

        result = srutil.SR_get_content(loc_name1, msgid1)
        if result[0] != srio.SR_OK:
            self.fail()

        data = result[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a1", "value": "Hello world 1"}]'):
            self.fail()

        result = srutil.SR_get_file(loc_name1, msgid1, file_key, 'text', newpath1)
        if result[0] != srio.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path1, newpath1):
            self.fail()

        result = srutil.SR_get_content(loc_name2, msgid2)
        if result[0] != srio.SR_OK:
            self.fail()

        data = result[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a2", "value": "Hello world 2"}]'):
            self.fail()

        result = srutil.SR_get_file(loc_name2, msgid2, file_key, 'binary', newpath2)
        if result[0] != srio.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path2, newpath2):
            self.fail()

        result = srutil.SR_get_content(loc_name3, msgid3)
        if result[0] != srio.SR_OK:
            self.fail()

        data = result[1]
        if (u'content' not in data) or (data[u'content'] != u'[{"name": "a3", "value": "Hello world 3"}]'):
            self.fail()

        result = srutil.SR_get_file(loc_name3, msgid3, file_key, 'text', newpath3)
        if result[0] != srio.SR_OK:
            self.fail()
        
        if not filecmp.cmp(path3, newpath3):
            self.fail()

        srutil.SR_delete_project()

