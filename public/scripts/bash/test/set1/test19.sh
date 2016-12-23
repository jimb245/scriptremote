#!/bin/bash
#
# Variables as args with values including dollar, space, backtick
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

proj='TEST(set1)-Project19 ${SR_userid}'
job='J`ob'

SR_start "$SRUSER" "$SRTOKEN" "$proj" "$job"
if [ $? != 0 ]
then
    exit 1
fi

name='$A'
val='Hel`lo ${World}'
SR_set "$name" "$val" 'false'
if [ $? != 0 ]
then
    exit 1
fi

key='@fi $le'
SR_set "$key" 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

loc='Location$'
SR_send "$loc"
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

job_string="\"id\":\"${SR_jobid}\",\"name\":\"J\`ob\""
if echo "$result" | grep -vq "$job_string"
then
    exit 1
fi

result=$(SR_get_content "$loc" "$SR_msgid")
expect='{"SR_status":"OK","content":"[{\"name\":\"$A\",\"value\":\"Hel`lo ${World}\"}]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file "$loc" "$SR_msgid" 'fi $le' 'test19.txt'
diff test19.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test19.txt


