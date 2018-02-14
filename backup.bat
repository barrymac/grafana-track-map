@echo off
rem backup zipfilename with date

rem XDate = AAAA.MM.DD
for /f "tokens=1-3 delims=/- " %%a in ('date /t') do set XDate=%%c.%%b.%%a
for %%* in (.) do set file_prefix=%%~nx*

rem base path for source projects
rem set folder=D:\inetpub\webs\gadanit\yii\gadan

rem zip file name = prefix + _ + date + .zip
set dest=".\_bkp"
set fn=%dest%\%file_prefix%_%XDate%.zip
md %dest% 2>NUL

echo zipping file(s) to %fn%... 
rem zip -r // recurse in subfolders
rem zip source folders
c:\zip.exe %fn% .\*.js > NUL
c:\zip.exe %fn% .\*.json > NUL
c:\zip.exe %fn% .\*.sql > NUL
c:\zip.exe %fn% .\*.md > NUL
c:\zip.exe %fn% .\*.pem > NUL
c:\zip.exe -r %fn% .\src\*.* > NUL
c:\zip.exe -r %fn% .\spec\*.* > NUL

rem c:\zip.exe -r %fn% .\protected\*.* -x *.log > NUL
