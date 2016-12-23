#!/bin/bash
#
# Simple reply test - emulates browser reply,
# doesnt test compatibility with browser crypto.
#

#set -x

function send_message ()
{
    project="${1}"
    job="${2}"
    passphrase="${3}"

    SR_start "$SRUSER" "$SRTOKEN" "$project" "$job" "$passphrase"
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi

    SR_set 'A' 'Hello World' 'true'
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi

    SR_send 'Location'
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi

    SR_get 'A'
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi
    result=${SR_output#\'}
    result=${result%\'}
    if [ "$result" != "Goodbye World" ]
    then
        echo "1" > srio.code
        return 1
    fi

    SR_end
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi

    echo "0" > srio.code
}

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set2

passphrase='12345'

# send_message is the actual test - run it in the background
# so script below can send reply asynchronously
(send_message 'TEST(set2)-Project12' 'Job' "$passphrase") &
pid=$!

sleep 5s

SR_set 'A' 'Goodbye World' 'true'
if [ $? != 0 ]
then
    exit 1
fi

SR_project_encoded=`cat srio.project_encoded`
SR_jobid=`cat srio.jobid`
loc_encoded=`cat srio.loc_encoded`
SR_location_map['Location']="$loc_encoded"
msgid=`cat srio.msgid`
SR_passphrase="$passphrase"

result=`SR_put_reply 'Location' "$msgid"`
if [ $? == 1 ] || [ "$result" != 'OK' ]
then
    echo "$SR_status"
    exit 1
else
    wait $pid
    code=`cat srio.code`
    SR_delete_project
    exit $code
fi
