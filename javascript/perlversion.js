// perlversion.js - writes Perl version drop-down menu

function selectPerlVersion(element) {
  if (element.value.substring(0,1) == '/') {
    location.href = element.value;
  }
}

document.write('<select id="perl_version_select" name="version-chooser" onChange="selectPerlVersion(this)">');
document.write('  <option selected>Select...');
document.write('  <optgroup label="Perl 5 version 12">');
document.write('    <option value="/index.html">Perl 5.12.1');
document.write('    <option value="/5.12.0/index.html">Perl 5.12.0');
document.write('  </optgroup>');
document.write('  <optgroup label="Perl 5 version 10">');
document.write('    <option value="/5.10.0/index.html">Perl 5.10.0');
document.write('  </optgroup>');
document.write('  <optgroup label="Perl 5 version 8">');
document.write('    <option value="/5.8.9/index.html">Perl 5.8.9');
document.write('    <option value="/5.8.8/index.html">Perl 5.8.8');
document.write('  </optgroup>');
document.write('</select>');