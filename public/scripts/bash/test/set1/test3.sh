#!/bin/bash
#
# SR_start incomplete args
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project3'
if [ $? == 1 ] && [ "$SR_status" == 'SR_start: INCORRECT ARGUMENT COUNT' ]
then
    exit 0
else
    exit 1
fi
