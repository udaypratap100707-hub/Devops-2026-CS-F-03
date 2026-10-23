@echo off
REM usage: push.bat https://github.com/<user>/<repo>.git "commit message"
if not exist .git git init
git add .
git commit -m %2
git branch -M main
git remote remove origin 2>nul
git remote add origin %1
git push -u origin main
