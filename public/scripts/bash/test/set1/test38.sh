#!/bin/bash
#
# Send empty message
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project38' 'Job'
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
expect='{"SR_status":"OK","content":"[]","is_reply":false,"timestamp":"2015-12-11 05:08:33.134"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_delete_project

