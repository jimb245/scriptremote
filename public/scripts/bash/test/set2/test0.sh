#!/bin/bash
#
# Check environment
#

if [ "$SRUSER" == '' ]
then
    echo "SRUSER not defined"
    exit 1
fi

if [ "$SRTOKEN" == '' ]
then
    echo "SRTOKEN not defined"
    exit 1
fi

if [ "$SREMAIL" == '' ]
then
    echo "SREMAIL not defined"
    exit 1
fi


if [ "$SRSHAREUSER" == '' ]
then
    echo "SRSHAREUSER not defined"
    exit 1
fi

if [ "$SRSHARETOKEN" == '' ]
then
    echo "SRSHARETOKEN not defined"
    exit 1
fi

if [ "$SRSHAREEMAIL" == '' ]
then
    echo "SRSHAREEMAIL not defined"
    exit 1
fi

if [ "$SRTESTMODE" == '' ]
then
    echo "SRTESTMODE not defined"
    exit 1
fi

