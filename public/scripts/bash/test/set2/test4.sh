#!/bin/bash
#
# SR_set incomplete args
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set2)-Project4' 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A'
if [ $? == 1 ] && [ "$SR_status" == 'SR_set: INCORRECT ARGUMENT COUNT' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
