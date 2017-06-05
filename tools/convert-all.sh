#!/bin/sh
postfix='.decoded'
files=( bases/3x3base.ori bases/4x4base.ori bases/birdbase.ori bases/bombbase.ori bases/fishbase.ori bases/organbase.ori bases/squarebase.ori examples/airplane.ori examples/boat.ori examples/bomb.ori examples/butterfly.ori examples/catamaran.ori examples/chair.ori examples/crane.ori examples/crown.ori examples/dragon.ori examples/fortune.ori examples/frog.ori examples/glynnbox.ori examples/goldfish.ori examples/helicopter.ori examples/kabuto.ori examples/kazaribox.ori examples/leporello.ori examples/lily.ori examples/masubox.ori examples/miura.ori examples/mouse.ori examples/omegastar.ori examples/owl.ori examples/pelican.ori examples/phoenix.ori examples/pigeon.ori examples/pine.ori examples/pinwheel.ori examples/rose.ori examples/sanbow.ori examples/seahorse.ori examples/table.ori examples/whale.ori examples/yakko.ori )

for file in "${files[@]}"
do
    java -jar origami-files-reader.jar "models/${file}"
    ruby O3D-reader.rb "models/${file}"$postfix
done