#!/bin/bash
#
# Double quote in SR_set name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set1)-Project27' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A"B' 'Hello World' 'false'
if [ $? == 1 ] && [ "$SR_status" == 'SR_set: QUOTE, SLASH, BACKSLASH OR BACKTICK IN NAME' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
