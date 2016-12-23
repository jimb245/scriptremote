#
# Multiple content/reply items
#
import os
import unittest
import srutil
import srjob
import credentials
import time
import urllib
import subprocess
import json

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(suite1)-Project19'
        jobName = 'Job'
        locName = 'Location'

        # help19.py is the actual test - run it in the background
        helperPath = os.getcwd() + '/Suite1/help19.py'
        cwdPath = os.getcwd()
        p = subprocess.Popen(['python', helperPath], cwd=cwdPath, preexec_fn=os.setpgrp)

        # Make sure the initial message has time to reach server
        time.sleep(5)

        srjob.sr_project_encoded=urllib.quote_plus(projName)

        f = open('srjob.jobid', 'r')
        srjob.sr_jobid=f.read()
        f.close()

        srjob.sr_location_map[locName] = locName

        f = open('srjob.msgid', 'r')
        msgid=f.read()
        f.close()

        srjob.sr_userid = credentials.SRUSER
        srjob.sr_token = credentials.SRTOKEN

        # Simulate browser sending a reply message
        reply_content = json.dumps([{'name':'a1', 'value':'Goodbye World 1'}, {'name':'a2', 'value':'Goodbye World 2'}, {'name':'a3', 'value':'Goodbye World 3'}])
        result = srutil.SR_put_reply(locName, msgid, reply_content)
        if (result[0] != srjob.SR_OK):
            self.fail()

        # Wait for subprocess to complete - return code indicates result
        retcode = p.wait()
        if retcode != 0:
            self.fail()

