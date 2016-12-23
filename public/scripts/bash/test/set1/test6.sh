#!/bin/bash
#
# SR_send incomplete args
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project6' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello world' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send
if [ $? == 1 ] && [ "$SR_status" == 'SR_send: INCORRECT ARGUMENT COUNT' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
