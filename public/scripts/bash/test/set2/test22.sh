#!/bin/bash
#
# Commas in names
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project22,X' 'Job,X' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A,X' 'Hello,World' 'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set '@file,X' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location,X'
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

job_string="\"id\":\"${SR_jobid}\",\"name\":\"Job,X\""
if echo "$result" | grep -vq "$job_string"
then
    exit 1
fi

result=`SR_get_content 'Location,X' "$SR_msgid"`
expect='[{"name":"A,X","value":"Hello,World"}]'

if [[ "${result}" != "${expect}" ]]
then
    exit 1
fi

SR_get_file 'Location,X' "$SR_msgid" 'file,X' 'test22.txt'
diff test22.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test22.txt



