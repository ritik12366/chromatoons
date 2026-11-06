/* ============================================================================
 * ChromaToons.Effects — post-processing presets implemented as CSS filters and
 * overlay gradients on the stage. Replaces Effects/EffectsManager.cs.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  var KINDS = [
    { id: 'none', label: 'None' },
    { id: 'night', label: 'Night Mode' },
    { id: 'oldfilm', label: 'Old Film' },
    { id: 'underwater', label: 'Under Water' },
    { id: 'vignette', label: 'Vignette' },
    { id: 'blur', label: 'Strong Blur' },
    { id: 'ghost', label: 'Ghost Blur' },
    { id: 'vintage', label: 'Vintage Look' },
    { id: 'thermal', label: 'Thermal' }
  ];

  var Effects = {
    kinds: KINDS,
    current: 'none',
    amount: 0.7,

    set: function (id) {
      this.current = id || 'none';
      C.EventBus.emit('effects:changed', { id: this.current, amount: this.amount });
    },

    setAmount: function (a) {
      this.amount = Math.max(0, Math.min(1, a));
      C.EventBus.emit('effects:changed', { id: this.current, amount: this.amount });
    },

    /* Returns {filter, overlay} for the current effect. */
    style: function () {
      var a = this.amount;
      switch (this.current) {
        case 'night': return { filter: 'brightness(' + (1 - 0.45 * a) + ') contrast(1.1) saturate(0.8)', overlay: 'rgba(10,20,60,' + (0.25 * a) + ')' };
        case 'oldfilm': return { filter: 'sepia(' + a + ') contrast(' + (1 + 0.2 * a) + ') brightness(' + (1 - 0.1 * a) + ')', overlay: 'rgba(120,90,40,' + (0.12 * a) + ')' };
        case 'underwater': return { filter: 'hue-rotate(-25deg) saturate(1.3) brightness(' + (1 - 0.05 * a) + ')', overlay: 'rgba(0,90,140,' + (0.22 * a) + ')' };
        case 'vignette': return { filter: 'contrast(' + (1 + 0.08 * a) + ')', overlay: 'radial-gradient(circle, rgba(0,0,0,0) 45%, rgba(0,0,0,' + (0.85 * a) + ') 100%)' };
        case 'blur': return { filter: 'blur(' + (4 * a) + 'px)', overlay: 'none' };
        case 'ghost': return { filter: 'blur(' + (2 * a) + 'px) brightness(' + (1 + 0.15 * a) + ')', overlay: 'rgba(76,194,255,' + (0.12 * a) + ')' };
        case 'vintage': return { filter: 'sepia(' + (0.6 * a) + ') contrast(' + (1 + 0.15 * a) + ') saturate(' + (1 - 0.2 * a) + ')', overlay: 'rgba(255,180,80,' + (0.1 * a) + ')' };
        case 'thermal': return { filter: 'hue-rotate(180deg) saturate(2) contrast(1.2)', overlay: 'rgba(255,60,0,' + (0.12 * a) + ')' };
        default: return { filter: 'none', overlay: 'none' };
      }
    }
  };

  C.Effects = Effects;
})(window);
