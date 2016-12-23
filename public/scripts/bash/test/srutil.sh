#!/bin/bash
#
# Test Support Functions
#
# THe ones that dont modify any global variables so
# can be run as subshells to capture the output
#

#
# SR_get_jobs [<user:token>]
#
# Outputs list of job ids for current project
#
function SR_get_jobs ()
{
    auth="${SRUSER}:${SRTOKEN}"
    if [ $# -eq 1 ]
    then
        auth="$1"
    fi
    url="${SR_api_url}/projects/${SR_project_encoded}/jobs"
    result=`curl -sS --request GET --user ${auth} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    if [ "$SR_passphrase" == '' ]
    then
        echo "$result"
        return 0
    fi

    # For encryption case parse the result in order to decrypt
    #
    jobs1=${result#{\"SR_status\":\"OK\",\"jobs\":}

    # jobs1 should be array of the form:
    # [{"id":string,"name":string,"timestamp":string},...]

    # Split it into objects
    jobs3=${jobs1%]}
    jobs4=${jobs3#[}
    len=${#jobs4}
    level=0
    lastpos=0
    objects=()
    for (( i=0; i < $len; i++ ))
    do
        if [ "${jobs4:$i:1}" == "," ] && [ $level -eq 0 ]
        then
            sublen=`expr $i - $lastpos`
            objects+=("\"${jobs4:$lastpos:$sublen}\"")
            lastpos=`expr $i + 1`
        elif [ "${jobs4:$i:1}" == "{" ]
        then
            level=$(($level+1))
        elif [ "${jobs4:$i:1}" == "}" ]
        then
            level=$(($level-1))
        fi
    done

    output=''
    sublen=`expr $i - $lastpos`
    objects+=("\"${jobs4:$lastpos:$sublen}\"")
    obj_count=${#objects[@]}
    for (( i=0; i < $obj_count; i++ ))
    do
        object=${objects[$i]}
        IFS=',' read id_entry name_entry timestamp_entry <<< "$object"
        IFS=':' read label id <<< "$id_entry"
        IFS=':' read label name <<< "$name_entry"

        id=${id%\"}
        id=${id#\"}
        name=${name%\"}
        name=${name#\"}
        name1=`decrypt_var "$SR_passphrase" "$name"`

        entry="\"id\":\"${id}\",\"name\":\"${name1}\""
        entry={$entry}
        if [ -z "$output" ]
        then
            output=$entry
        else
            output="$output, $entry"
        fi
    done
    output=[$output]
    echo "$output"
    return 0
    echo "$result"
    return 0
}

#
# SR_get_locations
#
# Outputs list of locations for current job
#
function SR_get_locations ()
{
    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations"
    result=`curl -sS --request GET --user ${SRUSER}:${SRTOKEN} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    echo $result
    return 0
}

#
# SR_get_msgs <location_name> 
#
# Outputs a list of messages for a location in current job
#
function SR_get_msgs ()
{
    location="${1}"
    loc_encoded=${SR_location_map["$location"]}

    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/${loc_encoded}/msgs"
    result=`curl -sS --request GET --user ${SRUSER}:${SRTOKEN} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    echo $result
    return 0
}

#
# SR_get_content <location_name> <msg_id>
#
# Outputs the contents of a message in current job
#
function SR_get_content ()
{
    location="${1}"
    loc_encoded=${SR_location_map["$location"]}
    msgid="${2}"

    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/${loc_encoded}/msgs/${msgid}"
    result=`curl -sS --request GET --user ${SRUSER}:${SRTOKEN} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    if [ "$SR_passphrase" == '' ]
    then
        echo "$result"
        return 0
    fi

    # For encryption case parse the result in order to decrypt
    #
    content1=${result#{\"SR_status\":\"OK\",\"content\":\"}
    content2=${content1%%\",\"is_reply*\}}

    # content2 should be array of the form:
    # [{"name":string,"value":string},...]
    # Split it into objects
    content3=${content2%]}
    content4=${content3#[}
    len=${#content4}
    level=0
    lastpos=0
    objects=()
    for (( i=0; i < $len; i++ ))
    do
        if [ "${content4:$i:1}" == "," ] && [ $level -eq 0 ]
        then
            sublen=`expr $i - $lastpos`
            objects+=("\"${content4:$lastpos:$sublen}\"")
            lastpos=`expr $i + 1`
        elif [ "${content4:$i:1}" == "{" ]
        then
            level=$(($level+1))
        elif [ "${content4:$i:1}" == "}" ]
        then
            level=$(($level-1))
        fi
    done

    output=''
    sublen=`expr $i - $lastpos`
    objects+=("\"${content4:$lastpos:$sublen}\"")
    obj_count=${#objects[@]}
    for (( i=0; i < $obj_count; i++ ))
    do
        object=${objects[$i]}
        IFS=',' read name_entry value_entry <<< "$object"
        IFS=':' read label name1 <<< "$name_entry"
        IFS=':' read label value1 <<< "$value_entry"

        name1=${name1#\"}
        name1=${name1%\"}
        value1=${value1#\"}
        value1=${value1%\"\}\"}

        name1=`decrypt_var "$SR_passphrase" "$name1"`
        value1=`decrypt_var "$SR_passphrase" "$value1"`

        entry="\"name\":\"${name1}\",\"value\":\"${value1}\""
        entry={$entry}
        if [ -z "$output" ]
        then
            output=$entry
        else
            output="$output, $entry"
        fi
    done
    output=[$output]
    echo "$output"
    return 0
}

#
# SR_get_file <location_name> <msg_id> <file_key> <output_file>
#
# Gets the contents of a file belonging to a message in current job
#
function SR_get_file ()
{
    location="${1}"
    loc_encoded=${SR_location_map["$location"]}
    msgid="${2}"
    plain_key="${3}"
    output_file="${4}"

    # To handle encryption case, download the key list
    # and decrypt them to look for match to the argument

    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/${loc_encoded}/msgs/${msgid}/files"
    result=`curl -sS --request GET --user ${SRUSER}:${SRTOKEN} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    IFS="," read V1 V2 <<< "$result"
    IFS=":" read V3 stat1 <<< "$V1"
    SR_status=`echo $stat1 | tr -d {}:,\"`
    SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
    SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

    IFS=":" read V4 V5 <<< "$V2"
    V6=${V5%%,\"file_types*\}}
    keys_list=${V6%]}
    keys_list=${keys_list#[}

    # Split the key list into a bash array of strings
    #
    keys_len=${#keys_list}
    level=0
    lastpos=0
    keys_array=()
    for (( i=0; i < $keys_len; i++ ))
    do
        if [ "${keys_list:$i:1}" == "," ] && [ $level -eq 0 ]
        then
            sublen=`expr $i - $lastpos`
            keys_array+=("${keys_list:$lastpos:$sublen}")
            lastpos=`expr $i + 1`
        elif [ "${keys_list:$i:1}" == "{" ]
        then
            level=$(($level+1))
        elif [ "${keys_list:$i:1}" == "}" ]
        then
            level=$(($level-1))
        fi
    done
    sublen=`expr $i - $lastpos`
    keys_array+=("${keys_list:$lastpos:$sublen}")

    # Decrypt keys and look for match
    #
    file_key=''
    count=${#keys_array[@]}
    for (( i=0; i < $count; i++ ))
    do
        key1="${keys_array[$i]}"
        key2=${key1#\"}
        key=${key2%\"}
        if [ "$SR_passphrase" != '' ]
        then
            plain_key1=`decrypt_var "$SR_passphrase" "$key"`
        else
            plain_key1="$key"
        fi
        if [ "$plain_key1" == "$plain_key" ]
        then
            file_key=$( urlencode "${key}" )
            break
        fi
    done

    if [ "$file_key" == '' ]
    then
        echo "NOT FOUND"
        return 1
    fi

    if [ "$SR_passphrase" != '' ]
    then
        mkdir -p /tmp/scriptremote
        tempfile=$(/bin/mktemp -p /tmp/scriptremote)
    else
        tempfile="$output_file"
    fi

    # Download file and decrypt it if needed
    #
    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/${loc_encoded}/msgs/${msgid}/files/${file_key}"
    curl -sS --request GET --user ${SRUSER}:${SRTOKEN} --user-agent $SR_agent -o "$tempfile" $url
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    if [ "$SR_passphrase" != '' ]
    then
        decrypt_file "$SR_passphrase" "$tempfile" "$output_file"
        rm -f "$tempfile"
    fi
}

#
# SR_put_reply <location_name> <msg_id>
#
# Send a reply to a message in current job.
# Use SR_set to create reply content.
#
function SR_put_reply ()
{
    location="${1}"
    loc_encoded=${SR_location_map["$location"]}
    msgid="${2}"

    local result V1 V2 V3 V4 V5 reply_content count entry retmsg
    reply_content=""
    count=${#SR_reply_names[@]}
    if [ $count -eq 0 ]
    then
        echo "EMPTY REPLY"
        return 1
    fi

    msg_concat=''
    for (( i=0; i < $count; i++ ))
    do
        name=${SR_reply_names[$i]}
        val=${SR_reply_values[$i]}
        # Encrypt name and value if needed, base64 output
        if [ "$SR_passphrase" != '' ]
        then
            name=`encrypt_var "$SR_passphrase" "$name"`
            val=`encrypt_var "$SR_passphrase" "$val"`
            msg_concat="$msg_concat""$name""$val"
        fi

        entry="\"name\":\"${name}\",\"value\":\"${val}\""
        entry={$entry}
        if [ -z "$reply_content" ]
        then
            reply_content=$entry
        else
            reply_content="$reply_content, $entry"
        fi
    done
    if [ "$SR_passphrase" != '' ]
    then
        hmac=`hmac_var "$SR_passphrase" "$msg_concat"`
        entry="\"name\":\"hmac\",\"value\":\"${hmac}\""
        entry={$entry}
        reply_content="$reply_content, $entry"
    fi

    reply_content=[$reply_content]

    SR_reply_names=()
    SR_reply_values=()

    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/${loc_encoded}/msgs/${msgid}/reply"
    result=`curl -sS --request PUT  --user ${SRUSER}:${SRTOKEN}  --data-urlencode reply_content="$reply_content" --user-agent $SR_agent $url`

    IFS="," read V1 V2 V3 <<< "$result"
    IFS=":" read V4 stat1 <<< "$V1"
    IFS=":" read V5 msgid1 <<< "$V2"
    status=`echo $stat1 | tr -d {}\"`
    status="${status#"${status%%[![:space:]]*}"}"
    status="${status%"${status##*[![:space:]]}"}"

    if [ "$status" == "" ]
    then
        SR_status='SERVER ERROR'
        echo "$SR_status"
        return 1
    fi
    if [ "$status" != "OK" ]
    then
        SR_status="$status"
        echo "$SR_status"
        return 1
    fi
    echo "$status"
    return 0
}

#
# SR_delete_project [<user>:<token>]
#
# Delete current project
#
function SR_delete_project ()
{
    auth="${SRUSER}:${SRTOKEN}"
    if [ $# -eq 1 ]
    then
        auth="$1"
    fi
    url="${SR_api_url}/projects/${SR_project_encoded}"
    result=`curl -sS --request DELETE --user ${auth} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    return 0
}

#
# SR_add_share <auth> <email>
#
# Add email to share list for current project
#
function SR_add_share ()
{
    url="${SR_api_url}/projects/${SR_project_encoded}/share"
    result=`curl -sS --request PUT --user ${1} --data-urlencode email="${2}" --data-urlencode access="${3}" --data-urlencode action="add" --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    IFS="," read V1 V2 V3 <<< "$result"
    IFS=":" read V4 stat1 <<< "$V1"
    IFS=":" read V5 msgid1 <<< "$V2"
    status=`echo $stat1 | tr -d {}\"`
    status="${status#"${status%%[![:space:]]*}"}"
    status="${status%"${status##*[![:space:]]}"}"

    if [ "$status" == "" ]
    then
        SR_status='SERVER ERROR'
        echo "$SR_status"
        return 1
    fi
    if [ "$status" != "OK" ]
    then
        SR_status="$status"
        echo "$SR_status"
        return 1
    fi
    echo "$status"
    return 0
}

#
# SR_add_description <auth> <description>
#
# Add description to current project
#
function SR_add_description ()
{
    url="${SR_api_url}/projects/${SR_project_encoded}/description"
    result=`curl -sS --request PUT --user ${1} --data-urlencode description="${2}" --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    IFS="," read V1 V2 V3 <<< "$result"
    IFS=":" read V4 stat1 <<< "$V1"
    IFS=":" read V5 msgid1 <<< "$V2"
    status=`echo $stat1 | tr -d {}\"`
    status="${status#"${status%%[![:space:]]*}"}"
    status="${status%"${status##*[![:space:]]}"}"

    if [ "$status" == "" ]
    then
        SR_status='SERVER ERROR'
        echo "$SR_status"
        return 1
    fi
    if [ "$status" != "OK" ]
    then
        SR_status="$status"
        echo "$SR_status"
        return 1
    fi
    echo "$status"
    return 0
}

#
# SR_add_notify <auth> <nickname>
#
# Add notify subscriber to current project
#
function SR_add_notify ()
{
    url="${SR_api_url}/projects/${SR_project_encoded}/notify"
    result=`curl -sS --request PUT --user ${1} --data-urlencode nickname="${2}" --data-urlencode action="add" --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        echo "CURL ERROR"
        return 1
    fi
    IFS="," read V1 V2 V3 <<< "$result"
    IFS=":" read V4 stat1 <<< "$V1"
    IFS=":" read V5 msgid1 <<< "$V2"
    status=`echo $stat1 | tr -d {}\"`
    status="${status#"${status%%[![:space:]]*}"}"
    status="${status%"${status##*[![:space:]]}"}"

    if [ "$status" == "" ]
    then
        SR_status='SERVER ERROR'
        echo "$SR_status"
        return 1
    fi
    if [ "$status" != "OK" ]
    then
        SR_status="$status"
        echo "$SR_status"
        return 1
    fi
    echo "$status"
    return 0
}

