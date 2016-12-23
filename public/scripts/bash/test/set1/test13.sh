#!/bin/bash
#
# Reply timeout
#

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

SR_start "$SRUSER" "$SRTOKEN" 'Project13' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_set 'A' 'Hello World' 'true'
if [ $? != 0 ]
then
    exit 1
fi

SR_send 'Location' 1
if [ $? == 1 ] && [ "$SR_status" == 'REPLY TIMEOUT' ]
then
    SR_clear
else
    exit 1
fi

result=`SR_get 'A'`
result=${result#\'}
result=${result%\'}
if [ "$result" != "Hello World" ]
then
    exit 1
fi

SR_end
if [ $? != 0 ]
then
    exit 1
fi
SR_delete_project
