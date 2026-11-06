/* ============================================================================
 * ChromaToons character + project store. Replaces Core/SaveSystem.cs,
 * Characters/CharacterStore.cs and Characters/CharacterData.cs.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var Store = C.Store;
  var EventBus = C.EventBus;

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  var CHARS_KEY = 'characters';
  var PROJECTS_KEY = 'projects';
  var SCENE_KEY = 'scene';

  /* ---- CharacterStore ---- */
  var CharacterStore = {
    all: function () { return Store.get(CHARS_KEY, []); },
    save: function (list) { Store.set(CHARS_KEY, list); EventBus.emit('characters:changed', list); },

    get: function (id) {
      var found = null;
      this.all().forEach(function (c) { if (c.id === id) found = c; });
      return found;
    },

    create: function (name) {
      var list = this.all();
      var c = {
        id: uid(),
        name: (name || '').trim() || 'My Character',
        createdUtc: new Date().toISOString(),
        clipName: 'idle'
      };
      list.push(c);
      this.save(list);
      return c;
    },

    update: function (c) {
      var list = this.all();
      var i = -1;
      list.forEach(function (x, idx) { if (x.id === c.id) i = idx; });
      if (i >= 0) list[i] = c; else list.push(c);
      this.save(list);
    },

    remove: function (id) {
      this.save(this.all().filter(function (c) { return c.id !== id; }));
    },

    /* Attach an imported image (data URL) and its natural size. */
    setSprite: function (id, dataUrl, w, h) {
      var c = this.get(id);
      if (!c) return null;
      c.sprite = dataUrl;
      c.width = w;
      c.height = h;
      this.update(c);
      return c;
    }
  };

  /* ---- ProjectStore: named keyframe projects, saved as JSON ---- */
  var ProjectStore = {
    all: function () { return Store.get(PROJECTS_KEY, []); },
    save: function (list) { Store.set(PROJECTS_KEY, list); EventBus.emit('projects:changed', list); },

    saveProject: function (project) {
      var list = this.all();
      project.updatedUtc = new Date().toISOString();
      var i = -1;
      list.forEach(function (p, idx) { if (p.name === project.name) i = idx; });
      /* deep copy so later edits don't mutate the stored entry */
      var copy = JSON.parse(JSON.stringify(project));
      if (i >= 0) list[i] = copy; else list.push(copy);
      this.save(list);
      return copy;
    },

    byName: function (name) {
      var found = null;
      this.all().forEach(function (p) { if (p.name === name) found = p; });
      return found;
    },

    remove: function (name) {
      this.save(this.all().filter(function (p) { return p.name !== name; }));
    }
  };

  /* ---- Scene list: characters placed in the current scene ---- */
  var Scene = {
    get: function () { return Store.get(SCENE_KEY, []); },
    set: function (list) { Store.set(SCENE_KEY, list); EventBus.emit('scene:changed', list); },
    add: function (characterId) {
      var list = this.get();
      var entry = {
        id: uid(),
        characterId: characterId,
        x: 0.5,
        y: 0.5,
        scale: 1,
        flipX: false,
        rotation: 0
      };
      list.push(entry);
      this.set(list);
      return entry;
    },
    update: function (entry) {
      var list = this.get();
      list.forEach(function (e, i) { if (e.id === entry.id) list[i] = entry; });
      this.set(list);
    },
    remove: function (id) {
      this.set(this.get().filter(function (e) { return e.id !== id; }));
    },
    clear: function () { this.set([]); }
  };

  /* ---- Image helpers ---- */
  function readImageFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('read failed')); };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve({ dataUrl: reader.result, width: img.width, height: img.height }); };
        img.onerror = function () { reject(new Error('not an image')); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  C.uid = uid;
  C.CharacterStore = CharacterStore;
  C.ProjectStore = ProjectStore;
  C.Scene = Scene;
  C.readImageFile = readImageFile;
})(window);
