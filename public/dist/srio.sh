#!/bin/bash
#################################################################
#
# bash utilities for ScriptRemote, Version 1.0.2
#
# Dependencies: bash, curl, openssl
# Tested: bash 4.3.11, curl 7.35.0, openssl 1.0.1f
#
# Set environment variable SRSERVER to the protocol (http or https) and
# domain or IP (and port if not 80 or 443) of your server. If the script
# will run behind a proxy server you also may need to set the http_proxy or
# HTTPS_PROXY environment variable.
#
if [ "$SRSERVER" == '' ]
then
    SRSERVER=https://scriptremote.com
fi
#
# NOTE: These funtions share and modify global variables so should 
# not be run as subshells
#
#################################################################
#
# SR_start <user_id> <token> <project_name> <job_name> [<passphrase> [<max_msgs>]]
#
# Starts job communication with the server The parent project for the job will
# be created with name <project_name> if it does not already exist. <user_id> 
# and <token> may be obtained from the Settings main menu item of the website. 
# <project_name> and <job_name> are user-selected strings(*). <job_name> does 
# not need to be unique since the server assigns a unique id to each job
# within a project.
#
# Parameter passphrase enables end-to-end script-browwer encryption if it has
# a non-empty string value (*) - it will be used to generate the symetric encryption
# key. All user-defined data is encrypted before transmission to the server.
# The reply part, if any, of an outgoing message is both encrypted and 
# cryptographically signed.  Likewise any reply data received from the 
# server must have been encrypted and signed using the same passphrase.
#
# The passphrase for a project is fixed at the time the project is created.  
# If a later job attempts to use a different passphrase with the same project 
# name it will actually create a new project with the same plaintext name 
# but a different encrypted name in the server.
#
# max_msgs is an optional parameter for the maximum number of messages per
# location to retain in the server - the oldest messages will be deleted to
# stay within this limit.  The default is 100.
# If only the max_msgs arg is needed an emtpy value ('') for passphrase
# should be used as a placeholder.
#
# Return code is 0 if successful and 1 if not. (***)
# Status messages are written to standard output and to variable SR_status.
# 
#
#################################################################
#
# SR_set <name> <value> <reply>
#
# Records a name/value pair for the next call to SR_send. <name> and <value>
# are user-selected strings(*) or file specifiers(**).  reply can be 'true'
# or 'false', or any case variation of those. (Note: reply cannot have a
# true value in the case of a file specifier.)  
#
# Return code is 0 if successful and 1 if not. (***)
# Status messages are written to standard output and to variable SR_status.
#
#################################################################
#
# SR_send <location_name> [<reply_timeout>]
#
# Sends a message to the server <location_name> is a
# user-selected string(*). Data defined in SR_set calls since the
# previous SR_send is included in the message. If any SR_set calls 
# had reply = 'true' then SR_send waits for a reply from the user before 
# returning.  The user can optionally modify the values for those pairs
# when sending the reply.
#
# Optional parameter reply_timeout is maximum time (in minutes)
# to wait for a reply - the default is 600. If reply_timeout 
# is exceeded SR_send returns with no modifications to data, code 1,
# and message 'REPLY TIMEOUT'. In this case SR_clear should be called to
# clear the status before continuing with the script.
#
# Return code is 0 if successful and 1 if not. (***)
# Status messages are written to standard output and to variable SR_status.
#
#################################################################
#
# SR_get <name>
#
# Gets replied values following a call to SR_send. <name> was recorded 
# in a previous SR_set call with reply = 'true.' Replied values are 
# available until the next call to SR_send.
#
# Return code is 0 if successful and 1 if not. (***)
# Status messages are written to standard output and to variable SR_status.
# Reply values are written to standard output and to variable SR_output
#
#################################################################
#
# SR_end
#
# Ends job messaging - no more messages for the job are allowd.
#
# Return code is 0 if successful and 1 if not. (***)
# Status messages are written to standard output and to variable SR_status.
#
#################################################################
#
# Notes:
#
# (*) User-selected strings consist of utf8-encoded characters with
# these limitations to simplify working with bash, curl
# and node:
#
#  1) string literal args should be enclosed in single quotes
#
#  2) strings should not contain single quotes, even if 
#  backslash-escaped 
#
#  3) <project_name>, <location_name>, and SR_set <name>
#  should not contain: 
#       quote (single or double) 
#       backtick (`) 
#       slash (/)
#       backslash (\)
#
#  In addition, the tilde (~) character has a special meaning
#  within <project_name> as indicating a shared project that
#  is owned by another user. A shared project reference consists
#  of the project name proper, followed by the owners email
#  address, separated by a tilde.
#   
# (**) File specifiers are used to send the contents of text or
# image files. The name part of a file specifier begins with the '@'
# character followed by a string not containing '@' or '<', which
# have special meaning to curl.  The name part is just a key and 
# is independent of the actual file name. The value part of the
# specifier is the path to the file. The supported image types 
# are '.svg' and '.png'. Files not having those extensions are
# assumed to be utf8-encoded text.
# 
# (***) An unsuccessful call causes a sticky error flag to be set
# and all succeeding calls will return immediately. Call SR_clear
# to clear the sticky flag.
#
#################################################################
#
# Example:
#
#!/bin/bash
#
# . ./srio
#
# SR_start ${SRUSER} ${SRTOKEN} 'myproject' 'myjob'
#
# SR_set 'a' 'Hello World' 'False'
#
# SR_send 'Locaton1'
#
# SR_set 'b' 'Modify me' 'True'
#
# SR_send 'Location2'
#
# SR_get 'b'
#
# SR_end
#
#################################################################

