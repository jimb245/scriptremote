#
# Simple reply test
#
import os
import unittest
import srutil
import srio
import credentials
import time
import urllib
import subprocess
import json

class Test(unittest.TestCase):
    def runTest(self):

        user = credentials.SRUSER
        token = credentials.SRTOKEN
        projName = 'TEST(suite1)-Project12'
        jobName = 'Job'
        locName = 'Location'
        fieldName = 'a'

        # help12.py is the actual test - run it in the background
        helperPath = os.getcwd() + '/Suite1/help12.py'
        cwdPath = os.getcwd()
        p = subprocess.Popen(['python', helperPath], cwd=cwdPath, preexec_fn=os.setpgrp)

        # Make sure the initial message has time to reach server
        time.sleep(5)

        srio.sr_project_encoded=urllib.quote_plus(projName)

        f = open('srio.jobid', 'r')
        srio.sr_jobid=f.read()
        f.close()

        srio.sr_location_map[locName] = locName

        f = open('srio.msgid', 'r')
        msgid=f.read()
        f.close()

        srio.sr_userid = credentials.SRUSER
        srio.sr_token = credentials.SRTOKEN

        # Simulate browser sending a reply message
        reply_content = json.dumps([{'name':fieldName, 'value':'Goodbye World'}])
        result = srutil.SR_put_reply(locName, msgid, reply_content)
        if (result[0] != srio.SR_OK):
            self.fail()

        # Wait for subprocess to complete - return code indicates result
        retcode = p.wait()
        if retcode != 0:
            self.fail()

        srutil.SR_delete_project()
