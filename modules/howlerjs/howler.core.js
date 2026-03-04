define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  /*!
   *  howler.js v2.2.3
   *  howlerjs.com
   *
   *  (c) 2013-2020, James Simpson of GoldFire Studios
   *  goldfirestudios.com
   *
   *  MIT License
   */

  /** Global Methods **/
  /***************************************************************************/

  /**
   * Create the global controller. All contained methods and properties apply
   * to all sounds that are currently playing or will be in the future.
   */
  var HowlerGlobal = function () {
    // Create a global ID counter.
    this._counter = 1000;

    // Internal properties.
    this._howls = [];
    this._muted = false;
    this._volume = 1;

    // Public properties.
    this.masterGain = null;
    this.noAudio = false;
    this.autoSuspend = true;
    this.ctx = null;
    this.bound_onAutoSuspendTimeout = this._onAutoSuspendTimeout.bind(this);
    this.bound_handleSuspension = this._handleSuspension.bind(this);
    this.bound_onCtxResume = this._onCtxResume.bind(this);

    // Setup the various state values for global tracking.
    this._setup();
  };
  HowlerGlobal.prototype = {
    /**
     * Setup various state values for global tracking.
     * @return {Howler}
     */
    _setup: function () {
      // Keeps track of the suspend/resume state of the AudioContext.
      this.state = this.ctx ? this.ctx.state || 'suspended' : 'suspended';

      // Automatically begin the 30-second suspend process
      this._autoSuspend();
      return this;
    },
    _handleSuspension: function () {
      var self = this;
      // Handle updating the state of the audio context after suspending.
      self.state = 'suspended';
      if (self._resumeAfterSuspend) {
        delete self._resumeAfterSuspend;
        self._autoResume();
      }
    },
    _onAutoSuspendTimeout: function () {
      var self = this;
      if (!self.autoSuspend) {
        return;
      }
      self._suspendTimer = null;
      self.state = 'suspending';

      // Either the state gets suspended or it is interrupted.
      // Either way, we need to update the state to suspended.
      self.ctx.suspend().then(self.bound_handleSuspension, self.bound_handleSuspension);
    },
    /**
     * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
     * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
     * @return {Howler}
     */
    _autoSuspend: function () {
      var self = this;
      if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined') {
        return;
      }

      // Check if any sounds are playing.
      for (var i = 0; i < self._howls.length; i++) {
        for (var j = 0; j < self._howls[i]._sounds.length; j++) {
          if (!self._howls[i]._sounds[j]._paused) {
            return self;
          }
        }
      }
      if (self._suspendTimer) {
        clearTimeout(self._suspendTimer);
      }
      //console.log('setTimeout');
      // If no sound has played after 30 seconds, suspend the context.
      self._suspendTimer = setTimeout(self.bound_onAutoSuspendTimeout, 30000);
      return self;
    },
    _onCtxResume: function () {
      var self = this;
      self.state = 'running';

      // Emit to all Howls that the audio has resumed.
      for (var i = 0; i < self._howls.length; i++) {
        if (self._howls[i]._onResume) {
          self._howls[i]._onResume();
        }
      }
    },
    /**
     * Automatically resume the Web Audio AudioContext when a new sound is played.
     * @return {Howler}
     */
    _autoResume: function () {
      var self = this;
      if (!self.ctx || typeof self.ctx.resume === 'undefined') {
        return;
      }
      if (self.state === 'running' && self.ctx.state !== 'interrupted' && self._suspendTimer) {
        clearTimeout(self._suspendTimer);
        self._suspendTimer = null;
      } else if (self.state === 'suspended' || self.state === 'running' && self.ctx.state === 'interrupted') {
        self.ctx.resume().then(self.bound_onCtxResume);
        if (self._suspendTimer) {
          clearTimeout(self._suspendTimer);
          self._suspendTimer = null;
        }
      } else if (self.state === 'suspending') {
        self._resumeAfterSuspend = true;
      }
      return self;
    }
  };

  // Setup the global audio controller.
  var Howler = new HowlerGlobal();
  var cache = {};

  /**
   * Sound is now loaded, so finish setting everything up and fire the loaded event.
   * @param  {Howl} self
   * @param  {Object} buffer The decoded buffer sound source.
   */
  var loadSound = function (self, buffer) {
    // Set the duration.
    if (buffer && !self._duration) {
      self._duration = buffer.duration;
    }

    // Setup a sprite if none is defined.
    if (Object.keys(self._sprite).length === 0) {
      self._sprite = {
        __default: [0, self._duration * 1000]
      };
    }

    // Fire the loaded event.
    if (self._state !== 'loaded') {
      self._state = 'loaded';
      self._loadQueue();
    }
  };

  /**
   * Decode audio data from an array buffer.
   * @param  {ArrayBuffer} arraybuffer The audio data.
   * @param  {Howl}        self
   */
  var decodeAudioData = function (arraybuffer, self) {
    // Fire a load error if something broke.
    var error = function () {
      console.log('loaderror');
    };

    // Load the sound on success.
    var success = function (buffer) {
      if (buffer && self._sounds.length > 0) {
        cache[self._src] = buffer;
        loadSound(self, buffer);
      } else {
        error();
      }
    };

    // Decode the buffer into an audio source.
    if (Howler.ctx.decodeAudioData.length === 1) {
      Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
    } else {
      Howler.ctx.decodeAudioData(arraybuffer, success, error);
    }
  };

  /**
   * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
   * @param  {Howl} self
   */
  var loadBuffer = function (self) {
    var url = self._src;

    // Check if the buffer has already been cached and use it instead.
    if (cache[url]) {
      // Set the duration from the cache.
      self._duration = cache[url].duration;
      // Load the sound into this Howl.
      loadSound(self);
      return;
    }

    // Load the buffer from the URL.
    var xhr = new XMLHttpRequest();
    xhr.open(self._xhr.method, url, true);
    xhr.withCredentials = self._xhr.withCredentials;
    xhr.responseType = 'arraybuffer';

    // Apply any custom headers to the request.
    if (self._xhr.headers) {
      Object.keys(self._xhr.headers).forEach(function (key) {
        xhr.setRequestHeader(key, self._xhr.headers[key]);
      });
    }
    xhr.onload = function () {
      // Make sure we get a successful response back.
      var code = (xhr.status + '')[0];
      if (code !== '0' && code !== '2' && code !== '3') {
        console.log('loaderror');
        return;
      }
      decodeAudioData(xhr.response, self);
    };
    xhr.onerror = function () {
      // If there is an error, switch to noAudio.
      self.noAudio = true;
      self._sounds = [];
      delete cache[url];
      self.load();
    };
    try {
      xhr.send();
    } catch (e) {
      xhr.onerror();
    }
  };

  /**
   * Setup the audio context when available, or set noAudio to true
   */
  var setupAudioContext = function () {
    // If we have already detected that Web Audio isn't supported, don't run this step again.
    if (Howler.noAudio) {
      return;
    }

    // Check if we are using Web Audio and setup the AudioContext if we are.
    try {
      if (typeof AudioContext !== 'undefined') {
        Howler.ctx = new AudioContext();
      } else {
        Howler.noAudio = true;
      }
    } catch (e) {
      Howler.noAudio = true;
    }

    // If the audio context creation still failed, set using web audio to false.
    if (!Howler.ctx) {
      Howler.noAudio = true;
    }

    // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
    if (!Howler.noAudio) {
      Howler.masterGain = Howler.ctx.createGain();
      Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
      Howler.masterGain.connect(Howler.ctx.destination);
    }

    // Re-run the setup on Howler.
    Howler._setup();
  };

  /**
   * Setup the sound object, which each node attached to a Howl group is contained in.
   * @param {Object} howl The Howl parent group.
   */
  var Sound = function (howl) {
    this._parent = howl;
    this.init();
  };
  Sound.prototype = {
    /**
     * Initialize a new Sound object.
     * @return {Sound}
     */
    init: function () {
      var self = this;
      var parent = self._parent;

      // Setup the default parameters.
      self._muted = parent._muted;
      self._volume = parent._volume;
      self._paused = true;
      self._ended = true;
      self._sprite = '__default';

      // Generate a unique ID for this sound.
      self._id = ++Howler._counter;

      // Add itself to the parent's pool.
      parent._sounds.push(self);

      // Create the new node.
      self.create();
      return self;
    },
    /**
     * Create and setup a new sound object
     * @return {Sound}
     */
    create: function () {
      var self = this;
      var volume = Howler._muted || self._muted || self._parent._muted ? 0 : self._volume;

      // Create the gain node for controlling volume (the source will connect to this).
      self._node = Howler.ctx.createGain();
      self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
      self._node.paused = true;
      self._node.connect(Howler.masterGain);
      return self;
    },
    /**
     * Reset the parameters of this sound to the original state (for recycle).
     * @return {Sound}
     */
    reset: function () {
      var self = this;
      var parent = self._parent;

      // Reset all of the parameters of this sound.
      self._muted = parent._muted;
      self._volume = parent._volume;
      self._paused = true;
      self._ended = true;
      self._sprite = '__default';

      // Generate a new ID so that it isn't confused with the previous sound.
      self._id = ++Howler._counter;
      return self;
    }
  };

  /**
   * Create an audio group controller.
   * @param {Object} o Passed in properties for this group.
   */
  var Howl = function (o) {
    var self = this;

    // Throw an error if no source is provided.
    if (!o.src || o.src.length === 0) {
      console.error('An array of source files must be passed with any new Howl.');
      return;
    }
    self.init(o);
  };
  Howl.prototype = {
    /**
     * Initialize a new Howl group object.
     * @param  {Object} o Passed in properties for this group.
     * @return {Howl}
     */
    init: function (o) {
      var self = this;

      // If we don't have an AudioContext created yet, run the setup.
      if (!Howler.ctx) {
        setupAudioContext();
      }
      self.boundPlaySoundAfterResume = self.playSoundAfterResume.bind(self);

      // Setup user-defined default properties.
      self._autoplay = o.autoplay || false;
      self._format = typeof o.format !== 'string' ? o.format : [o.format];
      self._muted = o.mute || false;
      self._pool = o.pool || 5;
      self._preload = typeof o.preload === 'boolean' || o.preload === 'metadata' ? o.preload : true;
      self._sprite = o.sprite || {};
      self._src = typeof o.src !== 'string' ? o.src : [o.src];
      self._volume = o.volume !== undefined ? o.volume : 1;
      self._xhr = {
        method: o.xhr && o.xhr.method ? o.xhr.method : 'GET',
        headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
        withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false
      };

      // Setup all other default properties.
      self._duration = 0;
      self._state = 'unloaded';
      self._sounds = [];
      self._queue = [];
      self._playLock = false;

      // Keep track of this Howl group in the global controller.
      Howler._howls.push(self);

      // If they selected autoplay, add a play event to the load queue.
      if (self._autoplay) {
        self._queue.push({
          event: 'play',
          action: function () {
            self.play();
          }
        });
      }

      // Load the source file unless otherwise specified.
      if (self._preload && self._preload !== 'none') {
        self.load();
      }
      return self;
    },
    /**
     * Load the audio file.
     * @return {Howler}
     */
    load: function () {
      var self = this;
      var url = null;

      // If no audio is available, quit immediately.
      if (Howler.noAudio) {
        console.log('loaderror');
        return;
      }

      // Loop through the sources and pick the first one that is compatible.
      if (self._src.length) {
        url = self._src[0];
      }
      if (!url) {
        console.log('loaderror');
        return;
      }
      self._src = url;
      self._state = 'loading';

      // Create a new sound object and add it to the pool.
      new Sound(self);

      // Load and decode the audio data for playback.
      loadBuffer(self);
      return self;
    },
    playSoundInternal: function (sound) {
      var self = this;
      // Begin the actual playback.
      var node = sound._node;
      self._onResume = null;
      self._playLock = false;
      sound._paused = false;
      self._refreshBuffer(sound);

      // Setup the playback params.
      var vol = sound._muted || self._muted ? 0 : sound._volume;
      node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
      sound._playStart = Howler.ctx.currentTime;

      // Play the sound using the supported method.
      node.bufferSource.start(0);
      node.bufferSource.onended = self._ended.bind(self, sound);
      self._loadQueue('play');
      self._loadQueue();
    },
    playSoundAfterResume: function () {
      var self = this;
      var sound = self._onResumeSound;
      if (sound) {
        self.playSoundInternal(sound);
        self._onResumeSound = null;
      }
    },
    /**
     * Play a sound or resume previous playback.
     * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
     * @return {Number}          Sound ID.
     */
    play: function (sprite) {
      var self = this;
      var id = null;

      // Determine if a sprite, sound id or nothing was passed
      if (typeof sprite === 'number') {
        id = sprite;
        sprite = null;
      } else if (typeof sprite === 'undefined') {
        // Use the default sound sprite (plays the full audio length).
        sprite = '__default';

        // Check if there is a single paused sound that isn't ended.
        // If there is, play that sound. If not, continue as usual.
        if (!self._playLock) {
          var num = 0;
          for (var i = 0; i < self._sounds.length; i++) {
            if (self._sounds[i]._paused && !self._sounds[i]._ended) {
              num++;
              id = self._sounds[i]._id;
            }
          }
          if (num === 1) {
            sprite = null;
          } else {
            id = null;
          }
        }
      }

      // Get the selected node, or get one from the pool.
      var sound = id ? self._soundById(id) : self._inactiveSound();

      // If the sound doesn't exist, do nothing.
      if (!sound) {
        return null;
      }

      // Select the sprite definition.
      if (id && !sprite) {
        sprite = sound._sprite || '__default';
      }

      // If the sound hasn't loaded, we must wait to get the audio's duration.
      // We also need to wait to make sure we don't run into race conditions with
      // the order of function calls.
      if (self._state !== 'loaded') {
        // Set the sprite value on this sound.
        sound._sprite = sprite;

        // Mark this sound as not ended in case another sound is played before this one loads.
        sound._ended = false;

        // Add the sound to the queue to be played on load.
        var soundId = sound._id;
        self._queue.push({
          event: 'play',
          action: function () {
            self.play(soundId);
          }
        });
        return soundId;
      }

      // Don't play the sound if an id was passed and it is already playing.
      if (id && !sound._paused) {
        // Trigger the play event, in order to keep iterating through queue.
        self._loadQueue('play');
        return sound._id;
      }

      // Make sure the AudioContext isn't suspended, and resume it if it is.
      Howler._autoResume();

      // Determine how long to play for and where to start playing.
      sound._sprite = sprite;

      // Mark the sound as ended instantly so that this async playback
      // doesn't get grabbed by another call to play while this one waits to start.
      sound._ended = false;
      if (Howler.state === 'running' && Howler.ctx.state !== 'interrupted') {
        self.playSoundInternal(sound);
      } else {
        self._playLock = true;

        // Fire this when the sound is ready to play to begin Web Audio playback.

        // Wait for the audio context to resume before playing.
        self._onResumeSound = sound;
        self._onResume = self.boundPlaySoundAfterResume;
      }
      return sound._id;
    },
    /**
     * Queue of actions initiated before the sound has loaded.
     * These will be called in sequence, with the next only firing
     * after the previous has finished executing (even if async like play).
     * @return {Howl}
     */
    _loadQueue: function (event) {
      var self = this;
      if (self._queue.length > 0) {
        var task = self._queue[0];

        // Remove this task if a matching event was passed.
        if (task.event === event) {
          self._queue.shift();
          self._loadQueue();
        }

        // Run the task if no event type is passed.
        if (!event) {
          task.action();
        }
      }
      return self;
    },
    /**
     * Fired when playback ends at the end of the duration.
     * @param  {Sound} sound The sound object to work with.
     * @return {Howl}
     */
    _ended: function (sound) {
      var self = this;

      // Mark the node as paused.
      sound._paused = true;
      sound._ended = true;

      // Clean up the buffer source.
      self._cleanBuffer(sound._node);

      // Attempt to auto-suspend AudioContext if no sounds are still playing.
      Howler._autoSuspend();
      return self;
    },
    /**
     * Return the sound identified by this ID, or return null.
     * @param  {Number} id Sound ID
     * @return {Object}    Sound object or null.
     */
    _soundById: function (id) {
      var self = this;

      // Loop through all sounds and find the one with this ID.
      for (var i = 0; i < self._sounds.length; i++) {
        if (id === self._sounds[i]._id) {
          return self._sounds[i];
        }
      }
      return null;
    },
    /**
     * Return an inactive sound from the pool or create a new one.
     * @return {Sound} Sound playback object.
     */
    _inactiveSound: function () {
      var self = this;
      self._drain();

      // Find the first inactive node to recycle.
      for (var i = 0; i < self._sounds.length; i++) {
        if (self._sounds[i]._ended) {
          return self._sounds[i].reset();
        }
      }

      // If no inactive node was found, create a new one.
      return new Sound(self);
    },
    /**
     * Drain excess inactive sounds from the pool.
     */
    _drain: function () {
      var self = this;
      var limit = self._pool;
      var cnt = 0;
      var i = 0;

      // If there are less sounds than the max pool size, we are done.
      if (self._sounds.length < limit) {
        return;
      }

      // Count the number of inactive sounds.
      for (i = 0; i < self._sounds.length; i++) {
        if (self._sounds[i]._ended) {
          cnt++;
        }
      }

      // Remove excess inactive sounds, going in reverse order.
      for (i = self._sounds.length - 1; i >= 0; i--) {
        if (cnt <= limit) {
          return;
        }
        if (self._sounds[i]._ended) {
          // Disconnect the audio source when using Web Audio.
          if (self._sounds[i]._node) {
            self._sounds[i]._node.disconnect(0);
          }

          // Remove sounds until we have the pool size.
          self._sounds.splice(i, 1);
          cnt--;
        }
      }
    },
    /**
     * Load the sound back into the buffer source.
     * @param  {Sound} sound The sound object to work with.
     * @return {Howl}
     */
    _refreshBuffer: function (sound) {
      var self = this;

      // Setup the buffer source for playback.
      sound._node.bufferSource = Howler.ctx.createBufferSource();
      sound._node.bufferSource.buffer = cache[self._src];

      // Connect to the correct node.
      sound._node.bufferSource.connect(sound._node);

      // Setup playback rate.
      sound._node.bufferSource.playbackRate.setValueAtTime(1, Howler.ctx.currentTime);
      return self;
    },
    /**
     * Prevent memory leaks by cleaning up the buffer source after playback.
     * @param  {Object} node Sound's audio node containing the buffer source.
     * @return {Howl}
     */
    _cleanBuffer: function (node) {
      var self = this;
      var isIOS = navigator.vendor.indexOf('Apple') >= 0;
      if (!node.bufferSource) {
        return self;
      }
      if (Howler._scratchBuffer && node.bufferSource) {
        node.bufferSource.onended = null;
        node.bufferSource.disconnect(0);
        if (isIOS) {
          try {
            node.bufferSource.buffer = Howler._scratchBuffer;
          } catch (e) {}
        }
      }
      node.bufferSource = null;
      return self;
    }
  };
  var _default = _exports.default = Howl;
});
