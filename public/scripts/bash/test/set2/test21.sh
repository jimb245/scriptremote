#!/bin/bash
#
# Commas in names
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

    SR_set 'A,X' 'Hello,World' 'true'
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi

    SR_send 'Location,X'
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi

    SR_get 'A,X'
    if [ $? != 0 ]
    then
        echo "1" > srio.code
        return 1
    fi
    result=${SR_output#\'}
    result=${result%\'}
    if [ "$result" != "Goodbye,World" ]
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

(send_message 'TEST(set2)-Project21,X' 'Job,X' "$passphrase") &
pid=$!

sleep 5s

SR_set 'A,X' 'Goodbye,World' 'true'
if [ $? != 0 ]
then
    exit 1
fi

SR_project_encoded=`cat srio.project_encoded`
SR_jobid=`cat srio.jobid`
loc_encoded=`cat srio.loc_encoded`
SR_location_map['Location,X']="$loc_encoded"
msgid=`cat srio.msgid`
SR_passphrase="$passphrase"

result=`SR_put_reply 'Location,X' "$msgid"`
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
