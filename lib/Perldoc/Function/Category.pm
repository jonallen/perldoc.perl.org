package Perldoc::Function::Category;

use strict;
use warnings;
use Pod::Functions;

our $VERSION = '0.01';


#--------------------------------------------------------------------------

sub list {
  return @Type_Order;  
}


#--------------------------------------------------------------------------

sub description {
  my $category_id = shift;
  return $Type_Description{$category_id};
}


#--------------------------------------------------------------------------

sub functions {
  my $category_id = shift;
  return @{$Kinds{$category_id}}
}


#--------------------------------------------------------------------------

1;
