#! /usr/bin/perl

use strict;
use warnings;
use File::Basename;
use File::Path;
use FindBin qw/$Bin/;
use Getopt::Long;

use lib "$Bin/lib";
use Perldoc::Config;
use Perldoc::Page;
use Perldoc::Page::Convert;
use Perldoc::Section;


#--Set config options-----------------------------------------------------

my %specifiers = ( 'output-path' => '=s' );                  
my %options;
GetOptions( \%options, optionspec(%specifiers) );


#--Check mandatory options have been given--------------------------------

my @mandatory_options = qw/ output-path /;

foreach (@mandatory_options) {
  (my $option = $_) =~ tr/-/_/;
  unless ($options{$option}) {
    die "Option '$_' must be specified!\n";
  }
}


#--Check the output path exists-------------------------------------------

unless (-d $options{output_path}) {
  die "Output path '$options{output_path}' does not exist!\n";
}

$Perldoc::Config::option{output_path}  = $options{output_path};


#--Convert pages to PDF---------------------------------------------------

my @pages = grep {exists $Perldoc::Page::CoreList{$_}} Perldoc::Page::list();
foreach my $section (Perldoc::Section::list()) {
  push @pages,Perldoc::Section::pages($section);
}
my %pages = map {$_,1} @pages;
@pages = keys %pages;

foreach my $page (@pages) {
  (my $filename = "$Perldoc::Config::option{output_path}/$page.pdf") =~ s!::!/!g;
  check_filepath($filename);
  #print "$page\n";
  warn("Converting $page to PDF as $filename\n");
  open OUTPUT,'>',$filename or die("Cannot open file '$filename': $!\n");
  print OUTPUT Perldoc::Page::Convert::pdf($page);
  close OUTPUT;
}


sub check_filepath {
  my $filename  = shift;
  my $directory = dirname($filename);
  mkpath $directory unless (-d $directory);
}


sub optionspec {
  my %option_specs = @_;
  my @getopt_list;
  while (my ($option_name,$spec) = each %option_specs) {
    (my $variable_name = $option_name) =~ tr/-/_/;
    (my $nospace_name  = $option_name) =~ s/-//g;
    my $getopt_name = ($variable_name ne $option_name) ? "$variable_name|$option_name|$nospace_name" : $option_name;
    push @getopt_list,"$getopt_name$spec";
  }
  return @getopt_list;
}
