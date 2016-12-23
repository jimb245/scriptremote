#!/bin/bash
#
# Slash in project name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2


SR_start ${SRUSER} ${SRTOKEN} 'TEST(set2)-Pr/noject10' 'Job' '12345'
if [ $? == 1 ] && [ "$SR_status" == 'SR_start: QUOTE, SLASH, BACKSLASH OR BACKTICK IN PROJECT NAME' ]
then
    exit 0
else
    exit 1
fi

