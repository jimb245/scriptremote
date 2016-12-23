#!/bin/bash
#
# Double quote in project name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set1)-Pr"oject26' 'Job'
if [ $? == 1 ] && [ "$SR_status" == 'SR_start: QUOTE, SLASH, BACKSLASH OR BACKTICK IN PROJECT NAME' ]
then
    exit 0
else
    exit 1
fi

