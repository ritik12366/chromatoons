/* Creator panel — character import + scene building (replaces CreatorPanel.cs) */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  function render(el) {
    var stage = C.Stage.create({ showRig: true, showHandles: false });
    stage.root.style.filter = '';
    el.appendChild(stage.root);

    var showRig = true;
    var effectsOn = false;

    var selectRow = h('div');
    el.appendChild(selectRow);

    var actions = C.UI.grid([
      C.UI.button('Import Image', 'btn--accent', importImage),
      C.UI.button('Add to Scene', 'btn--accent2', addToScene),
      C.UI.button('Remove Last', '', removeLast),
      C.UI.button('Clear Scene', 'btn--danger', function () {
        C.Scene.clear(); C.EventBus.emit('toast', 'Scene cleared'); refreshSelect();
      })
    ], 2);
    el.appendChild(actions);

    el.appendChild(C.UI.row([
      C.UI.button('Show Rig', '', function () { showRig = !showRig; stage.animator.state.showRig = showRig; stage.render(); }),
      C.UI.button('Toggle Effect', '', function () { effectsOn = !effectsOn; stage.setEffects(effectsOn); })
    ]));

    el.appendChild(C.UI.sectionTitle('Next'));
    el.appendChild(C.UI.row([
      C.UI.button('Animate Rig →', 'btn--accent', function () { C.Panels.show('animate'); }),
      C.UI.button('Timeline →', '', function () { C.Panels.show('timeline'); })
    ]));

    function refreshSelect() {
      selectRow.innerHTML = '';
      var chars = C.CharacterStore.all();
      if (!chars.length) {
        selectRow.appendChild(C.UI.muted('No characters yet — import an image to begin.'));
        return;
      }
      var current = stage._selected || (chars[0] && chars[0].id);
      stage._selected = current;
      selectRow.appendChild(C.UI.fieldLabel('Character'));
      selectRow.appendChild(C.UI.select(chars.map(function (c) {
        return { value: c.id, label: c.name + (c.sprite ? '' : ' (no image)') };
      }), current, function (id) { stage._selected = id; }));
    }

    function importImage() {
      var file = h('input', { type: 'file', accept: 'image/*' });
      file.onchange = function (e) {
        var f = e.target.files[0];
        if (!f) return;
        C.Creator.importImage(f).then(function (res) {
          return C.Creator.downscale(res.dataUrl, 2048).then(function (url) {
            var c = C.CharacterStore.create(f.name.replace(/\.[^.]+$/, ''));
            C.CharacterStore.setSprite(c.id, url, res.width, res.height);
            stage._selected = c.id;
            C.EventBus.emit('toast', 'Imported ' + c.name);
            refreshSelect();
          });
        }).catch(function (err) { C.EventBus.emit('toast', 'Import failed: ' + err.message); });
      };
      file.click();
    }

    function addToScene() {
      var id = stage._selected;
      if (!id) { C.EventBus.emit('toast', 'Create a character first'); return; }
      C.Scene.add(id);
      C.EventBus.emit('toast', 'Added to scene');
      stage.render();
    }

    function removeLast() {
      var list = C.Scene.get();
      if (!list.length) return;
      C.Scene.remove(list[list.length - 1].id);
      stage.render();
    }

    C.EventBus.on('characters:changed', function () { refreshSelect(); stage.render(); });
    C.EventBus.on('creator:select', function (id) { stage._selected = id; refreshSelect(); });
    refreshSelect();
    stage.render();
  }

  C.Panels.register({
    id: 'creator',
    title: 'Creator',
    navLabel: 'Create',
    icon: '🎨',
    render: render
  });
})(window);
