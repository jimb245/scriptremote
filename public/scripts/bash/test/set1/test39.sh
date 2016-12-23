#!/bin/bash
#
# Simple utf8 test
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

projName='✞ℰϟ†(ϟʊ☤☂℮2)✏ℙґ◎ʝ℮¢⊥39'
jobName='Ⓙ◎ß'
locName='ℒ☺¢α⊥ї☺η'
fieldName='ḟїℯℓḓℕαмε'
fieldVal='√αʟü℮'
fileTag='@ƒ☤ʟε✝αℊ'
fileTag1='ƒ☤ʟε✝αℊ'

SR_start "$SRUSER" "$SRTOKEN" "$projName" "$jobName"
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

expect='{"SR_status":"OK","content":"[{\"name\":\"ḟїℯℓḓℕαмε\",\"value\":\"√αʟü℮\"}]","is_reply":false,"timestamp":"2016-11-16 13:40:38.708"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file "$locName" "$SR_msgid" "$fileTag1" 'test39.txt'
diff test39.txt utf8.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test39.txt
