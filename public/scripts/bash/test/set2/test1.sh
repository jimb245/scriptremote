#!/bin/bash
#
# SR_start incorrect user id
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start 'xxx' "$SRTOKEN" 'TEST(set2)-Project1' 'Job' '12345'
if [ $? == 1 ] && [ "$SR_status" == 'Invalid user id' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
