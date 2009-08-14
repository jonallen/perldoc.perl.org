document.write('<form id="perl_version" name="perl_version">');
document.write('<select name="version-chooser" onChange="selectPerlVersion(this)">');
document.write('  <option selected>Select...');
document.write('  <option>Perl 5 version 10');
document.write('    <option value="/index.html">&nbsp;&nbsp;&bull;&nbsp;Perl 5.10.0');
document.write('  <option>');
document.write('  <option>Perl 5 version 8');
document.write('    <option value="/5.8.9/index.html">&nbsp;&nbsp;&bull;&nbsp;Perl 5.8.9');
document.write('    <option value="/5.8.8/index.html">&nbsp;&nbsp;&bull;&nbsp;Perl 5.8.8');
document.write('    <option value="/5.8.7/index.html">&nbsp;&nbsp;&bull;&nbsp;Perl 5.8.7');
document.write('</select>');
document.write('</form>');

function selectPerlVersion(element) {
  if (element.value.substring(0,1) == '/') {
    location.href = element.value;
  }
}
