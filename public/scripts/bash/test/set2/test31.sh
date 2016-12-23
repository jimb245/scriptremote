#!/bin/bash
#
# Single quote in location name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set2)-Project31' 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

loc="Loca'tion"
SR_send "$loc"
if [ $? == 1 ] && [ "$SR_status" == 'SR_send: QUOTE, SLASH, BACKSLASH OR BACKTICK IN LOCATION NAME' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi

