#!/bin/bash
#
# Encrypted and unencrypted projects with same plaintext name
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

project='TEST(set2)-Project42'

SR_start ${SRUSER} ${SRTOKEN} ${project} 'Job'
if [ $? != 0 ]
then
    exit 1
fi

proj1="$SR_project_encoded"

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

SR_end


SR_start ${SRUSER} ${SRTOKEN} ${project} 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

proj2="$SR_project_encoded"

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

if [ $count -ne 1 ]
then
    exit 1
fi

SR_project_encoded="$proj1"
SR_delete_project
SR_project_encoded="$proj2"
SR_delete_project

exit 0


