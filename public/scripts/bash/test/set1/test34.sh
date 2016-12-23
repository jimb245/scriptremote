#!/bin/bash
#
# Backslash in location name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set1)-Project34' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

loc="Loca\\ion"
SR_send "$loc"
if [ $? == 1 ] && [ "$SR_status" == 'SR_send: QUOTE, SLASH, BACKSLASH OR BACKTICK IN LOCATION NAME' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi

