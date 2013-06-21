===================================================
tagtacular.js v0.5.1
A jQuery library for tags management.
http://gototech.com/tagtacular/sample/
===================================================
Copyright 2013 Eric W. Burns

Licensed under the Mozilla Public License, Version 2.0 You may not use this work except in compliance with the License.

http://www.mozilla.org/MPL/2.0/

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See online documentation for complete instructions. Requires jquery.js and jqueryui.js.
===================================================

Go here to see it in action: http://gototech.com/tagtacular/sample/

Tagtacular.js is an open source tag management library released under the Mozilla Public License, Version 2.0. The goals of this project are:

* very easy to setup with default behavior
* very flexible customization options
* minimal requirements and minimal assumptions about your technology stack and architecture

Tagtacular requires jQuery and jQueryUI. See samples/index.html for examples of how to use.

This is a work in progress. Basic functionality is up and running, but it needs to have some css examples, config examples, and lots of documentation. Look for frequent updates in the coming weeks.

In the meantime, look at the settings object at the bottom of tagtacular.js, and you'll be able to see a lot of the ways to configure. Most of them work (not all), I just need to write some docs! 

commitAddTag and commitRemoveTag in the initialization object are the callbacks that should talk to the backend to commit your changes. Pass in your functions when initializing.

Eric Burns, June 2013
