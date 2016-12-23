#!/bin/bash
#
# Missing SR_start
#

SRTESTMODE=''

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

SR_set 'A' 'Hello world' 'false'
if [ $? == 1 ] && [ "$SR_status" == 'SR_set: JOB NOT STARTED' ]
then
    exit 0
else
    exit 1
fi

SR_send 'Location'

SR_end
