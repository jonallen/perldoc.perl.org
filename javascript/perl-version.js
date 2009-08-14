document.write('<h2>Perl version:</h2>');
document.write('<form name="perl-version">');
document.write('<select name="version-chooser" onChange="selectPerlVersion(this)">');
document.write('<option selected>Select...<option value="/">Perl 5.10.0<option value="/5.8.9">Perl 5.8.9<option value="/5.8.8">Perl 5.8.8</select>');
document.write('</form>');

function selectPerlVersion(element) {
  if (element.value.substring(0,1) == '/') {
    location.href = element.value;
  }
}
