#!/bin/bash
#
# Try to add job to shared project with read permission
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

proj='TEST(set2)-Project45'
projShare=${proj}"~"${SREMAIL}

SR_start ${SRUSER} ${SRTOKEN} ${proj} 'Job1'
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

sleep 5s

SR_add_share "${SRUSER}:${SRTOKEN}" "$SRSHAREEMAIL" 'read'

SR_start ${SRSHAREUSER} ${SRSHARETOKEN} ${projShare} 'Job2'
if [ $? == 1 ] && [ "$SR_status" == 'Project write not authorized for user' ]
then
    SR_project_encoded="$proj1"
    SR_delete_project
    exit 0
else
    SR_project_encoded="$proj1"
    SR_delete_project
    exit 1
fi
