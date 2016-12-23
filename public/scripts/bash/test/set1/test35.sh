#!/bin/bash
#
# Add job to existing project
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set1)-Project35' 'Job1'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

loc="Location"
SR_send "$loc"
if [ $? != 0 ]
then
    exit 1
fi

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set1)-Project35' 'Job2'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

loc="Location"
SR_send "$loc"
if [ $? != 0 ]
then
    exit 1
fi

result=`SR_get_jobs`
count=`grep -o "id" <<< "$result" | wc -l`

if [ $count -ne 2 ]
then
    exit 1
fi

SR_delete_project
exit 0


