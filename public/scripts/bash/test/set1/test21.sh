#!/bin/bash
#
# Commas in names
#

set -x

function send_message ()
{
    project="${1}"
    job="${2}"

    SR_start "$SRUSER" "$SRTOKEN" "$project" "$job"
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_set 'A,X' 'Hello,World' 'true'
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_send 'Location,X'
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_get 'A,X'
    if [ $? != 0 ]
    then
        return 1
    fi
    result=${SR_output#\'}
    result=${result%\'}
    if [ "$result" != "Goodbye,World" ]
    then
        return 1
    fi

    SR_end
    if [ $? != 0 ]
    then
        return 1
    fi
}

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set1

(send_message 'TEST(set1)-Project21,X' 'Job,X') &
pid=$!

sleep 5s

SR_set 'A,X' 'Goodbye,World' 'true'
if [ $? != 0 ]
then
    exit 1
fi

SR_project_encoded=$( rawurlencode 'TEST(set1)-Project21,X' )
SR_jobid=`cat srio.jobid`
SR_location_map['Location,X']='Location,X'
msgid=`cat srio.msgid`

result=`SR_put_reply 'Location,X' "$msgid"`
if [ $? == 1 ] || [ "$result" != 'OK' ]
then
    echo "$SR_status"
    exit 1
else
    wait $pid
    SR_delete_project
    exit 0
fi