#set -x

#
# Global variables
#
declare SR_status SR_output SR_userid SR_passphrase SR_project SR_project_encoded 
declare SR_job SR_jobid SR_msgid SR_token SR_api_url SR_names SR_values SR_reply_names 
declare SR_reply_values SR_agent
declare -A SR_reply_dict SR_location_map

SR_status=""
SR_userid=""
SR_project=""
SR_jobid=""
SR_msgid=""
SR_token=""
SR_agent='ScriptRemote'
SR_reply_names=()
SR_reply_values=()
SR_api_url="${SRSERVER}/api"

#
# SR_start <user_id> <token> <project_name> <job_name> [<passphrase>] [<max_msgs>]
#
function SR_start ()
{
    local result V1 V2 V3 V4 stat1 jobid1 max_msgs salt argcnt url
    SR_status=""

    argcnt=$#
    if [ $argcnt -lt 4 ] || [ $argcnt -gt 6 ]
    then
        SR_status='SR_start: INCORRECT ARGUMENT COUNT'
        echo "$SR_status"
        return 1
    fi

    SR_names=()
    SR_values=()
    SR_reply_names=()
    SR_reply_values=()

    SR_userid="${1}"
    SR_token="${2}"
    SR_project="${3}"
    SR_job="${4}"

    if [[ "$SR_project" == */* ]] || [[ "$SR_project" == *\`* ]] || [[ "$SR_project" == *\\* ]] || [[ "$SR_project" == *\"* ]] || [[ "$SR_project" == *\'* ]]
    then
        SR_status='SR_start: QUOTE, SLASH, BACKSLASH OR BACKTICK IN PROJECT NAME'
        echo "$SR_status"
        return 1
    fi

    SR_passphrase=''
    if [ $argcnt -gt 4 ]
    then
        SR_passphrase=${5}
    fi

    max_msgs='100'
    if [ $argcnt -eq 6 ]
    then
        max_msgs=${6}
    fi

    tsn=`date "+%Y-%m-%d %T.%N"`
    ts=${tsn%??????}

    #
    # Get existing user projects and decrypt if required
    #
    url="${SR_api_url}/projects"
    result=`curl -sS --request GET --user ${SR_userid}:${SR_token} --user-agent $SR_agent $url`
    if [ $? != 0 ]
    then
        SR_status='CURL ERROR'
        echo "$SR_status"
        return 1
    fi

    # Parse the json
    IFS="," read V1 V2 <<< "$result"
    IFS=":" read V3 stat1 <<< "$V1"
    SR_status=`echo $stat1 | tr -d {}\"`
    SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
    SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

    if [ "$SR_status" == "" ]
    then
        SR_status='SERVER ERROR'
        echo "$SR_status"
        return 1
    fi
    if [ "$SR_status" != "OK" ]
    then
        echo "$SR_status"
        return 1
    fi

    new_project=1
    data1=${result#\{\"SR_status\":\"OK\",\"projects\":}
    data2=${data1%\}}

    # data2 should be array of the form:
    # [["name",true,""],["name",false,""],...]
    # since no per-project salt for openssl encryption

    if [ "$data2" != "[]" ]
    then
        # Extract last encryption flag
        len1=${#data2}
        data3=${data2%\",true,\"\"]]}
        len2=${#data3}
        if [ $len2 -lt $len1 ]
        then
            encrypted_last='true'
        else
            encrypted_last='false'
        fi
        data3=${data3%\",false,\"\"]]}
        data4=${data3#[[\"}
        len=${#data4}
        lastpos=0
        for (( i=0; i < $len; i++ ))
        do
            # Using that quote cannot occur inside legal project name or encrypted name
            if [ "$i" -eq 1 ]
            then
                minus1=0
            else
                minus1=`expr $i - 1`
            fi
            plus1=`expr $i + 1`
            plus2=`expr $i + 2`
            if [ $i -gt 0 ] && [ "${data4:$i:1}" == "," ] && [ "${data4:$plus1:1}" == "[" ] && [ "${data4:$plus2:1}" == "\"" ] && [ "${data4:$minus1:1}" == "]" ]
            then
                sublen=`expr $i - $lastpos`
                ss=${data4:$lastpos:$sublen}
                len1=${#ss}
                ss=${ss%\",true,\"\"]}
                len2=${#ss}
                name=${ss%\",false,\"\"]}
                if [ $len2 -lt $len1 ]
                then
                    encrypted='true'
                else
                    encrypted='false'
                fi
                project="$name"
                if [ "$SR_passphrase" != '' ] && [ "$encrypted" == 'true' ]
                then
                    project=`decrypt_var "$SR_passphrase" "$project"`
                elif [ "$SR_passphrase" == '' ] && [ "$encrypted" == 'true' ]
                then
                    project=''
                elif [ "$SR_passphrase" != '' ] && [ "$encrypted" == 'false' ]
                then
                    project=''
                fi
                if [ "$project" == "$SR_project" ]
                then
                    # Got a match to existing project
                    new_project=0
                    # Project name for use in urls
                    SR_project_encoded=$( urlencode "$name" )
                    break
                fi
                lastpos=`expr $i + 3`
            fi
        done

        if [ $new_project -eq 1 ]
        then
            # Checking last array entry
            name=${data4:$lastpos}
            project="$name"
            if [ "$SR_passphrase" != '' ] && [ "$encrypted_last" == 'true' ]
            then
                project=`decrypt_var "$SR_passphrase" "$project"`
            elif [ "$SR_passphrase" == '' ] && [ "$encrypted_last" == 'true' ]
            then
                project=''
            elif [ "$SR_passphrase" != '' ] && [ "$encrypted_last" == 'false' ]
            then
                project=''
            fi
            if [ "$project" == "$SR_project" ]
            then
                # Got a match to existing project
                new_project=0
                # Project name for use in urls
                SR_project_encoded=$( urlencode "$name" )
            fi
        fi
    fi

    if [ $new_project -eq 1 ]
    then
        # No match to owned project - check for shared project
        if [[ "$SR_project" == *~* ]]
        then
            email=${SR_project##*~}
            email_encoded=$( urlencode "$email" )
            plain_project=${SR_project%~${email}}
            url="${SR_api_url}/projects-share/${email_encoded}"
            result=`curl -sS --request GET --user ${SR_userid}:${SR_token} --user-agent $SR_agent $url`
            if [ $? != 0 ]
            then
                SR_status='CURL ERROR'
                echo "$SR_status"
                return 1
            fi

            # Parse the json
            IFS="," read V1 V2 <<< "$result"
            IFS=":" read V3 stat1 <<< "$V1"
            SR_status=`echo $stat1 | tr -d {}\"`
            SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
            SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

            if [ "$SR_status" == "" ]
            then
                SR_status='SERVER ERROR'
                echo "$SR_status"
                return 1
            fi
            if [ "$SR_status" != "OK" ]
            then
                echo "$SR_status"
                return 1
            fi

            new_project=1
            data1=${result#\{\"SR_status\":\"OK\",\"projects\":}
            data2=${data1%\}}

            # data2 should be array of the form:
            # [["name",true,""],["name",false,""],...]
            # since no per-project salt for openssl encryption

            if [ "$data2" != "[]" ]
            then
                # Extract last encryption flag
                len1=${#data2}
                data3=${data2%\",true,\"\"]]}
                len2=${#data3}
                if [ $len2 -lt $len1 ]
                then
                    encrypted_last='true'
                else
                    encrypted_last='false'
                fi
                data3=${data3%\",false,\"\"]]}
                data4=${data3#[[\"}
                len=${#data4}
                lastpos=0
                for (( i=0; i < $len; i++ ))
                do
                    # Using that quote cannot occur inside legal project name or encrypted name
                    if [ "$i" -eq 1 ]
                    then
                        minus1=0
                    else
                        minus1=`expr $i - 1`
                    fi
                    plus1=`expr $i + 1`
                    plus2=`expr $i + 2`
                    if [ $i -gt 0 ] && [ "${data4:$i:1}" == "," ] && [ "${data4:$plus1:1}" == "[" ] && [ "${data4:$plus2:1}" == "\"" ] && [ "${data4:$minus1:1}" == "]" ]
                    then
                        sublen=`expr $i - $lastpos`
                        ss=${data4:$lastpos:$sublen}
                        len1=${#ss}
                        ss=${ss%\",true,\"\"]}
                        len2=${#ss}
                        name=${ss%\",false,\"\"]}
                        if [ $len2 -lt $len1 ]
                        then
                            encrypted='true'
                        else
                            encrypted='false'
                        fi
                        project="$name"
                        if [ "$SR_passphrase" != '' ]
                        then
                            project=`decrypt_var "$SR_passphrase" "$project"`
                        elif [ "$SR_passphrase" == '' ] && [ "$encrypted" == 'true' ]
                        then
                            project=''
                        elif [ "$SR_passphrase" != '' ] && [ "$encrypted" == 'false' ]
                        then
                            project=''
                        fi
                        if [ "$project" == "$plain_project" ]
                        then
                            # Got a match to existing project
                            new_project=0
                            # Project name for use in urls
                            SR_project_encoded=$( urlencode "${name}~${email}" )
                            break
                        fi
                        lastpos=`expr $i + 3`
                    fi
                done

                if [ $new_project -eq 1 ]
                then
                    # Checking last array entry
                    name=${data4:$lastpos}
                    project="$name"
                    if [ "$SR_passphrase" != '' ] && [ "$encrypted_last" == 'true' ]
                    then
                        project=`decrypt_var "$SR_passphrase" "$project"`
                    elif [ "$SR_passphrase" == '' ] && [ "$encrypted_last" == 'true' ]
                    then
                        project=''
                    elif [ "$SR_passphrase" != '' ] && [ "$encrypted_last" == 'false' ]
                    then
                        project=''
                    fi
                    if [ "$project" == "$plain_project" ]
                    then
                        # Got a match to existing project
                        new_project=0
                        # Project name for use in urls
                        SR_project_encoded=$( urlencode "${name}~${email}" )
                    fi
                fi
            fi

            if [ $new_project -eq 1 ]
            then
                SR_status='ERROR: SHARED PROJECT NOT FOUND OR NO PERMISSION'
                echo "$SR_status"
                return 1
            fi
        fi
    fi

    if [ $new_project -eq 1 ]
    then
        # Encrypt the project name if needed
        is_encrypted='false'
        if [ "$SR_passphrase" != '' ]
        then
            SR_project=`encrypt_var "$SR_passphrase" "$SR_project"`
            is_encrypted='true'
        fi
        # Project name for use in urls
        SR_project_encoded=$( urlencode "$SR_project" )

        # Create the project
        url="${SR_api_url}/projects"
        result=`curl -sS --request POST --user ${SR_userid}:${SR_token} --data-urlencode project_name="$SR_project" --data-urlencode is_encrypted="$is_encrypted" --data-urlencode timestamp="$ts" --user-agent $SR_agent $url`

        if [ $? != 0 ]
        then
            SR_status='CURL ERROR'
            echo "$SR_status"
            return 1
        fi

        # parse json result
        IFS="," read V1 V2 <<< "$result"
        IFS=":" read V3 stat1 <<< "$V1"
        SR_status=`echo $stat1 | tr -d {}\"`
        SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
        SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

        if [ "$SR_status" == "" ]
        then
            SR_status='SERVER ERROR'
            echo "$SR_status"
            return 1
        fi
        if [ "$SR_status" != "OK" ]
        then
            echo "$SR_status"
            return 1
        fi
    fi

    if [ "$SRTESTMODE" != '' ]
    then
        echo $SR_project_encoded > srio.project_encoded
    fi

    #
    # Send job startup info to server
    #
    if [ "$SR_passphrase" != '' ]
    then
        SR_job=`encrypt_var "$SR_passphrase" "$SR_job"`
    fi

    url="${SR_api_url}/projects/"${SR_project_encoded}"/jobs"
    result=`curl -sS --request POST --user ${SR_userid}:${SR_token} --data-urlencode job_name="$SR_job" --data-urlencode max_msgs="$max_msgs" --data-urlencode timestamp="$ts" --user-agent $SR_agent $url`

    if [ $? != 0 ]
    then
        SR_status='CURL ERROR'
        echo "$SR_status"
        return 1
    fi

    # Parse json result
    IFS="," read V1 V2 <<< "$result"
    IFS=":" read V3 stat1 <<< "$V1"
    IFS=":" read V4 jobid1 <<< "$V2"
    SR_status=`echo $stat1 | tr -d {}\"`
    SR_jobid=`echo $jobid1 | tr -d {}\"`
    if [ "$SRTESTMODE" != '' ]
    then
        echo $SR_jobid > srio.jobid
    fi

    if [ "$SR_status" == "" ]
    then
        SR_status='SERVER ERROR'
        echo "$SR_status"
        return 1
    fi
    if [ "$SR_status" != "OK" ]
    then
        echo "$SR_status"
        return 1
    fi
    return 0
}

#
# SR_set <name> <value> <reply>
#
#
function SR_set ()
{
    local name val len

    if [ "$SR_userid" == "" ] && [ "$SRTESTMODE" == '' ]
    then
        SR_status='SR_set: JOB NOT STARTED'
        echo "$SR_status"
        return 1
    fi

    if [ "$SR_status" != "OK" ] && [ "$SRTESTMODE" == '' ]
    then
        echo "$SR_status"
        return 1
    fi

    if [ $# -ne 3 ]
    then
        SR_status='SR_set: INCORRECT ARGUMENT COUNT'
        echo "$SR_status"
        return 1
    fi

    name="${1}"
    if [[ "$name" == */* ]] || [[ "$name" == *\`* ]] || [[ "$name" == *\\* ]] || [[ "$name" == *\"* ]] || [[ "$name" == *\'* ]]
    then
        SR_status='SR_set: QUOTE, SLASH, BACKSLASH OR BACKTICK IN NAME'
        echo "$SR_status"
        return 1
    fi

    val=${2}
    len=${#val[@]}
    if [ $len -eq 0 ]
    then
        SR_status='SR_set: EMPTY VALUE ARGUMENT'
        echo "$SR_status"
        return 1
    fi

    if  echo ${3} | grep -qi 'true' 
    then
        SR_reply_names+=("$name")
        SR_reply_values+=("$val")
    elif  echo ${3} | grep -qi 'false' 
    then
        SR_names+=("$name")
        SR_values+=("$val")
    else
        SR_status='SR_set: INVALID REPLY ARG'
        echo "$SR_status"
        return 1
    fi

    return 0
}

#
# SR_get <name>
#
function SR_get ()
{
    local name1 name2 value1 value2 value3

    SR_output=''

    if [ "$SR_userid" == "" ]
    then
        SR_status='SR_set: JOB NOT STARTED'
        echo "$SR_status"
        return 1
    fi

    if [ "$SR_status" != "OK" ]
    then
        echo "$SR_status"
        return 1
    fi

    if [ $# -ne 1 ]
    then
        SR_status='SR_get: INCORRECT ARGUMENT COUNT'
        echo "$SR_status"
        return 1
    fi

    #echo "NAMES: ${!SR_reply_dict[@]}" >> echo.log
    #echo "VALUES: ${SR_reply_dict[@]}" >> echo.log

    name1=\"${1}\"
    name2=${1}
    if [[ ${SR_reply_dict["$name1"]} ]]
    then
        value1=${SR_reply_dict["$name1"]} 
        value2=${value1#\"}
        value3=${value2%\"}
        SR_output="$value3"
        echo "$SR_output"
        return 0
    elif [[ ${SR_reply_dict["$name2"]} ]]
    then
        value1=${SR_reply_dict["$name2"]} 
        value2=${value1#\"}
        value3=${value2%\"}
        SR_output="$value3"
        echo "$SR_output"
        return 0
    fi

    SR_status='SR_get: NAME NOT FOUND'
    echo "$SR_status"
    return 1
}


#
# SR_send <location_name> [<reply_timeout>]
#
function SR_send ()
{

    local result V1 V2 V3 V4 V5 content reply reply_content stat1 msgid1 entry 
    local reply_content1 reply_content2 reply_content3 reply_content4
    local reply_content5 name val value1 value2 value3 filenames filepaths
    local argcnt retmsg salt location location1 loc_encoded count 
    local regx fkey fpath atfpath file_name file_ext fkeys fpaths url
    local reply_timeout start_time timeout reply_sleep sleep1 max_time

    argcnt=$#
    if [ "$SR_userid" == "" ]
    then
        SR_status='SR_send: JOB NOT STARTED'
        retmsg="$SR_status"
        echo "$retmsg"
        return 1
    fi

    if [ "$SR_status" != "OK" ]
    then
        retmsg="$SR_status"
        echo "$retmsg"
        return 1
    fi

    if [ $argcnt -eq 0 ] || [ $argcnt -gt 3 ]
    then
        SR_status='SR_send: INCORRECT ARGUMENT COUNT'
        retmsg="$SR_status"
        echo "$retmsg"
        return 1
    fi

    location="${1}"
    if [[ "$location" == */* ]] || [[ "$location" == *\`* ]] || [[ "$location" == *\\* ]] || [[ "$location" == *\"* ]] || [[ "$location" == *\'* ]]
    then
        SR_status='SR_send: QUOTE, SLASH, BACKSLASH OR BACKTICK IN LOCATION NAME'
        echo "$SR_status"
        return 1
    fi

    loc_encoded=${SR_location_map["$location"]}
    if [ "$loc_encoded" == '' ] 
    then
        # Encrypt location name if needed, base64 output.
        # The url uses the encrypted value and and re-encrypting
        # would not produce the same result so sr_location_map
        # saves it to use for later SR_send calls to
        # same location.
        if [ "$SR_passphrase" != '' ]
        then
            location1=`encrypt_var "$SR_passphrase" "$location"`
        else
            location1="$location"
        fi

        loc_encoded=$( urlencode "$location1" )
        SR_location_map["${location}"]="${loc_encoded}"
    fi
    if [ "$SRTESTMODE" != '' ]
    then
        echo "$loc_encoded" > srio.loc_encoded
    fi

    # Set up dictionary of initial reply values
    SR_reply_dict=()
    count=${#SR_reply_names[@]}
    for (( i=0; i < $count; i++ ))
    do
        SR_reply_dict["${SR_reply_names[$i]}"]="${SR_reply_values[$i]}"
    done

    #
    # Scan the data passed to SR_set calls to build the
    # outgoing json content string and identify any files
    #
    content=""
    count=${#SR_names[@]}
    regx='@.*'
    fkeys=()
    fpaths=()
    for (( i=0; i < $count; i++ ))
    do
        name=${SR_names[$i]}
        val=${SR_values[$i]}
        if [[ ${SR_names[$i]} =~ $regx ]]
        then
            name=${name/@/}
            entry="$name"

            # Encrypt the key if needed, base64 output
            if [ "$SR_passphrase" != '' ]
            then
                entry=`encrypt_var "$SR_passphrase" "$entry"`
            fi

            fkeys+=( "$entry" )
            fpaths+=(${SR_values[$i]})
        else
            # Encrypt name and value if needed, base64 output
            if [ "$SR_passphrase" != '' ]
            then
                name=`encrypt_var "$SR_passphrase" "$name"`
                val=`encrypt_var "$SR_passphrase" "$val"`
            fi

            entry="\"name\":\"${name}\",\"value\":\"${val}\""
            entry={$entry}
            if [ -z "$content" ]
            then
                content=$entry
            else
                content="$content, $entry"
            fi
        fi
    done
    content=[$content]

    if  [ ${#SR_reply_names[@]} = 0 ]
    then
        reply=False
    else
        reply=True
    fi

    #
    # Build the outgoing json reply content string
    #
    reply_content=""
    if [ $reply == True ]
    then
        msg_concat=''
        count=${#SR_reply_names[@]}
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
            # Calculate reply message authentication
            hmac=`hmac_var "$SR_passphrase" "$msg_concat"`
            entry="\"name\":\"hmac\",\"value\":\"${hmac}\""
            entry={$entry}
            reply_content="$reply_content, $entry"
        fi
        reply_content=[$reply_content]
    fi

    SR_names=()
    SR_values=()
    SR_reply_names=()
    SR_reply_values=()

    tsn=`date "+%Y-%m-%d %T.%N"`
    ts=${tsn%??????}
    #
    # Send the non-file msg data to server
    #

    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/"${loc_encoded}"/msgs"
    result=`curl -sS --request POST  --user ${SR_userid}:${SR_token} --data-urlencode timestamp="$ts" --data-urlencode content="$content" --data-urlencode is_reply=$reply --data-urlencode reply_content="$reply_content" --user-agent $SR_agent $url`

    # Parse json result
    IFS="," read V1 V2 V3 <<< "$result"
    IFS=":" read V4 stat1 <<< "$V1"
    IFS=":" read V5 msgid1 <<< "$V2"
    SR_status=`echo $stat1 | tr -d {}\"`
    SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
    SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"
    SR_msgid=`echo $msgid1 | tr -d {}\"`
    if [ "$SRTESTMODE" != '' ]
    then
        echo $SR_msgid > srio.msgid
    fi

    if [ "$SR_status" == "" ]
    then
        SR_status='SERVER ERROR'
        retmsg="$SR_status"
        echo "$retmsg"
        return 1
    fi
    if [ "$SR_status" != "OK" ]
    then
        retmsg="$SR_status"
        echo "$retmsg"
        return 1
    fi

    #
    # Process the file uploads
    #
    count=${#fkeys[@]}
    for (( i=0; i < $count; i++ ))
    do
        fkey=${fkeys[$i]}
        fpath=${fpaths[$i]}
        atfpath='@'$fpath
        is_encrypted=0

        file_name=`basename $fpath`
        file_ext=${file_name##*.}

        if [ "$file_ext" == "png" ]
        then
            #
            # Encrypt or base64 encode the binary file
            #
            file_content_type="image/png"
            mkdir -p /tmp/scriptremote
            tempfile=$(/bin/mktemp -p /tmp/scriptremote --suffix=png)
            if [ "$SR_passphrase" != '' ]
            then
                encrypt_file "$SR_passphrase" "$fpath" "$tempfile"
                is_encrypted=1
            else
                base64 $fpath > $tempfile
            fi
            atfpath='@'$tempfile
        elif [ "$file_ext" == "svg" ]
        then
            file_content_type="image/svg+xml"
            # Encrypt the file if needed
            if [ "$SR_passphrase" != '' ]
            then
                mkdir -p /tmp/scriptremote
                tempfile=$(/bin/mktemp -p /tmp/scriptremote --suffix=svg)
                atfpath='@'$tempfile
                encrypt_file "$SR_passphrase" "$fpath" "$tempfile"
                is_encrypted=1
            fi
        else
            file_content_type="text/plain"
            # Encrypt the file if needed
            if [ "$SR_passphrase" != '' ]
            then
                mkdir -p /tmp/scriptremote
                tempfile=$(/bin/mktemp -p /tmp/scriptremote --suffix=txt)
                atfpath='@'$tempfile
                encrypt_file "$SR_passphrase" "$fpath" "$tempfile"
                is_encrypted=1
            fi
        fi

        url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/"${loc_encoded}"/msgs/${SR_msgid}/files"
        result=`curl -sS --request POST --user ${SR_userid}:${SR_token} --form "file_key=$fkey;type=text/plain" --form "file=$atfpath;type=$file_content_type" --form encrypted="$is_encrypted" --user-agent $SR_agent $url`
        rm -f "$tempfile"

        # Parse json result
        IFS="," read V1 V2 <<< "$result"
        IFS=":" read V3 stat1 <<< "$V1"
        SR_status=`echo $stat1 | tr -d {}\"`
        SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
        SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

        if [ "$SR_status" == "" ]
        then
            SR_status='SERVER ERROR'
            retmsg="$SR_status"
            echo "$retmsg"
            return 1
        fi
        if [ "$SR_status" != "OK" ]
        then
            retmsg="$SR_status"
            echo "$retmsg"
            return 1
        fi
    done

    if [ $reply != True ]
    then
        #
        # All done if no reply needed
        #
        return 0
    fi

    reply_timeout=600
    if [ $# -ge 2 ]
    then
        reply_timeout=${2}
    fi
    start_time=`date +%s`
    timeout=$((60*$reply_timeout))

    reply_sleep=1
    sleep1=$((60*$reply_sleep))
    current_time=`date +%s`

    #
    # Wait for a reply. Usinglong-polling so the loop
    # is for fallback if the connection dies before reply
    # is sent.
    #
    while [ $(( $current_time - $start_time )) -lt $timeout ]
    do
        max_time=$(($timeout + $start_time - `date +%s`))
        url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/"${loc_encoded}"/msgs/${SR_msgid}/reply"
        result=`curl -sS --request GET --max-time $max_time --user ${SR_userid}:${SR_token} --user-agent $SR_agent $url`
        # Check for max-time code
        if [ $? -eq 28 ]
        then
            break
        fi
        # Parse json result
        #
        IFS="," read V1 V2 <<< "$result"
        IFS=":" read V3 stat1 <<< "$V1"
        IFS=":" read V4 reply_content1 <<< "$V2"
        SR_status=`echo $stat1 | tr -d {}:,\"`
        SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
        SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"
        reply_content2=${reply_content1%\}}
        reply_content3=${reply_content2# }

        if [ "$SR_status" == "OK" ] && [ "$reply_content3" != null ]
        then
            # reply_content3 is of the form:
            # "[{"name":string,"value":string},...]"

            reply_content4=${reply_content3%]\"}
            reply_content5=${reply_content4#\"[}
            reply_len=${#reply_content5}

            # Split the top-level objects into a bash array of strings
            #
            level=0
            lastpos=0
            objects=()
            for (( i=0; i < $reply_len; i++ ))
            do
                if [ "${reply_content5:$i:1}" == "," ] && [ $level -eq 0 ]
                then
                    sublen=`expr $i - $lastpos`
                    objects+=("\"${reply_content5:$lastpos:$sublen}\"")
                    lastpos=`expr $i + 1`
                elif [ "${reply_content5:$i:1}" == "{" ]
                then
                    level=$(($level+1))
                elif [ "${reply_content5:$i:1}" == "}" ]
                then
                    level=$(($level-1))
                fi
            done
            sublen=`expr $i - $lastpos`
            objects+=("\"${reply_content5:$lastpos:$sublen}\"")
            #
            # parse the json objects
            #
            msg_concat=''
            obj_count=${#objects[@]}
            for (( i=0; i < $obj_count; i++ ))
            do
                object=${objects[$i]}
                item1=${object%%,\"value\":*}
                IFS=':' read label name1 <<< "$item1"
                value1=${object##*,\"value\":}
                value2=${value1%\}\"}
                value3=${value2#\"}
                value4=${value3%\"}
                name2=${name1#\"}
                name3=${name2%\"}

                if [ "$SR_passphrase" != '' ]
                then
                    # Concatentate encrypted message contents for 
                    # hmac check and decrypt
                    last=`expr $obj_count - 1`
                    if [ $i -lt $last ]
                    then
                        msg_concat="$msg_concat""$name3""$value4"
                        name3=`decrypt_var "$SR_passphrase" "$name3"`
                        value4=`decrypt_var "$SR_passphrase" "$value4"`
                        SR_reply_dict["$name3"]="$value4"
                    else
                        remote_hmac="$value4"
                    fi
                else
                    SR_reply_dict["$name3"]="$value4"
                fi
            done                

            if [ "$SR_passphrase" != '' ]
            then
                # Check reply message authentication
                hmac=`hmac_var "$SR_passphrase" "$msg_concat"`
                if [ "$hmac" != "$remote_hmac" ]
                then
                    SR_reply_dict=()
                    SR_status='REPLY FAILS AUTHENTICATION'
                    retmsg="$SR_status"
                    echo "$retmsg"
                    return 1
                fi
            fi
            #
            # Reply was successful so send acknowledgement
            #
            url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/locations/"${loc_encoded}"/msgs/${SR_msgid}/reply_ack"
            result=`curl -sS --request PUT --user ${SR_userid}:${SR_token} --user-agent $SR_agent --data-urlencode dummy="1" $url`
            IFS="," read V1 V2 <<< "$result"
            IFS=":" read V3 stat1 <<< "$V1"
            SR_status=`echo $stat1 | tr -d {}\"`
            SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
            SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

            if [ "$SR_status" == "" ]
            then
                SR_status='SERVER ERROR'
                retmsg="$SR_status"
                echo "$retmsg"
                return 1
            fi
            if [ "$SR_status" != "OK" ]
            then
                retmsg="$SR_status"
                echo "$retmsg"
                return 1
            fi

            return 0
        fi
        #
        # Rate limit requests if connection dies before min elapsed time
        #
        prev_time=$current_time
        current_time=`date +%s`
        if [ $(( $current_time - $prev_time )) -lt $sleep1 ]
        then
            sleep $sleep1
            current_time=`date +%s`
        fi
    done

    SR_status="REPLY TIMEOUT"
    retmsg="$SR_status"
    echo "$retmsg"
    return 1
}

#
# SR_clear
#
function SR_clear ()
{
    SR_status="OK"
    return 0
}


#
# SR_end
#
function SR_end ()
{
    local result V1 V3

    if [ "$SR_userid" == "" ]
    then
        SR_status='SR_end: JOB NOT STARTED'
        echo "$SR_status"
        return 1
    fi

    if [ "$SR_status" != "OK" ]
    then
        echo "$SR_status"
        return 1
    fi

    tsn=`date "+%Y-%m-%d %T.%N"`
    ts=${tsn%??????}
    url="${SR_api_url}/projects/${SR_project_encoded}/jobs/${SR_jobid}/end"
    result=`curl -sS --request PUT --user ${SR_userid}:${SR_token} --data-urlencode timestamp="$ts"  --user-agent $SR_agent $url`

    IFS="," read V1 V2 <<< "$result"
    IFS=":" read V3 stat1 <<< "$V1"
    SR_status=`echo $stat1 | tr -d {}\"`
    SR_status="${SR_status#"${SR_status%%[![:space:]]*}"}"
    SR_status="${SR_status%"${SR_status##*[![:space:]]}"}"

    if [ "$SR_status" == "" ]
    then
        echo "SERVER ERROR"
        return 1
    fi
    if [ "$SR_status" != "OK" ]
    then
        echo "$SR_status"
        return 1
    fi
    return 0
}

#
# encrypt_var <passphrase> <value>
#
# Encrypts value of a variable.
# Output is modified base64 - slash translated to
# dash to be url-safe
#
function encrypt_var ()
{
    salt=`openssl rand -hex 8`
    if [ $? != 0 ]
    then
        echo ""
        return 1
    fi
    result=`echo -n "${2}" | openssl aes-256-ctr -S "$salt" -a -A -pass pass:"${1}" | tr "/" "-"`

    if [ $? != 0 ]
    then
        echo ""
        return 1
    fi
    #echo -n "$result"
    echo -n ${result#(stdin)= }
}

#
# encrypt_file <passphrase> <infile> <outfile>
#
# Encrypts a file
#
function encrypt_file ()
{
    salt=`openssl rand -hex 8`
    openssl aes-256-ctr -S "$salt" -a -A -pass pass:"${1}" -in "${2}" -out "${3}"
}

#
# decrypt_var <passphrase> <value>
#
# Decrypts value of a variable
#
function decrypt_var ()
{
    result=`tr "-" "/" <<< "${2}" | openssl aes-256-ctr -salt -d -a -A -pass pass:"${1}"`
    if [ $? != 0 ]
    then
        echo ""
        return 1
    fi
    echo -n ${result#(stdin)= }
}

#
# decrypt_file <passphrase> <infile> <outfile>
#
# Decrypts a file
#
function decrypt_file ()
{
    openssl aes-256-ctr -salt -a -A -d -pass pass:"${1}" -in "${2}" -out "${3}"
}

#
# hmac_var <passphrase> <value>
#
# Computes hmac of a value
#
function hmac_var ()
{
    ohmac=`echo -n "${2}" | openssl dgst -sha256 -hex -hmac "${1}"`
    echo -n ${ohmac#(stdin)= }
}

#
# stackoverflow.com/questions/296536/how-to-urlencode-data-for-curl-command
#
# A pure bash method, but doesnt work for unicode
#
function rawurlencode() {
  local string="${1}"
  local strlen=${#string}
  local encoded=""

  for (( pos=0 ; pos<strlen ; pos++ )); do
     c=${string:$pos:1}
     case "$c" in
        [-_.~a-zA-Z0-9] ) o="${c}" ;;
        * )               printf -v o '%%%02x' "'$c"
     esac
     encoded+="${o}"
  done
  echo "${encoded}"    # You can either set a return variable (FASTER) 
  REPLY="${encoded}"   #+or echo the result (EASIER)... or both... :p
}

#
# stackoverflow.com/questions/296536/how-to-urlencode-data-for-curl-command
#
# Use curl internal encoder - works for unicode
#
urlencode() {
    local data
    if [[ $# != 1 ]]; then
        echo ""
        return 1
    fi
    # atsign is a special character for --data-urlencode, so
    # need to handle it separately
    encoded=''
    remainder="$1"
    while [ "$remainder" != '' ]
    do
        remainder1="$remainder"
        IFS="@" read part remainder <<< "$remainder1"
        data="$(curl -s -o /dev/null -w %{url_effective} --get --data-urlencode "$part" "")"
        if [[ $? != 3 ]]; then
            echo ""
            return 1
        fi
        if [ "$encoded" != '' ]
        then
            encoded="${encoded}%40${data##/?}"
        else
            encoded="${data##/?}"
        fi
    done

    echo "$encoded"
    return 0
}

