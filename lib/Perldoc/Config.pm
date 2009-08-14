package Perldoc::Config;

use strict;
use warnings;
use Config;

our $VERSION = '0.01';


#--------------------------------------------------------------------------

our %option = (
  output_path  => '/tmp/perldoc',
  site_href    => 'http://perldoc.perl.org',
  site_title   => 'perldoc.perl.org',
  perl_version => sprintf("%vd",$^V),
  inc          => [@INC],
  pdf          => 1,
  bin          => $Config{bin},
);
