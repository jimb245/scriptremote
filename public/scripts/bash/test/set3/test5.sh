#!/bin/bash
#
# Test SR_MESSAGE_SIZE == 100000
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set3

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project5' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file' 'baboon.png' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location'
if [ $? == 0 ]
then
    exit 1
fi

SR_delete_project
exit 0
