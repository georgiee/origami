#!/bin/bash
file="$1"
postfix='.decoded'

java -jar origami-files-reader.jar $file
ruby O3D-reader.rb $file$postfix