#!/bin/bash
#
# Test SR_MESSAGE_SIZE_PER_JOB == 150000
#

set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set3

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project6' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file1' 'heatmaps.png' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location1'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file1' 'heatmaps.png' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location2'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file1' 'heatmaps.png' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location3'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'a' 'Hello World' 'false'
if [ $? != 0 ]
then
    exit 1
fi

SR_set '@file1' 'heatmaps.png' 'False'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location4'
if [ $? == 0 ]
then
    exit 1
fi


SR_delete_project
exit 0
