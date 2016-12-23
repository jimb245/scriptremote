#!/bin/bash
#
# .svg flle
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project20' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file' 'tiger.svg' 'False'
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

SR_get_file 'Location' "$SR_msgid" 'file' 'test20.svg'
diff test20.svg tiger.svg
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test20.svg



