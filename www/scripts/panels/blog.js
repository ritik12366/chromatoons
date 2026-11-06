/* Blog panel — replaces UI/Panels/BlogPanel.cs (character download feed) */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;
  var cfg = C.AppConfig;

  C.Panels.register({
    id: 'blog',
    title: 'Blog',
    navLabel: 'Blog',
    icon: '📰',
    render: function (el) {
      var status = h('div', { class: 'muted', text: 'Tap refresh to load characters.' });
      var list = h('div');
      el.appendChild(status);
      el.appendChild(C.UI.button('Refresh Feed', 'btn--accent btn--block', refresh));
      el.appendChild(C.UI.button('Open Site in Browser', 'btn--block', function () {
        global.open(cfg.siteUrl, '_blank');
      }));
      el.appendChild(C.UI.sectionTitle('Characters'));
      el.appendChild(list);
      el.appendChild(C.UI.muted('Tip: open the site, save a character image, then import it from the Characters tab.'));

      function refresh() {
        status.textContent = C.Localization.t('loading');
        list.innerHTML = '';
        fetch(cfg.blogFeedUrl, { mode: 'cors' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(function (body) {
            status.textContent = 'Loaded ' + body.length + ' bytes from feed.';
            var items = parseFeed(body);
            if (!items.length) { list.appendChild(C.UI.muted('Feed loaded, but no entries were parsed.')); return; }
            items.forEach(function (it) {
              list.appendChild(C.UI.listItem({
                title: it.title,
                meta: it.link,
                actions: [C.UI.button('Open', 'btn--sm btn--accent', function () { global.open(it.link, '_blank'); })]
              }));
            });
          })
          .catch(function (e) {
            status.textContent = 'Could not load feed (' + e.message + '). Open the site instead.';
          });
      }

      function parseFeed(html) {
        var out = [];
        try {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var entries = doc.querySelectorAll('h3.entry-title a, h2 a, a[href*=".html"]');
          var seen = {};
          entries.forEach(function (a) {
            var title = (a.textContent || '').trim();
            var link = a.href;
            if (!title || !link || seen[link]) return;
            seen[link] = true;
            out.push({ title: title, link: link });
          });
        } catch (e) { /* ignore */ }
        return out.slice(0, 20);
      }
    }
  });
})(window);
