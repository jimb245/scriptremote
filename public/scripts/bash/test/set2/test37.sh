#!/bin/bash
#
# Multiple content items and files
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project39' 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'B' 'Howdy Doody' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file1' 'data.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file2' 'heatmaps.png' 'False'
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
expect='[{"name":"A","value":"Hello World"}, {"name":"B","value":"Howdy Doody"}]'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file 'Location' "$SR_msgid" 'file1' 'test39.txt'
diff test39.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_get_file 'Location' "$SR_msgid" 'file2' 'test39.png'
diff -q test39.png heatmaps.png
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project

rm -f test39.txt
rm -f test39.64
rm -f test39.png

