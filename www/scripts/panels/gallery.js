/* Gallery panel — replaces UI/Panels/GalleryPanel.cs */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  C.Panels.register({
    id: 'gallery',
    title: 'Gallery',
    navLabel: 'Gallery',
    icon: '🖼️',
    render: function (el) {
      el.appendChild(h('b', { text: 'Your recordings and screenshots' }));
      var list = h('div');
      el.appendChild(list);

      function refresh() {
        list.innerHTML = '';
        var items = C.Recorder.gallery;
        if (!items.length) {
          list.appendChild(C.UI.empty('Nothing recorded yet.'));
          return;
        }
        items.forEach(function (entry) {
          var url = C.Recorder.urlFor(entry);
          var thumb = entry.thumb || (entry.type === 'image' ? url : null);
          list.appendChild(C.UI.listItem({
            thumb: thumb,
            title: entry.name,
            meta: kindLabel(entry) + ' • ' + sizeLabel(entry.size) + ' • ' + dateLabel(entry.ts),
            actions: [
              C.UI.button('Open', 'btn--sm btn--accent', function () { C.Recorder.open(entry); }),
              C.UI.button('Del', 'btn--sm btn--danger', function () { C.Recorder.remove(entry.id); refresh(); })
            ]
          }));
        });
      }

      function kindLabel(e) { return e.type === 'video' ? 'Video' : (e.type === 'document' ? 'File' : 'Image'); }
      function sizeLabel(bytes) {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
      }
      function dateLabel(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      var clearBtn = C.UI.button('Clear Gallery', 'btn--danger btn--block', function () {
        C.Recorder.clear();
        C.EventBus.emit('toast', 'Gallery cleared');
        refresh();
      });
      el.appendChild(clearBtn);

      C.EventBus.on('gallery:changed', refresh);
      C.EventBus.on('recording:stopped', refresh);
      refresh();
    },
    onShow: function () { C.EventBus.emit('gallery:refresh'); }
  });
})(window);
