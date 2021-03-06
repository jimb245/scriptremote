#!/bin/bash
#
# Slash in location name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set1)-Project11' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Loca/ntion'
if [ $? == 1 ] && [ "$SR_status" == 'SR_send: QUOTE, SLASH, BACKSLASH OR BACKTICK IN LOCATION NAME' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi

