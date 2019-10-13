// COMPONENTS

AFRAME.registerComponent('terminal', {
  schema: {
    position: {type: 'vec3', default: {x: -.75, y: 1.75, z: -1.75}},
    color: {type: 'color', default: 'white'},
    font: {type: 'string', default: 'monoid'},
    size: {type: 'int', default: 10},
    active: {type: 'boolean', default: false},
  },
  init: function() {
    let self = this;
    $.ajax({
      type: 'POST',
      url: '/terminal/',
      success: function(res) {
        self.el.guid = res.guid;
      },
    });
    this.el.setAttribute('id', 'terminal');
    this.el.windowEl = document.createElement('a-box');
    this.el.windowEl.setAttribute('id', 'win');
    this.el.windowEl.setAttribute('color', 'black');
    this.el.windowEl.setAttribute('scale', {x: 3, y: 3, z: 0.0});
    this.el.appendChild(this.el.windowEl);

    this.el.consoleEl = document.createElement('a-text');
    this.el.consoleEl.setAttribute('id', 'console');
    this.el.consoleEl.setAttribute('scale', {x: 0.5, y: 0.5, z: 0.5});
    this.el.consoleEl.setAttribute('position', {x: -1, y: -1, z: 0});
    this.el.consoleEl.setAttribute('color', this.data.color);
    this.el.consoleEl.setAttribute('font', this.data.font);
    this.el.consoleEl.setAttribute('wrap-count', 80);
    this.el.consoleEl.setAttribute('align', 'left');
    this.el.consoleEl.setAttribute('anchor', 'left');
    this.el.consoleEl.setAttribute('baseline', 'bottom');
    this.el.appendChild(this.el.consoleEl);
    this.onKeydown = this.onKeydown.bind(this);
    window.addEventListener('keydown', this.onKeydown);
  },
  onKeydown: function (e) {
    let self = this;
    $.ajax({
      type: 'PUT',
      url: '/terminal/' + self.el.guid,
      data: {key: escape(e.key)},
    });
  },
});

AFRAME.registerPrimitive('a-terminal', {
  defaultComponents: {
    terminal: {},
  },
  mappings: {
    position: 'terminal.position',
    font: 'terminal.font',
    color: 'terminal.color',
    size: 'terminal.size',
    active: 'terminal.active',
  },
});
