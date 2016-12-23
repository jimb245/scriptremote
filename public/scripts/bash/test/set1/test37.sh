#!/bin/bash
#
# Multiple content items and files
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project37' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'B' 'Howdy Doody' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file1' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file2' 'heatmaps.png' 'False'
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

result=`SR_get_content 'Location' "$SR_msgid"`
expect='{"SR_status":"OK","content":"[{\"name\":\"A\",\"value\":\"Hello World\"}, {\"name\":\"B\",\"value\":\"Howdy Doody\"}]","is_reply":false,"timestamp":"2016-03-24 21:35:38.254"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location' "$SR_msgid" 'file1' 'test37.txt'
diff test37.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_get_file 'Location' "$SR_msgid" 'file2' 'test37.64'
base64 -d test37.64 > test37.png
diff -q test37.png heatmaps.png
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project

rm -f test37.txt
rm -f test37.64
rm -f test37.png

