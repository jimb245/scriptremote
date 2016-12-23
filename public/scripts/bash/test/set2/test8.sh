#!/bin/bash
#
# Send simple content and text file
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project8' 'Job' '12345'
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

result=`SR_get_content "Location" "$SR_msgid"`
expect='[{"name":"A","value":"Hello World"}]'
if [[ "${result}" != "${expect}" ]]
then
    exit 1
fi

SR_get_file 'Location' "$SR_msgid" 'file' 'test1.txt'
diff test1.txt data.txt 
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test1.txt


