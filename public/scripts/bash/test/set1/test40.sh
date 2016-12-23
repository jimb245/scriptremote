#!/bin/bash
#
# Multiple locations
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project40' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World 1' 'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set '@file1' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location1'
if [ $? != 0 ]
then
    exit 1
fi

msgid1="$SR_msgid" 

SR_set 'B' 'Hello World 2' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file2' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location2'
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

result=`SR_get_content 'Location1' "$msgid1"`
expect='{"SR_status":"OK","content":"[{\"name\":\"A\",\"value\":\"Hello World 1\"}]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location1' "$msgid1" 'file1' 'test40.1.txt'
diff test40.1.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

result=`SR_get_content 'Location2' "$msgid2"`
expect='{"SR_status":"OK","content":"[{\"name\":\"B\",\"value\":\"Hello World 2\"}]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location2' "$msgid2" 'file2' 'test40.2.txt'
diff test40.2.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project

rm -f test40.1.txt
rm -f test40.2.txt
