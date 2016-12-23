#!/bin/bash
#
# Try to modify sharing of non-owned project
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

proj='TEST(set1)-Project48'
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

# Owner grants sharing read permission
SR_add_share "${SRUSER}:${SRTOKEN}" "$SRSHAREEMAIL" 'read'
if [ $? != 0 ]
then
    exit 1
fi

# Sharing user trys to modify permission to write
SR_project_encoded=$( rawurlencode "$projShare" )
SR_add_share "${SRSHAREUSER}:${SRSHARETOKEN}" "$SRSHAREEMAIL" 'write'
if [ $? == 1 ] && [ "$SR_status" == 'Project not owned by user' ]
then
    SR_project_encoded=$( rawurlencode "$proj" )
    SR_delete_project
    exit 0
else
    SR_project_encoded=$( rawurlencode "$proj" )
    SR_delete_project
    exit 1
fi
