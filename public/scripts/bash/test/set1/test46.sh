#!/bin/bash
#
# Multiple messages per location
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project46' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set '@file' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

msgid1="$SR_msgid"

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set '@file' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

msgid2="$SR_msgid"

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

result=`SR_get_content 'Location' "$msgid1"`
expect='{"SR_status":"OK","content":"[{\"name\":\"A\",\"value\":\"Hello World\"}]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location' "$msgid1" 'file' 'test8.txt'
diff test8.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

result=`SR_get_content 'Location' "$msgid2"`
expect='{"SR_status":"OK","content":"[{\"name\":\"A\",\"value\":\"Hello World\"}]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location' "$msgid1" 'file' 'test8.txt'
diff test8.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project

rm -f test8.txt
