#!/bin/bash
#
# Modify description of non-owned project with write permission
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

proj='TEST(set1)-Project51'
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

# Owner grants sharing write permission
SR_add_share "${SRUSER}:${SRTOKEN}" "$SRSHAREEMAIL" 'write'
if [ $? != 0 ]
then
    exit 1
fi

# Sharing user can modify description
SR_project_encoded=$( rawurlencode "$projShare" )
SR_add_description "${SRSHAREUSER}:${SRSHARETOKEN}" "$SRSHAREEMAIL" 'Project X'
if [ $? == 0 ] && [ "$SR_status" == 'OK' ]
then
    SR_project_encoded=$( rawurlencode "$proj" )
    SR_delete_project
    exit 0
else
    SR_project_encoded=$( rawurlencode "$proj" )
    SR_delete_project
    exit 1
fi
