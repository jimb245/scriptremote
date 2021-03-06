#!/bin/bash
#
# Try to access shared project with invalid email
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

proj='TEST(set1)-Project42'
projShare=${proj}"~""abc@xyz.com"

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

SR_add_share "${SRUSER}:${SRTOKEN}" "$SRSHAREEMAIL" 'write'


SR_start ${SRSHAREUSER} ${SRSHARETOKEN} ${projShare} 'Job2'
if [ $? == 1 ] && [ "$SR_status" == 'Sharing user not found' ]
then
    SR_delete_project
    exit 0
else
    SR_delete_project
    exit 1
fi
