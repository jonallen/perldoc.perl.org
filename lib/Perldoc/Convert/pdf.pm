package Perldoc::Convert::pdf;

use strict;
use warnings;
use File::Temp qw/tempfile tmpnam/;
use FindBin qw/$Bin/;

our $iconpath  = "$Bin/static/perlonion.png";
our $iconscale = 0.5;

#--------------------------------------------------------------------------

sub convert {
  my $name = shift;
  my $pod  = shift;
  
  my $filename = tmpnam;
  open TEMP,'>',$filename;
  print TEMP $pod;
  close TEMP;
  
  my $pdf = `pod2pdf --title "Perl version $Perldoc::Config::option{perl_version} documentation - $name" --icon "$iconpath" --icon-scale "$iconscale" --footer-text "$Perldoc::Config::option{site_href}" $filename`;

  unlink $filename; 
  return $pdf;
}
