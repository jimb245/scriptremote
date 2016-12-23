#!/bin/bash
#
# Test SR_LOCATIONS_PER_JOB == 4
#

set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set3

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project3' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a1' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location1'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a2' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location2'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a3' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location3'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a4' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location4'
if [ $? != 0 ]
then
    exit 1
fi


SR_set 'a5' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location5'
if [ $? == 0 ]
then
    exit 1
fi

SR_delete_project
exit 0
