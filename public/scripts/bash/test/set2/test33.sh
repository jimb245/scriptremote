#!/bin/bash
#
# Backslash in SR_set name
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_start ${SRUSER} ${SRTOKEN} 'TEST(set2)-Project33' 'Job' '12345'
if [ $? != 0 ]
then
    exit 1
fi

name="A\B"
SR_set "$name" 'Hello World' 'false'

if [ $? == 1 ] && [ "$SR_status" == 'SR_set: QUOTE, SLASH, BACKSLASH OR BACKTICK IN NAME' ]
then
    SR_delete_project
    exit 0
else
    exit 1
fi
