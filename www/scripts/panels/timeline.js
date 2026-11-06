/* Timeline panel — replaces UI/Panels/TimelinePanel.cs + AnimationStudio save */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;
  var studio = null;

  function render(el) {
    studio = C.AnimationStudio;

    var readout = h('div', { class: 'muted' });
    var keyInfo = h('div', { class: 'muted' });
    var scrub = h('input', { type: 'range', min: 0, max: 1, step: 0.001, value: 0 });
    var track = h('div', { class: 'timeline-track' });
    var syncing = false;

    el.appendChild(h('b', { text: 'Animation Timeline' }));
    el.appendChild(readout);
    el.appendChild(scrub);
    el.appendChild(track);
    el.appendChild(keyInfo);

    scrub.addEventListener('input', function () {
      if (syncing) return;
      studio.scrub(parseFloat(scrub.value));
    });

    /* transport */
    el.appendChild(C.UI.sectionTitle('Transport'));
    el.appendChild(C.UI.grid([
      C.UI.button('◀ Prev Key', '', jumpKey(-1)),
      C.UI.button('Next Key ▶', '', jumpKey(1)),
      C.UI.button('Play/Pause', 'btn--accent2', function () { studio.togglePlay(); }),
      C.UI.button('Stop', '', function () { studio.stop(); })
    ], 2));

    /* key editing */
    el.appendChild(C.UI.sectionTitle('Keyframes'));
    el.appendChild(C.UI.grid([
      C.UI.button('Add Keyframe', 'btn--accent', function () {
        var f = studio.addKeyframe();
        C.EventBus.emit('toast', 'Keyframe @ ' + f);
        refreshKeys();
      }),
      C.UI.button('Delete Frame', 'btn--danger', function () {
        studio.removeKeyframesAtFrame(Math.round(studio.currentFrame));
        refreshKeys();
      }),
      C.UI.button('Delete Last', '', function () { studio.removeLastKeyframe(); refreshKeys(); }),
      C.UI.button('Clear All', '', function () {
        studio.project.tracks.forEach(function (t) { t.keys = []; });
        refreshKeys();
      })
    ], 2));

    /* project settings */
    el.appendChild(C.UI.sectionTitle('Project'));
    var durationInput = h('input', { class: 'input', type: 'number', min: 1, value: studio.project.durationFrames });
    var fpsSelect = C.UI.select([
      { value: '12', label: '12 fps' }, { value: '24', label: '24 fps' }, { value: '30', label: '30 fps' }
    ], String(studio.project.frameRate), function (v) { studio.project.frameRate = parseInt(v, 10); });
    var loopChip = C.UI.chip('Loop', studio.project.loop, function () {
      studio.project.loop = !studio.project.loop;
      loopChip.classList.toggle('is-on', studio.project.loop);
    });
    durationInput.addEventListener('change', function () {
      studio.setDuration(parseInt(durationInput.value, 10) || 120);
      refreshKeys();
    });
    el.appendChild(C.UI.fieldLabel('Duration (frames)'));
    el.appendChild(durationInput);
    el.appendChild(C.UI.fieldLabel('Frame rate'));
    el.appendChild(fpsSelect);
    el.appendChild(h('div', { style: { height: '10px' } }));
    el.appendChild(loopChip);

    /* save / load */
    el.appendChild(C.UI.sectionTitle('Save & Export'));
    var nameInput = h('input', { class: 'input', type: 'text', placeholder: 'Project name', value: studio.project.name });
    el.appendChild(nameInput);
    el.appendChild(C.UI.grid([
      C.UI.button('Save Project', 'btn--accent', function () {
        studio.project.name = nameInput.value || 'project';
        C.ProjectStore.saveProject(studio.project);
        C.EventBus.emit('toast', 'Project saved');
        refreshProjects();
      }),
      C.UI.button('Export JSON', '', function () {
        studio.exportJson((nameInput.value || 'project').replace(/\s+/g, '_'));
        C.EventBus.emit('toast', 'Exported JSON');
      }),
      C.UI.button('Import JSON', '', function () {
        var file = h('input', { type: 'file', accept: 'application/json,.json' });
        file.onchange = function (e) {
          var f = e.target.files[0];
          if (!f) return;
          var r = new FileReader();
          r.onload = function () {
            try { studio.importJson(String(r.result)); C.EventBus.emit('toast', 'Project imported'); refreshKeys(); }
            catch (err) { C.EventBus.emit('toast', 'Import failed'); }
          };
          r.readAsText(f);
        };
        file.click();
      }),
      C.UI.button('New Project', 'btn--danger', function () {
        studio.createEmptyRig();
        C.EventBus.emit('toast', 'New project');
        refreshKeys();
      })
    ], 2));

    var projectList = h('div');
    el.appendChild(projectList);

    function jumpKey(dir) {
      return function () {
        var keys = studio.keyFrames();
        if (!keys.length) return;
        var cur = studio.currentFrame;
        var target = null;
        if (dir > 0) { for (var i = 0; i < keys.length; i++) { if (keys[i] > cur + 0.01) { target = keys[i]; break; } } target = target == null ? keys[0] : target; }
        else { for (var j = keys.length - 1; j >= 0; j--) { if (keys[j] < cur - 0.01) { target = keys[j]; break; } } target = target == null ? keys[keys.length - 1] : target; }
        studio.seekFrame(target);
      };
    }

    function refreshKeys() {
      track.innerHTML = '';
      var dur = studio.project.durationFrames || 1;
      studio.keyFrames().forEach(function (f) {
        var marker = h('div', { class: 'timeline-key' });
        marker.style.left = (f / dur * 100) + '%';
        marker.title = 'frame ' + f;
        track.appendChild(marker);
      });
    }

    function refreshProjects() {
      projectList.innerHTML = '';
      var projects = C.ProjectStore.all();
      if (!projects.length) { projectList.appendChild(C.UI.muted('No saved projects yet.')); return; }
      projectList.appendChild(C.UI.sectionTitle('Saved Projects'));
      projects.slice().reverse().forEach(function (p) {
        projectList.appendChild(C.UI.listItem({
          title: p.name,
          meta: (p.tracks ? p.tracks.reduce(function (n, t) { return n + t.keys.length; }, 0) : 0) + ' keys • ' + (p.durationFrames || 0) + ' frames',
          actions: [
            C.UI.button('Load', 'btn--sm btn--accent', function () {
              studio.project = JSON.parse(JSON.stringify(p));
              studio.currentFrame = 0;
              nameInput.value = p.name;
              durationInput.value = studio.project.durationFrames;
              C.EventBus.emit('toast', 'Loaded ' + p.name);
              refreshKeys();
            }),
            C.UI.button('Del', 'btn--sm btn--danger', function () { C.ProjectStore.remove(p.name); refreshProjects(); })
          ]
        }));
      });
    }

    var off = studio.onUpdate(function () {
      var dur = studio.project.durationFrames || 1;
      syncing = true;
      scrub.value = studio.currentFrame / dur;
      syncing = false;
      readout.textContent = 'frame ' + Math.round(studio.currentFrame) + ' / ' + dur;
      keyInfo.textContent = studio.keyframeCount() + ' keyframes • ' + (studio.isPlaying ? 'playing' : 'paused') + (studio.project.loop ? ' • loop' : '');
    });
    el.__dispose = off;

    el.appendChild(C.UI.button('Open Animate', 'btn--accent2', function () { C.Panels.show('animate'); }));

    refreshKeys();
    refreshProjects();
  }

  C.Panels.register({
    id: 'timeline',
    title: 'Timeline',
    navLabel: 'Timeline',
    icon: '🎞️',
    render: render
  });
})(window);
