#!/bin/bash
#
# Single quote in project name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

projName="TEST(set2)-Pr'oject29"
SR_start ${SRUSER} ${SRTOKEN} "$projName" 'Job' '12345'
if [ $? == 1 ] && [ "$SR_status" == 'SR_start: QUOTE, SLASH, BACKSLASH OR BACKTICK IN PROJECT NAME' ]
then
    exit 0
else
    exit 1
fi

