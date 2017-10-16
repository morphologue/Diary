# Diary
A web app for diarising life events. Rich text editing is supported on desktops and tablets, including image embedding on desktops. On mobiles a textarea is provided for direct HTML editing (the result of which is sanitised).

## Hosting
An instance of this app is hosted at https://gavin-tech.com/diary

## Building
Local build is known to work on Windows with the following globally installed:

* MySQL Server 5.7
* Node 8.5.0
  * npm 5.4.2
  * webpack 3.7.1
  * tsc 2.5.2
* Visual Studio 2017
  * Install the Webpack Task Runner extension.
  * Configure the "External Web Tools" path to prefer the system Node, NPM etc. over those bundled with VS.
