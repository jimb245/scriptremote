#!/bin/bash
#
# Backtick in project name
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set2)-Pr`noject16' 'Job' '12345'
if [ $? == 1 ] && [ "$SR_status" == 'SR_start: QUOTE, SLASH, BACKSLASH OR BACKTICK IN PROJECT NAME' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi

