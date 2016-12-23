#!/bin/bash
#
# Simple reply  - using message data encrypted by browser client
# to check consistency with openssl decrypt
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

(send_message 'TEST(set2)-Project2' 'Job' "$passphrase") &
pid=$!

sleep 5s

SR_set 'U2FsdGVkX1-+S3gVHI6-oRs=' 'U2FsdGVkX19FrLTnocXroxGB9rQFPYVmT5G5x+w=' 'true'
if [ $? != 0 ]
then
    exit 1
fi
SR_set 'hmac' '19b16f05e1efb1b257d6580a95127c9fdee0c168421f3840a2c5ddd867bd4416' 'true'
if [ $? != 0 ]
then
    exit 1
fi

passphrase=''

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
