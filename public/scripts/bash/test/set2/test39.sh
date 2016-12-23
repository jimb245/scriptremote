#!/bin/bash
#
# Projects with same plain name, different passphrases
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project6' 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
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

project_encoded1="$SR_project_encoded"

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project6' 'Job' 'abc'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
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

project_encoded2="$SR_project_encoded"

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project6' 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
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

SR_project_encoded="$project_encoded1"

result=`SR_get_jobs`
count=`grep -o "id" <<< "$result" | wc -l`
if [ $count -ne 2 ]
then
    exit 1
fi

SR_project_encoded="$project_encoded2"

result=`SR_get_jobs`
count=`grep -o "id" <<< "$result" | wc -l`
if [ $count -ne 1 ]
then
    exit 1
fi

SR_delete_project
SR_project_encoded="$project_encoded1"
SR_delete_project
exit 0
