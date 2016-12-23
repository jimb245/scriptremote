#!/bin/bash
#
# SR_start incorrect token
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" 'xxx' 'TEST(set1)-Project2' 'Job'
if [ $? == 1 ] && [ "$SR_status" == 'Invalid user token' ]
then
    exit 0
else
    exit 1
fi
