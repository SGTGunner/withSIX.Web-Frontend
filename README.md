withSIX.Web-Frontend - SIX Networks
=============

Homepage: http://www.withSIX.com

## Notes

Angular code (cdn_source/app) is considered legacy code.
The new framework used is Aurelia (cdn_source/aurelia).

## How to build

Requires NodeJS 4.1.2. (Recommended to use nvm)
Recommended editor: atom.io with atom-typescript plugin.

Initial / on package updates

1. run (from project root): npm install
2. run (from cdn/aurelia): jspm install

While developing, run background watcher and compiler:

1. run (from project root): grunt watch
The webbrowser will open at the end.
