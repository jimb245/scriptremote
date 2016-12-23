#!/bin/bash
#
# Test SR_PROJECTS_PER_USER == 4
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set3

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project1.1' 'Job'
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

SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project1.2' 'Job'
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

SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project1.3' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

proj3="$SR_project_encoded"

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project1.4' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

proj4="$SR_project_encoded"

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project1.5' 'Job'
if [ $? == 0 ]
then
    exit 1
fi

SR_project_encoded="$proj1"
SR_delete_project

SR_project_encoded="$proj2"
SR_delete_project

SR_project_encoded="$proj3"
SR_delete_project

SR_project_encoded="$proj4"
SR_delete_project

exit 0
