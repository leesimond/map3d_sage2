Place csv files in directory /data
The application will load csv files listed in /scripts/csvFileNames.txt
Each filename must be separated with a newline. E.g:
data1.csv
data2.csv

Scripts have been provided (updateFileList-bash.sh and updateFileList-windows.bat) that automatically look in /data folder and create/write csvFileNames.txt. Only one execution of either script is necessary.