#!/bin/bash
#
# Add job to shared project
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

proj='TEST(set2)-Project36'
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

SR_add_share "${SRUSER}:${SRTOKEN}" "$SRSHAREEMAIL" 'write'

projencoded="$SR_project_encoded"
projshare=${proj}"~"${SREMAIL}

SR_start ${SRSHAREUSER} ${SRSHARETOKEN} ${projshare} 'Job2' "$passphrase"
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

result=`SR_get_jobs "${SRSHAREUSER}:${SRSHARETOKEN}"`
count=`grep -o "id" <<< "$result" | wc -l`

if [ $count -ne 2 ]
then
    exit 1
fi

SR_project_encoded="$projencoded"
SR_delete_project "${SRUSER}:${SRTOKEN}"
exit 0


