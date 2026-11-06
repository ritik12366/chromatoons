/* ============================================================================
 * ChromaToons.UI — tiny DOM builder + the panel registry/router.
 * Replaces UI/UIFactory.cs, UI/PanelBase.cs and UI/PanelManager.cs.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  function append(el, children) {
    if (children == null) return;
    if (Array.isArray(children)) { children.forEach(function (c) { append(el, c); }); return; }
    if (children.nodeType) { el.appendChild(children); return; }
    el.appendChild(document.createTextNode(String(children)));
  }

  function h(tag, props, children) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v);
      });
    }
    append(el, children);
    return el;
  }

  var UI = {
    h: h,
    button: function (label, cls, onClick, extra) {
      var b = h('button', { class: 'btn' + (cls ? ' ' + cls : ''), type: 'button' }, label);
      if (onClick) b.addEventListener('click', onClick);
      if (extra) Object.assign(b, extra);
      return b;
    },
    sectionTitle: function (text) { return h('div', { class: 'section-title', text: text }); },
    card: function (children, cls) { return h('div', { class: 'card' + (cls ? ' ' + cls : '') }, children); },
    row: function (children, cls) { return h('div', { class: 'row' + (cls ? ' ' + cls : '') }, children); },
    grid: function (children, cols) { return h('div', { class: 'grid' + (cols === 3 ? ' grid--3' : '') }, children); },
    fieldLabel: function (text) { return h('div', { class: 'field-label', text: text }); },
    muted: function (text) { return h('div', { class: 'muted', text: text }); },
    empty: function (text) { return h('div', { class: 'empty', text: text }); },
    input: function (placeholder, value) {
      return h('input', { class: 'input', type: 'text', placeholder: placeholder || '', value: value || '' });
    },
    chip: function (label, on, onClick) {
      return h('button', { class: 'chip' + (on ? ' is-on' : ''), type: 'button', text: label, onclick: onClick });
    },
    topbar: function (title, opts) {
      opts = opts || {};
      var bar = h('div', { class: 'up-top' });
      if (opts.back) bar.appendChild(UI.button('‹ Back', 'btn--sm btn--ghost', opts.back));
      bar.appendChild(h('b', { text: title }));
      return bar;
    },
    listItem: function (opts) {
      var item = h('div', { class: 'list-item' });
      if (opts.thumb) item.appendChild(h('img', { class: 'thumb', src: opts.thumb, alt: '' }));
      var body = h('div', { class: 'list-item__body' },
        h('div', { class: 'list-item__title', text: opts.title }));
      if (opts.meta) body.appendChild(h('div', { class: 'list-item__meta', text: opts.meta }));
      item.appendChild(body);
      if (opts.actions && opts.actions.length) {
        var actions = h('div', { class: 'list-item__actions' });
        opts.actions.forEach(function (a) { actions.appendChild(a); });
        item.appendChild(actions);
      }
      return item;
    },
    select: function (options, value, onChange) {
      var sel = h('select', { class: 'input' });
      options.forEach(function (o) {
        var opt = h('option', { value: o.value, text: o.label });
        if (o.value === value) opt.selected = true;
        sel.appendChild(opt);
      });
      if (onChange) sel.addEventListener('change', function () { onChange(sel.value); });
      return sel;
    }
  };

  /* ---- Panel registry / router (PanelManager.cs) ---- */
  var Panels = (function () {
    var registry = {};
    var order = [];
    var host = null;
    var current = null;
    var cache = {};

    return {
      initialize: function (hostEl) { host = hostEl; },

      register: function (panel) {
        registry[panel.id] = panel;
        order.push(panel.id);
      },

      all: function () { return order.map(function (id) { return registry[id]; }); },
      get: function (id) { return registry[id]; },
      current: function () { return current; },

      show: function (id) {
        var panel = registry[id];
        if (!panel || !host) return null;
        if (current && current !== id) {
          var prev = cache[current];
          if (prev) { prev.classList.remove('is-active'); var pp = registry[current]; if (pp && pp.onHide) pp.onHide(); }
        }
        var el = cache[id];
        if (!el) {
          el = h('div', { class: 'panel', 'data-panel': id });
          host.appendChild(el);
          cache[id] = el;
          if (panel.render) panel.render(el);
        }
        var from = current;
        current = id;
        el.classList.add('is-active');
        el.scrollTop = 0;
        if (panel.onShow) panel.onShow(el);
        C.EventBus.emit('panel:changed', { from: from, to: id });
        return el;
      },

      element: function (id) { return cache[id]; }
    };
  })();

  C.UI = UI;
  C.Panels = Panels;
})(window);
