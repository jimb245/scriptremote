#!/bin/bash
#
# Spaces in names
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project14 X' 'Job X'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A X' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set '@file X' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location X'
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

job_string="\"id\":\"${SR_jobid}\",\"name\":\"Job X\""
if echo "$result" | grep -vq "$job_string"
then
    exit 1
fi

result=`SR_get_content 'Location X' "$SR_msgid"`
expect='{"SR_status":"OK","content":"[{\"name\":\"A X\",\"value\":\"Hello World\"}]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location X' "$SR_msgid" 'file X' 'test14.txt'
diff test14.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test14.txt

