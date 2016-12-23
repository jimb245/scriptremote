#!/bin/bash
#
# SR_start incorrect user id
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start 'xxx' "$SRTOKEN" 'TEST(set1)-Project1' 'Job'
if [ $? == 1 ] && [ "$SR_status" == 'Invalid user id' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
