#!/bin/bash
#
# Simple Unicode test
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

projName=`echo -e "TEST(set1)-Pro\xE2\x98\xA0ject26"`
jobName=`echo -e "Jo\xE2\x98\xA0b"`
locName=`echo -e "Loc\xE2\x98\xA0ation"`
fieldName=`echo -e "A\xE2\x98\xA0B"`
fieldVal=`echo -e "Hello \xE2\x98\xA0 World"`
fileTag=`echo -e "@fi\xE2\x98\xA0le"`
fileTag1=`echo -e "fi\xE2\x98\xA0le"`

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
SR_set "$fileTag" 'data.txt' 'False'
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
expect='{"SR_status":"OK","content":"[{\"name\":\"A☠B\",\"value\":\"Hello ☠ World\"}]","is_reply":false,"timestamp":"2016-01-18 22:37:52.059"}'
if [[ "${result%%timestamp*}" != "${expect%%timestamp*}" ]]
then
    exit 1
fi

SR_get_file "$locName" "$SR_msgid" "$fileTag1" 'test26.txt'
diff test26.txt data.txt
if [ $? -eq 1 ]
then
    exit 1
fi

SR_delete_project
rm -f test26.txt
