#!/bin/bash
#
# SR_set invalid reply arg
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project5' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello world' 'xxx'
if [ $? == 1 ] && [ "$SR_status" == 'SR_set: INVALID REPLY ARG' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
