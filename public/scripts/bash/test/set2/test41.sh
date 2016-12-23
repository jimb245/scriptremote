#!/bin/bash
#
# Add jobs to existing projects
#

set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

project1='TEST(set2)-Project41.1'
project2='TEST(set2)-Project41.2'
passphrase='12345'

SR_start ${SRUSER} ${SRTOKEN} ${project1} 'Job1' ${passphrase} 
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


SR_start ${SRUSER} ${SRTOKEN} ${project1} 'Job2' ${passphrase}
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

SR_end


SR_start ${SRUSER} ${SRTOKEN} ${project2} 'Job1' ${passphrase}
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

SR_end


SR_start ${SRUSER} ${SRTOKEN} ${project2} 'Job2' ${passphrase}
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

SR_end


SR_project_encoded="$proj1"
SR_delete_project
SR_project_encoded="$proj2"
SR_delete_project

exit 0


