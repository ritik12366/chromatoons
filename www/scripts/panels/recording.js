/* Recording panel — replaces UI/Panels/RecordingPanel.cs + ScreenRecorder.cs */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  function render(el) {
    var stage = C.Stage.create({ showRig: true, showHandles: false });
    el.appendChild(stage.root);

    var quality = 'high';
    var withAudio = true;
    var effectsOn = false;
    var status = h('div', { class: 'muted', text: 'Ready.' });
    el.appendChild(h('b', { text: 'Screen Recording' }));
    el.appendChild(status);

    /* quality */
    el.appendChild(C.UI.fieldLabel('Quality'));
    var qChips = h('div', { class: 'chip-row' });
    [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']].forEach(function (q) {
      qChips.appendChild(C.UI.chip(q[1], q[0] === quality, function () {
        quality = q[0];
        Array.prototype.forEach.call(qChips.children, function (c, i) { c.classList.toggle('is-on', i === ['low', 'medium', 'high', 'ultra'].indexOf(quality)); });
      }));
    });
    el.appendChild(qChips);

    /* audio */
    var audioChip = C.UI.chip('Record audio (mic)', withAudio, function () {
      withAudio = !withAudio;
      audioChip.classList.toggle('is-on', withAudio);
    });
    el.appendChild(h('div', { style: { height: '10px' } }));
    el.appendChild(audioChip);

    /* effects */
    var effChip = C.UI.chip('Apply effect', effectsOn, function () {
      effectsOn = !effectsOn;
      effChip.classList.toggle('is-on', effectsOn);
      stage.setEffects(effectsOn);
    });
    el.appendChild(h('div', { style: { height: '10px' } }));
    el.appendChild(effChip);

    /* controls */
    var startBtn = C.UI.button('● Start Recording', 'btn--danger btn--block', start);
    var stopBtn = C.UI.button('■ Stop Recording', 'btn--block', stop);
    el.appendChild(startBtn);
    el.appendChild(stopBtn);
    el.appendChild(C.UI.button('📷 Capture Frame (PNG)', 'btn--accent btn--block', screenshot));
    el.appendChild(C.UI.button('Open Gallery', '', function () { C.Panels.show('gallery'); }));

    if (!C.Recorder.isSupported()) {
      status.textContent = 'Video recording is not supported on this device — screenshots still work.';
    }

    function start() {
      var res = C.Recorder.start(stage.canvas, withAudio);
      if (!res.ok) { status.textContent = res.error; C.EventBus.emit('toast', res.error); return; }
      status.textContent = 'Recording…';
      stage.setBadge(true);
      C.EventBus.emit('toast', 'Recording started');
    }
    function stop() {
      if (!C.Recorder.isRecording) return;
      C.Recorder.stop();
      stage.setBadge(false);
      status.textContent = 'Recording stopped.';
    }
    function screenshot() {
      var entry = C.Recorder.screenshot(stage.canvas);
      status.textContent = 'Frame saved: ' + entry.name;
      C.EventBus.emit('toast', 'Frame saved to Gallery');
    }

    C.EventBus.on('recording:stopped', function (entry) {
      stage.setBadge(false);
      status.textContent = entry ? 'Saved ' + entry.name : 'Recording produced no file.';
    });
  }

  C.Panels.register({
    id: 'recording',
    title: 'Recording',
    navLabel: 'Record',
    icon: '⏺️',
    render: render
  });
})(window);
