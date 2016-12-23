#!/bin/bash
#
# Try adding job to shared project with wrong passphrase
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

proj='TEST(set2)-Project47'
passphrase1='12345'
passphrase2='abc'

SR_start ${SRUSER} ${SRTOKEN} ${proj} 'Job1' "$passphrase1"
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

SR_add_share "${SRUSER}:${SRTOKEN}" "$SRSHAREEMAIL" 'write'

projencoded="$SR_project_encoded"
projshare=${proj}"~"${SREMAIL}

SR_start ${SRSHAREUSER} ${SRSHARETOKEN} ${projshare} 'Job2' "$passphrase2"
if [ $? == 1 ] && [ "$SR_status" == 'ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION' ]
then
    SR_project_encoded="$proj1"
    SR_delete_project
    exit 0
else
    SR_project_encoded="$proj1"
    SR_delete_project
    exit 1
fi
