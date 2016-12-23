#!/bin/bash
#
# Manual test of encrypted reply using browser -
# checks compatability of the two encryption libraries.
# Expected reply: "Goodbye World"
#

set -x

function send_message ()
{
    project="${1}"
    job="${2}"
    passphrase="${3}"

    SR_start "$SRUSER" "$SRTOKEN" "$project" "$job" "$passphrase"
    if [ $? != 0 ]
    then
        echo "1" > srjob.code
        return 1
    fi

    SR_set 'A' 'Hello World' 'true'
    if [ $? != 0 ]
    then
        echo "1" > srjob.code
        return 1
    fi

    SR_send 'Location'
    if [ $? != 0 ]
    then
        echo "1" > srjob.code
        return 1
    fi

    SR_get 'A'
    if [ $? != 0 ]
    then
        echo "1" > srjob.code
        return 1
    fi
    result=${SR_output#\'}
    result=${result%\'}
    if [ "$result" != "Goodbye World" ]
    then
        echo "1" > srjob.code
        return 1
    fi

    SR_end
    if [ $? != 0 ]
    then
        echo "1" > srjob.code
        return 1
    fi

    echo "0" > srjob.code
}

cd end2end
. ./srjob.sh

passphrase='12345'

(send_message 'TEST(end2end)-Project1' 'Job' "$passphrase") &
pid=$!

wait $pid
code=`cat srjob.code`
#SR_delete_project
exit $code
