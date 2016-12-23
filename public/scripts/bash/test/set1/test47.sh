#!/bin/bash
#
# Try to send message after end
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set1)-Project47' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

SR_end


SR_set 'A' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? == 1 ] && [ "$SR_status" == 'Job already ended' ]
then
    SR_delete_project
    exit 0
else
    SR_delete_project
    exit 1
fi

