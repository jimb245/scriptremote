#!/bin/bash
#
# Single quote in project name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

projName="TEST(set1)-Pr'oject29"
SR_start ${SRUSER} ${SRTOKEN} "$projName" 'Job'
if [ $? == 1 ] && [ "$SR_status" == 'SR_start: QUOTE, SLASH, BACKSLASH OR BACKTICK IN PROJECT NAME' ]
then
    exit 0
else
    exit 1
fi

