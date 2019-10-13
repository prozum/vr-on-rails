function format(input) {
  return input.replace(/\x1B\[([0-9]+(;[0-9]+)?)?m/g, '')
      .replace(/\x1B\[\?[0-9]+h/g, '')
      .replace(/\x1B\[[0-9]+;[0-9]+;[0-9]+t/g, '')
      .replace(/\x1B=/g, '');
}
