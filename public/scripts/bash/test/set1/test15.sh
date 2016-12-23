#!/bin/bash
#
# .png flle
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project15' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file' 'heatmaps.png' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

SR_end
if [ $? != 0 ]
then
    exit 1
fi

result=`SR_get_jobs`

job_string="\"id\":\"${SR_jobid}\",\"name\":\"Job\""
if echo "$result" | grep -vq "$job_string"
then
    exit 1
fi

SR_get_file 'Location' "$SR_msgid" 'file' 'test15.64'
base64 -d test15.64 > test15.png
diff -q test15.png heatmaps.png
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test15.64
rm -f test15.png




