#!/bin/bash
#
# Try to modify description of non-owned project with no permission
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

proj='TEST(set1)-Project52'
projShare=${proj}"~"${SREMAIL}

SR_start ${SRUSER} ${SRTOKEN} ${proj} 'Job1'
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

sleep 5s

# Other user trys to modify description without permission
SR_project_encoded=$( rawurlencode "$projShare" )
SR_add_description "${SRSHAREUSER}:${SRSHARETOKEN}" "$SRSHAREEMAIL" 'Project X'
if [ $? == 1 ] && [ "$SR_status" == 'Project not authorized for user' ]
then
    SR_project_encoded=$( rawurlencode "$proj" )
    SR_delete_project
    exit 0
else
    SR_project_encoded=$( rawurlencode "$proj" )
    SR_delete_project
    exit 1
fi
