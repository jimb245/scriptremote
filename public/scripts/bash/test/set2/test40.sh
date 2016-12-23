#!/bin/bash
#
# Simple utf8 test
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

projName='✞ℰϟ†(ϟʊ☤☂℮2)✏ℙґ◎ʝ℮¢⊥40'
jobName='Ⓙ◎ß'
locName='ℒ☺¢α⊥ї☺η'
fieldName='ḟїℯℓḓℕαмε'
fieldVal='√αʟü℮'
fileTag='@ƒ☤ʟε✝αℊ'
fileTag1='ƒ☤ʟε✝αℊ'

SR_start "$SRUSER" "$SRTOKEN" "$projName" "$jobName" '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set "$fieldName" "$fieldVal"  'false'
if [ $? != 0 ]
then
    exit 1
fi
SR_set "$fileTag" 'utf8.txt' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send "$locName"
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

job_string="\"id\":\"${SR_jobid}\",\"name\":\"${jobName}\""
if echo "$result" | grep -vq "$job_string"
then
    exit 1
fi

result=$(SR_get_content "$locName" "$SR_msgid")

expect='[{"name":"ḟїℯℓḓℕαмε","value":"√αʟü℮"}]'
if [[ "${result}" != "${expect}" ]]
then
    exit 1
fi

SR_get_file "$locName" "$SR_msgid" "$fileTag1" 'test40.txt'
diff test40.txt utf8.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test40.txt
