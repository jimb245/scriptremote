set terminal pngcairo  transparent enhanced font "arial,10"  size 500, 350 
set output 'heatmaps.png'
set format cb "%4.1f"
set view 49, 28, 1, 1.48
set samples 25, 25
set isosamples 50, 50
set ticslevel 0
set cbtics border in scale 0,0 mirror norotate  offset character 0, 0, 0
set title "4D data (3D Heat Map)\nIndependent value color-mapped onto 3D surface" 
set title  offset character 0, 1, 0 font "" norotate
set xlabel "x" 
set xlabel  offset character 3, 0, 0 font "" textcolor lt -1 norotate
set xrange [ 5.00000 : 35.0000 ] noreverse nowriteback
set ylabel "y" 
set ylabel  offset character -5, 0, 0 font "" textcolor lt -1 rotate by -270
set yrange [ 5.00000 : 35.0000 ] noreverse nowriteback
set zlabel "z" 
set zlabel  offset character 2, 0, 0 font "" textcolor lt -1 norotate
set pm3d implicit at s
set colorbox user
set colorbox vertical origin screen 0.9, 0.2, 0 size screen 0.03, 0.6, 0 front noborder
Z(x,y) = 100. * (sinc(x,y) + 1.5)
sinc(x,y) = sin(sqrt((x-20.)**2+(y-20.)**2))/sqrt((x-20.)**2+(y-20.)**2)
color(x,y) = 10. * (1.1 + sin((x-20.)/5.)*cos((y-20.)/10.))
GPFUN_Z = "Z(x,y) = 100. * (sinc(x,y) + 1.5)"
GPFUN_sinc = "sinc(x,y) = sin(sqrt((x-20.)**2+(y-20.)**2))/sqrt((x-20.)**2+(y-20.)**2)"
GPFUN_color = "color(x,y) = 10. * (1.1 + sin((x-20.)/5.)*cos((y-20.)/10.))"
splot '++' using 1:2:(Z($1,$2)):(color($1,$2)) with pm3d title "4 data columns x/y/z/color"
