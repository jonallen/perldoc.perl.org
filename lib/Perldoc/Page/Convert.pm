package Perldoc::Page::Convert;

use strict;
use warnings;
use Perldoc::Page;

our $VERSION = '0.01';


#--------------------------------------------------------------------------

sub html {
  my $page = shift;
  my $pod  = Perldoc::Page::pod($page);
  use Perldoc::Convert::html;
  return Perldoc::Convert::html::convert($page,$pod);
}


#--------------------------------------------------------------------------

sub index {
  my $page = shift;
  my $pod  = Perldoc::Page::pod($page);
  use Perldoc::Convert::html;
  return Perldoc::Convert::html::index($page,$pod);
}


#--------------------------------------------------------------------------

sub pdf {
  my $page = shift;
  my $pod  = Perldoc::Page::pod($page);
  use Perldoc::Convert::pdf;
  return Perldoc::Convert::pdf::convert($page,$pod);
}


#--------------------------------------------------------------------------

1;
