#!/bin/bash
#
# Dollar and backtick characters in literal args
# Backtick is only allowed in job name and
# SR_set values.
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project18${SR_userid}' 'J`o`b' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '$A' 'Hel`lo ${World}' 'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set '@fi$le' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send '$Location'
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

job_string="\"id\":\"${SR_jobid}\",\"name\":\"J\`o\`b\""
if echo "$result" | grep -vq "$job_string"
then
    exit 1
fi

result=$(SR_get_content '$Location' "$SR_msgid")
expect='[{"name":"$A","value":"Hel`lo ${World}"}]'
if [[ "${result}" != "${expect}" ]]
then
    exit 1
fi

SR_get_file '$Location' "$SR_msgid" 'fi$le' 'test18.txt'
diff test18.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test18.txt
