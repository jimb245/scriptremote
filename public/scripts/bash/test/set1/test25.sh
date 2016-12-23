#!/bin/bash
#
# Multiple reply content entries
#

#set -x

function send_message ()
{
    project="${1}"
    job="${2}"

    SR_start "$SRUSER" "$SRTOKEN" "$project" "$job"
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_set 'A' 'Hello World' 'true'
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_set 'B' 'Mickey Mouse' 'true'
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_send 'Location'
    if [ $? != 0 ]
    then
        return 1
    fi

    SR_get 'A'
    if [ $? != 0 ]
    then
        return 1
    fi
    result=${SR_output#\'}
    result=${result%\'}
    if [ "$result" != "Goodbye World" ]
    then
        return 1
    fi

    SR_get 'B'
    if [ $? != 0 ]
    then
        return 1
    fi
    result=${SR_output#\'}
    result=${result%\'}
    if [ "$result" != "Bugs Bunny" ]
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

(send_message 'TEST(set1)-Project12' 'Job') &
pid=$!

sleep 5s

SR_set 'A' 'Goodbye World' 'true'
if [ $? != 0 ]
then
    exit 1
fi
SR_set 'B' 'Bugs Bunny' 'true'
if [ $? != 0 ]
then
    exit 1
fi

SR_project_encoded=$( rawurlencode 'TEST(set1)-Project12' )
SR_jobid=`cat srio.jobid`
SR_location_map['Location']='Location'
msgid=`cat srio.msgid`

result=`SR_put_reply 'Location' "$msgid"`
if [ $? == 1 ] || [ "$result" != 'OK' ]
then
    echo "$SR_status"
    exit 1
else
    wait $pid
    SR_delete_project
    exit 0
fi
