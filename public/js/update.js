setInterval(function() {
  document.querySelectorAll('#terminal').forEach(function(term) {
    $.ajax({
      type: 'GET',
      url: '/terminal/' + term.guid,
      success: function(res) {
        term.consoleEl.setAttribute('value', format(res.output.join('\n')));
      },
    });
  });
}, 50);
