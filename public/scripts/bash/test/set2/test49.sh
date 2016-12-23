#!/bin/bash
#
# Try to modify sharing of non-owned project
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

proj='TEST(set2)-Project49'
projShare=${proj}"~"${SREMAIL}
passphrase='12345'

SR_start ${SRUSER} ${SRTOKEN} ${proj} 'Job1' "$passphrase"
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
SR_add_share "${SRSHAREUSER}:${SRSHARETOKEN}" "$SRSHAREEMAIL" 'write'
if [ $? == 1 ] && [ "$SR_status" == 'Invalid project' ]
then
    SR_delete_project
    exit 0
else
    SR_delete_project
    exit 1
fi
