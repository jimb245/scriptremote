#!/bin/bash
#
# Simple encryption including text file
#

set -x

cd end2end
. ./srjob.sh

SR_start "$SRUSER" "$SRTOKEN" 'TEST(end2end)-Project3' 'Job' 'xyz'
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

result=`SR_get_jobs 'TEST(set2)-Project3'`

job_string="\"id\":\"${SR_jobid}\",\"name\":\"$SR_job\""
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

rm -f test1.txt


