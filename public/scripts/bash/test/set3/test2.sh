#!/bin/bash
#
# Test SR_JOBS_PER_PROJECT == 4
#

#set -x

. "$BATSDIR"/srio.sh
. "$BATSDIR"/srutil.sh
cd "$BATSDIR"/set3

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project2' 'Job'
if [ $? != 0 ]
then
    exit 1
fi


SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project2' 'Job'
if [ $? != 0 ]
then
    exit 1
fi


SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project2' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project2' 'Job'
if [ $? != 0 ]
then
    exit 1
fi

SR_end
if [ $? != 0 ]
then
    exit 1
fi

SR_start "$SRUSER" "$SRTOKEN" 'TEST(set3)-Project2' 'Job'
if [ $? == 0 ]
then
    exit 1
fi


SR_delete_project
exit 0
