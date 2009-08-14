#! /usr/bin/perl

use strict;
use warnings;
use File::Basename;
use File::Find;
use File::Spec::Functions qw/catfile/;
use FindBin qw/$Bin/;
use Getopt::Long;
use Shell qw/cp/;
use Template;
use Text::Template qw/fill_in_string/;

use lib "$Bin/lib";
use Perldoc::Config;


#--Set options for Template::Toolkit---------------------------------------

use constant TT_INCLUDE_PATH => "$Bin/templates";


#--Set config options-----------------------------------------------------

my %specifiers = (
  'output-path' => '=s',
  'perl'        => '=s',
  'download'    => '!',
  'pdf'         => '!',
);                  
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


#--Check if we are using a different perl----------------------------------

if ($options{perl}) {
  #warn "Setting perl to $options{perl}\n";
  my $version_cmd  = 'printf("%vd",$^V)';
  my $perl_version = `$options{perl} -e '$version_cmd'`;
  my $inc_cmd      = 'print "$_\n" foreach @INC';
  my $perl_inc     = `$options{perl} -e '$inc_cmd'`;
  my $bin_cmd      = 'use Config; print $Config{bin}';
  my $perl_bin     = `$options{perl} -e '$bin_cmd'`;
  
  $Perldoc::Config::option{perl_version}  = $perl_version;
  $Perldoc::Config::option{perl5_version} = substr($perl_version,2);
  $Perldoc::Config::option{inc}           = [split /\n/,$perl_inc];
  $Perldoc::Config::option{bin}           = $perl_bin;
  
  #warn Dumper(\%Perldoc::Config::option);
}


eval <<EOT;
use Perldoc::Page;
EOT


#--Set update timestamp---------------------------------------------------

my $date         = sprintf("%02d",(localtime(time))[3]);
my $month        = qw/ January
                       February
                       March
                       April
                       May
                       June
                       July
                       August
                       September
                       October
                       November
                       December /[(localtime(time))[4]];
my $year         = (localtime(time))[5] + 1900;

$Perldoc::Config::option{last_update} = "$date $month $year";


#--Copy static files------------------------------------------------------

cp('-r', "$Bin/static/*",     $Perldoc::Config::option{output_path});
cp('-r', "$Bin/javascript/*", $Perldoc::Config::option{output_path});


#--Process static html files with template--------------------------------

my @module_az_links;
foreach my $module_index ('A'..'Z') {
  my $link;
  if (grep {/^$module_index/ && exists($Perldoc::Page::CoreList{$_})} Perldoc::Page::list()) {
    $link = "index-modules-$module_index.html";
  } 
  push @module_az_links, {letter=>$module_index, link=>$link};
}

#my $templatefile = "$Bin/templates/html.template";

my $process = create_template_function(
  #templatefile => $templatefile,
  variables    => { module_az => \@module_az_links, %options },
);

#die("Cannot chdir to static-html directory: $!\n") unless (chdir "$Bin/static-html");
warn "Searcning in $Bin/static-html";
find( {wanted=>$process, no_chdir=>0}, "$Bin/static-html" );

#-------------------------------------------------------------------------

sub create_template_function {
  my %args = @_;
  return sub {
    warn "Process called: $_";
    return unless (/(\w+)\.html$/);
    my $page = $1;
    local $/ = undef;
    #if (open FILE,'<',$_) {
      #my $content  = (<FILE>);
      #my $template = Text::Template->new(source => $args{templatefile});
      my $template = Template->new(INCLUDE_PATH => TT_INCLUDE_PATH,
                                   ABSOLUTE     => 1);
      my $depth    = () = m/\//g;
      
      my %titles = (
        index       => "Perl programming documentation",
        search      => 'Search results',
        preferences => 'Preferences',
      );
      
      my %breadcrumbs = (
        index       => 'Home',
        search      => '<a href="index.html">Home</a> &gt; Search results',
        preferences => '<a href="index.html">Home</a> &gt; Preferences',
      );
      
      my %variables          = %{$args{variables}};
      $variables{path}       = '../' x ($depth - 1);
      $variables{pagedepth}  = $depth - 1;
      $variables{pagename}   = $titles{$page} || $page;
      $variables{breadcrumb} = $breadcrumbs{$page} || $page;
      $variables{content_tt} = $File::Find::name;
      #$variables{content}  = fill_in_string($content,hash => {%Perldoc::Config::option, %variables});
      
      #my $html = $template->fill_in(hash => {%Perldoc::Config::option, %variables});
      
      my $output_filename = catfile($Perldoc::Config::option{output_path},$_);
      #if (open OUT,'>',$output_filename) {
      #  print OUT $html;
      #}
      warn "Writing $output_filename";
      $template->process('default.tt',{%Perldoc::Config::option, %variables},$output_filename) || die "Failed processing $page\n".$template->error;
    #}   
  }
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
