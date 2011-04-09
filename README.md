MASTERPLAN.
===========

By [Brandon Arbini][me] @ [Zencoder][zencoder].

MASTERPLAN is useful for high-level feature tracking.


Background
----------

At Zencoder we use [Pivotal Tracker][pivotal] to manage our development process. Pivotal Tracker is great, really, but stories are very granular (by design) and features get lost. Major features are usually made up of many stories in Pivotal, which makes it hard to keep track of whole features as they move through development, QA, staging, and the various stages of being released. While we used to keep a list of features in a text file in [Dropbox][dropbox] (but no one looked at regularly), we now use MASTERPLAN to keep the whole team on the same page.

Technology
----------

On the back-end, MASTERPLAN is a [Sinatra][sinatra] application using [Redis][redis] as the datastore through the [Toy Store][toystore] gem. All of the gem dependencies are managed with [Bundler][bundler] and specified in the Gemfile. On the front-end, MASTERPLAN is an HTML5  application using the [Backbone.js][backbone] MVC framework, [ICanHaz.js][icanhaz] with [Mustache.js][mustache] for templating, and [jQuery UI][jqueryui] for sorting magic.

Setup
-----

MASTERPLAN is [rackable][rackable] and comes with a `config.ru` file to get up and running easily. You can start it by running `rackup`, running under [Passenger][passenger], or by using [Pow][pow]. By default, MASTERPLAN will use a Redis URL of `redis://127.0.0.1:6379/0`, but you can specify a different URL in `app.yml`.

Keyboard Shortcuts
------------------

    , or k      previous feature
    . or j      next feature
    n           new feature
    enter       begin/end editing
    esc         end editing
    x           delete feature


© 2011 Brandon Arbini.  
Released under the [MIT license][mit].



[me]: http://about.me/brandonarbini
[zencoder]: http://zencoder.com
[pivotal]: http://pivotaltracker.com
[dropbox]: http://dropbox.com
[sinatra]: http://sinatrarb.com
[redis]: http://redis.io
[toystore]: http://github.com/newtoy/toystore
[bundler]: http://gembundler.com
[backbone]: http://documentcloud.github.com/backbone
[icanhaz]: http://icanhazjs.com
[mustache]: http://mustache.github.com
[jqueryui]: http://jqueryui.com
[rackable]: http://rack.rubyforge.org
[passenger]: http://modrails.com
[pow]: http://pow.cx
[mit]: http://opensource.org/licenses/mit-license.php
