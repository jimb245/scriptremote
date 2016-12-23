#!/bin/bash
#
# SR_start incorrect token
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" 'xxx' 'TEST(set2)-Project2' 'Job' '12345'
if [ $? == 1 ] && [ "$SR_status" == 'Invalid user token' ]
then
    exit 0
else
    exit 1
fi
