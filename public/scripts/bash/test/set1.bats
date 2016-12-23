#!/usr/bin/env bats
#
# Basic Tests
#

#
# Load environment variables - these are automatically
# generated by a grunt task
#
load credentials

@test "Check environment" {
    run "$BATSDIR"/set1/test0.sh
    [ "$status" -eq 0 ]
}

@test "Incorrect user id" {
    run "$BATSDIR"/set1/test1.sh
    [ "$status" -eq 0 ]
}

@test "Incorrect user token" {
    run "$BATSDIR"/set1/test2.sh
    [ "$status" -eq 0 ]
}

@test "SR_start incomplete args" {
    run "$BATSDIR"/set1/test3.sh
    [ "$status" -eq 0 ]
}

@test "SR_set incomplete args" {
    run "$BATSDIR"/set1/test4.sh
    [ "$status" -eq 0 ]
}

@test "SR_set invalid reply flag" {
    run "$BATSDIR"/set1/test5.sh
    [ "$status" -eq 0 ]
}

@test "SR_send incomplete args" {
    run "$BATSDIR"/set1/test6.sh
    [ "$status" -eq 0 ]
}

@test "SR_set job not started" {
    run "$BATSDIR"/set1/test7.sh
    [ "$status" -eq 0 ]
}

@test "Send simple content and text file" {
    run "$BATSDIR"/set1/test8.sh
    [ "$status" -eq 0 ]
}

@test "Simple unicode" {
    run "$BATSDIR"/set1/test9.sh
    [ "$status" -eq 0 ]
}

@test "Slash in project name" {
    run "$BATSDIR"/set1/test10.sh
    [ "$status" -eq 0 ]
}

@test "Slash in location name" {
    run "$BATSDIR"/set1/test11.sh
    [ "$status" -eq 0 ]
}

@test "Simple reply" {
    run "$BATSDIR"/set1/test12.sh
    [ "$status" -eq 0 ]
}

@test "Reply timeout" {
    run "$BATSDIR"/set1/test13.sh
    [ "$status" -eq 0 ]
}

@test "Spaces in names" {
    run "$BATSDIR"/set1/test14.sh
    [ "$status" -eq 0 ]
}

@test "png file" {
    run "$BATSDIR"/set1/test15.sh
    [ "$status" -eq 0 ]
}

@test "Backtick in project name" {
    run "$BATSDIR"/set1/test16.sh
    [ "$status" -eq 0 ]
}

@test "Backtick in location name" {
    run "$BATSDIR"/set1/test17.sh
    [ "$status" -eq 0 ]
}

@test "Dollar and allowed backtick in literal args" {
    run "$BATSDIR"/set1/test18.sh
    [ "$status" -eq 0 ]
}

@test "Variables as args with values including dollar, space, backtick" {
    run "$BATSDIR"/set1/test19.sh
    [ "$status" -eq 0 ]
}

@test "svg file" {
    run "$BATSDIR"/set1/test20.sh
    [ "$status" -eq 0 ]
}

@test "Commas in names" {
    run "$BATSDIR"/set1/test21.sh
    [ "$status" -eq 0 ]
}

@test "Commas in names" {
    run "$BATSDIR"/set1/test22.sh
    [ "$status" -eq 0 ]
}

@test "Colons in names" {
    run "$BATSDIR"/set1/test23.sh
    [ "$status" -eq 0 ]
}

@test "Colons in names" {
    run "$BATSDIR"/set1/test24.sh
    [ "$status" -eq 0 ]
}

@test "Multiple reply content entries" {
    run "$BATSDIR"/set1/test25.sh
    [ "$status" -eq 0 ]
}

@test "Double quote in project name" {
    run "$BATSDIR"/set1/test26.sh
    [ "$status" -eq 0 ]
}

@test "Double quote in SR_set name" {
    run "$BATSDIR"/set1/test27.sh
    [ "$status" -eq 0 ]
}

@test "Double quote in location name" {
    run "$BATSDIR"/set1/test28.sh
    [ "$status" -eq 0 ]
}

@test "Single quote in project name" {
    run "$BATSDIR"/set1/test29.sh
    [ "$status" -eq 0 ]
}

@test "Single quote in SR_set name" {
    run "$BATSDIR"/set1/test30.sh
    [ "$status" -eq 0 ]
}

@test "Single quote in location name" {
    run "$BATSDIR"/set1/test31.sh
    [ "$status" -eq 0 ]
}

@test "Backslash in project name" {
    run "$BATSDIR"/set1/test32.sh
    [ "$status" -eq 0 ]
}

@test "Backslash in SR_set name" {
    run "$BATSDIR"/set1/test33.sh
    [ "$status" -eq 0 ]
}

@test "Backslash in location name" {
    run "$BATSDIR"/set1/test34.sh
    [ "$status" -eq 0 ]
}

@test "Add job to existing project" {
    run "$BATSDIR"/set1/test35.sh
    [ "$status" -eq 0 ]
}

@test "Add job to shared project" {
    run "$BATSDIR"/set1/test36.sh
    [ "$status" -eq 0 ]
}

@test "Multiple content items and files" {
    run "$BATSDIR"/set1/test37.sh
    [ "$status" -eq 0 ]
}

@test "Send empty message" {
    run "$BATSDIR"/set1/test38.sh
    [ "$status" -eq 0 ]
}

@test "Simple utf8" {
    run "$BATSDIR"/set1/test39.sh
    [ "$status" -eq 0 ]
}

@test "Multiple locations" {
    run "$BATSDIR"/set1/test40.sh
    [ "$status" -eq 0 ]
}

@test "Add jobs to multiple existing projects" {
    run "$BATSDIR"/set1/test41.sh
    [ "$status" -eq 0 ]
}

@test "Try to access shared project with invalid email" {
    run "$BATSDIR"/set1/test42.sh
    [ "$status" -eq 0 ]
}

@test "Try to add job to shared project with no permission" {
    run "$BATSDIR"/set1/test43.sh
    [ "$status" -eq 0 ]
}

@test "Try to add job to shared project with read permission" {
    run "$BATSDIR"/set1/test44.sh
    [ "$status" -eq 0 ]
}

@test "Try to add job to shared project with reply permission" {
    run "$BATSDIR"/set1/test45.sh
    [ "$status" -eq 0 ]
}

@test "Multiple messages per location" {
    run "$BATSDIR"/set1/test46.sh
    [ "$status" -eq 0 ]
}

@test "Try to send message after end" {
    run "$BATSDIR"/set1/test47.sh
    [ "$status" -eq 0 ]
}

@test "Try to modify sharing of non-owned project" {
    run "$BATSDIR"/set1/test48.sh
    [ "$status" -eq 0 ]
}

@test "Try to modify description of non-owned project with read permission" {
    run "$BATSDIR"/set1/test49.sh
    [ "$status" -eq 0 ]
}

@test "Try to modify description of non-owned project with reply permission" {
    run "$BATSDIR"/set1/test50.sh
    [ "$status" -eq 0 ]
}

@test "Modify description of non-owned project with write permission" {
    run "$BATSDIR"/set1/test51.sh
    [ "$status" -eq 0 ]
}

@test "Try to modify description of non-owned project with no permission" {
    run "$BATSDIR"/set1/test52.sh
    [ "$status" -eq 0 ]
}

@test "Try to add notification for non-owned project with no permission" {
    run "$BATSDIR"/set1/test53.sh
    [ "$status" -eq 0 ]
}