@echo off
set nodebat="C:\Program Files\nodejs\nodevars.bat"
set curdir=%cd%
@echo on
C:\Windows\System32\cmd.exe /k "%nodebat% %curdir%"