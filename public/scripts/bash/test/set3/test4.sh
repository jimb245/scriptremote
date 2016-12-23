#!/bin/bash
#
# Test SR_MESSAGES_PER_LOCATION == 4
#

set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set3

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project4' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a1' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a2' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a3' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a4' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a5' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? != 0 ]
then
    exit 1
fi

result=`SR_get_msgs "Location"`

if echo "$result" | grep -q "Msg1"
then
    exit 1
fi

SR_delete_project
exit 0
